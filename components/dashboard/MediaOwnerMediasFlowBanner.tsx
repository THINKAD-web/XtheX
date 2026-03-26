/**
 * 매체사 미디어 목록 상단 — 등록부터 노출까지 단계 안내 (정적)
 */
export function MediaOwnerMediasFlowBanner() {
  const steps = ["등록", "검토", "관리자 승인", "노출"] as const;

  return (
    <div className="rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/90 via-white to-sky-50/60 px-4 py-3.5 shadow-sm dark:border-emerald-900/45 dark:from-emerald-950/35 dark:via-zinc-950 dark:to-sky-950/25">
      <p className="text-xs font-semibold tracking-wide text-emerald-800 dark:text-emerald-200/90">
        미디어가 광고주에게 보이기까지
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
        {steps.map((label, i) => (
          <span key={label} className="inline-flex items-center gap-1">
            {i > 0 ? (
              <span className="mx-1 text-zinc-400 dark:text-zinc-500" aria-hidden>
                →
              </span>
            ) : null}
            <span className="rounded-full border border-emerald-200/80 bg-white/90 px-3 py-1 text-[13px] shadow-sm dark:border-emerald-900/50 dark:bg-zinc-900/80">
              {label}
            </span>
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        등록 후 <strong className="font-medium text-zinc-700 dark:text-zinc-300">최종 신청</strong>을 하면
        관리자가 검토하고, 승인되면 탐색·추천에 노출됩니다.
      </p>
    </div>
  );
}
