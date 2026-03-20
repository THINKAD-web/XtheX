/**
 * 타겟/인구통계 문구 → 검색용 정규 태그 (audienceTags).
 * 길고 구체적인 패턴을 먼저 매칭.
 */
const DEMOGRAPHIC_RULES: Array<{ re: RegExp; tag: string }> = [
  {
    re: /오피스\s*출퇴근자?|강남\s*오피스|오피스\s*근무|사무실\s*인근|CBD|업무\s*지구/i,
    tag: "오피스워커",
  },
  { re: /직장\s*인|화이트\s*칼라|사무직|워킹\s*맨|회사원|직장인|비즈니스\s*맨/i, tag: "오피스워커" },
  {
    re: /쇼핑몰\s*방문자?|쇼핑몰|쇼핑\s*객|백화점|아울렛|소비\s*객|매장\s*방문|리테일/i,
    tag: "쇼핑러",
  },
  { re: /통근|출퇴근\s*객|환승\s*동선/i, tag: "통근객" },
  { re: /대학\s*생|캠퍼스|MZ/i, tag: "대학생층" },
  { re: /20\s*대|twenties/i, tag: "20대" },
  { re: /30\s*대|thirties/i, tag: "30대" },
  { re: /40\s*대|50\s*대|중장년/i, tag: "중장년층" },
  { re: /여성|레이디|Lady/i, tag: "여성층" },
  { re: /남성|맨즈|Male/i, tag: "남성층" },
  { re: /가족|육아|키즈/i, tag: "가족단위" },
  { re: /관광|외국인|인바운드/i, tag: "관광객" },
  { re: /거주|주민|단지/i, tag: "거주민" },
  { re: /유동\s*인구|길\s*가는|도보\s*유동/i, tag: "유동인구" },
  { re: /역\s*이용|지하철\s*이용|환승/i, tag: "역이용객" },
  { re: /차량|운전|도로\s*이용/i, tag: "차량층" },
];

/** 탐색 검색어와 매칭되는 audience 태그 (hasSome 검색용) */
export const ALL_CANONICAL_AUDIENCE_TAGS: readonly string[] = Array.from(
  new Set(DEMOGRAPHIC_RULES.map((r) => r.tag)),
);

export function deriveAudienceTagsFromDemographics(
  text: string | null | undefined,
): string[] {
  if (!text?.trim()) return [];
  const hay = text.trim();
  const found = new Set<string>();
  for (const { re, tag } of DEMOGRAPHIC_RULES) {
    if (re.test(hay)) found.add(tag);
  }
  return Array.from(found);
}

/** 검색어 q로 audienceTags 배열 필터에 쓸 후보 태그 */
export function audienceTagsMatchingSearchQuery(q: string): string[] {
  const norm = q.trim().toLowerCase();
  if (norm.length < 2) return [];
  const hits = new Set<string>();
  for (const tag of ALL_CANONICAL_AUDIENCE_TAGS) {
    const tl = tag.toLowerCase();
    if (tl.includes(norm) || norm.includes(tl)) hits.add(tag);
  }
  deriveAudienceTagsFromDemographics(q).forEach((t) => hits.add(t));
  return Array.from(hits);
}

export function mergeAudienceTagsForStorage(
  targetAudience: string | null | undefined,
  extra: string[] | null | undefined,
): string[] {
  const fromText = deriveAudienceTagsFromDemographics(targetAudience);
  const manual = (extra ?? [])
    .map((s) => String(s).trim())
    .filter(Boolean);
  return Array.from(new Set([...fromText, ...manual])).slice(0, 24);
}
