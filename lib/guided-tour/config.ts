/** `data-tour` values on header UI — keep in sync with SiteHeader / MobileNav / etc. */
export const TOUR_SELECTORS = {
  intro: null,
  explore: '[data-tour="tour-explore"]',
  planner: '[data-tour="tour-planner"]',
  templates: '[data-tour="tour-templates"]',
  search: '[data-tour="tour-search"]',
  cart: '[data-tour="tour-cart"]',
  account: '[data-tour="tour-account"]',
  outro: null,
} as const;

export type TourStepId = keyof typeof TOUR_SELECTORS;

export const TOUR_STEP_ORDER: TourStepId[] = [
  "intro",
  "explore",
  "planner",
  "templates",
  "search",
  "cart",
  "account",
  "outro",
];

export function tourStorageKey(userId: string): string {
  return `xthex_guided_tour_v2_${userId}`;
}
