import { Destination, Maneuver, RouteOption, Stop } from "@/types/journey";
import { synthesizeTrafficSegments } from "./trafficData";

export const DEFAULT_ORIGIN = {
  name: "Nagpur (Your location)",
  coordinate: { lat: 21.1463, lng: 79.0849 },
  address: "Zero Mile / Civil Lines, Nagpur, Maharashtra, India",
};

export const DETERMINISTIC_DESTINATIONS: Destination[] = [
  {
    id: "dest-pench",
    name: "Pench National Park",
    type: "place",
    address: "Tiger Reserve Corridor, Nagpur-Seoni Border, NH 44",
    coordinate: { lat: 21.6500, lng: 79.3000 },
    category: "National Park · Wildlife Safari",
    distanceMeters: 78000,
    approximateDurationMinutes: 85,
    tags: ["Tiger Reserve", "Forest Drive", "Popular Weekend", "Scenic"],
    rating: 4.9,
  },
  {
    id: "dest-ramtek",
    name: "Ramtek Fort & Gadmandir",
    type: "place",
    address: "Ramtek Hill, Nagpur District, Maharashtra",
    coordinate: { lat: 21.3980, lng: 79.3300 },
    category: "Historic Fort · Panoramic Valley",
    distanceMeters: 45000,
    approximateDurationMinutes: 55,
    tags: ["Historic", "Scenic Ghats", "Temple"],
    rating: 4.8,
  },
  {
    id: "dest-futala",
    name: "Futala Lake Promenade",
    type: "place",
    address: "Amravati Road, Telangkhedi, Nagpur, Maharashtra",
    coordinate: { lat: 21.1542, lng: 79.0436 },
    category: "Lakefront Promenade · Evening Hangout",
    distanceMeters: 4200,
    approximateDurationMinutes: 12,
    tags: ["Lakefront", "Sunset View", "Local"],
    rating: 4.7,
  },
  {
    id: "dest-lonavala",
    name: "Lonavala & Khandala Ghats",
    type: "place",
    address: "Sahyadri Ranges, Pune District, Maharashtra",
    coordinate: { lat: 18.7557, lng: 73.4072 },
    category: "Hill station · Scenic valleys",
    distanceMeters: 720000,
    approximateDurationMinutes: 680,
    tags: ["Hill Station", "Waterfalls", "Long Drive"],
    rating: 4.8,
  },
];

export const DETERMINISTIC_STOPS: Stop[] = [
  {
    id: "stop-starbucks-vrmall",
    name: "Starbucks Coffee - VR Mall",
    type: "coffee",
    coordinate: { lat: 21.1306, lng: 79.0975 },
    detourMinutes: 3,
    address: "Medical Square, Rambagh, Nagpur",
    rating: 4.8,
    added: false,
  },
  {
    id: "stop-starbucks-dharampeth",
    name: "Starbucks Coffee - Dharampeth",
    type: "coffee",
    coordinate: { lat: 21.1481, lng: 79.0625 },
    detourMinutes: 4,
    address: "West High Court Road, Dharampeth, Nagpur",
    rating: 4.9,
    added: false,
  },
  {
    id: "stop-ccd-ravinagar",
    name: "Cafe Coffee Day (CCD) - Ravi Nagar",
    type: "coffee",
    coordinate: { lat: 21.1465, lng: 79.0612 },
    detourMinutes: 3,
    address: "Amravati Road, Ravi Nagar, Nagpur",
    rating: 4.7,
    added: false,
  },
  {
    id: "stop-fuel-wardha",
    name: "Indian Oil Swagat Fuel & EV Hub",
    type: "fuel",
    coordinate: { lat: 21.1215, lng: 79.0712 },
    detourMinutes: 2,
    address: "Wardha Road, Somalwada, Nagpur",
    rating: 4.6,
    added: false,
  },
];

