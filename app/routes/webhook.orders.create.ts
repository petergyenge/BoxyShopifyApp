import { json } from "@remix-run/node";
import { db } from "~/db.server";
import axios from "axios";

export const action = async ({ request }: { request: Request }) => {
  console.log("📩 Webhook érkezett!");

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const order = await request.json();
    console.log("📦 Webhook tartalma:", JSON.stringify(order, null, 2));

    const shopDomain = order.store_domain;
    const orderId = order.id;

    const shop = await db.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) {
      console.error("❌ A bolt nem található az adatbázisban!");
      return json({ error: "A bolt nem található az adatbázisban" }, { status: 404 });
    }

    const accessToken = shop.accessToken;

    const query = `
      {
        order(id: "gid://shopify/Order/${orderId}") {
          id
          customer {
            email
          }
          shippingAddress {
            name
            phone
            address1
            city
            country
            zip
            countryCodeV2
          }
        }
      }
    `;

    const graphqlResponse = await axios.post(
      `https://${shopDomain}/admin/api/2025-04/graphql.json`,
      { query },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const orderData = graphqlResponse.data.data.order;

    if (!orderData || !orderData.shippingAddress) {
      console.error("❌ Nincs szállítási cím a rendelésben.");
      return json({ error: "Nincs szállítási cím." }, { status: 400 });
    }

    const noteAttributes = [
      { name: "Country code", value: orderData.shippingAddress.countryCodeV2 },
      { name: "Név", value: orderData.shippingAddress.name },
      { name: "Telefon", value: orderData.shippingAddress.phone || "" },
      { name: "Cím", value: orderData.shippingAddress.address1 },
      { name: "Város", value: orderData.shippingAddress.city },
      { name: "Irányítószám", value: orderData.shippingAddress.zip },
      { name: "Email", value: orderData.customer?.email || "" },
    ];

    const updateResponse = await axios.put(
      `https://${shopDomain}/admin/api/2025-04/orders/${orderId}.json`,
      {
        order: {
          id: orderId,
          note_attributes: noteAttributes,
        },
      },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Rendelés sikeresen frissítve:", updateResponse.data);
    return json({ success: true });
  } catch (error: any) {
    console.error("❌ Hiba a webhook feldolgozása során:", error.message);
    return json({ error: "Hiba a rendelés feldolgozása közben." }, { status: 500 });
  }
};
