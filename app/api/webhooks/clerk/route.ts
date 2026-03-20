import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) throw new Error("CLERK_WEBHOOK_SECRET missing");

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  const payload = await req.text();

  const svix = new Webhook(WEBHOOK_SECRET);
  let evt: { type: string; data: any };

  try {
    evt = svix.verify(payload, {
      "svix-id": svix_id!,
      "svix-timestamp": svix_timestamp!,
      "svix-signature": svix_signature!,
    }) as { type: string; data: any };
  } catch (err) {
    console.error("Webhook verification failed", err);
    return new Response("Error", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, first_name, last_name, email_addresses } = evt.data;
    const email = email_addresses[0]?.email_address ?? `user_${id}@placeholder.local`;
    await prisma.user.upsert({
      where: { clerkId: id },
      update: {
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        email,
      },
      create: {
        clerkId: id,
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        email,
        role: UserRole.ADVERTISER,
        onboardingCompleted: false,
      },
    });
  }

  return new Response("OK", { status: 200 });
}
