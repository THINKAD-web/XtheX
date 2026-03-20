import { NextResponse } from "next/server";
import { parseAddressToHotspot } from "@/lib/footfall/address-parser";
import { getFootfallSuggestion } from "@/lib/footfall/seoul-api";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim() ?? "";
  const district = searchParams.get("district")?.trim();
  const city = searchParams.get("city")?.trim();

  if (!address) {
    return NextResponse.json({ error: "address query is required" }, { status: 400 });
  }

  try {
    const hotspotKey = parseAddressToHotspot(address, district, city);
    const suggestion = await getFootfallSuggestion(hotspotKey);
    return NextResponse.json({
      suggestion,
      matchedArea: hotspotKey,
    });
  } catch (e) {
    console.error("[api/footfall]", e);
    return NextResponse.json({ error: "footfall lookup failed" }, { status: 500 });
  }
}
