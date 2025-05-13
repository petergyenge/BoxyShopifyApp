import { json } from "@remix-run/node";
import { db } from "~/db.server";
import { saveWebhooks } from "./api.services.save-webhooks";

export const action = async ({ request }: { request: Request }) => {
  const { shopDomain, accessToken, update } = await request.json();

  if (!shopDomain || !accessToken) {
    return json({ error: "Shop domain and access token are required." }, { status: 400 });
  }

  try {
    const existingShop = await db.shop.findUnique({
      where: { shopDomain },
    });
    if (existingShop) {
      if (update) {
        const updatedShop = await db.shop.update({
          where: { shopDomain },
          data: {
            accessToken,
            createdAt: new Date(),
          },
        });
        await saveWebhooks(shopDomain);
        return json({ success: true, shop: updatedShop }, { status: 200 });
      } else {
        return json({ error: "Shop already exists, update is not true" }, { status: 400 });
      }
    } else {
      const shop = await db.shop.create({
        data: {
          shopDomain,
          accessToken,
        },
      });
      await saveWebhooks(shopDomain);
      return json({ success: true, shop }, { status: 200 });
    }
  } catch (error) {
    console.error("Failed to save shop:", error);
    return json({ error: "Failed to save shop" }, { status: 500 });
  }
};
