import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim();
  const clean = token.replace(/^['"\s]+|['"\s]+$/g, "");
  return NextResponse.json({ mapboxToken: clean });
}
