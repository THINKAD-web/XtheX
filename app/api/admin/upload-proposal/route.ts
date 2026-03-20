import { NextResponse } from "next/server";
import { runUploadProposalFromFormData } from "@/lib/admin/upload-proposal-handler";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
