import { NextRequest, NextResponse } from "next/server";
import { getDirections } from "@/lib/providers/mapbox";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, mode } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Origin and destination required." } },
        { status: 400 }
      );
    }

    const routes = await getDirections(origin, destination, mode || "driving");
    return NextResponse.json({ routes });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "ROUTE_CALCULATION_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}
