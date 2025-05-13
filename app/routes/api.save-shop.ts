import { json } from "@remix-run/node";
import { db } from "~/db.server";
import { saveWebhooks } from "../services.save-webhooks";

function normalizeShopDomain(input: string): string {
  return input.replace(/^https?:\/\//i, "").trim().toLowerCase();
}

export const action = async ({ request }: { request: Request }) => {
  const { shopDomain, accessToken, update } = await request.json();

  if (!shopDomain || !accessToken) {
    return json({ error: "Shop domain and access token are required." }, { status: 400 });
  }

  const normalizedShopDomain = normalizeShopDomain(shopDomain);

  try {
    const existingShop = await db.shop.findUnique({
      where: { shopDomain: normalizedShopDomain },
    });

    if (existingShop) {
      if (update) {
        const updatedShop = await db.shop.update({
          where: { shopDomain: normalizedShopDomain },
          data: {
            accessToken,
            createdAt: new Date(),
          },
        });
        await saveWebhooks(normalizedShopDomain);
        return json({ success: true, shop: updatedShop }, { status: 200 });
      } else {
        return json({ error: "Shop already exists, update is not true" }, { status: 400 });
      }
    } else {
      const shop = await db.shop.create({
        data: {
          shopDomain: normalizedShopDomain,
          accessToken,
        },
      });
      await saveWebhooks(normalizedShopDomain);
      return json({ success: true, shop }, { status: 200 });
    }
  } catch (error) {
    console.error("Failed to save shop:", error);
    return json({ error: "Failed to save shop" }, { status: 500 });
  }
};
