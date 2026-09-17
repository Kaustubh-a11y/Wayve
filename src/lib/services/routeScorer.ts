import { JourneyMode, JourneyPreferences, RouteOption } from "@/types/journey";

export interface ScoringWeights {
  wEta: number;
  wTraffic: number;
  wDistance: number;
  wWeather: number;
  wTolls: number;
  wScenic: number;
  wStopDetour: number;
  wIncidents: number;
}

export function getWeightsForMode(
  mode: JourneyMode,
  customPreferences?: JourneyPreferences
): ScoringWeights {
  switch (mode) {
    case "fast":
      return {
        wEta: 0.40,
        wTraffic: 0.25,
        wDistance: 0.15,
        wWeather: 0.05,
        wTolls: 0.05,
        wScenic: 0.02,
        wStopDetour: 0.03,
        wIncidents: 0.05,
      };
    case "scenic":
      return {
        wEta: 0.10,
        wTraffic: 0.15,
        wDistance: 0.05,
        wWeather: 0.15,
        wTolls: 0.05,
        wScenic: 0.40,
        wStopDetour: 0.05,
        wIncidents: 0.05,
      };
    case "relaxed":
      return {
        wEta: 0.12,
        wTraffic: 0.20,
        wDistance: 0.08,
        wWeather: 0.15,
        wTolls: 0.05,
        wScenic: 0.25,
        wStopDetour: 0.10,
        wIncidents: 0.05,
      };
    case "economy":
      return {
        wEta: 0.15,
        wTraffic: 0.15,
        wDistance: 0.30,
        wWeather: 0.05,
        wTolls: 0.25,
        wScenic: 0.02,
        wStopDetour: 0.03,
        wIncidents: 0.05,
      };
    case "custom":
    default:
      if (customPreferences) {
        const total =
          customPreferences.fastest +
          customPreferences.traffic +
          customPreferences.fuel +
          customPreferences.scenic +
          customPreferences.weather +
          customPreferences.tolls;
        const norm = total > 0 ? total : 1;
        return {
          wEta: (customPreferences.fastest / norm) * 0.4,
          wTraffic: (customPreferences.traffic / norm) * 0.25,
          wDistance: (customPreferences.fuel / norm) * 0.15,
          wWeather: (customPreferences.weather / norm) * 0.1,
          wTolls: (customPreferences.tolls / norm) * 0.1,
          wScenic: (customPreferences.scenic / norm) * 0.35,
          wStopDetour: 0.05,
          wIncidents: 0.05,
        };
      }
      return {
        wEta: 0.25,
        wTraffic: 0.20,
        wDistance: 0.15,
        wWeather: 0.10,
        wTolls: 0.05,
        wScenic: 0.15,
        wStopDetour: 0.05,
        wIncidents: 0.05,
      };
  }
}

/**
 * Evaluates and scores multiple routes deterministically.
 * Lower score is better (cost optimization) or higher score is better (utility).
 * Here we compute a normalized utility score from 0 to 100 where higher is better.
 */
export function scoreRoutes(
  routes: RouteOption[],
  mode: JourneyMode,
  preferences?: JourneyPreferences,
  hasStopRequested: boolean = false
): RouteOption[] {
  if (routes.length === 0) return [];

  const weights = getWeightsForMode(mode, preferences);

  // Find min/max for normalization
  const minDuration = Math.min(...routes.map((r) => r.predictedDurationSeconds || r.durationSeconds));
  const maxDuration = Math.max(...routes.map((r) => r.predictedDurationSeconds || r.durationSeconds), minDuration + 1);

  const minDistance = Math.min(...routes.map((r) => r.distanceMeters));
  const maxDistance = Math.max(...routes.map((r) => r.distanceMeters), minDistance + 1);

  const scored = routes.map((route) => {
    const duration = route.predictedDurationSeconds || route.durationSeconds;
    // Normalized factors: 1.0 is optimal, 0.0 is least optimal
    const etaUtility = 1 - (duration - minDuration) / (maxDuration - minDuration);
    const distanceUtility = 1 - (route.distanceMeters - minDistance) / (maxDistance - minDistance);

    const trafficUtility =
      route.trafficCondition === "low" ? 1.0 : route.trafficCondition === "moderate" ? 0.6 : 0.2;

    const weatherUtility = 1 - (route.weatherCondition.rainProbability / 100);

    const scenicUtility =
      route.name.toLowerCase().includes("scenic") || route.name.toLowerCase().includes("ghat") || route.name.toLowerCase().includes("valley")
        ? 0.95
        : route.name.toLowerCase().includes("highway") || route.name.toLowerCase().includes("expressway")
        ? 0.35
        : 0.65;

    const detourUtility = hasStopRequested ? 0.9 : 0.5;
    const tollUtility = route.name.toLowerCase().includes("expressway") ? 0.4 : 0.85;
    const incidentUtility = route.warnings.length === 0 ? 1.0 : 0.3;

    // Weighted composite utility (0 to 100)
    const compositeScore = Math.round(
      (weights.wEta * etaUtility +
        weights.wTraffic * trafficUtility +
        weights.wDistance * distanceUtility +
        weights.wWeather * weatherUtility +
        weights.wTolls * tollUtility +
        weights.wScenic * scenicUtility +
        weights.wStopDetour * detourUtility +
        weights.wIncidents * incidentUtility) *
        100
    );

    const scoreBreakdown = {
      eta: Math.round(etaUtility * 100),
      traffic: Math.round(trafficUtility * 100),
      scenic: Math.round(scenicUtility * 100),
      weather: Math.round(weatherUtility * 100),
      detour: Math.round(detourUtility * 100),
      tolls: Math.round(tollUtility * 100),
    };

    return {
      ...route,
      score: compositeScore,
      scoreBreakdown,
    };
  });

  // Pick the highest scoring route as Wayve's Pick
  let bestRoute = scored[0];
  for (const r of scored) {
    if (r.score > bestRoute.score) {
      bestRoute = r;
    }
  }

  // Format human-readable explainability for each route
  return scored.map((r) => {
    const isPick = r.id === bestRoute.id;
    let reason = "";

    if (isPick) {
      const reasons: string[] = [];
      if (r.scoreBreakdown.scenic >= 75) reasons.push("matches scenic driving preference");
      if (r.scoreBreakdown.traffic >= 70) reasons.push("has lower congestion risk");
      if (r.scoreBreakdown.weather >= 80) reasons.push("clear weather along the pass");
      if (hasStopRequested) reasons.push("convenient stops along the way");
      if (r.scoreBreakdown.eta >= 80) reasons.push("optimal travel time");

      reason = reasons.length > 0
        ? `Wayve recommends this route because it ${reasons.slice(0, 3).join(", ")}.`
        : "Wayve recommends this route as the best balance for your trip objectives.";
    } else {
      const fastestDuration = minDuration;
      const diffMin = Math.round((r.durationSeconds - fastestDuration) / 60);
      if (diffMin <= 0) {
        reason = "Fastest direct route via primary corridor with moderate traffic.";
      } else {
        reason = `Alternative route with +${diffMin} min travel time.`;
      }
    }

    return {
      ...r,
      isWayvePick: isPick,
      recommendationReason: reason,
      confidence: Math.min(94, Math.max(78, Math.round(82 + (r.score / 10)))),
    };
  });
}
