/**
 * 날씨·시간대별 추천 문구 (룰베이스). OpenWeather main + getHours() 사용.
 */
export type WeatherCondition = "rain" | "clear" | "clouds" | "snow" | "default";
export type TimeSlot = "morning_rush" | "evening_rush" | "day" | "night";

/** 시간대별 문구 + 폴백용 default */
type SlotHints = Partial<Record<TimeSlot, string>> & { default?: string };

const HINTS_KO: Record<WeatherCondition, SlotHints> = {
  rain: {
    morning_rush: "비 오는 날 출근 시간대, 역·대중교통 매체 집중도↑ CPM 효과 기대.",
    evening_rush: "비 오는 날 퇴근 시간, 실내·역사 매체 노출 가치 상승.",
    day: "비 오는 날 실내·대중교통 노출 가치 상승. 지하철·실내 디스플레이 추천.",
    night: "비 오는 날 야외보다 실내·대중교통 매체 추천.",
    default: "비 오는 날 실내·대중교통 노출 가치 상승. 지하철·실내 디스플레이 추천.",
  },
  clear: {
    morning_rush: "맑은 날 출근 시간, 역·사무가 밀집 매체 효과 UP. 강남·역세권 LED 추천.",
    evening_rush: "맑은 날 퇴근 시간, 야외 LED·빌보드 시인성 좋음. 강남·홍대권 추천.",
    day: "맑은 날 야외 매체 시인성 좋음. 도심·상권 빌보드 추천.",
    night: "맑은 밤 LED·디지털 보드 가시성 좋음.",
    default: "맑은 날 야외 매체 시인성·효과 좋음.",
  },
  clouds: {
    morning_rush: "흐린 날 출근 시간, 역·대중교통 매체 안정적 노출.",
    evening_rush: "흐린 날 퇴근 시간, 실내·역사 매체 추천.",
    default: "흐린 날 실내·역사 매체 노출 안정적.",
  },
  snow: {
    morning_rush: "눈 오는 날 출근 시간, 대중교통·실내 매체 집중도↑.",
    default: "눈 오는 날 실내·대중교통 매체 추천.",
  },
  default: {
    morning_rush: "출근 시간대, 역·사무가 밀집 매체 효과 UP.",
    evening_rush: "퇴근 시간대, 야외 LED·상권 매체 추천.",
    default: "현재 조건에 맞는 매체를 비교해 보세요.",
  },
};

const HINTS_EN: Record<WeatherCondition, SlotHints> = {
  rain: {
    morning_rush: "Rain + morning rush: transit & station media perform better.",
    evening_rush: "Rain + evening: indoor & station displays recommended.",
    default: "Rainy day: indoor and transit displays recommended.",
  },
  clear: {
    morning_rush: "Clear morning: station & office-area LED recommended.",
    evening_rush: "Clear evening: outdoor LED & billboards have strong visibility.",
    default: "Clear day: good visibility for outdoor DOOH.",
  },
  clouds: {
    default: "Cloudy: indoor & station media offer stable reach.",
  },
  snow: {
    default: "Snow: indoor and transit media recommended.",
  },
  default: {
    morning_rush: "Morning rush: station & office-area media perform well.",
    evening_rush: "Evening rush: outdoor LED & retail areas recommended.",
    default: "Compare media suited to current conditions.",
  },
};

export function getTimeSlot(hour: number): TimeSlot {
  if (hour >= 7 && hour < 10) return "morning_rush";
  if (hour >= 17 && hour < 21) return "evening_rush";
  if (hour >= 6 && hour < 18) return "day";
  return "night";
}

export function mapWeatherMain(main: string): WeatherCondition {
  const m = main.toLowerCase();
  if (m.includes("rain") || m.includes("drizzle")) return "rain";
  if (m.includes("clear")) return "clear";
  if (m.includes("cloud")) return "clouds";
  if (m.includes("snow")) return "snow";
  return "default";
}

export function getWeatherHint(
  condition: WeatherCondition,
  timeSlot: TimeSlot,
  locale: string,
): string {
  const hints = locale === "ko" ? HINTS_KO : HINTS_EN;
  const byCond = hints[condition] ?? hints.default;
  return (
    (byCond && (byCond[timeSlot] ?? byCond.default)) ||
    (hints.default && (hints.default[timeSlot] ?? hints.default.default)) ||
    ""
  );
}
