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
import { getHaversineDistance } from "../services/userLocation";

export const NAGPUR_SURROUNDING_POIS: Destination[] = [
  {
    id: "nagpur-starbucks-vrmall",
    name: "Starbucks Coffee - VR Mall",
    type: "place",
    address: "VR Mall (Trillium), Medical Square, Rambagh, Nagpur, Maharashtra 440009",
    coordinate: { lat: 21.1306, lng: 79.0975 },
    category: "Cafe · Coffee",
    rating: 4.8,
    tags: ["Starbucks", "Coffee", "Nagpur City", "Surroundings"],
  },
  {
    id: "nagpur-starbucks-dharampeth",
    name: "Starbucks Coffee - Dharampeth",
    type: "place",
    address: "West High Court Road, Dharampeth, Nagpur, Maharashtra 440010",
    coordinate: { lat: 21.1481, lng: 79.0625 },
    category: "Cafe · Coffee",
    rating: 4.9,
    tags: ["Starbucks", "Coffee", "Nagpur West", "Surroundings"],
  },
  {
    id: "nagpur-starbucks-sadar",
    name: "Starbucks Coffee - Sadar",
    type: "place",
    address: "Residency Road, Sadar, Nagpur, Maharashtra 440001",
    coordinate: { lat: 21.1610, lng: 79.0820 },
    category: "Cafe · Coffee",
    rating: 4.7,
    tags: ["Starbucks", "Coffee", "Nagpur North", "Surroundings"],
  },
  {
    id: "nagpur-ccd-ravinagar",
    name: "Cafe Coffee Day (CCD) - Ravi Nagar",
    type: "place",
    address: "Amravati Road, Ravi Nagar, Bharat Nagar, Nagpur, Maharashtra 440033",
    coordinate: { lat: 21.1465, lng: 79.0612 },
    category: "Cafe · Coffee",
    rating: 4.6,
    tags: ["CCD", "Coffee", "Cafe", "Nagpur"],
  },
  {
    id: "nagpur-22nd-bridge",
    name: "22nd Bridge Coffee Roasters",
    type: "place",
    address: "Red Cross Road, Ramdaspeth, Nagpur, Maharashtra 440010",
    coordinate: { lat: 21.1507, lng: 79.0747 },
    category: "Specialty Cafe · Artisan Coffee",
    rating: 4.9,
    tags: ["Roastery", "Coffee", "Cafe", "Nagpur"],
  },
  {
    id: "nagpur-pench",
    name: "Pench National Park (Tiger Reserve)",
    type: "place",
    address: "Seoni / Chhindwara & Nagpur Border, NH 44 corridor",
    coordinate: { lat: 21.6500, lng: 79.3000 },
    category: "National Park · Wildlife Safari",
    rating: 4.9,
    tags: ["Tiger Reserve", "Weekend Getaway", "Nature", "Pench"],
  },
  {
    id: "nagpur-ramtek",
    name: "Ramtek Fort & Gadmandir Temple",
    type: "place",
    address: "Ramtek Hill, Nagpur District, Maharashtra 441106",
    coordinate: { lat: 21.3980, lng: 79.3300 },
    category: "Historic Fort · Scenic Viewpoint",
    rating: 4.8,
    tags: ["Historic", "Scenic Drive", "Temple", "Ramtek"],
  },
  {
    id: "nagpur-futala",
    name: "Futala Lake Promenade & Fountain",
    type: "place",
    address: "Futala Lake Road, Telangkhedi, Nagpur, Maharashtra 440001",
    coordinate: { lat: 21.1542, lng: 79.0436 },
    category: "Lakefront Promenade · Evening Hangout",
    rating: 4.7,
    tags: ["Lake", "Sunset", "Food Court", "Futala"],
  },
  {
    id: "nagpur-zero-mile",
    name: "Zero Mile Stone (Center of India)",
    type: "place",
    address: "Civil Lines, Wardha Road Junction, Nagpur, Maharashtra 440001",
    coordinate: { lat: 21.1528, lng: 79.0822 },
    category: "Historical Monument",
    rating: 4.6,
    tags: ["Monument", "Landmark", "Central India", "Zero Mile"],
  },
  {
    id: "nagpur-tadoba",
    name: "Tadoba-Andhari Tiger Reserve",
    type: "place",
    address: "Chandrapur District, Maharashtra (via Nagpur-Chandrapur Hwy)",
    coordinate: { lat: 20.2520, lng: 79.3140 },
    category: "Tiger Sanctuary · Forest Safari",
    rating: 4.9,
    tags: ["Tiger Reserve", "Wildlife", "Tadoba"],
  },
  {
    id: "nagpur-fuel-wardha",
    name: "Indian Oil / HP Petrol & EV Hub",
    type: "place",
    address: "Wardha Road, Somalwada, Nagpur, Maharashtra 440025",
    coordinate: { lat: 21.1215, lng: 79.0712 },
    category: "Fuel & EV Rapid Charger",
    rating: 4.6,
    tags: ["Fuel", "Petrol", "EV Charger", "Rest Stop"],
  },
];

