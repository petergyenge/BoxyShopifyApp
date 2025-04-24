import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { db } from "./db.server";

const appUrl = process.env.SHOPIFY_APP_URL?.replace(/\/$/, "");

if (!appUrl) {
  throw new Error("SHOPIFY_APP_URL is not defined in environment variables.");
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(db),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },

  async afterAuth({ session }: { session: import("@shopify/shopify-app-remix/server").Session }) {
    const shop = session.shop;
    const accessToken = session.accessToken;

    // ⬇️ SHOP mentése adatbázisba
    await db.shop.upsert({
      where: { shopDomain: shop },
      update: { accessToken },
      create: { shopDomain: shop!, accessToken: accessToken! },
    });    

    try {
      const response = await fetch(
        `https://${shop}/admin/api/2024-01/webhooks.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { "X-Shopify-Access-Token": accessToken }),
          },
          body: JSON.stringify({
            webhook: {
              topic: "orders/create",
              address: `${appUrl}/webhook/orders/create`,
              format: "json",
            },
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Webhook sikeresen regisztrálva!");
      } else {
        console.error("❌ Webhook regisztráció sikertelen:", await response.text());
      }
    } catch (error) {
      console.error("❌ Webhook regisztráció error:", error);
    }
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const sessionStorage = shopify.sessionStorage;
