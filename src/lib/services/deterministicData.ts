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

// Helper to generate coordinates along a curved road between two points
function generateCurvedPath(
  start: [number, number],
  end: [number, number],
  curveOffset: number,
  pointsCount: number
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount;
    // Linear interpolation
    const lng = start[0] + (end[0] - start[0]) * t;
    const lat = start[1] + (end[1] - start[1]) * t;
    // Quadratic arc displacement perpendicular to line
    const arc = Math.sin(Math.PI * t) * curveOffset;
    // Slightly jitter for realistic road curvature
    const jitter = Math.sin(t * 12) * (curveOffset * 0.15);
    points.push([
      Math.round((lng + arc * 0.5 + jitter) * 100000) / 100000,
      Math.round((lat + arc + jitter) * 100000) / 100000,
    ]);
  }
  return points;
}

export function getDeterministicRoutes(
  origin: { lat: number; lng: number } = DEFAULT_ORIGIN.coordinate,
  destination: { lat: number; lng: number } = DETERMINISTIC_DESTINATIONS[0].coordinate
): RouteOption[] {
  const startPt: [number, number] = [origin.lng, origin.lat];
  const endPt: [number, number] = [destination.lng, destination.lat];

  // Route 1: NH 48 Scenic Ghat Pass (Wayve's pick candidate for leisure/scenic)
  const geomScenic = generateCurvedPath(startPt, endPt, 0.045, 45);
  // Route 2: Expressway (Fastest corridor)
  const geomExpress = generateCurvedPath(startPt, endPt, -0.025, 38);
  // Route 3: Low-traffic Talegaon-Kamshet bypass
  const geomBypass = generateCurvedPath(startPt, endPt, 0.08, 42);

  return [
    {
      id: "route-scenic-ghat",
      name: "NH 44 Express Corridor",
      summary: "via NH 44 · Primary high-speed corridor with scenic canopy",
      provider: "wayve-fused",
      geometry: geomScenic,
      distanceMeters: 64800,
      durationSeconds: 4920, // 82 mins
      predictedDurationSeconds: 4680, // 78 mins with ML prediction
      isWayvePick: true,
      recommendationReason:
        "Wayve recommends this route because it matches your scenic preference, has lower predicted congestion, and includes your requested stop.",
      confidence: 89,
      score: 88,
      scoreBreakdown: {
        eta: 74,
        traffic: 92,
        scenic: 96,
        weather: 88,
        detour: 94,
        tolls: 90,
      },
      trafficCondition: "low",
      trafficSegments: synthesizeTrafficSegments(geomScenic, "low"),
      weatherCondition: {
        summary: "Clear · Mild Breeze",
        tempC: 24,
        rainProbability: 10,
      },
      warnings: [],
      maneuvers: DETERMINISTIC_MANEUVERS,
      shapAttribution: [
        { feature: "Low congestion arterial", impactMinutes: 4.8, direction: "decrease" },
        { feature: "Canopy scenery weight", impactMinutes: 0.0, direction: "decrease" },
        { feature: "Clear weather conditions", impactMinutes: 1.5, direction: "decrease" },
        { feature: "Scenic curve speed limit", impactMinutes: 3.2, direction: "increase" },
      ],
    },
    {
      id: "route-expressway",
      name: "Direct Arterial Bypass",
      summary: "via Ring Road & State Highway · Direct connection",
      provider: "wayve-fused",
      geometry: geomExpress,
      distanceMeters: 62400,
      durationSeconds: 4320, // 72 mins
      predictedDurationSeconds: 4440, // 74 mins
      isWayvePick: false,
      recommendationReason: "Fastest direct travel time with moderate peak-hour traffic.",
      confidence: 84,
      score: 81,
      scoreBreakdown: {
        eta: 95,
        traffic: 68,
        scenic: 35,
        weather: 85,
        detour: 60,
        tolls: 45,
      },
      trafficCondition: "moderate",
      trafficSegments: synthesizeTrafficSegments(geomExpress, "moderate"),
      weatherCondition: {
        summary: "Clear · Sunny",
        tempC: 26,
        rainProbability: 15,
      },
      warnings: ["Moderate truck traffic near toll plaza"],
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 5),
      shapAttribution: [
        { feature: "High-speed corridor", impactMinutes: 6.2, direction: "decrease" },
        { feature: "Toll plaza queue delay", impactMinutes: 4.4, direction: "increase" },
      ],
    },
    {
      id: "route-countryside-bypass",
      name: "Scenic Lakeside Bypass",
      summary: "via Scenic Lakeside Corridor · Relaxed cruising",
      provider: "wayve-fused",
      geometry: geomBypass,
      distanceMeters: 67200,
      durationSeconds: 5280, // 88 mins
      predictedDurationSeconds: 5160, // 86 mins
      isWayvePick: false,
      recommendationReason: "Quiet scenic route with minimal signals and very low stress.",
      confidence: 82,
      score: 76,
      scoreBreakdown: {
        eta: 62,
        traffic: 96,
        scenic: 85,
        weather: 80,
        detour: 75,
        tolls: 95,
      },
      trafficCondition: "low",
      trafficSegments: synthesizeTrafficSegments(geomBypass, "low"),
      weatherCondition: {
        summary: "Partly Cloudy",
        tempC: 23,
        rainProbability: 20,
      },
      warnings: [],
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 6),
      shapAttribution: [
        { feature: "Zero congestion rural road", impactMinutes: 5.1, direction: "decrease" },
        { feature: "Extra 4.8 km distance", impactMinutes: 6.5, direction: "increase" },
      ],
    },
  ];
}
