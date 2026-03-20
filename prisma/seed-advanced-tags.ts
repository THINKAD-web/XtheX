import { prisma } from "@/lib/prisma";

async function main() {
  const tagCategory = (prisma as any).tagCategory;
  const tag = (prisma as any).tag;
  const savedFilterPreset = (prisma as any).savedFilterPreset;

  const location = await tagCategory.upsert({
    where: { code: "location_poi" },
    update: {},
    create: {
      code: "location_poi",
      ko: "위치 / 상권",
      en: "Location / POI",
      ja: "場所 / POI",
      order: 10,
    },
  });

  const time = await tagCategory.upsert({
    where: { code: "time_context" },
    update: {},
    create: {
      code: "time_context",
      ko: "시간 / 컨텍스트",
      en: "Time / Context",
      ja: "時間 / コンテキスト",
      order: 20,
    },
  });

  const audience = await tagCategory.upsert({
    where: { code: "demographic_lifestyle" },
    update: {},
    create: {
      code: "demographic_lifestyle",
      ko: "인구통계 / 라이프스타일",
      en: "Demographics / Lifestyle",
      ja: "属性 / ライフスタイル",
      order: 30,
    },
  });

  await tag.createMany({
    skipDuplicates: true,
    data: [
      {
        code: "gangnam_station",
        ko: "강남역",
        en: "Gangnam Station",
        ja: "江南駅",
        categoryId: location.id,
        aliases: ["강남", "Gangnam", "강남역 주변"],
        mappingField: "location.district",
        mappingType: "in",
        mappingValue: "강남구",
      },
      {
        code: "coex",
        ko: "코엑스",
        en: "COEX",
        ja: "COEX",
        categoryId: location.id,
        aliases: ["코엑스몰", "삼성동 코엑스", "COEX Mall"],
        mappingField: "location.poi",
        mappingType: "contains",
        mappingValue: "코엑스",
      },
      {
        code: "yeouido",
        ko: "여의도",
        en: "Yeouido",
        ja: "汝矣島",
        categoryId: location.id,
        aliases: ["여의도역", "여의도 금융가"],
        mappingField: "location.district",
        mappingType: "in",
        mappingValue: "영등포구",
      },
      // --- Japan POIs (copy of KR structure) ---
      {
        code: "tokyo_shibuya",
        ko: "도쿄 시부야",
        en: "Tokyo Shibuya",
        ja: "渋谷（東京）",
        categoryId: location.id,
        aliases: ["시부야", "Shibuya", "渋谷", "Tokyo Shibuya"],
        mappingField: "location.poi",
        mappingType: "contains",
        mappingValue: "Shibuya",
      },
      {
        code: "tokyo_shinjuku",
        ko: "도쿄 신주쿠",
        en: "Tokyo Shinjuku",
        ja: "新宿（東京）",
        categoryId: location.id,
        aliases: ["신주쿠", "Shinjuku", "新宿", "Tokyo Shinjuku"],
        mappingField: "location.poi",
        mappingType: "contains",
        mappingValue: "Shinjuku",
      },
      {
        code: "osaka_namba",
        ko: "오사카 난바",
        en: "Osaka Namba",
        ja: "難波（大阪）",
        categoryId: location.id,
        aliases: ["난바", "Namba", "難波", "Osaka Namba"],
        mappingField: "location.poi",
        mappingType: "contains",
        mappingValue: "Namba",
      },
      {
        code: "osaka_umeda",
        ko: "오사카 우메다",
        en: "Osaka Umeda",
        ja: "梅田（大阪）",
        categoryId: location.id,
        aliases: ["우메다", "Umeda", "梅田", "Osaka Umeda"],
        mappingField: "location.poi",
        mappingType: "contains",
        mappingValue: "Umeda",
      },
      {
        code: "morning_rush",
        ko: "출근시간",
        en: "Morning rush hour",
        ja: "通勤ラッシュ（朝）",
        categoryId: time.id,
        aliases: ["아침 러시", "AM 러시아워"],
        mappingField: "timeSlot",
        mappingType: "in",
        mappingValue: "MORNING_RUSH",
      },
      {
        code: "evening_rush",
        ko: "퇴근시간",
        en: "Evening rush hour",
        ja: "通勤ラッシュ（夕）",
        categoryId: time.id,
        aliases: ["저녁 러시", "PM 러시아워"],
        mappingField: "timeSlot",
        mappingType: "in",
        mappingValue: "EVENING_RUSH",
      },
      {
        code: "office_workers",
        ko: "직장인",
        en: "Office workers",
        ja: "オフィスワーカー",
        categoryId: audience.id,
        aliases: ["오피스 워커", "화이트칼라"],
        mappingField: "targetAudience",
        mappingType: "contains",
        mappingValue: "직장인",
      },
      {
        code: "high_income",
        ko: "고소득층",
        en: "High income",
        ja: "高所得層",
        categoryId: audience.id,
        aliases: ["High spenders", "상위소득"],
        mappingField: "targetSegment",
        mappingType: "contains",
        mappingValue: "고소득",
      },
    ],
  });

  await savedFilterPreset.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "preset_commuter_office_high_income",
        nameKo: "강남/여의도 출퇴근 직장인(고소득)",
        nameEn: "Gangnam/Yeouido commuters (high income)",
        filterJson: {
          groups: [
            { logic: "OR", tags: ["gangnam_station", "coex", "yeouido"] },
            { logic: "OR", tags: ["morning_rush", "evening_rush"] },
            { logic: "AND", tags: ["office_workers", "high_income"] },
          ],
        },
        ownerId: null,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

