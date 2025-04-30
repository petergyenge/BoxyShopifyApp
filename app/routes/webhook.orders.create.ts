import { json } from "@remix-run/node";
import { db } from "~/db.server";
import axios from "axios";

export const action = async ({ request }: { request: Request }) => {
  console.log("Webhook received");

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const shopDomain = request.headers.get("x-shopify-shop-domain");
  if (!shopDomain) {
    return json({ error: "Missing shop domain" }, { status: 400 });
  }

  try {
    const order = await request.json();
    console.log("Order Number:", JSON.stringify(order.name, null, 2));

    const orderId = order.id;

    const shop = await db.shop.findUnique({
      where: { shopDomain },
    });

    if (!shop) {
      return json({ error: "Shop not found in DB" }, { status: 404 });
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
      return json({ error: "No shippingAddress" }, { status: 400 });
    }

    const noteAttributes = [
      { name: "CountryCode", value: orderData.shippingAddress.countryCodeV2 },
      { name: "FullName", value: orderData.shippingAddress.name },
      { name: "Phone", value: orderData.shippingAddress.phone || "" },
      { name: "Addres", value: orderData.shippingAddress.address1 },
      { name: "City", value: orderData.shippingAddress.city },
      { name: "ZipCode", value: orderData.shippingAddress.zip },
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

    console.log("Order successfully updated", order.name);
    return json({ success: true });
  } catch (error: any) {
    console.error("Webhook processing error", error.message);
    return json({ error: "Failed to process the order" }, { status: 500 });
  }
};
