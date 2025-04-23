import axios from "axios";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE!;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const WEBHOOK_URL = process.env.WEBHOOK_URL!;

export async function registerWebhook() {
  try {
    const response = await axios.post(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/webhooks.json`,
      {
        webhook: {
          topic: "orders/create",
          address: WEBHOOK_URL,
          format: "json",
        },
      },
      {
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Webhook sikeresen regisztrálva:", response.data);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Hiba a webhook regisztrálásakor:", error.response?.data || error.message);
    } else {
      console.error("❌ Ismeretlen hiba a webhook regisztráció során:", error);
    }
  }
}
