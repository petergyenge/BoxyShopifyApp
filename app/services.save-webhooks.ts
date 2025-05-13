import { db } from "~/db.server";

export async function saveWebhooks(shopDomain: string) {
  const shop = await db.shop.findUnique({
    where: { shopDomain },
  });

  if (!shop || !shop.accessToken) {
    console.error(`No access token found for shop: ${shopDomain}`);
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
      const res = await fetch(`https://${shopDomain}/admin/api/2023-10/webhooks.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": shop.accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address,
            format: "json",
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();

        const alreadyExists =
          res.status === 422 &&
          error?.errors?.address?.[0]?.includes("already been taken");

        if (alreadyExists) {
          console.warn(`Webhook already exists for topic: ${topic}`);
          continue;
        }

        throw new Error(`HTTP ${res.status}: ${JSON.stringify(error)}`);
      }

      console.log(`Webhook successfully registered: ${topic}`);
    } catch (error) {
      console.error(`Failed to register webhook (${topic}):`, error);
    }
  }
}
