import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { db } from "./db.server";
import axios from "axios";

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
    console.log("⚡ afterAuth elindult!");
  
    try {
      const shop = session.shop;
      const accessToken = session.accessToken;
  
      if (!accessToken) {
        throw new Error("❌ accessToken hiányzik!");
      }
  
      console.log("➡️ Shop mentés:", shop);
  
      await db.shop.upsert({
        where: { shopDomain: shop },
        update: { accessToken },
        create: { shopDomain: shop, accessToken },
      });
  
      const webhookUrl = `${appUrl}/webhook/orders/create`;
      console.log("🔗 Webhook regisztrálás:", webhookUrl);
  
      const response = await axios.post(
        `https://${shop}/admin/api/${ApiVersion}/webhooks.json`,
        {
          webhook: {
            topic: "orders/create",
            address: webhookUrl,
            format: "json",
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
        }
      );
  
      if (response.status === 201) {
        console.log("✅ Webhook sikeresen regisztrálva!");
      } else {
        console.error("❌ Webhook hiba:", response.data);
      }
    } catch (error: any) {
      console.error("🔥 Hiba az afterAuth alatt:", error.message || error);
    }
  }
  ,
});

export default shopify;
export const authenticate = shopify.authenticate;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const sessionStorage = shopify.sessionStorage;
