// app/routes/api/save-shop.ts

import { json } from "@remix-run/node";
import { db } from "~/db.server"; // Prisma instance

// A POST requesthez használt action
export const action = async ({ request }: { request: Request }) => {
  // Kivesszük a shop URL-t és az access token-t a kérés body-jából
  const { shopDomain, accessToken } = await request.json();

  if (!shopDomain || !accessToken) {
    return json({ error: "Shop domain and access token are required." }, { status: 400 });
  }

  try {
    // Új shop mentése a Prisma modelbe
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
