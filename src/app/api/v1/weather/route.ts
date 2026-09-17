import { NextRequest, NextResponse } from "next/server";
import { fetchWeather } from "@/lib/providers/weather";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "18.7557");
  const lng = parseFloat(searchParams.get("lng") || "73.4072");

  try {
    const weather = await fetchWeather(lat, lng);
    return NextResponse.json(weather);
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "WEATHER_FETCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}
