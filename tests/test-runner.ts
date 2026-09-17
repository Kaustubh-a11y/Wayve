import assert from "node:assert";
import { parseIntentRuleBased } from "../src/lib/providers/gemini";
import { predictTravelTime } from "../src/lib/services/mlPredictor";
import { getWeightsForMode, scoreRoutes } from "../src/lib/services/routeScorer";
import { processSimulationEvent, REPLANNING_HYSTERESIS_MINUTES } from "../src/lib/services/simulationEngine";
import { getDeterministicRoutes } from "../src/lib/services/deterministicData";

console.log("==========================================");
console.log("RUNNING WAYVE CORE DECISION LOGIC TESTS");
console.log("==========================================\n");

// TEST 1: Intent & Preference Parsing
console.log("▶ Test 1: Conversational Intent & Preference Extraction...");
const intent1 = parseIntentRuleBased("Yo I wanna go to the nearest hill station");
assert.strictEqual(intent1.intent, "find_destination");
assert.strictEqual(intent1.destinationName, "Lonavala");
assert.strictEqual(intent1.journeyMode, "scenic");
console.log("  ✔ Destination discovery intent correctly resolved to Lonavala.");

const intent2 = parseIntentRuleBased(
  "Find somewhere for snacks on the way and make it scenic, I don't care if it's 10 minutes longer",
  "Lonavala"
);
assert.ok(intent2.stopsRequested.includes("snacks"));
assert.strictEqual(intent2.journeyMode, "scenic");
assert.strictEqual(intent2.preferences.scenic, 0.9);
assert.strictEqual(intent2.preferences.fastest, 0.3);
console.log("  ✔ Contextual stop & preference modification correctly parsed.");

// TEST 2: ML ETA Prediction & Feature Attribution
console.log("\n▶ Test 2: ML ETA Prediction & XAI Feature Attribution...");
const prediction = predictTravelTime({
  baseDurationSeconds: 4320, // 72 mins
  distanceMeters: 62400,
  trafficLevel: "heavy",
  weatherCondition: { tempC: 24, rainProbability: 70 },
  isHighway: true,
});
assert.ok(prediction.predictedDurationMinutes > 72, "Heavy traffic and rain should increase duration");
assert.ok(prediction.attributions.length >= 2, "Should return at least 2 feature attributions");
const trafficFactor = prediction.attributions.find((a) => a.feature.includes("arterial congestion"));
assert.ok(trafficFactor && trafficFactor.impactMinutes > 0, "Congestion must have positive impact minutes");
console.log(`  ✔ Predicted ETA: ${prediction.predictedDurationMinutes} min (Base: 72 min, Delta: +${prediction.deltaMinutes} min)`);
console.log(`  ✔ XAI Attributions: ${prediction.attributions.map((a) => `${a.feature} (${a.direction === "increase" ? "+" : "-"}${a.impactMinutes}m)`).join(", ")}`);

// TEST 3: Route Scoring Engine
console.log("\n▶ Test 3: Deterministic Route Scoring Engine...");
const baseRoutes = getDeterministicRoutes();
const fastScored = scoreRoutes(baseRoutes, "fast");
const scenicScored = scoreRoutes(baseRoutes, "scenic", undefined, true);

// Fast mode should prioritize the fastest corridor (Expressway)
const fastPick = fastScored.find((r) => r.isWayvePick);
assert.ok(fastPick, "Must have a Wayve Pick for fast mode");

// Scenic mode with snack stops should prioritize the scenic ghat pass
const scenicPick = scenicScored.find((r) => r.isWayvePick);
assert.ok(scenicPick, "Must have a Wayve Pick for scenic mode");
assert.strictEqual(scenicPick.id, "route-scenic-ghat", "Scenic mode should recommend the Scenic Ghat Pass");
assert.ok(scenicPick.recommendationReason.includes("scenic"), "Explanation must explain scenic reason");
console.log(`  ✔ Fast Mode Pick: ${fastPick.name} (Score: ${fastPick.score})`);
console.log(`  ✔ Scenic Mode Pick: ${scenicPick.name} (Score: ${scenicPick.score})`);
console.log(`  ✔ Recommendation Reason: "${scenicPick.recommendationReason}"`);

// TEST 4: Simulation & Dynamic Replanning Pipeline
console.log("\n▶ Test 4: Dynamic Replanning & Hysteresis Threshold...");
const simEvent = {
  type: "heavy_traffic" as const,
  targetRouteId: "route-scenic-ghat",
  severity: 0.85,
  timestamp: new Date().toISOString(),
};

const replanResult = processSimulationEvent(
  simEvent,
  "route-scenic-ghat",
  scenicScored,
  "scenic",
  undefined,
  true
);

assert.ok(replanResult.assessment.triggered, "Severe congestion (>10 min delay) must trigger replanning");
assert.ok(replanResult.assessment.timeSavedMinutes >= REPLANNING_HYSTERESIS_MINUTES, "Must meet hysteresis threshold");
assert.notStrictEqual(replanResult.assessment.recommendedRoute.id, "route-scenic-ghat", "Must recommend an alternative route");
console.log(`  ✔ Replanning Triggered: ${replanResult.assessment.triggered}`);
console.log(`  ✔ Time Saved by Alternative: ${replanResult.assessment.timeSavedMinutes} minutes`);
console.log(`  ✔ Recommended Alternative: ${replanResult.assessment.recommendedRoute.name}`);
console.log(`  ✔ Replanning Reason: "${replanResult.assessment.reason}"`);

console.log("\n==========================================");
console.log("ALL DECISION LOGIC TESTS PASSED SUCCESSFULLY!");
console.log("==========================================");
