import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIDiagnostics, JourneyMode, JourneyPreferences } from "@/types/journey";

export interface ParsedIntentResult {
  intent: "find_destination" | "plan_journey" | "modify_journey" | "add_stop" | "change_preferences" | "general_chat";
  destinationName?: string;
  journeyMode?: JourneyMode;
  stopsRequested?: string[];
  preferences?: Partial<JourneyPreferences>;
  replyMessage: string;
  diagnostics?: AIDiagnostics;
}

/**
 * Deterministic fallback rule-based NLP parser.
 * Protects free-tier Gemini API quota and provides 100% offline & demo reliability.
 */
export function parseIntentRuleBased(
  query: string,
  currentDestination?: string,
  diagnosticReason?: string
): ParsedIntentResult {
  const q = query.toLowerCase();

  let mode: JourneyMode = "scenic";
  if (q.includes("fast") || q.includes("quick") || q.includes("rush") || q.includes("asap")) {
    mode = "fast";
  } else if (q.includes("chill") || q.includes("relax") || q.includes("leisure") || q.includes("easy")) {
    mode = "relaxed";
  } else if (q.includes("fuel") || q.includes("economy") || q.includes("cheap") || q.includes("toll")) {
    mode = "economy";
  } else if (q.includes("scenic") || q.includes("nature") || q.includes("view") || q.includes("mountain") || q.includes("ghat")) {
    mode = "scenic";
  }

  const stops: string[] = [];
  if (q.includes("snack") || q.includes("food") || q.includes("eat") || q.includes("bite")) {
    stops.push("snacks");
  }
  if (q.includes("coffee") || q.includes("tea") || q.includes("cafe")) {
    stops.push("coffee");
  }
  if (q.includes("fuel") || q.includes("petrol") || q.includes("gas") || q.includes("charge")) {
    stops.push("fuel");
  }

  const diagnostics: AIDiagnostics = {
    status: "fallback",
    engine: "rule_based",
    message: diagnosticReason || "Built-in offline NLP engine active (100% route & demo reliability)",
  };

  // 1. Destination Discovery ("nearest hill station", "take me to lonavala")
  if (q.includes("hill station") || q.includes("nearest") || q.includes("weekend trip") || q.includes("getaway")) {
    return {
      intent: "find_destination",
      destinationName: "Lonavala",
      journeyMode: mode,
      stopsRequested: stops,
      preferences: {
        scenic: 0.85,
        fastest: 0.4,
        traffic: 0.75,
      },
      replyMessage: "I found 3 nearby hill stations in the Western Ghats. Lonavala is the most accessible scenic route (65 km). Which one would you like to head to?",
      diagnostics,
    };
  }

  // Explicit Destination Names
  if (q.includes("lonavala")) {
    return {
      intent: "plan_journey",
      destinationName: "Lonavala",
      journeyMode: mode,
      stopsRequested: stops,
      preferences: {
        scenic: mode === "scenic" ? 0.9 : 0.4,
        fastest: mode === "fast" ? 0.95 : 0.35,
        traffic: 0.8,
      },
      replyMessage: stops.length > 0
        ? `Plotting a ${mode} route to Lonavala with a stop for ${stops.join(" & ")}. Comparing road conditions now.`
        : `Setting course to Lonavala with ${mode} optimization. Comparing alternative corridors.`,
      diagnostics,
    };
  }

  if (q.includes("panchgani")) {
    return {
      intent: "plan_journey",
      destinationName: "Panchgani",
      journeyMode: mode,
      stopsRequested: stops,
      replyMessage: `Setting up your ${mode} route to Panchgani. Checking traffic along the mountain ghats.`,
      diagnostics,
    };
  }

  if (q.includes("matheran")) {
    return {
      intent: "plan_journey",
      destinationName: "Matheran",
      journeyMode: mode,
      stopsRequested: stops,
      replyMessage: `Setting course to Matheran via scenic foothills with ${mode} optimization.`,
      diagnostics,
    };
  }

  // Contextual modifications (adding stops or adjusting preferences to current journey)
  if (stops.length > 0 || q.includes("longer") || q.includes("scenic") || q.includes("avoid")) {
    const dest = currentDestination || "your destination";
    return {
      intent: "modify_journey",
      destinationName: currentDestination,
      journeyMode: mode,
      stopsRequested: stops,
      preferences: {
        scenic: q.includes("scenic") ? 0.9 : undefined,
        fastest: q.includes("longer") ? 0.3 : undefined,
        avoidTolls: q.includes("toll"),
        avoidHighways: q.includes("avoid highway"),
      },
      replyMessage: stops.length > 0
        ? `Added ${stops.join(" & ")} stop to your journey to ${dest}. Recalculating routes with minimum detour.`
        : `Updated your route preferences for ${dest}. Adjusting candidate route optimization.`,
      diagnostics,
    };
  }

  return {
    intent: "general_chat",
    replyMessage: "Where would you like to head today? You can search any place, choose driving modes, or ask for scenic routes.",
    diagnostics,
  };
}

