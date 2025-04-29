import { json } from "@remix-run/node";
import { db } from "~/db.server";

export const action = async ({ request }: { request: Request }) => {
  const { shopDomain, accessToken } = await request.json();

  if (!shopDomain || !accessToken) {
    return json({ error: "Shop domain and access token are required." }, { status: 400 });
  }

  try {
    const shop = await db.shop.create({
      data: {
        shopDomain,
        accessToken,
      },
    });

    return json({ success: true, shop }, { status: 200 });
  } catch (error) {
    console.error("Failed to save shop:", error);
    return json({ error: "Failed to save shop" }, { status: 500 });
  }
};
