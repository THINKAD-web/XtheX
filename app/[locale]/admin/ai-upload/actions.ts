"use server";

import { runUploadProposalFromFormData } from "@/lib/admin/upload-proposal-handler";

export type { UploadProposalResult } from "@/lib/admin/upload-proposal-handler";

/** @deprecated 클라이언트에서는 /api/admin/upload-proposal 사용 (React 19 FormData 이슈 회피) */
export async function uploadProposal(formData: FormData) {
  return runUploadProposalFromFormData(formData);
}
