"use client";

import * as React from "react";
import { CloudRain, Sun } from "lucide-react";
import {
  getTimeSlot,
  mapWeatherMain,
  getWeatherHint,
} from "@/lib/compare/weather-hint-rules";

type Props = {
  locale: string;
  condition?: string; // OpenWeather main
  className?: string;
};

export function WeatherHint({ locale, condition = "default", className }: Props) {
  const [hour, setHour] = React.useState(12);
  React.useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const timeSlot = getTimeSlot(hour);
  const weatherCond = mapWeatherMain(condition);
  const hint = getWeatherHint(weatherCond, timeSlot, locale);

  if (!hint) return null;

  const isRain = weatherCond === "rain";
  const isClear = weatherCond === "clear";

  return (
    <div
      className={
        className ??
        "flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
      }
    >
      {isRain ? (
        <CloudRain className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
      ) : isClear ? (
        <Sun className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
      ) : null}
      <p>{hint}</p>
    </div>
  );
}

type WeatherHintWithFetchProps = {
  locale: string;
  city?: string;
  className?: string;
};

export function WeatherHintWithFetch({
  locale,
  city = "Seoul",
  className,
}: WeatherHintWithFetchProps) {
  const [condition, setCondition] = React.useState<string>("default");

  React.useEffect(() => {
    const q = city ? `?city=${encodeURIComponent(city)}` : "?city=Seoul,KR";
    fetch(`/api/weather${q}`)
      .then((r) => r.json())
      .then((d) => setCondition(d.condition ?? "default"))
      .catch(() => setCondition("default"));
  }, [city]);

  return <WeatherHint locale={locale} condition={condition} className={className} />;
}
