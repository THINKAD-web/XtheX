import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/find-user-by-clerk";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_MEDIA_PHOTOS_BUCKET?.trim() || "media-photos";

function getSupabase() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await findUserById(session.user.id);
    if (!dbUser || dbUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const mediaId = formData.get("mediaId");

    if (!(file instanceof File) || typeof mediaId !== "string" || !mediaId) {
      return NextResponse.json(
        { ok: false, error: "Missing file or mediaId" },
        { status: 400 },
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase Storage not configured" },
        { status: 500 },
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const storagePath = `bulk/${mediaId}/${Date.now()}_${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || `image/${ext}`,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: uploadError.message },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    await prisma.media.update({
      where: { id: mediaId },
      data: {
        sampleImages: { push: publicUrl },
      },
    });

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (e) {
    console.error("[bulk-upload]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 },
    );
  }
}
