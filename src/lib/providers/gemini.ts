import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIDiagnostics, Coordinate, JourneyMode, JourneyPreferences } from "@/types/journey";
import { extractPandalsFromQuery, optimizeTourOrder } from "../services/pandalData";

export interface ParsedIntentResult {
  intent: "find_destination" | "plan_journey" | "modify_journey" | "add_stop" | "change_preferences" | "general_chat";
  originName?: string;
  destinationName?: string;
  journeyMode?: JourneyMode;
  stopsRequested?: string[];
  isTour?: boolean;
  isRoundTrip?: boolean;
  tourWaypoints?: Array<{
    name: string;
    address?: string;
    coordinate: Coordinate;
  }>;
  preferences?: Partial<JourneyPreferences>;
  explanation?: string;
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
  diagnosticReason?: string,
  userLocation?: { city?: string; region?: string; country?: string; coordinate?: { lat: number; lng: number } }
): ParsedIntentResult {
  const q = query.toLowerCase();

  const diagnostics: AIDiagnostics = {
    status: "fallback",
    engine: "rule_based",
    message: diagnosticReason || "Built-in offline NLP engine active (100% route & demo reliability)",
  };

  // 1. Detect Multi-Stop City Tour / Ganpati Pandal Loop Request
  const rawPandals = extractPandalsFromQuery(query);
  if (rawPandals.length > 0) {
    const startCoord = userLocation?.coordinate || { lat: 21.1463, lng: 79.0849 }; // Nagpur Center
    const ordered = optimizeTourOrder(startCoord, rawPandals);

    const isRoundTrip =
      q.includes("come back") ||
      q.includes("current location in the end") ||
      q.includes("round trip") ||
      q.includes("loop") ||
      q.includes("city tour");

    return {
      intent: "plan_journey",
      isTour: true,
      isRoundTrip: isRoundTrip !== false,
      originName: "Nagpur (Your location)",
      destinationName: isRoundTrip ? "Nagpur (Tour Finish)" : ordered[ordered.length - 1]?.name,
      journeyMode: "scenic",
      stopsRequested: ordered.map((p) => p.name),
      tourWaypoints: ordered.map((p) => ({
        name: p.name,
        address: `${p.ground}, ${p.locality}, Nagpur`,
        coordinate: p.coordinate,
      })),
      explanation: `Synthesized continuous city tour connecting ${ordered.length} Ganpati pandals across Nagpur in an optimized loop.`,
      replyMessage: `Synthesized your ${ordered.length}-stop Nagpur city tour for Ganpati Pandals. Navigating in an optimal non-overlapping loop from your location and returning at the end.`,
      diagnostics,
    };
  }

  let mode: JourneyMode = "scenic";
  if (q.includes("fast") || q.includes("quick") || q.includes("rush") || q.includes("asap") || q.includes("direct")) {
    mode = "fast";
  } else if (q.includes("chill") || q.includes("relax") || q.includes("leisure") || q.includes("easy")) {
    mode = "relaxed";
  } else if (q.includes("fuel") || q.includes("economy") || q.includes("cheap") || q.includes("toll")) {
    mode = "economy";
  } else if (q.includes("scenic") || q.includes("nature") || q.includes("view") || q.includes("mountain") || q.includes("coastal")) {
    mode = "scenic";
  }

  const stops: string[] = [];
  const starbucksMatch = query.match(/(?:stop\s+(?:by|at)\s+|visit\s+|via\s+)?(starbucks|coffee\s*shop|cafe|in-n-out|mcdonald'?s|gas\s*station|ev\s*charger|rest\s*stop)/i);
  if (starbucksMatch) {
    stops.push(starbucksMatch[1]);
  } else {
    if (q.includes("snack") || q.includes("food") || q.includes("eat") || q.includes("bite")) stops.push("Snacks");
    if (q.includes("coffee") || q.includes("tea") || q.includes("cafe")) stops.push("Coffee");
    if (q.includes("fuel") || q.includes("petrol") || q.includes("gas") || q.includes("charge")) stops.push("Fuel");
  }

  // Helper to normalize colloquial venue queries and strip proximity noise
  const city = userLocation?.city || "Nagpur";
  const sanitizeDest = (raw: string): string => {
    let cleaned = raw
      .replace(/^(the\s+)?(nearest|closest)\s+/i, "")
      .replace(/\s+(near|around)\s+(me|here|my location)$/i, "")
      .replace(/\s+nearby$/i, "")
      .trim();

    if (/^mac\s*d|mcdonald'?s|^mcd$/i.test(cleaned)) {
      cleaned = `McDonald's, ${city}`;
    } else if (/^starbucks$/i.test(cleaned)) {
      cleaned = `Starbucks, ${city}`;
    } else if (/^kfc$/i.test(cleaned)) {
      cleaned = `KFC, ${city}`;
    } else if (/^dominos|domino'?s(\s+pizza)?$/i.test(cleaned)) {
      cleaned = `Domino's Pizza, ${city}`;
    } else if (/^subway$/i.test(cleaned)) {
      cleaned = `Subway, ${city}`;
    } else if (/^burger\s*king$/i.test(cleaned)) {
      cleaned = `Burger King, ${city}`;
    } else if (/^ccd|cafe\s*coffee\s*day$/i.test(cleaned)) {
      cleaned = `Cafe Coffee Day, ${city}`;
    } else if (/^fuel|petrol(\s*pump)?|gas\s*station$/i.test(cleaned)) {
      cleaned = `Petrol Pump, ${city}`;
    } else if (/^ev(\s*charging)?$/i.test(cleaned)) {
      cleaned = `EV Charging Station, ${city}`;
    }
    return cleaned;
  };

  // Pattern: "from X to Y"
  const fromToMatch = query.match(/from\s+([^,]+?)\s+to\s+([^,]+?)(?:\s+stop|\s+via|\s+with|\s+and|$)/i);
  if (fromToMatch) {
    const originName = fromToMatch[1].trim();
    const destinationName = sanitizeDest(fromToMatch[2].trim());
    return {
      intent: "plan_journey",
      originName,
      destinationName,
      journeyMode: mode,
      stopsRequested: stops,
      explanation: `Synthesized corridor from ${originName} to ${destinationName}${stops.length > 0 ? ` with ${stops.join(", ")} stop` : ""}.`,
      replyMessage: `Planning your ${mode} route from ${originName} to ${destinationName}${stops.length > 0 ? ` stopping at ${stops.join(", ")}` : ""}.`,
      diagnostics,
    };
  }

  // Pattern: "to X" or "take me to X" or "drive to X" or "navigate to X"
  const toMatch = query.match(/(?:take me to|navigate to|drive to|route to|go to|plan a trip to|head to|directions to|trip to|to)\s+([^,]+?)(?:\s+stop|\s+via|\s+with|\s+and|\s+avoid|$)/i);
  if (toMatch) {
    const destinationName = sanitizeDest(toMatch[1].trim());
    return {
      intent: "plan_journey",
      destinationName,
      journeyMode: mode,
      stopsRequested: stops,
      explanation: `Synthesized ${mode} corridor to ${destinationName}${stops.length > 0 ? ` including stop at ${stops.join(", ")}` : ""}.`,
      replyMessage: `Calculating optimal route to ${destinationName}${stops.length > 0 ? ` with stop at ${stops.join(", ")}` : ""}.`,
      diagnostics,
    };
  }

  // Pattern: "nearest X", "find X near me", "X nearby"
  const nearestMatch = query.match(/(?:find|locate|search|show)?\s*(?:the\s+)?(?:nearest|closest)?\s*([a-zA-Z0-9\s'\-]+?)(?:\s+near\s+me|\s+around\s+me|\s+nearby)?$/i);
  if (nearestMatch && nearestMatch[1].trim().length > 2 && !q.startsWith("what") && !q.startsWith("how")) {
    const destinationName = sanitizeDest(nearestMatch[1].trim());
    if (destinationName && destinationName.toLowerCase() !== "where would you like to drive") {
      return {
        intent: "plan_journey",
        destinationName,
        journeyMode: mode,
        stopsRequested: stops,
        explanation: `Located nearest venue for ${destinationName}.`,
        replyMessage: `Finding the nearest ${destinationName} and calculating optimal corridor from your current location.`,
        diagnostics,
      };
    }
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
      explanation: `Updated journey to ${dest} with added stop: ${stops.join(", ")}.`,
      replyMessage: stops.length > 0
        ? `Added ${stops.join(" & ")} stop to your journey to ${dest}. Recalculating route.`
        : `Updated your route preferences for ${dest}.`,
      diagnostics,
    };
  }

  return {
    intent: "general_chat",
    replyMessage: "Where would you like to drive today? Try typing 'Drive to Santa Cruz with a stop at Starbucks' or search any destination.",
    diagnostics,
  };
}

/**
 * Parses user travel intent using Google Gemini API with fallback to local rule-based NLP.
 */
export async function extractJourneyIntent(
  userPrompt: string,
  currentDestination?: string,
  customKey?: string,
  userLocation?: { city?: string; region?: string; country?: string; coordinate?: { lat: number; lng: number } }
): Promise<ParsedIntentResult> {
  const startTime = Date.now();
  const apiKey = (customKey || process.env.GEMINI_API_KEY || "").trim();

  // Validate key existence
  if (!apiKey) {
    return parseIntentRuleBased(userPrompt, currentDestination, "No API key configured. Built-in NLP active.", userLocation);
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
      `API key format unrecognized (starts with '${prefix}'). Expected 'AIzaSy...' or 'AQ.' prefix. Using local NLP engine.`,
      userLocation
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const userLocStr = userLocation
      ? `${userLocation.city || "Nagpur"}, ${userLocation.region || "Maharashtra"}, ${userLocation.country || "India"} (Coordinates: ${userLocation.coordinate?.lat || 21.1463}, ${userLocation.coordinate?.lng || 79.0849})`
      : "Nagpur, Maharashtra, India (Coordinates: 21.1463, 79.0849)";

    const systemPrompt = `You are Wayve's Agentic Navigation Copilot.
Convert user natural language travel queries into structured route objectives.
USER'S SURROUNDING LOCATION: ${userLocStr}.
Current destination context: ${currentDestination || "None"}

CRITICAL RULE FOR SURROUNDINGS & PROXIMITY:
The user is located in ${userLocStr}.
All route planning, intermediate stops (e.g. coffee, Starbucks, food, fuel, EV charging), and road suggestions MUST be strictly grounded in the user's surrounding region and corridor, prioritized by PROXIMITY NEAREST to the user's current starting location (within 1 to 5 km radius).
NEVER suggest locations, cities, or businesses in other countries or far away cities unless the user explicitly names that distant location.
For example, if the user asks to "stop by Starbucks", resolve to the nearest Starbucks branch within their immediate city surroundings, NOT in another city or overseas.

Respond strictly with a single valid JSON object in this exact schema:
{
  "intent": "plan_journey" | "modify_journey" | "add_stop" | "find_destination" | "general_chat",
  "originName": string or null (e.g. "Current Location" or "Nagpur"),
  "destinationName": string or null (e.g. "Current Location" if a round-trip tour, or destination),
  "journeyMode": "fast" | "scenic" | "relaxed" | "economy",
  "stopsRequested": string[] (e.g. list of places, pandals, or stops),
  "isTour": boolean (true if user wants a multi-stop city tour, pandal visit loop, or sightseeing),
  "isRoundTrip": boolean (true if user wants to come back to current/starting location in the end),
  "preferences": {
    "scenic": number (0.0 to 1.0),
    "fastest": number (0.0 to 1.0),
    "avoidHighways": boolean,
    "avoidTolls": boolean
  },
  "explanation": string (1 brief sentence explaining why this route fits),
  "replyMessage": string (brief, professional assistant confirmation in 1 sentence)
}
Never include markdown code fences or backticks. Only output the raw JSON object.`;

    const candidateModels = ["gemini-3.5-flash", "gemini-3.6-flash"];
    let result: any = null;
    let activeModelUsed = "gemini-3.5-flash";

    for (const m of candidateModels) {
      let attempts = 0;
      while (attempts < 2) {
        try {
          const model = genAI.getGenerativeModel({ model: m });
          result = await model.generateContent([
            { text: systemPrompt },
            { text: userPrompt },
          ]);
          activeModelUsed = m;
          break;
        } catch (modelErr: any) {
          attempts++;
          const is503 = modelErr.message?.includes("503") || modelErr.message?.includes("high demand");
          if (is503 && attempts < 2) {
            console.warn(`[Gemini Provider] Model ${m} got 503 high demand spike, retrying in 1s...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          console.error(`[Gemini Provider] Model ${m} failed:`, modelErr.message || modelErr);
          break;
        }
      }
      if (result) break;
    }

    if (!result) {
      throw new Error("Candidate Gemini models busy or high demand spike.");
    }

    const rawText = result.response.text().trim();
    const cleanJson = rawText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleanJson);
    const latency = Date.now() - startTime;

    // If it's a specific pandal tour request, cross-reference with Nagpur pandals database
    let tourWaypoints;
    let isTour = Boolean(parsed.isTour);
    let isRoundTrip = Boolean(parsed.isRoundTrip);
    const rawPandals = extractPandalsFromQuery(userPrompt);
    if (rawPandals.length > 0) {
      isTour = true;
      isRoundTrip = true;
      const startCoord = userLocation?.coordinate || { lat: 21.1463, lng: 79.0849 };
      const ordered = optimizeTourOrder(startCoord, rawPandals);
      tourWaypoints = ordered.map((p) => ({
        name: p.name,
        address: `${p.ground}, ${p.locality}, Nagpur`,
        coordinate: p.coordinate,
      }));
    }

    return {
      intent: parsed.intent || "plan_journey",
      originName: parsed.originName || (isTour ? "Current Location" : undefined),
      destinationName: isRoundTrip ? "Current Location (Tour Finish)" : parsed.destinationName || undefined,
      journeyMode: parsed.journeyMode || "scenic",
      stopsRequested: tourWaypoints ? tourWaypoints.map((w) => w.name) : parsed.stopsRequested || [],
      isTour,
      isRoundTrip,
      tourWaypoints,
      preferences: parsed.preferences,
      explanation: parsed.explanation || "Optimized corridor calculated by Wayve AI.",
      replyMessage: parsed.replyMessage || "Synthesizing route with your requested stops.",
      diagnostics: {
        status: "connected",
        engine: "gemini",
        message: `Connected to Google ${activeModelUsed} (${latency}ms)`,
        keyPrefix: apiKey.substring(0, 6),
        latencyMs: latency,
      },
    };
  } catch (err: any) {
    console.warn("[Gemini Provider] API Error, falling back to local NLP parser:", err.message);
    return parseIntentRuleBased(
      userPrompt,
      currentDestination,
      `Gemini request failed: ${err.message || "Network/Rate Limit error"}. Local NLP engine active.`,
      userLocation
    );
  }
}
