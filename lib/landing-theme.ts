/**
 * XtheX layout tokens — dark-first, unified sections/cards/buttons.
 * Use across home, marketing, mix-media, dashboards (import `landing`).
 */
export const landing = {
  /** Section vertical rhythm (replaces py-16~28 mix) */
  section:
    "relative border-t border-zinc-800/50 py-20 lg:py-28 dark:border-zinc-800/50",
  sectionAlt:
    "relative border-t border-zinc-800/50 bg-zinc-900/20 py-20 lg:py-28 dark:bg-zinc-900/30",
  sectionSolid:
    "relative border-t border-zinc-800/50 bg-zinc-950 py-20 lg:py-28",
  /** Stack children inside a section */
  sectionStack: "space-y-16 lg:space-y-24",

  container: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",

  /** Typography */
  h1: "text-balance text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-5xl",
  h1OnDark:
    "text-balance text-4xl font-bold tracking-tight text-white lg:text-5xl",
  h2: "text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl",
  h3: "text-xl font-semibold text-zinc-900 dark:text-zinc-50 lg:text-2xl",
  lead: "mx-auto mt-4 max-w-2xl text-pretty text-center text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg",
  body: "text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg",

  /**
   * Unified cards — shadcn semantic + hover depth
   * (dark: card bg reads well on zinc-950)
   */
  card: [
    "rounded-xl border border-border bg-card p-6 text-card-foreground shadow-md",
    "transition-[box-shadow,border-color,transform,filter] duration-300 ease-out",
    "hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-zinc-400/25 hover:brightness-[1.01]",
    "dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-black/50",
    "dark:hover:border-primary/40 dark:hover:shadow-[0_24px_48px_-12px_rgba(37,99,235,0.35)]",
  ].join(" "),

  cardDark: [
    "rounded-xl border border-zinc-700/60 bg-zinc-900/85 p-6 shadow-xl shadow-black/40",
    "backdrop-blur-sm transition-[box-shadow,border-color,transform,filter] duration-300",
    "hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-2xl hover:shadow-[0_28px_56px_-14px_rgba(37,99,235,0.4)] hover:brightness-[1.02]",
  ].join(" "),

  cardDarkCompact: [
    "rounded-xl border border-zinc-700/50 bg-zinc-900/90 shadow-lg shadow-black/35",
    "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-blue-950/30",
  ].join(" "),

  /** Flat inner panels (sliders, summaries) */
  panel:
    "rounded-xl border border-border bg-muted/40 p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800/50",

  /** Composer / static surfaces (no hover scale) */
  surface:
    "rounded-xl border border-border bg-card shadow-lg dark:border-zinc-700 dark:bg-zinc-900/90",

  /** Primary CTA — brand blue #2563EB */
  btnPrimary: [
    "inline-flex h-11 min-w-[200px] items-center justify-center rounded-lg px-6",
    "bg-[#2563EB] text-sm font-medium text-white",
    "transition-all duration-200 hover:bg-[#1d4ed8] hover:shadow-xl hover:shadow-[#2563EB]/35",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
  ].join(" "),

  btnSecondary: [
    "inline-flex h-11 min-w-[200px] items-center justify-center rounded-lg border border-zinc-500 px-6",
    "bg-transparent text-sm font-medium text-zinc-900 dark:text-zinc-100",
    "transition-all duration-200 hover:border-blue-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
  ].join(" "),

  btnPrimaryMuted: [
    "inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white",
    "transition-all duration-200 hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-600/90 dark:hover:shadow-lg dark:hover:shadow-blue-600/20",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
  ].join(" "),

  /** Form controls */
  input:
    "h-11 w-full rounded-lg border border-input bg-background px-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",

  grid4:
    "mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:mt-16",
  grid3:
    "mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8 lg:mt-16",
  grid2: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8",

  /** Map embed */
  mapHeight: "h-[50vh] min-h-[280px] w-full lg:h-[60vh]",
} as const;

export const landingChart = {
  grid: "#3f3f46",
  axis: "#a1a1aa",
  tooltipBg: "#18181b",
  tooltipBorder: "#3f3f46",
  linePrimary: "#3b82f6",
  lineSecondary: "#22d3ee",
  lineTertiary: "#818cf8",
  lineAccent: "#38bdf8",
} as const;

/** 밝기(밝게) + 차트 영역용 — 흰 카드 위 가독성 */
export const landingChartLight = {
  grid: "#d4d4d8",
  axis: "#52525b",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e4e4e7",
  linePrimary: "#2563eb",
  lineSecondary: "#0891b2",
  lineTertiary: "#4f46e5",
  lineAccent: "#0284c7",
} as const;
