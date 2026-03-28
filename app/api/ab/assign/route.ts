import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { pickAbVariant } from "@/lib/ab/pick-variant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const cookieStore = await cookies();
  let subject = cookieStore.get("ab_sub")?.value?.trim();
  const needsCookie = !subject;
  if (!subject) {
    subject = randomUUID();
  }

  const experiment = await prisma.abExperiment.findUnique({
    where: { slug },
    select: {
      id: true,
      status: true,
      trafficSplitA: true,
      winnerVariant: true,
    },
  });

  const variant = pickAbVariant(experiment, subject);

  const res = NextResponse.json({
    ok: true,
    slug,
    variant,
    experimentId: experiment?.id ?? null,
  });

  if (needsCookie) {
    res.cookies.set("ab_sub", subject, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return res;
}
