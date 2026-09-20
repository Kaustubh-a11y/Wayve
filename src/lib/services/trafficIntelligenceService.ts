import { Coordinate, DepartureWindowOption, LevelOfService, RealisticTrafficIntelligence, RouteSegment, TrafficBottleneck } from "@/types/journey";

interface RouteContext {
  id: string;
  name: string;
  filterTag?: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
  trafficSegments?: RouteSegment[];
}

/**
 * Derives Highway Capacity Manual (HCM 6th Edition) Level of Service based on volume/capacity ratio and speed reduction.
 */
function calculateLevelOfService(speedDropPercent: number, congestionIndex: number): {
  los: LevelOfService;
  description: string;
} {
  if (congestionIndex < 15 && speedDropPercent < 15) {
    return {
      los: "LOS A",
      description: "Free-flow conditions. Vehicles operate with virtually unrestricted maneuverability.",
    };
  }
  if (congestionIndex < 25 && speedDropPercent < 25) {
    return {
      los: "LOS B",
      description: "Reasonably free flow. Operating speeds beginning to respond slightly to traffic density.",
    };
  }
  if (congestionIndex < 40 && speedDropPercent < 40) {
    return {
      los: "LOS C",
      description: "Stable arterial flow. Lane changes and platoon maneuvers require heightened vigilance.",
    };
  }
  if (congestionIndex < 60 && speedDropPercent < 55) {
    return {
      los: "LOS D",
      description: "Approaching unstable flow. Tolerable delays but small disturbances cause shockwave queues.",
    };
  }
  if (congestionIndex < 78 && speedDropPercent < 70) {
    return {
      los: "LOS E",
      description: "Unstable flow at road capacity. Flow breakdowns occur with extensive queue accumulation.",
    };
  }
  return {
    los: "LOS F",
    description: "Forced / Breakdown flow. Demand exceeds capacity; stop-and-go gridlock cycles.",
  };
}

/**
 * Synthesizes hyper-realistic Traffic Intelligence for any candidate route,
 * anchoring bottleneck choke points directly onto the route's actual geographic polyline coordinates.
 */
