import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/rbac";
import { DatabaseConnectionError } from "@/lib/auth/find-user-by-clerk";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ completed: true });
    }
    if (user.role === UserRole.ADMIN) {
      return NextResponse.json({ completed: true });
    }
    return NextResponse.json({
      completed: user.onboardingCompleted,
      role: user.role,
    });
  } catch (e) {
    if (e instanceof DatabaseConnectionError) {
      return NextResponse.json({ completed: true, dbUnavailable: true }, { status: 200 });
    }
    throw e;
  }
}