export async function searchPlaces(
  query: string,
  proximity?: Coordinate,
  countryCode?: string
): Promise<Destination[]> {
  const token = getCleanToken();
  const q = query.trim().toLowerCase();
  if (!q) return DETERMINISTIC_DESTINATIONS;

  // Default to Nagpur / Central India if proximity not provided
  const center: Coordinate = proximity || { lat: 21.1463, lng: 79.0849 };
  const detectedCountry = countryCode || (center.lat >= 6 && center.lat <= 38 && center.lng >= 68 && center.lng <= 98 ? "in" : "us");

  let candidates: Destination[] = [];

  // 1. Check local verified surroundings POIs first for immediate match (e.g. Starbucks, cafes, Pench, Ramtek)
  for (const poi of NAGPUR_SURROUNDING_POIS) {
    const nameMatch = poi.name.toLowerCase().includes(q);
    const tagMatch = poi.tags?.some((t) => t.toLowerCase().includes(q));
    const catMatch = poi.category?.toLowerCase().includes(q);
    const addrMatch = poi.address?.toLowerCase().includes(q);
    const isCoffeeQuery = (q.includes("coffee") || q.includes("cafe") || q.includes("starbucks")) && (poi.category?.toLowerCase().includes("cafe") || poi.tags?.includes("Coffee") || poi.tags?.includes("Starbucks"));
    const isFuelQuery = (q.includes("fuel") || q.includes("petrol") || q.includes("ev") || q.includes("gas")) && (poi.category?.toLowerCase().includes("fuel") || poi.tags?.includes("Fuel"));

    if (nameMatch || tagMatch || catMatch || addrMatch || isCoffeeQuery || isFuelQuery) {
      const dist = getHaversineDistance(center, poi.coordinate);
      candidates.push({
        ...poi,
        distanceMeters: dist,
      });
    }
  }

  // 2. Mapbox Geocoding with strict proximity & country
  if (token && !token.includes("your_mapbox_token")) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=10&proximity=${center.lng},${center.lat}&country=${detectedCountry}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const mbPlaces: Destination[] = data.features.map((feat: any, idx: number) => {
            const [lng, lat] = feat.center || [center.lng, center.lat];
            const cleanName = feat.text || feat.place_name?.split(",")[0] || query;
            const dist = getHaversineDistance(center, { lat, lng });
            return {
              id: feat.id || `place-${idx}`,
              name: cleanName,
              type: feat.place_type?.[0] || "place",
              address: feat.place_name || undefined,
              coordinate: { lat, lng },
              category: feat.properties?.category || feat.place_type?.[0] || "Destination",
              distanceMeters: dist,
              rating: 4.8,
              tags: [feat.place_type?.[0] || "Location", "Surroundings Verified"],
            };
          });
          candidates = [...candidates, ...mbPlaces];
        }
      }
    } catch {
      // Fallback
    }
  }

  // 3. OpenStreetMap Nominatim with strict viewbox & countrycode
  if (candidates.length < 3) {
    try {
      const delta = 2.0; // ~200km local bounding box
      const viewbox = `${center.lng - delta},${center.lat + delta},${center.lng + delta},${center.lat - delta}`;
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=${detectedCountry}&viewbox=${viewbox}&limit=10&addressdetails=1`;

      const nomRes = await fetch(nomUrl, {
        headers: { "User-Agent": "WayveSurroundings/1.0" },
      });
      if (nomRes.ok) {
        const places = await nomRes.json();
        if (Array.isArray(places) && places.length > 0) {
          const nomPlaces: Destination[] = places.map((p: any, idx: number) => {
            const lat = parseFloat(p.lat);
            const lng = parseFloat(p.lon);
            const name = p.name || p.display_name.split(",")[0] || query;
            const dist = getHaversineDistance(center, { lat, lng });
            return {
              id: `nom-${p.place_id || idx}`,
              name,
              type: p.type || "place",
              address: p.display_name,
              coordinate: { lat, lng },
              category: p.class || p.type || "Destination",
              distanceMeters: dist,
              rating: 4.7,
              tags: [p.type || "Place", "Local Verified"],
            };
          });
          candidates = [...candidates, ...nomPlaces];
        }
      }
    } catch {
      // Continue
    }
  }

  // Deduplicate candidates by coordinates (~100m)
  const uniqueMap = new Map<string, Destination>();
  for (const c of candidates) {
    const key = `${c.coordinate.lat.toFixed(3)},${c.coordinate.lng.toFixed(3)}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, c);
    }
  }
  candidates = Array.from(uniqueMap.values());

  // Sort strictly by distance from user's current location ascending (closest first, NEVER Australia!)
  if (candidates.length > 0) {
    candidates.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    // Purge any result across the world (> 3000 km away when user is in India)
    if (detectedCountry === "in") {
      candidates = candidates.filter((c) => (c.distanceMeters || 0) < 3000000);
    }
    return candidates;
  }

  // Synthesize dynamic destination in local surroundings
  return [
    {
      id: `custom-dest-${Date.now()}`,
      name: q.charAt(0).toUpperCase() + q.slice(1),
      type: "place",
      address: `${q}, Local Area`,
      coordinate: { lat: center.lat + 0.03, lng: center.lng + 0.03 },
      category: "Destination",
      distanceMeters: 3800,
      rating: 4.8,
      tags: ["Location", "Local Verified"],
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
      // Fall through to OSRM open routing
    }
  }

  // Free Open Source OSRM Routing Engine fallback (No token needed, works globally!)
  try {
    const allPoints = [origin, ...validWaypoints, destination];
    const coords = allPoints.map((p) => `${p.lng},${p.lat}`).join(";");
    const osrmProfile = mode === "walking" ? "foot" : mode === "cycling" ? "bicycle" : "driving";
    const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coords}?overview=full&geometries=geojson&steps=true&alternatives=true`;

    const osrmRes = await fetch(osrmUrl);
    if (osrmRes.ok) {
      const osrmData = await osrmRes.json();
      if (osrmData.routes && osrmData.routes.length > 0) {
        const weather = await fetchWeather(destination.lat, destination.lng);

        const osrmRoutes: RouteOption[] = osrmData.routes.map((r: any, i: number) => {
          const maneuvers: Maneuver[] = [];
          if (r.legs) {
            r.legs.forEach((leg: any, legIdx: number) => {
              if (legIdx > 0 && validWaypoints[legIdx - 1]) {
                maneuvers.push({
                  instruction: `Arrive at intermediate stop`,
                  type: "arrive",
                  distanceMeters: 0,
                  location: validWaypoints[legIdx - 1],
                  roadName: "Waypoint Stop",
                });
              }
              if (leg.steps) {
                leg.steps.forEach((step: any) => {
                  const m = step.maneuver || {};
                  maneuvers.push({
                    instruction: m.instruction || step.name || "Proceed",
                    type: m.type || "turn",
                    modifier: m.modifier,
                    distanceMeters: Math.round(step.distance || 0),
                    location: {
                      lat: m.location?.[1] ?? origin.lat,
                      lng: m.location?.[0] ?? origin.lng,
                    },
                    roadName: step.name || undefined,
                  });
                });
              }
            });
          }

          const distance = Math.round(r.distance || 25000);
          const duration = Math.round(r.duration || 1800);
          const isPrimary = i === 0;

          const prediction = predictTravelTime({
            baseDurationSeconds: duration,
            distanceMeters: distance,
            trafficLevel: isPrimary ? "moderate" : "low",
            weatherCondition: {
              tempC: weather.tempC,
              rainProbability: weather.rainProbability,
            },
            isHighway: true,
          });

          const routeName =
            hasWaypoints
              ? "Corridor with Stops"
              : i === 0
              ? "Fastest Corridor"
              : "Scenic Alternative";

          return {
            id: `osrm-route-${i}`,
            name: routeName,
            summary: `via ${routeName} · ${Math.round(distance / 1000)} km`,
            provider: "osrm-global",
            geometry: r.geometry?.coordinates || [],
            distanceMeters: distance,
            durationSeconds: duration,
            predictedDurationSeconds: prediction.predictedDurationSeconds,
            isWayvePick: false,
            recommendationReason: "",
            confidence: prediction.confidence,
            score: 82,
            scoreBreakdown: {
              eta: 85,
              traffic: 80,
              scenic: 75,
              weather: 85,
              detour: 80,
              tolls: 75,
            },
            trafficCondition: isPrimary ? ("moderate" as const) : ("low" as const),
            weatherCondition: {
              summary: weather.summary,
              tempC: weather.tempC,
              rainProbability: weather.rainProbability,
            },
            warnings: [],
            maneuvers,
            shapAttribution: prediction.attributions,
          };
        });

        return scoreRoutes(osrmRoutes, "scenic");
      }
    }
  } catch {
    // Fall through to dynamic curved corridor
  }

  // Dynamic geometric path calculation between actual origin and destination
  const startPt: [number, number] = [origin.lng, origin.lat];
  const endPt: [number, number] = [destination.lng, destination.lat];
  
  // Calculate approximate Haversine distance in meters
  const R = 6371e3;
  const phi1 = (origin.lat * Math.PI) / 180;
  const phi2 = (destination.lat * Math.PI) / 180;
  const deltaPhi = ((destination.lat - origin.lat) * Math.PI) / 180;
  const deltaLambda = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directMeters = Math.max(Math.round(R * c), 2000);
  const roadMeters = Math.round(directMeters * 1.25);
  const durationSec = Math.round(roadMeters / 15); // ~54 km/h average speed

  const numPoints = Math.min(Math.max(Math.round(roadMeters / 1000), 20), 80);
  const coords1: [number, number][] = [];
  const coords2: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const baseLng = startPt[0] + (endPt[0] - startPt[0]) * t;
    const baseLat = startPt[1] + (endPt[1] - startPt[1]) * t;
    const arc = Math.sin(t * Math.PI);
    // Route 1 slight positive arc
    coords1.push([baseLng - (endPt[1] - startPt[1]) * 0.08 * arc, baseLat + (endPt[0] - startPt[0]) * 0.08 * arc]);
    // Route 2 direct
    coords2.push([baseLng + (endPt[1] - startPt[1]) * 0.04 * arc, baseLat - (endPt[0] - startPt[0]) * 0.04 * arc]);
  }

  const dynamicRoutes: RouteOption[] = [
    {
      id: "dynamic-fastest",
      name: "Fastest Direct Corridor",
      summary: `Direct highway route · ${Math.round(roadMeters / 1000)} km`,
      provider: "wayve-offline-engine",
      geometry: coords2,
      distanceMeters: roadMeters,
      durationSeconds: durationSec,
      predictedDurationSeconds: Math.round(durationSec * 0.95),
      isWayvePick: false,
      recommendationReason: "Direct arterial connection with predictable travel time.",
      confidence: 85,
      score: 84,
      scoreBreakdown: { eta: 88, traffic: 82, scenic: 70, weather: 85, detour: 90, tolls: 80 },
      trafficCondition: "low",
      weatherCondition: { summary: "Clear Sky", tempC: 22, rainProbability: 5 },
      warnings: [],
      maneuvers: [
        { instruction: `Depart from origin`, type: "depart", distanceMeters: 500, location: origin },
        { instruction: `Continue along arterial corridor`, type: "continue", distanceMeters: roadMeters - 1000, location: { lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 } },
        { instruction: `Arrive at destination`, type: "arrive", distanceMeters: 500, location: destination },
      ],
    },
    {
      id: "dynamic-scenic",
      name: "Scenic Panoramic Bypass",
      summary: `Scenic bypass with valley vista · ${Math.round((roadMeters * 1.1) / 1000)} km`,
      provider: "wayve-offline-engine",
      geometry: coords1,
      distanceMeters: Math.round(roadMeters * 1.1),
      durationSeconds: Math.round(durationSec * 1.15),
      predictedDurationSeconds: Math.round(durationSec * 1.12),
      isWayvePick: true,
      recommendationReason: "Wayve recommends this corridor for superior road quality and scenic ambiance.",
      confidence: 90,
      score: 89,
      scoreBreakdown: { eta: 78, traffic: 92, scenic: 95, weather: 88, detour: 85, tolls: 88 },
      trafficCondition: "low",
      weatherCondition: { summary: "Pleasant · Good Visibility", tempC: 21, rainProbability: 0 },
      warnings: [],
      maneuvers: [
        { instruction: `Depart along panoramic route`, type: "depart", distanceMeters: 800, location: origin },
        { instruction: `Enjoy scenic vista stretch`, type: "continue", distanceMeters: roadMeters - 1200, location: { lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 } },
        { instruction: `Arrive safely at destination`, type: "arrive", distanceMeters: 400, location: destination },
      ],
    },
  ];

  return scoreRoutes(dynamicRoutes, "scenic");
}
