import { type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("🛎️ auth.callback loader meghívva");

  const { session } = await authenticate.admin(request);
  console.log("✅ Auth sikeres, session:", session);

  if (!session) {
    console.error("❌ Session nem jött létre.");
    return new Response("Session error", { status: 401 });
  }

  // 💾 Shop adatainak mentése DB-be
  try {
    await db.shop.upsert({
      where: { shopDomain: session.shop },
      update: { accessToken: session.accessToken },
      create: {
        shopDomain: session.shop,
        accessToken: session.accessToken ?? "default_token",
      },
    });
    console.log("📦 Shop adatok sikeresen elmentve:", session.shop);
  } catch (err) {
    console.error("🔥 Hiba a DB mentés során:", err);
  }

  return new Response("Callback kész!");
};
