import axios from "axios";
import { db } from "~/db.server";

export async function saveWebhooks(shopDomain: string) {
  const cleanShopDomain = shopDomain.replace(/^https?:\/\//i, "").trim();

  const shop = await db.shop.findUnique({
    where: { shopDomain },
  });

  if (!shop || !shop.accessToken) {
    console.error(`No access token found for shop: ${cleanShopDomain}`);
    return;
  }

  const webhooks = [
    {
      topic: "orders/create",
      address: "https://boxy-shopify-app.onrender.com/webhook/orders/create",
    },
    {
      topic: "orders/updated",
      address: "https://boxy-shopify-app.onrender.com/webhook/orders/update",
    },
  ];

  for (const { topic, address } of webhooks) {
    try {
      const response = await axios.post(
        `https://${cleanShopDomain}/admin/api/2023-10/webhooks.json`,
        {
          webhook: {
            topic,
            address,
            format: "json",
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": shop.accessToken,
          },
        }
      );

      console.log(`Webhook successfully registered: ${cleanShopDomain} ${topic}`);
    } catch (error: any) {
      const data = error?.response?.data;
      const alreadyExists =
        error?.response?.status === 422 &&
        data?.errors?.address?.[0]?.includes("already been taken");

      if (alreadyExists) {
        console.warn(`Webhook already exists: ${cleanShopDomain} ${topic}`);
      } else {
        console.error(`Failed to register webhook (${cleanShopDomain} ${topic}):`, data || error.message);
      }
    }
  }
}
