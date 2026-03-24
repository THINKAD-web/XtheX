import { getTrendingMediasTop5 } from "@/lib/medias/trending";
import { TrendingMediasCarouselClient } from "@/components/medias/TrendingMediasCarouselClient";

type Props = {
  locale: string;
  titleKo?: string;
  titleEn?: string;
  subtitleKo?: string;
  subtitleEn?: string;
};

export async function TrendingMediasSection({
  locale,
  titleKo = "이번 주 트렌딩 매체 TOP 5",
  titleEn = "Trending media TOP 5",
  subtitleKo = "서울 상권(강남·홍대·여의도 등) 우선으로 정렬합니다.",
  subtitleEn = "Prioritizes Seoul hotspots (Gangnam, Hongdae, Yeouido, etc).",
}: Props) {
  const medias = await getTrendingMediasTop5({ preferSeoul: true });
  if (medias.length === 0) return null;
  return (
    <TrendingMediasCarouselClient
      locale={locale}
      medias={medias}
      titleKo={titleKo}
      titleEn={titleEn}
      subtitleKo={subtitleKo}
      subtitleEn={subtitleEn}
    />
  );
}
