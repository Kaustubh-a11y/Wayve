import { NextRequest, NextResponse } from "next/server";
import { extractJourneyIntent } from "@/lib/providers/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, currentDestination, customKey, userLocation } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Prompt is required." } },
        { status: 400 }
      );
    }

    const result = await extractJourneyIntent(prompt, currentDestination, customKey, userLocation);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "AGENT_CONVERSATION_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}
