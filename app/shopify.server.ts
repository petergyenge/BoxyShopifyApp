import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  DeliveryMethod,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { db } from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL!,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(db),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  webhooks: {
    ORDERS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/orders/create",
    },
  },
  hooks: {
    async afterAuth({ session }) {
      console.log("🔥 afterAuth meghívva:", session.shop);
  
      await db.shop.upsert({
        where: { shopDomain: session.shop },
        update: { accessToken: session.accessToken },
        create: {
          shopDomain: session.shop,
          accessToken: session.accessToken ?? "default",
        },
      });
  
      const result = await shopify.registerWebhooks({ session });
      console.log("✅ Webhook regisztrálva:", result);
    },
  },
  
});

export default shopify;
export const authenticate = shopify.authenticate;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const sessionStorage = shopify.sessionStorage;
