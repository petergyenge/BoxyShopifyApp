import { PrismaClient } from "@prisma/client";
import { registerWebhook } from "./registerWebhook";

registerWebhook().catch(console.error);


let db: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

if (!global.__db) {
  global.__db = new PrismaClient();
}

db = global.__db;

export { db };
