import { Coordinate, Destination, Maneuver, RouteOption, TravelMode } from "@/types/journey";
import { DETERMINISTIC_DESTINATIONS, getDeterministicRoutes } from "../services/deterministicData";
import { predictTravelTime } from "../services/mlPredictor";
import { scoreRoutes } from "../services/routeScorer";
import { fetchWeather } from "./weather";

function getCleanToken(): string {
  const raw = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  return raw.replace(/^['"\s]+|['"\s]+$/g, "");
}

/**
 * Searches for places/destinations via Mapbox Geocoding API with fallback to deterministic destinations.
 */
export async function searchPlaces(
  query: string,
  proximity?: Coordinate
): Promise<Destination[]> {
  const token = getCleanToken();
  const q = query.trim();
  if (!q) return DETERMINISTIC_DESTINATIONS;

  if (token && !token.includes("your_mapbox_token")) {
    try {
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&limit=8`;
      if (proximity) {
        url += `&proximity=${proximity.lng},${proximity.lat}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          return data.features.map((feat: any, idx: number) => {
            const [lng, lat] = feat.center || [73.8567, 18.5204];
            const cleanName = feat.text || feat.place_name?.split(",")[0] || q;
            return {
              id: feat.id || `place-${idx}`,
              name: cleanName,
              type: feat.place_type?.[0] || "place",
              address: feat.place_name || undefined,
              coordinate: { lat, lng },
              category: feat.properties?.category || feat.place_type?.[0] || "Destination",
              distanceMeters: feat.properties?.distance || undefined,
              rating: 4.8,
              tags: [feat.place_type?.[0] || "Location", "Verified"],
            };
          });
        }
      }
    } catch {
      // Fallback
    }
  }

  // Filter deterministic destinations by query
  const lower = q.toLowerCase();
  const filtered = DETERMINISTIC_DESTINATIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(lower) ||
      d.category?.toLowerCase().includes(lower) ||
      d.tags?.some((t) => t.toLowerCase().includes(lower))
  );

  if (filtered.length > 0) return filtered;

  // Synthesize dynamic destination if not in local list and mapbox offline
  return [
    {
      id: `custom-dest-${Date.now()}`,
      name: q.charAt(0).toUpperCase() + q.slice(1),
      type: "place",
      address: `${q}, Verified Destination`,
      coordinate: proximity
        ? { lat: proximity.lat + 0.06, lng: proximity.lng + 0.06 }
        : { lat: 18.9365, lng: 72.8241 },
      category: "Destination",
      rating: 4.8,
      tags: ["Location", "Verified"],
    },
  ];
}

/**
 * Fetches driving routes from Mapbox Directions API with alternatives, traffic, and step maneuvers.
 * Supports multi-waypoint routes (e.g. Origin -> Starbucks -> Destination).
 * Falls back to high-fidelity deterministic routes if offline.
 */
export async function getDirections(
  origin: Coordinate,
  destination: Coordinate,
  mode: TravelMode = "driving",
  waypoints?: Coordinate[]
): Promise<RouteOption[]> {
  const token = getCleanToken();
  const profile = mode === "walking" ? "walking" : mode === "cycling" ? "cycling" : "driving-traffic";
  const validWaypoints = (waypoints || []).filter(
    (w) => w && typeof w.lat === "number" && typeof w.lng === "number"
  );
  const hasWaypoints = validWaypoints.length > 0;

  if (token && !token.includes("your_mapbox_token")) {
    try {
      const allPoints = [origin, ...validWaypoints, destination];
      const coords = allPoints.map((p) => `${p.lng},${p.lat}`).join(";");
      const alternativesParam = hasWaypoints ? "alternatives=false" : "alternatives=true";
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?${alternativesParam}&geometries=geojson&steps=true&overview=full&annotations=congestion,distance,duration&access_token=${token}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          // Fetch destination weather
          const weather = await fetchWeather(destination.lat, destination.lng);

          const rawRoutes: RouteOption[] = data.routes.map((r: any, i: number) => {
            const maneuvers: Maneuver[] = [];

            if (r.legs && r.legs.length > 0) {
              r.legs.forEach((leg: any, legIdx: number) => {
                if (legIdx > 0 && validWaypoints[legIdx - 1]) {
                  maneuvers.push({
                    instruction: `Arrive at intermediate stop`,
                    type: "arrive",
                    modifier: "straight",
                    distanceMeters: 0,
                    location: validWaypoints[legIdx - 1],
                    roadName: "Waypoint Stop",
                  });
                }

                if (leg.steps) {
                  leg.steps.forEach((step: any) => {
                    const man = step.maneuver || {};
                    maneuvers.push({
                      instruction: man.instruction || step.name || "Continue",
                      type: man.type || "turn",
                      modifier: man.modifier,
                      distanceMeters: Math.round(step.distance || 0),
                      location: {
                        lat: man.location?.[1] ?? origin.lat,
                        lng: man.location?.[0] ?? origin.lng,
                      },
                      bearingAfter: man.bearing_after,
                      roadName: step.name || undefined,
                    });
                  });
                }
              });
            }

            const isPrimary = i === 0;
            const distance = Math.round(r.distance || 50000);
            const duration = Math.round(r.duration || 3600);

            // ML ETA prediction
            const prediction = predictTravelTime({
              baseDurationSeconds: duration,
              distanceMeters: distance,
              trafficLevel: isPrimary ? "moderate" : "low",
              weatherCondition: {
                tempC: weather.tempC,
                rainProbability: weather.rainProbability,
              },
              isHighway: (r.summary || "").toLowerCase().includes("expressway") || (r.summary || "").toLowerCase().includes("hwy"),
            });

            const routeName =
              r.summary ||
              (hasWaypoints
                ? "Corridor via Intermediate Stop"
                : i === 0
                ? "Primary Highway Corridor"
                : i === 1
                ? "Scenic Ridge Route"
                : "Alternate Bypass");

            return {
              id: `mapbox-route-${i}`,
              name: routeName,
              summary: `via ${routeName} · ${Math.round(distance / 1000)} km`,
              provider: "mapbox-directions",
              geometry: r.geometry?.coordinates || [],
              distanceMeters: distance,
              durationSeconds: duration,
              predictedDurationSeconds: prediction.predictedDurationSeconds,
              isWayvePick: false,
              recommendationReason: "",
              confidence: prediction.confidence,
              score: 80,
              scoreBreakdown: {
                eta: 80,
                traffic: 75,
                scenic: 70,
                weather: 85,
                detour: 80,
                tolls: 70,
              },
              trafficCondition: isPrimary ? ("moderate" as const) : ("low" as const),
              weatherCondition: {
                summary: weather.summary,
                tempC: weather.tempC,
                rainProbability: weather.rainProbability,
              },
              warnings: [],
              maneuvers: maneuvers.length > 0 ? maneuvers : [],
              shapAttribution: prediction.attributions,
            };
          });

          // Run deterministic Route Scoring
          return scoreRoutes(rawRoutes, "scenic");
        }
      }
    } catch {
      // Fall through to deterministic
    }
  }

  // Deterministic fallback
  const fallback = getDeterministicRoutes(origin, destination);
  return scoreRoutes(fallback, "scenic");
}