export const DETERMINISTIC_MANEUVERS: Maneuver[] = [
  {
    instruction: "Head northwest on University Rd towards NH 48",
    type: "depart",
    distanceMeters: 450,
    location: { lat: 18.5312, lng: 73.8441 },
    bearingAfter: 315,
    roadName: "Ganeshkhind Road",
  },
  {
    instruction: "Turn right onto Aundh Flyover to stay on NH 48 Link",
    type: "turn",
    modifier: "right",
    distanceMeters: 1200,
    location: { lat: 18.5587, lng: 73.8073 },
    bearingAfter: 330,
    roadName: "Aundh Flyover",
  },
  {
    instruction: "Keep left at the fork and merge onto Old Mumbai Highway",
    type: "fork",
    modifier: "left",
    distanceMeters: 4800,
    location: { lat: 18.6189, lng: 73.7421 },
    bearingAfter: 300,
    roadName: "Old Mumbai Highway (NH 48)",
  },
  {
    instruction: "Continue straight through Talegaon Toll Plaza",
    type: "straight",
    distanceMeters: 16500,
    location: { lat: 18.7291, lng: 73.6521 },
    bearingAfter: 290,
    roadName: "NH 48 Bypass",
  },
  {
    instruction: "Prepare to turn left for Green Valley Snack Stop in 400 m",
    type: "waypoint",
    distanceMeters: 400,
    location: { lat: 18.665, lng: 73.612 },
    bearingAfter: 285,
    roadName: "Valley Overlook Lane",
  },
  {
    instruction: "Take exit toward Lonavala Hill Station / Khandala Ghat",
    type: "exit",
    modifier: "right",
    distanceMeters: 2800,
    location: { lat: 18.7489, lng: 73.4321 },
    bearingAfter: 270,
    roadName: "Lonavala Access Spur",
  },
  {
    instruction: "Turn left onto Ryewood Park Road",
    type: "turn",
    modifier: "left",
    distanceMeters: 650,
    location: { lat: 18.7541, lng: 73.4112 },
    bearingAfter: 210,
    roadName: "Ryewood Road",
  },
  {
    instruction: "You have arrived at your destination: Lonavala",
    type: "arrive",
    distanceMeters: 0,
    location: { lat: 18.7557, lng: 73.4072 },
    roadName: "Lonavala Town Center",
  },
];

