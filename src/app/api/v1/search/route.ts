import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/providers/mapbox";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, proximity, countryCode } = body;
    const destinations = await searchPlaces(query || "", proximity, countryCode || "in");
    return NextResponse.json({ destinations });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SEARCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}
