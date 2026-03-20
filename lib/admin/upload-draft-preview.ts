/** AI 업로드 API·클라이언트 공용 미리보기 타입 */
export type UploadDraftPreview = {
  draftId: string;
  mediaName: string;
  category: string;
  trustScore: number | null;
  description: string | null;
  tags: string[];
  address: string | null;
  district: string | null;
  price: number | null;
  cpm: number | null;
};
