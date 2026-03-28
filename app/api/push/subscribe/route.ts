import { NextResponse, type NextRequest } from "next/server";

/**
 * Placeholder endpoint for push subscription.
 * In production, persist the subscription in the DB and use web-push to send.
 */
export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // TODO: Store subscription in database
    // await prisma.pushSubscription.create({ data: { ... } });

    console.log("[push/subscribe] Received subscription:", subscription.endpoint?.slice(0, 60));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
}
