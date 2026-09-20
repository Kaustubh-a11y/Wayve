export type JourneyState =
  | "IDLE"
  | "PLANNING"
  | "DESTINATION_RESOLVED"
  | "ROUTES_LOADING"
  | "ROUTES_READY"
  | "AWAITING_CONFIRMATION"
  | "NAVIGATING"
  | "MONITORING"
  | "REPLANNING"
  | "ROUTE_SWITCH_PENDING"
  | "ARRIVED"
  | "TRIP_INTELLIGENCE"
  | "ERROR";

export interface Coordinate {
  lat: number;
  lng: number;
}

export type TravelMode = "driving" | "walking" | "cycling" | "transit";

export type JourneyMode = "fast" | "scenic" | "relaxed" | "economy" | "custom";

export interface JourneyPreferences {
  fastest: number; // 0.0 to 1.0
  scenic: number;
  traffic: number;
  fuel: number;
  tolls: number;
  weather: number;
  avoidHighways: boolean;
  avoidTolls: boolean;
  avoidRain: boolean;
  maxDetourMinutes?: number;
}

export interface Destination {
  id: string;
  name: string;
  type: "place" | "address" | "landmark" | "coordinate";
  address?: string;
  coordinate: Coordinate;
  category?: string;
  distanceMeters?: number;
  approximateDurationMinutes?: number;
  tags?: string[];
  rating?: number;
  photo?: string;
}

export interface Stop {
  id: string;
  name: string;
  type: "coffee" | "snacks" | "fuel" | "scenic" | "food" | "rest" | "other";
  coordinate: Coordinate;
  detourMinutes: number;
  address?: string;
  rating?: number;
  added: boolean;
}

export interface Maneuver {
  instruction: string;
  type: string;
  modifier?: string;
  distanceMeters: number;
  location: Coordinate;
  bearingAfter?: number;
  roadName?: string;
}

export interface FeatureAttribution {
  feature: string;
  impactMinutes: number;
  direction: "increase" | "decrease";
}

export type CongestionLevel = "unknown" | "low" | "moderate" | "heavy" | "severe";

export interface RouteSegment {
  coordinates: [number, number][]; // [lng, lat][]
  congestion: CongestionLevel;
  speedKmh?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  roadName?: string;
}

export interface RouteOption {
  id: string;
  name: string;
  summary: string;
  provider: string;
  geometry: [number, number][]; // [lng, lat]
  distanceMeters: number;
  durationSeconds: number;
  predictedDurationSeconds: number;
  isWayvePick: boolean;
  recommendationReason: string;
  confidence: number;
  score: number;
  scoreBreakdown: {
    eta: number;
    traffic: number;
    scenic: number;
    weather: number;
    detour: number;
    tolls: number;
  };
  trafficCondition: "low" | "moderate" | "heavy";
  trafficSegments?: RouteSegment[];
  weatherCondition: {
    summary: string;
    tempC: number;
    rainProbability: number;
  };
  warnings: string[];
  maneuvers: Maneuver[];
  shapAttribution?: FeatureAttribution[];
}

export type IncidentType =
  | "heavy_traffic"
  | "accident"
  | "construction"
  | "road_blocked"
  | "flooding"
  | "hazard"
  | "other";

export interface Incident {
  id: string;
  type: IncidentType;
  coordinate: Coordinate;
  severity: number; // 0 to 1
  confidence: number; // 0 to 1
  distanceAheadMeters?: number;
  reportedAt: string;
  source: "user" | "simulation" | "traffic_api";
  description?: string;
}

export type SimulationEventType =
  | "heavy_traffic"
  | "accident"
  | "road_closure"
  | "construction"
  | "heavy_rain"
  | "event_congestion";

export interface SimulationEvent {
  type: SimulationEventType;
  targetRouteId: string;
  severity: number;
  timestamp: string;
}

export interface ReplanningAssessment {
  triggered: boolean;
  reason: string;
  affectedRouteId: string;
  originalEtaSeconds: number;
  degradedEtaSeconds: number;
  delayMinutes: number;
  recommendedRoute: RouteOption;
  timeSavedMinutes: number;
  confidence: number;
}

export interface TripIntelligenceData {
  tripId: string;
  destinationName: string;
  distanceKm: number;
  actualDurationMinutes: number;
  reroutesCount: number;
  timeSavedMinutes: number;
  eventsTimeline: {
    time: string;
    text: string;
    type: "alert" | "decision" | "switch" | "start" | "arrived";
  }[];
  factorWeights: {
    factor: string;
    percentage: number;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "wayve";
  text: string;
  timestamp: string;
  structuredIntent?: {
    intent: string;
    destinationName?: string;
    journeyMode?: JourneyMode;
    stopsRequested?: string[];
    preferences?: Partial<JourneyPreferences>;
  };
}

export type ThemeMode = "light" | "dark" | "system";
export type MapViewMode = "2d" | "3d" | "satellite";
export type PlanningStep = "destination" | "preferences" | "routes";

export interface AIDiagnostics {
  status: "connected" | "fallback" | "error";
  engine: "gemini" | "rule_based";
  message: string;
  keyPrefix?: string;
  latencyMs?: number;
}
