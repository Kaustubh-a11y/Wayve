import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/providers/mapbox";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, proximity } = body;
    const destinations = await searchPlaces(query || "", proximity);
    return NextResponse.json({ destinations });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "SEARCH_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}
