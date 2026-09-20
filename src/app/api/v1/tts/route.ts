import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/tts
 * Server-side proxy to Sarvam AI Text-to-Speech (bulbul:v3)
 * Keeps API key server-side. Returns base64 audio.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, language, speaker } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.SARVAM_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "TTS service not configured", fallback: true },
        { status: 503 }
      );
    }

    // Truncate to Sarvam's 2500 char limit
    const truncatedText = text.slice(0, 2500);

    const sarvamRes = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        inputs: [truncatedText],
        target_language_code: language || "en-IN",
        speaker: speaker || "rohan",
        model: "bulbul:v3",
        pitch: 0,
        pace: 1.05,
        loudness: 1.5,
        enable_preprocessing: true,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!sarvamRes.ok) {
      const errText = await sarvamRes.text().catch(() => "Unknown error");
      console.error("[TTS] Sarvam API error:", sarvamRes.status, errText);
      return NextResponse.json(
        { error: "TTS generation failed", fallback: true },
        { status: 502 }
      );
    }

    const data = await sarvamRes.json();
    const audioBase64 = data.audios?.[0];

    if (!audioBase64) {
      return NextResponse.json(
        { error: "No audio returned", fallback: true },
        { status: 502 }
      );
    }

    return NextResponse.json({ audio: audioBase64, format: "wav" });
  } catch (error: any) {
    console.error("[TTS] Error:", error.message);
    return NextResponse.json(
      { error: error.message, fallback: true },
      { status: 500 }
    );
  }
}
