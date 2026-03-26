/**
 * 매체사 미디어 목록 상단 — 등록·승인·노출 단계 (정적)
 */
export function MediaOwnerMediasFlowBanner() {
  return (
    <div className="rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/90 via-white to-sky-50/60 px-4 py-3 shadow-sm dark:border-emerald-900/45 dark:from-emerald-950/35 dark:via-zinc-950 dark:to-sky-950/25">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
        등록 → 검토 → 관리자 승인 → 노출
      </p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        최종 신청 후 관리자 승인 시 광고주에게 노출됩니다.
      </p>
    </div>
  );
}
