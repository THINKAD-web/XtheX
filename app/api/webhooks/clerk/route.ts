import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

function getPrimaryEmail(event: WebhookEvent): string | null {
  const data: any = (event as any).data;
  const emails: Array<{ email_address?: string; id?: string }> =
    data?.email_addresses ?? [];
  const primaryId: string | undefined = data?.primary_email_address_id;
  const primary =
    emails.find((e) => e.id && primaryId && e.id === primaryId) ?? emails[0];
  return primary?.email_address ?? null;
}

function getDisplayName(event: WebhookEvent): string | null {
  const data: any = (event as any).data;
  const first = data?.first_name as string | undefined;
  const last = data?.last_name as string | undefined;
  const username = data?.username as string | undefined;
  const full = [first, last].filter(Boolean).join(" ").trim();
  return full || username || null;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  const svixId = (await headers()).get("svix-id");
  const svixTimestamp = (await headers()).get("svix-timestamp");
  const svixSignature = (await headers()).get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing Svix headers" },
      { status: 400 },
    );
  }

  const payload = await req.text();

  let event: WebhookEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  const eventType = event.type;
  const clerkId = (event as any).data?.id as string | undefined;
  if (!clerkId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  if (eventType === "user.created" || eventType === "user.updated") {
    const email = getPrimaryEmail(event);
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    const name = getDisplayName(event);

    await prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email,
        name,
        role: Role.PARTNER,
      },
      update: {
        email,
        name,
      },
    });
  } else if (eventType === "user.deleted") {
    // Optionally delete. For now, ignore to preserve auditability.
    // await prisma.user.delete({ where: { clerkId } }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

