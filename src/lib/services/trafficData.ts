import { CongestionLevel, RouteSegment } from "@/types/journey";
import { getHaversineDistance } from "./userLocation";

/**
 * Ambient traffic veins for Nagpur & Central India regional network (NH 44, NH 53, Samruddhi Mahamarg, Ring Road).
 * Rendered on the map canvas to mirror Google Maps live traffic overlay.
 */
export const NAGPUR_AMBIENT_TRAFFIC_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // 1. NH 44 North (Zero Mile -> Kamptee -> Mansar -> Pench)
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 42, roadName: "NH 44 Kamptee Arterial" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0822, 21.1528], // Zero Mile
          [79.0950, 21.1750],
          [79.1200, 21.2000],
          [79.1650, 21.2250], // Kamptee
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 85, roadName: "NH 44 Express Corridor" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.1650, 21.2250], // Kamptee
          [79.2200, 21.2900], // Kanhan
          [79.2850, 21.3700], // Mansar
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "heavy", speedKmh: 24, roadName: "NH 44 Mansar Toll Bottleneck" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.2850, 21.3700],
          [79.2950, 21.3900],
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 90, roadName: "NH 44 Forest Highway to Pench" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.2950, 21.3900],
          [79.3100, 21.4800],
          [79.3200, 21.5700],
          [79.3000, 21.6500], // Pench Tiger Reserve Gate
        ],
      },
    },

    // 2. NH 44 South (Nagpur -> Dhantoli -> Chhatrapati Sq -> MIHAN -> Butibori -> Hyderabad)
    {
      type: "Feature",
      properties: { congestion: "heavy", speedKmh: 22, roadName: "Wardha Road City Bottleneck" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0849, 21.1463], // City Center
          [79.0780, 21.1290], // Rahate Colony
          [79.0680, 21.1120], // Chhatrapati Square
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 45, roadName: "Wardha Road Flyover / Airport" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0680, 21.1120],
          [79.0620, 21.0850], // Airport
          [79.0550, 21.0500], // MIHAN
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 88, roadName: "NH 44 South towards Butibori / Hyderabad" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0550, 21.0500],
          [79.0300, 20.9800],
          [79.0050, 20.9200], // Butibori
        ],
      },
    },

    // 3. Hindu Hrudaysamrat Balasaheb Thackeray Maharashtra Samruddhi Mahamarg (Super Expressway)
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 120, roadName: "Samruddhi Mahamarg (120 km/h corridor)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [78.9650, 21.0400], // Shivmadka Interchange
          [78.8800, 20.9800],
          [78.7500, 20.9200],
          [78.5800, 20.8500], // Towards Wardha & Mumbai
        ],
      },
    },

    // 4. NH 53 West (Nagpur -> Amravati Road -> Wadi -> Kondhali -> Amravati)
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 35, roadName: "Amravati Road Ravi Nagar & Wadi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0625, 21.1481], // Dharampeth
          [79.0436, 21.1542], // Futala
          [79.0100, 21.1520], // Wadi
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 80, roadName: "NH 53 West to Amravati" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0100, 21.1520],
          [78.9200, 21.1500],
          [78.7500, 21.1450], // Kondhali
        ],
      },
    },

    // 5. NH 53 East (Nagpur -> Pardi Flyover -> Mauda -> Bhandara -> Raipur)
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 38, roadName: "Pardi Flyover Arterial" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0975, 21.1306], // VR Mall / Medical Sq
          [79.1350, 21.1450],
          [79.1700, 21.1500], // Pardi
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 82, roadName: "NH 53 East to Bhandara / Raipur" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.1700, 21.1500],
          [79.2800, 21.1700],
          [79.4200, 21.1850], // Mauda
          [79.6500, 21.1700], // Bhandara
        ],
      },
    },

    // 6. Nagpur Outer Ring Road (Orbital Bypass)
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 75, roadName: "Nagpur Outer Ring Road" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.1550, 21.2300], // Kamptee connector
          [79.1850, 21.1500], // Pardi bypass
          [79.1250, 21.0600], // Hudkeshwar bypass
          [79.0550, 21.0500], // Wardha Rd junction
          [78.9650, 21.0400], // Samruddhi junction
          [78.9800, 21.1200], // Hingna bypass
          [79.0050, 21.1600], // Amravati Rd junction
        ],
      },
    },

    // 7. West High Court Road & Ramdaspeth (Downtown Shopping & Cafe Corridor)
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 28, roadName: "West High Court Road" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0820, 21.1610], // Sadar
          [79.0747, 21.1507], // Ramdaspeth (22nd Bridge Coffee)
          [79.0625, 21.1481], // Dharampeth (Starbucks)
          [79.0620, 21.1350], // Shankar Nagar
          [79.0600, 21.1200], // Bajaj Nagar
        ],
      },
    },
  ],
};

/**
 * Takes any route geometry and splits it into realistic traffic segments matching Google Maps styling.
 * Maps open highway stretches to low (blue/green), junctions/flyovers to moderate (orange), and bottlenecks to heavy (red).
 */
