// app/routes/auth.callback.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  await db.shop.upsert({
    where: { shopDomain: session.shop },
    update: {
      accessToken: session.accessToken!,
    },
    create: {
      shopDomain: session.shop,
      accessToken: session.accessToken!,
    },
  });
  

  return json({ success: true });
};
