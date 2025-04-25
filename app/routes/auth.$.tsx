import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  console.log("🔥 afterAuth meghívva az auth.$.tsx loaderben!");
  console.log("➡️ Shop:", session.shop);
  console.log("🔐 Access Token:", session.accessToken);

  try {
    await db.shop.upsert({
      where: { shopDomain: session.shop },
      update: { accessToken: session.accessToken },
      create: {
        shopDomain: session.shop,
        accessToken: session.accessToken ?? "default",
      },
    });
    console.log("✅ Shop sikeresen mentve az adatbázisba!");
  } catch (err) {
    console.error("DB hiba:", err);
  }

  return null;
};