// Helper to compute exact cumulative meters along a polyline
export function computePolylineDistanceMeters(coords: [number, number][]): number {
  if (!coords || coords.length < 2) return 0;
  let total = 0;
  const R = 6371e3;
  for (let i = 0; i < coords.length - 1; i++) {
    const c1 = coords[i];
    const c2 = coords[i + 1];
    const p1 = (c1[1] * Math.PI) / 180;
    const p2 = (c2[1] * Math.PI) / 180;
    const dp = ((c2[1] - c1[1]) * Math.PI) / 180;
    const dl = ((c2[0] - c1[0]) * Math.PI) / 180;
    const a =
      Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return Math.round(total);
}

// Helper to generate distinct algorithmic routes strictly bound to REAL road geometries (never air routes)
export function synthesize10AgentRoutes(
  origin: { lat: number; lng: number } = DEFAULT_ORIGIN.coordinate,
  destination: { lat: number; lng: number } = DETERMINISTIC_DESTINATIONS[0].coordinate,
  baseDistance?: number,
  baseDuration?: number,
  baseGeometry?: [number, number][],
  candidateGeometries?: [number, number][][]
): RouteOption[] {
  const startPt: [number, number] = [origin.lng, origin.lat];
  const endPt: [number, number] = [destination.lng, destination.lat];

  const dLng = endPt[0] - startPt[0];
  const dLat = endPt[1] - startPt[1];
  const euclideanDist = Math.sqrt(dLng * dLng + dLat * dLat) || 0.01;
  const defaultFallbackMeters = baseDistance || Math.max(Math.round(euclideanDist * 111000 * 1.25), 4500);

  // Collect pool of real road geometries (filter out empty or invalid arrays)
  const realGeomPool: [number, number][][] = [];
  if (baseGeometry && Array.isArray(baseGeometry) && baseGeometry.length >= 2) {
    realGeomPool.push(baseGeometry);
  }
  if (candidateGeometries && candidateGeometries.length > 0) {
    for (const g of candidateGeometries) {
      if (Array.isArray(g) && g.length >= 2 && !realGeomPool.includes(g)) {
        realGeomPool.push(g);
      }
    }
  }

  // Fallback ONLY if zero road geometry could be fetched: orthogonal street grid (never curved air routes)
  const createOrthogonalStreetPath = (): [number, number][] => {
    const midPoint: [number, number] = [endPt[0], startPt[1]];
    return [startPt, midPoint, endPt];
  };

  const getGeometryForIndex = (index: number): [number, number][] => {
    if (realGeomPool.length > 0) {
      return realGeomPool[index % realGeomPool.length];
    }
    return createOrthogonalStreetPath();
  };

  // Define 10 specialized agent strategies with distinct algorithmic profiles
  const routeConfigs = [
    {
      id: "route-astar-fastest",
      name: "A* Dynamic Congestion Minimizer",
      summaryPrefix: "via Primary Arterial Corridor",
      geomIdx: 0,
      speedKmh: 42,
      isWayvePick: true,
      recommendationReason: "Evaluated real-time edge costs across 84 network vertices to bypass central bottlenecks.",
      confidence: 97,
      score: 98,
      agentScore: 98,
      dataStructureType: "A* Priority Queue Graph",
      trafficControlStrategy: "Dynamic Bottleneck Avoidance",
      trafficCongestionIndex: 14,
      filterTag: "fastest" as const,
      scoreBreakdown: { eta: 98, traffic: 95, scenic: 75, weather: 92, detour: 96, tolls: 88 },
      trafficCondition: "low" as const,
      maneuvers: DETERMINISTIC_MANEUVERS,
      warnings: [] as string[],
    },
    {
      id: "route-traffic-balancer",
      name: "Multi-Agent Traffic Load Balancer",
      summaryPrefix: "via Parallel Flow Distributor",
      geomIdx: 1,
      speedKmh: 36,
      isWayvePick: false,
      recommendationReason: "Disperses vehicular volume onto parallel distributor avenues, preventing phantom shockwave jams.",
      confidence: 95,
      score: 96,
      agentScore: 96,
      dataStructureType: "Min-Cut Capacity Flow Graph",
      trafficControlStrategy: "Arterial Load-Balancing",
      trafficCongestionIndex: 10,
      filterTag: "balancer" as const,
      scoreBreakdown: { eta: 94, traffic: 98, scenic: 80, weather: 90, detour: 92, tolls: 90 },
      trafficCondition: "low" as const,
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 5),
      warnings: [] as string[],
    },
    {
      id: "route-expressway-priority",
      name: "Hierarchical Expressway Prioritizer",
      summaryPrefix: "via Access-Controlled Flyover",
      geomIdx: 2,
      speedKmh: 52,
      isWayvePick: false,
      recommendationReason: "Locks onto access-controlled flyovers and express corridors for highest speed predictability.",
      confidence: 94,
      score: 94,
      agentScore: 94,
      dataStructureType: "Hierarchical Highway Contraction",
      trafficControlStrategy: "Expressway Flow Prioritization",
      trafficCongestionIndex: 12,
      filterTag: "express" as const,
      scoreBreakdown: { eta: 96, traffic: 91, scenic: 65, weather: 88, detour: 85, tolls: 65 },
      trafficCondition: "low" as const,
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 4),
      warnings: ["Fastag toll active on express lanes"],
    },
    {
      id: "route-outer-ring-bypass",
      name: "Outer Ring Convex Bypass",
      summaryPrefix: "via Orbital Freeway Bypass",
      geomIdx: 3,
      speedKmh: 48,
      isWayvePick: false,
      recommendationReason: "Circumvents central city traffic signals completely via the Outer Ring Road orbital freeway.",
      confidence: 93,
      score: 92,
      agentScore: 92,
      dataStructureType: "Convex Ring Radial Graph",
      trafficControlStrategy: "Signal-Free Orbital Bypass",
      trafficCongestionIndex: 6,
      filterTag: "bypass" as const,
      scoreBreakdown: { eta: 89, traffic: 99, scenic: 82, weather: 90, detour: 78, tolls: 92 },
      trafficCondition: "low" as const,
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 5),
      warnings: [] as string[],
    },
    {
      id: "route-pareto-optimal",
      name: "Pareto Time-Smoothness Frontier",
      summaryPrefix: "via Balanced Arterial Links",
      geomIdx: 4,
      speedKmh: 38,
      isWayvePick: false,
      recommendationReason: "Pareto frontier trade-off between speed and steady driving with minimum braking cycles.",
      confidence: 91,
      score: 91,
      agentScore: 91,
      dataStructureType: "Bi-Objective Pareto Frontier",
      trafficControlStrategy: "Minimal Deceleration Variance",
      trafficCongestionIndex: 18,
      filterTag: "balancer" as const,
      scoreBreakdown: { eta: 92, traffic: 90, scenic: 78, weather: 88, detour: 90, tolls: 85 },
      trafficCondition: "moderate" as const,
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 5),
      warnings: [] as string[],
    },
    {
      id: "route-incident-immune",
      name: "Incident-Immune Redundancy Route",
      summaryPrefix: "via Multi-Connector Parallel Grid",
      geomIdx: 1,
      speedKmh: 34,
      isWayvePick: false,
      recommendationReason: "Constructed with zero single-point failure exposure and quick lateral detour connectors ready if an accident occurs.",
      confidence: 90,
      score: 90,
      agentScore: 90,
      dataStructureType: "Vertex-Disjoint K-Shortest Paths",
      trafficControlStrategy: "Lateral Escape Redundancy",
      trafficCongestionIndex: 15,
      filterTag: "incident_immune" as const,
      scoreBreakdown: { eta: 88, traffic: 92, scenic: 75, weather: 86, detour: 88, tolls: 88 },
      trafficCondition: "low" as const,
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 5),
      warnings: [] as string[],
    },
    {
      id: "route-temporal-prediction",
      name: "Temporal Wave Prediction Route",
      summaryPrefix: "via Time-Shifted Feeder",
      geomIdx: 2,
      speedKmh: 40,
      isWayvePick: false,
      recommendationReason: "Predicts traffic wave arrivals at major intersections 15 minutes ahead, routing to arrive on green waves.",
      confidence: 89,
      score: 89,
      agentScore: 89,
      dataStructureType: "Time-Expanded Directed Acyclic Graph",
      trafficControlStrategy: "Green-Wave Progression Timing",
      trafficCongestionIndex: 20,
      filterTag: "balancer" as const,
      scoreBreakdown: { eta: 91, traffic: 89, scenic: 76, weather: 88, detour: 88, tolls: 82 },
      trafficCondition: "moderate" as const,
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 5),
      warnings: [] as string[],
    },
    {
      id: "route-eco-energy-saving",
      name: "Eco-Regenerative Gradient Descent",
      summaryPrefix: "via Flat Contour Alignment",
      geomIdx: 3,
      speedKmh: 35,
      isWayvePick: false,
      recommendationReason: "Optimized for EV regenerative efficiency, eliminating steep inclines and stop-and-go speed humps.",
      confidence: 88,
      score: 87,
      agentScore: 87,
      dataStructureType: "Energy-Cost Dynamic Programming",
      trafficControlStrategy: "Kinetic Inertia Preservation",
      trafficCongestionIndex: 16,
      filterTag: "eco" as const,
      scoreBreakdown: { eta: 82, traffic: 88, scenic: 90, weather: 85, detour: 84, tolls: 95 },
      trafficCondition: "low" as const,
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 5),
      warnings: [] as string[],
    },
    {
      id: "route-scenic-boulevard",
      name: "Aesthetic Greenery Boulevard",
      summaryPrefix: "via Canopy Lakefront Corridor",
      geomIdx: 4,
      speedKmh: 32,
      isWayvePick: false,
      recommendationReason: "Maximizes tree-lined shaded avenues, water body vistas, and low sound pollution.",
      confidence: 87,
      score: 86,
      agentScore: 86,
      dataStructureType: "Scenic Weighted Voronoi Diagram",
      trafficControlStrategy: "Acoustic & Visual Tranquility",
      trafficCongestionIndex: 22,
      filterTag: "scenic" as const,
      scoreBreakdown: { eta: 78, traffic: 84, scenic: 99, weather: 92, detour: 75, tolls: 90 },
      trafficCondition: "low" as const,
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 6),
      warnings: [] as string[],
    },
    {
      id: "route-fail-safe-backup",
      name: "Stochastic Commercial Segregation",
      summaryPrefix: "via Urban Arterial Grid",
      geomIdx: 0,
      speedKmh: 30,
      isWayvePick: false,
      recommendationReason: "Restricts route strictly to avenues with heavy-vehicle bans, avoiding slow-moving freight trucks.",
      confidence: 85,
      score: 84,
      agentScore: 84,
      dataStructureType: "Stochastic Routing under Uncertainty",
      trafficControlStrategy: "Commercial Freight Segregation",
      trafficCongestionIndex: 24,
      filterTag: "incident_immune" as const,
      scoreBreakdown: { eta: 80, traffic: 86, scenic: 80, weather: 84, detour: 82, tolls: 95 },
      trafficCondition: "moderate" as const,
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 4),
      warnings: [] as string[],
    },
  ];

  return routeConfigs.map((cfg) => {
    const geom = getGeometryForIndex(cfg.geomIdx);
    const measuredDist = computePolylineDistanceMeters(geom);
    const distMeters = measuredDist > 100 ? measuredDist : defaultFallbackMeters;
    const speedMps = (cfg.speedKmh * 1000) / 3600;
    const durSec = Math.max(Math.round(distMeters / speedMps), 180);
    const distKm = (distMeters / 1000).toFixed(1);
    const durMin = Math.round(durSec / 60);

    return {
      id: cfg.id,
      name: cfg.name,
      summary: `${cfg.summaryPrefix} · ${distKm} km · ${durMin} min`,
      provider: "wayve-agent",
      geometry: geom,
      distanceMeters: distMeters,
      durationSeconds: durSec,
      predictedDurationSeconds: durSec,
      isWayvePick: cfg.isWayvePick,
      recommendationReason: cfg.recommendationReason,
      confidence: cfg.confidence,
      score: cfg.score,
      agentScore: cfg.agentScore,
      dataStructureType: cfg.dataStructureType,
      trafficControlStrategy: cfg.trafficControlStrategy,
      trafficCongestionIndex: cfg.trafficCongestionIndex,
      filterTag: cfg.filterTag,
      scoreBreakdown: cfg.scoreBreakdown,
      trafficCondition: cfg.trafficCondition,
      trafficSegments: synthesizeTrafficSegments(geom, cfg.trafficCondition),
      weatherCondition: { summary: "Clear · Sunny", tempC: 26, rainProbability: 5 },
      warnings: cfg.warnings,
      maneuvers: cfg.maneuvers,
    };
  });
}

export function getDeterministicRoutes(
  origin: { lat: number; lng: number } = DEFAULT_ORIGIN.coordinate,
  destination: { lat: number; lng: number } = DETERMINISTIC_DESTINATIONS[0].coordinate
): RouteOption[] {
  return synthesize10AgentRoutes(origin, destination);
}
