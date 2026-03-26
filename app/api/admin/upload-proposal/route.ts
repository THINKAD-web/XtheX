import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { runUploadProposalFromFormData } = await import(
    "@/lib/admin/upload-proposal-handler"
  );
  const formData = await req.formData();
  const result = await runUploadProposalFromFormData(formData);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 },
    );
  }
  return NextResponse.json({
    success: true,
    draftId: result.draftId,
    draftIds: result.draftIds,
    failed: result.failed,
  });
}
