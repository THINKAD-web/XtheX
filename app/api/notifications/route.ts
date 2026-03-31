import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { getDisabledNotificationTypes } from "@/lib/notifications/prefs-shared";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, notificationCategoryPrefs: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const disabled = getDisabledNotificationTypes(user.notificationCategoryPrefs);
  const typeWhere =
    disabled.length > 0 ? { type: { notIn: disabled } as const } : {};

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id, ...typeWhere },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId: user.id, read: false, ...typeWhere },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const action = (body as { action?: string }).action;
  if (action === "markAllRead") {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "markRead") {
    const id = (body as { id?: string }).id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "markUnread") {
    const id = (body as { id?: string }).id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: false },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
