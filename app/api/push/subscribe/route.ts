import { NextResponse, type NextRequest } from "next/server";

/**
 * Placeholder endpoint for push subscription.
 * In production, persist the subscription in the DB and use web-push to send.
 */
export async function POST(request: NextRequest) {
  try {
    await request.json();

    // TODO: Store subscription in database

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
}
