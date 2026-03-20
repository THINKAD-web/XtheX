import { NextResponse } from "next/server";

const CACHE_SECONDS = 30 * 60; // 30 min

/**
 * GET /api/weather?city=Seoul
 * OpenWeather current weather. Server cache 30 min.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") ?? "Seoul,KR";
  const apiKey = process.env.OPENWEATHER_API_KEY ?? process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENWEATHER_API_KEY not set", condition: "default" },
      { status: 200 },
    );
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
      { next: { revalidate: CACHE_SECONDS } },
    );
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json(
        { error: res.statusText, condition: "default", detail: t },
        { status: 200 },
      );
    }
    const data = (await res.json()) as { weather?: { main: string }[] };
    const main = data.weather?.[0]?.main ?? "Clear";
    return NextResponse.json({ condition: main, raw: data });
  } catch (e) {
    console.error("weather api error:", e);
    return NextResponse.json(
      { error: "fetch failed", condition: "default" },
      { status: 200 },
    );
  }
}
