import {
  JourneyMode,
  JourneyPreferences,
  ReplanningAssessment,
  RouteOption,
  SimulationEvent,
} from "@/types/journey";
import { scoreRoutes } from "./routeScorer";

export const REPLANNING_HYSTERESIS_MINUTES = 3.0; // Minimum time saved required to recommend a switch

/**
 * Ingests a simulated or real incident and executes the real replanning pipeline.
 * Evaluates route degradation, re-scores routes, tests threshold, and returns recommendation.
 */
export function processSimulationEvent(
  event: SimulationEvent,
  currentRouteId: string,
  routes: RouteOption[],
  mode: JourneyMode = "scenic",
  preferences?: JourneyPreferences,
  hasStops: boolean = false
): {
  updatedRoutes: RouteOption[];
  assessment: ReplanningAssessment;
} {
  // 1. Calculate delay added by incident severity
  let delayMinutes = 0;
  let incidentDescription = "";

  switch (event.type) {
    case "accident":
      delayMinutes = Math.round((12 + event.severity * 14) * 10) / 10;
      incidentDescription = "Collision blocking 2 lanes ahead";
      break;
    case "heavy_traffic":
      delayMinutes = Math.round((8 + event.severity * 12) * 10) / 10;
      incidentDescription = "Severe standstill congestion detected";
      break;
    case "road_closure":
      delayMinutes = Math.round((20 + event.severity * 15) * 10) / 10;
      incidentDescription = "Road section closed for maintenance";
      break;
    case "construction":
      delayMinutes = Math.round((6 + event.severity * 8) * 10) / 10;
      incidentDescription = "Active road construction work";
      break;
    case "heavy_rain":
      delayMinutes = Math.round((5 + event.severity * 9) * 10) / 10;
      incidentDescription = "Severe waterlogging and low visibility";
      break;
    case "event_congestion":
      delayMinutes = Math.round((9 + event.severity * 10) * 10) / 10;
      incidentDescription = "Surge traffic from local event";
      break;
  }

  // 2. Apply degradation to target route
  const degradedRoutes = routes.map((route) => {
    if (route.id === event.targetRouteId) {
      const addedSeconds = Math.round(delayMinutes * 60);
      const newDuration = route.durationSeconds + addedSeconds;
      const newPredicted = (route.predictedDurationSeconds || route.durationSeconds) + addedSeconds;

      const newWarnings = [...route.warnings];
      if (!newWarnings.includes(incidentDescription)) {
        newWarnings.unshift(`⚠️ ${incidentDescription} (+${delayMinutes} min)`);
      }

      return {
        ...route,
        durationSeconds: newDuration,
        predictedDurationSeconds: newPredicted,
        trafficCondition: "heavy" as const,
        warnings: newWarnings,
      };
    }
    return route;
  });

  // 3. Re-score all candidate routes using the deterministic scoring engine
  const scoredRoutes = scoreRoutes(degradedRoutes, mode, preferences, hasStops);

  // 4. Locate degraded current route and best alternative
  const currentRoute = scoredRoutes.find((r) => r.id === currentRouteId) || scoredRoutes[0];
  const alternatives = scoredRoutes.filter((r) => r.id !== currentRouteId);

  // Find the highest scoring alternative
  let bestAlt = alternatives[0];
  for (const alt of alternatives) {
    if (alt.score > (bestAlt?.score || 0)) {
      bestAlt = alt;
    }
  }

  const currentEtaMinutes = Math.round((currentRoute.predictedDurationSeconds || currentRoute.durationSeconds) / 60);
  const bestAltEtaMinutes = bestAlt
    ? Math.round((bestAlt.predictedDurationSeconds || bestAlt.durationSeconds) / 60)
    : currentEtaMinutes;

  const timeSavedMinutes = Math.max(0, currentEtaMinutes - bestAltEtaMinutes);

  // 5. Evaluate against hysteresis threshold
  const shouldReplan =
    bestAlt &&
    timeSavedMinutes >= REPLANNING_HYSTERESIS_MINUTES &&
    event.targetRouteId === currentRouteId;

  const assessment: ReplanningAssessment = {
    triggered: shouldReplan,
    reason: shouldReplan
      ? `${incidentDescription}. Current route delayed by ~${delayMinutes} min. Alternative route saves ${timeSavedMinutes} minutes.`
      : `Conditions updated on ${event.targetRouteId}. Time variance (${timeSavedMinutes} min saved) is within threshold (${REPLANNING_HYSTERESIS_MINUTES} min).`,
    affectedRouteId: event.targetRouteId,
    originalEtaSeconds: currentRoute.durationSeconds - Math.round(delayMinutes * 60),
    degradedEtaSeconds: currentRoute.predictedDurationSeconds || currentRoute.durationSeconds,
    delayMinutes,
    recommendedRoute: bestAlt || currentRoute,
    timeSavedMinutes,
    confidence: 86,
  };

  return {
    updatedRoutes: scoredRoutes,
    assessment,
  };
}