/**
 * Parses user travel intent using Google Gemini API with fallback to local rule-based NLP.
 */
export async function extractJourneyIntent(
  userPrompt: string,
  currentDestination?: string,
  customKey?: string
): Promise<ParsedIntentResult> {
  const startTime = Date.now();
  const apiKey = (customKey || process.env.GEMINI_API_KEY || "").trim();

  // Validate key existence
  if (!apiKey || apiKey.includes("your_gemini_api_key")) {
    return parseIntentRuleBased(userPrompt, currentDestination, "No API key configured. Built-in NLP active.");
  }

  // Validate Google AI Studio key format (legacy AIzaSy or new AQ. format since June 2026)
  const isLegacyKey = apiKey.startsWith("AIzaSy");
  const isNewAuthKey = apiKey.startsWith("AQ.");
  if (!isLegacyKey && !isNewAuthKey) {
    const prefix = apiKey.substring(0, 6);
    console.warn(`[Gemini Provider] Unrecognized API key format (starts with '${prefix}'). Expected 'AIzaSy...' (legacy) or 'AQ.' (new Auth Key). Switching to local NLP fallback.`);
    return parseIntentRuleBased(
      userPrompt,
      currentDestination,
      `API key format unrecognized (starts with '${prefix}'). Expected 'AIzaSy...' or 'AQ.' prefix. Using local NLP engine.`
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const systemPrompt = `You are Wayve's Conversation Agent (Agent A).
Your job is to convert natural language travel requests into structured journey objectives.
Current destination context: ${currentDestination || "None"}

Respond strictly with a single valid JSON object in this exact schema:
{
  "intent": "find_destination" | "plan_journey" | "modify_journey" | "add_stop" | "change_preferences" | "general_chat",
  "destinationName": string or null,
  "journeyMode": "fast" | "scenic" | "relaxed" | "economy" | "custom",
  "stopsRequested": string[] (e.g. ["coffee", "snacks"]),
  "preferences": {
    "scenic": number (0.0 to 1.0),
    "fastest": number (0.0 to 1.0),
    "traffic": number (0.0 to 1.0),
    "avoidHighways": boolean,
    "avoidTolls": boolean
  },
  "replyMessage": string (brief, calm, assistant response in 1-2 sentences)
}
Never include markdown code fences or backticks. Only output the raw JSON object.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);

    const rawText = result.response.text().trim();
    const cleanJson = rawText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleanJson);
    const latency = Date.now() - startTime;

    return {
      intent: parsed.intent || "plan_journey",
      destinationName: parsed.destinationName || undefined,
      journeyMode: parsed.journeyMode || "scenic",
      stopsRequested: parsed.stopsRequested || [],
      preferences: parsed.preferences,
      replyMessage: parsed.replyMessage || "Understood. Updating your journey objectives.",
      diagnostics: {
        status: "connected",
        engine: "gemini",
        message: `Connected to Gemini 3.6 Flash (${latency}ms)`,
        keyPrefix: apiKey.substring(0, 6),
        latencyMs: latency,
      },
    };
  } catch (err: any) {
    console.warn("[Gemini Provider] API Error, falling back to local NLP parser:", err.message);
    return parseIntentRuleBased(
      userPrompt,
      currentDestination,
      `Gemini request failed: ${err.message || "Network/Rate Limit error"}. Local NLP engine active.`
    );
  }
}
