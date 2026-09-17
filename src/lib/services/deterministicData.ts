import { Destination, Maneuver, RouteOption, Stop } from "@/types/journey";

export const DEFAULT_ORIGIN = {
  name: "Pune City Center",
  coordinate: { lat: 18.5204, lng: 73.8567 },
  address: "Shivaji Nagar, Pune, Maharashtra",
};

export const DETERMINISTIC_DESTINATIONS: Destination[] = [
  {
    id: "dest-lonavala",
    name: "Lonavala",
    type: "place",
    address: "Sahyadri Ranges, Pune District, Maharashtra",
    coordinate: { lat: 18.7557, lng: 73.4072 },
    category: "Hill station · Scenic valleys",
    distanceMeters: 64800,
    approximateDurationMinutes: 78,
    tags: ["Hill Station", "Waterfalls", "Scenic Drive", "Popular"],
    rating: 4.8,
  },
  {
    id: "dest-panchgani",
    name: "Panchgani",
    type: "place",
    address: "Satara District, Maharashtra",
    coordinate: { lat: 17.9237, lng: 73.8016 },
    category: "Tableland viewpoint · Mountain retreat",
    distanceMeters: 98400,
    approximateDurationMinutes: 135,
    tags: ["Tableland", "Strawberry Farms", "Quiet"],
    rating: 4.7,
  },
  {
    id: "dest-matheran",
    name: "Matheran",
    type: "place",
    address: "Raigad District, Western Ghats",
    coordinate: { lat: 18.9865, lng: 73.3119 },
    category: "Automobile-free forest ridge",
    distanceMeters: 114000,
    approximateDurationMinutes: 160,
    tags: ["Eco-sensitive", "Toy Train", "Panoramic Views"],
    rating: 4.6,
  },
  {
    id: "dest-mahabaleshwar",
    name: "Mahabaleshwar",
    type: "place",
    address: "Western Ghats, Maharashtra",
    coordinate: { lat: 17.9307, lng: 73.6586 },
    category: "High altitude evergreen plateau",
    distanceMeters: 122000,
    approximateDurationMinutes: 175,
    tags: ["Plateau", "Forests", "Lake"],
    rating: 4.8,
  },
];

export const DETERMINISTIC_STOPS: Stop[] = [
  {
    id: "stop-snacks-1",
    name: "Green Valley Farm & Snack Point",
    type: "snacks",
    coordinate: { lat: 18.665, lng: 73.612 },
    detourMinutes: 4,
    address: "Old Pune-Mumbai Hwy, Kamshet",
    rating: 4.6,
    added: false,
  },
  {
    id: "stop-coffee-1",
    name: "Ghatside Artisan Roastery",
    type: "coffee",
    coordinate: { lat: 18.721, lng: 73.495 },
    detourMinutes: 3,
    address: "NH 48 Valley Rest Area",
    rating: 4.8,
    added: false,
  },
  {
    id: "stop-scenic-1",
    name: "Tiger's Leap Scenic Point Cafe",
    type: "scenic",
    coordinate: { lat: 18.749, lng: 73.418 },
    detourMinutes: 6,
    address: "Cliff Edge Road, Khandala Pass",
    rating: 4.9,
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
      name: "Old Highway & Scenic Ghat Pass",
      summary: "via Old NH 48 · Valley viewpoints & canopy roads",
      provider: "wayve-fused",
      geometry: geomScenic,
      distanceMeters: 64800,
      durationSeconds: 4920, // 82 mins
      predictedDurationSeconds: 4680, // 78 mins with ML prediction
      isWayvePick: true,
      recommendationReason:
        "Wayve recommends this route because it matches your scenic preference, has lower predicted congestion, and includes your snack stop.",
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
      weatherCondition: {
        summary: "Clear · Mild Mountain Breeze",
        tempC: 24,
        rainProbability: 10,
      },
      warnings: [],
      maneuvers: DETERMINISTIC_MANEUVERS,
      shapAttribution: [
        { feature: "Low congestion arterial", impactMinutes: 4.8, direction: "decrease" },
        { feature: "Valley scenery weight", impactMinutes: 0.0, direction: "decrease" },
        { feature: "Clear weather conditions", impactMinutes: 1.5, direction: "decrease" },
        { feature: "Scenic curve speed limit", impactMinutes: 3.2, direction: "increase" },
      ],
    },
    {
      id: "route-expressway",
      name: "Mumbai-Pune Expressway",
      summary: "via Yashwantrao Chavan Expressway · Direct corridor",
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
      weatherCondition: {
        summary: "Clear · Sunny",
        tempC: 26,
        rainProbability: 15,
      },
      warnings: ["Heavy container truck traffic near Khalapur toll plaza"],
      maneuvers: DETERMINISTIC_MANEUVERS.slice(0, 5),
      shapAttribution: [
        { feature: "High-speed expressway", impactMinutes: 6.2, direction: "decrease" },
        { feature: "Toll plaza queue delay", impactMinutes: 4.4, direction: "increase" },
        { feature: "Corridor merge traffic", impactMinutes: 3.8, direction: "increase" },
      ],
    },
    {
      id: "route-countryside-bypass",
      name: "Talegaon - Kamshet Country Bypass",
      summary: "via Pawna Lake Countryside Road · Relaxed cruising",
      provider: "wayve-fused",
      geometry: geomBypass,
      distanceMeters: 67200,
      durationSeconds: 5280, // 88 mins
      predictedDurationSeconds: 5160, // 86 mins
      isWayvePick: false,
      recommendationReason: "Quiet countryside route with minimal signals and very low stress.",
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