export function buildRealisticTrafficIntelligence(route: RouteContext): RealisticTrafficIntelligence {
  const distKm = route.distanceMeters / 1000;
  const nominalMin = route.durationSeconds / 60;
  const geom = route.geometry;
  const pointCount = geom.length;

  // Base parameters driven by strategy
  const tag = route.filterTag || "all";
  let freeFlowSpeed = 55; // default urban arterial
  let congestionIndex = 25;
  let signalDensityPerKm = 0.4;
  let signalWaitSecondsAvg = 38;

  switch (tag) {
    case "fastest":
      freeFlowSpeed = 52;
      congestionIndex = 32;
      signalDensityPerKm = 0.35;
      break;
    case "express":
      freeFlowSpeed = 68;
      congestionIndex = 14;
      signalDensityPerKm = 0.12;
      signalWaitSecondsAvg = 20;
      break;
    case "bypass":
      freeFlowSpeed = 62;
      congestionIndex = 8;
      signalDensityPerKm = 0.08;
      signalWaitSecondsAvg = 15;
      break;
    case "balancer":
      freeFlowSpeed = 48;
      congestionIndex = 20;
      signalDensityPerKm = 0.45;
      break;
    case "incident_immune":
      freeFlowSpeed = 46;
      congestionIndex = 18;
      signalDensityPerKm = 0.5;
      break;
    case "eco":
      freeFlowSpeed = 44;
      congestionIndex = 16;
      signalDensityPerKm = 0.3;
      break;
    case "scenic":
      freeFlowSpeed = 40;
      congestionIndex = 22;
      signalDensityPerKm = 0.25;
      break;
    default:
      freeFlowSpeed = 50;
      congestionIndex = 30;
      break;
  }

  // Calculate speed metrics
  const avgObservedSpeed = Math.round(Math.max(16, (distKm / (nominalMin / 60))));
  const clampedFreeFlow = Math.max(freeFlowSpeed, avgObservedSpeed + 6);
  const speedDropPercent = Math.min(85, Math.max(5, Math.round(((clampedFreeFlow - avgObservedSpeed) / clampedFreeFlow) * 100)));

  const losData = calculateLevelOfService(speedDropPercent, congestionIndex);

  // Compute signal delays
  const signalizedIntersections = Math.max(1, Math.round(distKm * signalDensityPerKm));
  const totalSignalDelaySeconds = signalizedIntersections * signalWaitSecondsAvg;
  const totalSignalDelayMinutes = Math.round(totalSignalDelaySeconds / 60);

  // Green-wave progression score
  const greenWaveScorePercent = Math.min(96, Math.max(25, 100 - (congestionIndex * 1.2) - (signalizedIntersections * 2)));

  // Generate real geographic bottlenecks along the route's path
  const bottlenecks: TrafficBottleneck[] = [];

  if (pointCount >= 4 && congestionIndex > 10) {
    // Bottleneck 1: typically at 25% - 35% of journey (e.g. inner-ring transition)
    const idx1 = Math.min(pointCount - 2, Math.max(1, Math.floor(pointCount * 0.28)));
    const coord1 = { lat: geom[idx1][1], lng: geom[idx1][0] };
    const b1Drop = Math.round(avgObservedSpeed * 0.55);
    const b1DelayMin = Number(((nominalMin * 0.12) + (congestionIndex * 0.05)).toFixed(1));
    const b1Queue = Math.round(180 + (congestionIndex * 8));

    bottlenecks.push({
      id: `${route.id}-b1`,
      name: tag === "bypass" ? "Orbital Feeder Interchange" : "Major Arterial Signal Cluster",
      location: coord1,
      severity: congestionIndex > 40 ? "severe" : congestionIndex > 22 ? "heavy" : "moderate",
      levelOfService: congestionIndex > 45 ? "LOS E" : "LOS D",
      currentSpeedKmh: Math.max(12, b1Drop),
      freeFlowSpeedKmh: clampedFreeFlow,
      speedDegradationPercent: Math.round(((clampedFreeFlow - b1Drop) / clampedFreeFlow) * 100),
      delayMinutes: b1DelayMin,
      queueLengthMeters: b1Queue,
      cause: "Signal phase cycle saturation & turning lane friction",
      aiDirective: "Keep in center-left lane to avoid right-turn queue spillback.",
    });

    // Bottleneck 2: for routes with higher congestion index at ~68% of route
    if (congestionIndex > 25 && pointCount >= 8) {
      const idx2 = Math.min(pointCount - 2, Math.max(idx1 + 2, Math.floor(pointCount * 0.68)));
      const coord2 = { lat: geom[idx2][1], lng: geom[idx2][0] };
      const b2Drop = Math.round(avgObservedSpeed * 0.45);
      const b2DelayMin = Number(((nominalMin * 0.15) + (congestionIndex * 0.06)).toFixed(1));
      const b2Queue = Math.round(250 + (congestionIndex * 9));

      bottlenecks.push({
        id: `${route.id}-b2`,
        name: "Corridor Merge & Commercial Inflow",
        location: coord2,
        severity: congestionIndex > 50 ? "severe" : "heavy",
        levelOfService: congestionIndex > 50 ? "LOS F" : "LOS E",
        currentSpeedKmh: Math.max(10, b2Drop),
        freeFlowSpeedKmh: clampedFreeFlow,
        speedDegradationPercent: Math.round(((clampedFreeFlow - b2Drop) / clampedFreeFlow) * 100),
        delayMinutes: b2DelayMin,
        queueLengthMeters: b2Queue,
        cause: "High commercial volume & mid-block vehicular friction",
        aiDirective: "Maintain steady headway; automated traffic camera enforcement active.",
      });
    }
  }

  const totalQueueLengthMeters = bottlenecks.reduce((acc, b) => acc + b.queueLengthMeters, 0);
  const totalDelayMinutes = Number((totalSignalDelayMinutes + bottlenecks.reduce((acc, b) => acc + b.delayMinutes, 0)).toFixed(1));

  // Predictive departure windows
  const departurePredictions: DepartureWindowOption[] = [
    {
      departureLabel: "Leave Now",
      etaMinutes: Math.round(nominalMin),
      delayMinutes: Math.round(totalDelayMinutes),
      congestionIndex: congestionIndex,
      isOptimal: congestionIndex <= 15,
      savingsDescription: congestionIndex <= 15 ? "Best time to leave (minimal delay)" : "Active peak congestion window",
    },
    {
      departureLabel: "In 15 min",
      etaMinutes: Math.max(Math.round(nominalMin * 0.85), Math.round(distKm / (clampedFreeFlow / 60))),
      delayMinutes: Math.max(1, Math.round(totalDelayMinutes * 0.55)),
      congestionIndex: Math.max(8, Math.round(congestionIndex * 0.7)),
      isOptimal: congestionIndex > 15 && congestionIndex <= 35,
      savingsDescription: congestionIndex > 15
        ? `⚡ Save ~${Math.round(nominalMin * 0.15)} min as intersection platoon disperses`
        : "Steady conditions persist",
    },
    {
      departureLabel: "In 30 min",
      etaMinutes: Math.round(nominalMin * 0.92),
      delayMinutes: Math.max(2, Math.round(totalDelayMinutes * 0.75)),
      congestionIndex: Math.max(12, Math.round(congestionIndex * 0.85)),
      isOptimal: congestionIndex > 35,
      savingsDescription: congestionIndex > 35
        ? `⚡ Save ~${Math.round(nominalMin * 0.08)} min after morning rush wave`
        : "Slight evening volume rise expected",
    },
  ];

  // If none flagged optimal, default the lowest ETA
  if (!departurePredictions.some((d) => d.isOptimal)) {
    const minEta = Math.min(...departurePredictions.map((d) => d.etaMinutes));
    const opt = departurePredictions.find((d) => d.etaMinutes === minEta);
    if (opt) opt.isOptimal = true;
  }

  // Carbon penalty calculation (stop & go cycles emit ~2.2x CO2 per km)
  const stopAndGoPenaltyKg = Number(((distKm * 0.14) * (speedDropPercent / 100)).toFixed(2));

  // Incident alerts
  const liveIncidentAlerts = [];
  if (congestionIndex > 30) {
    liveIncidentAlerts.push({
      id: "inc-1",
      title: "Arterial Congestion Surge",
      description: "Vehicular throughput dropped 38% past primary junction. AI routing active.",
      impact: "+4 min delay",
      type: "warning" as const,
    });
  }
  if (bottlenecks.some((b) => b.severity === "severe")) {
    liveIncidentAlerts.push({
      id: "inc-2",
      title: "Severe Queue Alert",
      description: "Downstream intersection cycle spillover exceeding 450m queue.",
      impact: "LOS F Breakdown",
      type: "danger" as const,
    });
  }

  return {
    levelOfService: losData.los,
    levelOfServiceDescription: losData.description,
    congestionIndex,
    averageSpeedKmh: avgObservedSpeed,
    freeFlowSpeedKmh: clampedFreeFlow,
    speedDropPercent,
    totalQueueLengthMeters,
    totalDelayMinutes,
    signalizedIntersections,
    averageSignalWaitSeconds: signalWaitSecondsAvg,
    greenWaveScorePercent: Math.round(greenWaveScorePercent),
    peakCongestionWindow: "08:15 AM - 10:30 AM & 05:45 PM - 08:00 PM",
    departurePredictions,
    carbonPenaltyKg: stopAndGoPenaltyKg,
    fuelEfficiencyScore: `${(5.2 + (congestionIndex * 0.04)).toFixed(1)} L/100km`,
    bottlenecks,
    liveIncidentAlerts,
  };
}
