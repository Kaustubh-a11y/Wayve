import { NextRequest, NextResponse } from "next/server";
import { extractJourneyIntent } from "@/lib/providers/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, currentDestination } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Prompt is required." } },
        { status: 400 }
      );
    }

    const result = await extractJourneyIntent(prompt, currentDestination);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: "AGENT_CONVERSATION_FAILED", message: error.message } },
      { status: 500 }
    );
  }
}