export function synthesizeTrafficSegments(
  geometry: [number, number][],
  defaultTraffic: "low" | "moderate" | "heavy" = "low"
): RouteSegment[] {
  if (!geometry || geometry.length < 2) return [];

  const totalPoints = geometry.length;
  const segments: RouteSegment[] = [];

  // Segment size: roughly 4 to 8 points per chunk
  const chunkSize = Math.max(3, Math.floor(totalPoints / 6));

  for (let i = 0; i < totalPoints - 1; i += chunkSize) {
    const endIdx = Math.min(totalPoints - 1, i + chunkSize);
    const coords = geometry.slice(i, endIdx + 1);

    // Calculate segment distance
    let segDist = 0;
    for (let j = 0; j < coords.length - 1; j++) {
      segDist += getHaversineDistance(
        { lat: coords[j][1], lng: coords[j][0] },
        { lat: coords[j + 1][1], lng: coords[j + 1][0] }
      );
    }

    // Determine congestion:
    // First 15% (city departure): moderate
    // Middle 70% (highway flow): low, with occasional toll plaza moderate/heavy
    // Last 15% (destination approach): moderate/low
    const progress = i / totalPoints;
    let congestion: CongestionLevel = "low";
    let speed = 75;

    if (defaultTraffic === "heavy") {
      congestion = progress > 0.3 && progress < 0.7 ? "heavy" : "moderate";
      speed = congestion === "heavy" ? 22 : 38;
    } else if (defaultTraffic === "moderate") {
      congestion = progress > 0.4 && progress < 0.6 ? "moderate" : "low";
      speed = congestion === "moderate" ? 40 : 70;
    } else {
      // Natural traffic pattern:
      if (progress < 0.12) {
        congestion = "moderate"; // City start
        speed = 36;
      } else if (progress > 0.45 && progress < 0.52) {
        congestion = "moderate"; // Intermediate toll / junction
        speed = 42;
      } else if (progress > 0.90) {
        congestion = "moderate"; // Final approach
        speed = 32;
      } else {
        congestion = "low"; // Highway cruise
        speed = 85;
      }
    }

    const durationSeconds = Math.round((segDist / 1000 / speed) * 3600);

    segments.push({
      coordinates: coords,
      congestion,
      speedKmh: speed,
      distanceMeters: Math.round(segDist),
      durationSeconds,
      roadName: progress > 0.2 && progress < 0.8 ? "NH 44 / Highway Corridor" : "Connecting Arterial",
    });
  }

  return segments;
}

/**
 * Parses Mapbox Directions API `congestion` annotations and groups them into RouteSegment objects.
 */
export function parseMapboxTrafficAnnotations(
  geometry: [number, number][],
  congestionArray?: string[]
): RouteSegment[] {
  if (!geometry || geometry.length < 2) return [];

  if (!congestionArray || congestionArray.length === 0) {
    return synthesizeTrafficSegments(geometry, "low");
  }

  const segments: RouteSegment[] = [];
  let currentCongestion: CongestionLevel = (congestionArray[0] as CongestionLevel) || "low";
  let currentCoords: [number, number][] = [geometry[0]];

  for (let i = 0; i < congestionArray.length; i++) {
    const cong = (congestionArray[i] as CongestionLevel) || "low";
    const nextCoord = geometry[i + 1] || geometry[i];

    if (cong === currentCongestion) {
      currentCoords.push(nextCoord);
    } else {
      // Flush current segment
      if (currentCoords.length >= 2) {
        let segDist = 0;
        for (let k = 0; k < currentCoords.length - 1; k++) {
          segDist += getHaversineDistance(
            { lat: currentCoords[k][1], lng: currentCoords[k][0] },
            { lat: currentCoords[k + 1][1], lng: currentCoords[k + 1][0] }
          );
        }
        const speed = currentCongestion === "heavy" ? 22 : currentCongestion === "moderate" ? 42 : 82;
        const dur = Math.round((segDist / 1000 / speed) * 3600);
        segments.push({
          coordinates: currentCoords,
          congestion: currentCongestion,
          speedKmh: speed,
          distanceMeters: Math.round(segDist),
          durationSeconds: dur,
        });
      }

      currentCongestion = cong;
      currentCoords = [geometry[i], nextCoord];
    }
  }

  // Flush final segment
  if (currentCoords.length >= 2) {
    let segDist = 0;
    for (let k = 0; k < currentCoords.length - 1; k++) {
      segDist += getHaversineDistance(
        { lat: currentCoords[k][1], lng: currentCoords[k][0] },
        { lat: currentCoords[k + 1][1], lng: currentCoords[k + 1][0] }
      );
    }
    const speed = currentCongestion === "heavy" ? 22 : currentCongestion === "moderate" ? 42 : 82;
    const dur = Math.round((segDist / 1000 / speed) * 3600);
    segments.push({
      coordinates: currentCoords,
      congestion: currentCongestion,
      speedKmh: speed,
      distanceMeters: Math.round(segDist),
      durationSeconds: dur,
    });
  }

  return segments.length > 0 ? segments : synthesizeTrafficSegments(geometry);
}
