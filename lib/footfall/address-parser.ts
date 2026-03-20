import type { HotspotKey } from "./fallback-data";

const NORMALIZE = (s: string) =>
  s
    .replace(/\s+/g, " ")
    .replace(/[·,，]/g, " ")
    .trim()
    .toLowerCase();

const HOTSPOT_PATTERNS: { key: HotspotKey; keywords: string[] }[] = [
  {
    key: "seongsu_yeonmujang",
    keywords: ["성수", "연무장", "연무장길", "성동구 연무장"],
  },
  {
    key: "seongsu_dong2ga",
    keywords: ["성수동2가", "성수동 2가", "성수2가"],
  },
  {
    key: "gangnam_main",
    keywords: ["강남", "강남역", "테헤란", "역삼"],
  },
  {
    key: "hongdae_main",
    keywords: ["홍대", "마포구 홍대", "서교동"],
  },
];

export function parseAddressToHotspot(
  address: string,
  district?: string | null,
  city?: string | null,
): HotspotKey | null {
  const combined = [address, district ?? "", city ?? ""]
    .filter(Boolean)
    .join(" ");
  const normalized = NORMALIZE(combined);
  if (!normalized) return null;

  for (const { key, keywords } of HOTSPOT_PATTERNS) {
    if (keywords.some((k) => normalized.includes(NORMALIZE(k)))) return key;
  }
  return null;
}

export function isSeongsuArea(address: string, district?: string | null): boolean {
  const key = parseAddressToHotspot(address, district);
  return (
    key === "seongsu_yeonmujang" ||
    key === "seongsu_dong2ga" ||
    (key === null && /성수|성동구/.test(NORMALIZE(address + " " + (district ?? ""))))
  );
}

export const SEONGSU_DONG2GA_CODE = "1120011400";

export function getDongCodeFromAddress(
  address: string,
  district?: string | null,
  city?: string | null,
): string | null {
  const combined = [address, district ?? "", city ?? ""].filter(Boolean).join(" ");
  const normalized = NORMALIZE(combined);
  if (!normalized) return null;
  if (
    /성수동2가|성수동\s*2가|성수2가|연무장|연무장길|성동구\s*연무장/.test(normalized) ||
    (normalized.includes("성동구") && normalized.includes("성수"))
  ) {
    return SEONGSU_DONG2GA_CODE;
  }
  return null;
}
