/** 관리자 반려 시 `adminMemo`에 `Rejected: …` 또는 `Rejected (no reason)` 줄로 누적 저장됨 */

export function parseRejectionFromAdminMemo(adminMemo: string | null | undefined): {
  reasonText: string | null;
  hasRejectedRecord: boolean;
} {
  if (!adminMemo?.trim()) {
    return { reasonText: null, hasRejectedRecord: false };
  }
  const lines = adminMemo
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]!;
    if (line.startsWith("Rejected: ")) {
      const body = line.slice("Rejected: ".length).trim();
      return { reasonText: body || null, hasRejectedRecord: true };
    }
    if (line === "Rejected (no reason)") {
      return { reasonText: null, hasRejectedRecord: true };
    }
  }
  return { reasonText: null, hasRejectedRecord: false };
}
