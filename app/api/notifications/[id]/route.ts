import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const patchBodySchema = z
  .object({
    read: z.boolean().optional(),
    starred: z.boolean().optional(),
  })
  .refine((o) => o.read !== undefined || o.starred !== undefined, {
    message: "Provide read and/or starred",
  });

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data: { read?: boolean; starred?: boolean } = {};
  if (parsed.data.read !== undefined) data.read = parsed.data.read;
  if (parsed.data.starred !== undefined) data.starred = parsed.data.starred;

  const updated = await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data,
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ notification: row });
}
