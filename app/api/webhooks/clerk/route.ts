import { Webhook } from "svix";
import { headers } from "next/headers";
import { MongoClient } from "mongodb";
import type { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const body = await req.text();
  const h = await headers();

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  const evt = wh.verify(body, {
    "svix-id": h.get("svix-id")!,
    "svix-timestamp": h.get("svix-timestamp")!,
    "svix-signature": h.get("svix-signature")!,
  }) as WebhookEvent;

  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();

  const users = client.db("liftlog").collection("users");

  if (evt.type === "user.created") {
    const user = evt.data;

    await users.insertOne({
      clerkId: user.id,
      email: user.email_addresses?.[0]?.email_address,
      firstName: user.first_name,
      lastName: user.last_name,
      imageUrl: user.image_url,
      provider: user.external_accounts?.[0]?.provider,
      createdAt: new Date(),
    });
  } else if (evt.type === "user.deleted") {
    const user = evt.data;

    await users.deleteOne({
      clerkId: user.id,
    });
  } else if (evt.type === "user.updated") {
    const user = evt.data;

    await users.updateOne(
      { clerkId: user.id },
      {
        $set: {
          email: user.email_addresses?.[0]?.email_address,
          firstName: user.first_name,
          lastName: user.last_name,
          imageUrl: user.image_url,
          provider: user.external_accounts?.[0]?.provider,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  await client.close();

  return Response.json({ ok: true });
}
