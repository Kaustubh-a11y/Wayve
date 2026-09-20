import { CongestionLevel, RouteSegment } from "@/types/journey";
import { getHaversineDistance } from "./userLocation";

/**
 * Ambient traffic veins for Nagpur & Central India regional network (NH 44, NH 53, Samruddhi Mahamarg, Ring Road).
 * Rendered on the map canvas to mirror Google Maps live traffic overlay.
 */
export const NAGPUR_AMBIENT_TRAFFIC_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // 1. NH 44 North Corridor (Zero Mile -> Kamptee -> Kanhan -> Mansar -> Pench)
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 42, roadName: "NH 44 Kamptee Road (Automotive Sq)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0822, 21.1528], // Zero Mile
          [79.0880, 21.1680], // Kadbi Chowk
          [79.0950, 21.1850], // Automotive Square
          [79.1200, 21.2050], // Uppalwadi
          [79.1650, 21.2250], // Kamptee Cantonment
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 85, roadName: "NH 44 Kanhan-Mansar Express Stretch" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.1650, 21.2250],
          [79.2200, 21.2900], // Kanhan
          [79.2850, 21.3700], // Mansar Junction
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "heavy", speedKmh: 24, roadName: "NH 44 Mansar Toll Plaza Bottleneck" },
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
      properties: { congestion: "low", speedKmh: 92, roadName: "NH 44 Pench Forest Corridor (Deolapar)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.2950, 21.3900],
          [79.3100, 21.4800], // Paoni
          [79.3200, 21.5700], // Deolapar
          [79.3000, 21.6500], // Pench Tiger Reserve Gate
        ],
      },
    },

    // 2. NH 44 South Corridor (Zero Mile -> Dhantoli -> Chhatrapati Sq -> MIHAN -> Butibori -> Hyderabad)
    {
      type: "Feature",
      properties: { congestion: "heavy", speedKmh: 20, roadName: "Wardha Road City Bottleneck (Rahate-Chhatrapati)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0822, 21.1528], // Zero Mile
          [79.0849, 21.1463], // Variety Square
          [79.0780, 21.1290], // Rahate Colony
          [79.0680, 21.1120], // Chhatrapati Square
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 48, roadName: "Wardha Road Double-Decker Metro Flyover" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0680, 21.1120], // Chhatrapati Sq
          [79.0640, 21.0950], // Ujjwal Nagar
          [79.0620, 21.0850], // Sonegaon / Airport North
          [79.0550, 21.0500], // MIHAN SEZ
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 88, roadName: "NH 44 Expressway to Jamtha & Butibori" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0550, 21.0500],
          [79.0400, 21.0100], // VCA Stadium Jamtha
          [79.0300, 20.9800], // Dongargaon
          [79.0050, 20.9200], // Butibori Industrial Zone
        ],
      },
    },

    // 3. Hindu Hrudaysamrat Balasaheb Thackeray Samruddhi Mahamarg (120 km/h Super Expressway)
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 120, roadName: "Samruddhi Mahamarg Expressway" },
      geometry: {
        type: "LineString",
        coordinates: [
          [78.9650, 21.0400], // Shivmadka Interchange (Zero Point)
          [78.8800, 20.9800], // Seloo
          [78.7500, 20.9200], // Wardha Toll
          [78.5800, 20.8500], // Towards Pulgaon & Mumbai
        ],
      },
    },

    // 4. NH 53 West Corridor (Law College -> Ravi Nagar -> Wadi -> Kondhali -> Amravati)
    {
      type: "Feature",
      properties: { congestion: "heavy", speedKmh: 26, roadName: "Amravati Road Ravi Nagar to Wadi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0700, 21.1500], // Law College Sq
          [79.0550, 21.1520], // Ravi Nagar
          [79.0400, 21.1540], // University Campus
          [79.0100, 21.1520], // Wadi Octroi Naka
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 84, roadName: "NH 53 4-Lane Highway to Amravati" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0100, 21.1520],
          [78.9600, 21.1510], // Dattawadi
          [78.9200, 21.1500], // Bazargaon
          [78.7500, 21.1450], // Kondhali
        ],
      },
    },

    // 5. NH 53 East Corridor (Railway Station -> Central Ave -> Pardi Flyover -> Mauda -> Bhandara)
    {
      type: "Feature",
      properties: { congestion: "severe", speedKmh: 18, roadName: "Central Avenue (Dosar Bhavan to Itwari)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0880, 21.1520], // Railway Station
          [79.0980, 21.1510], // Dosar Bhavan
          [79.1100, 21.1500], // Agrasen Chowk
          [79.1250, 21.1490], // Itwari
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 36, roadName: "Pardi Multi-Tier Flyover" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.1250, 21.1490],
          [79.1450, 21.1480], // Lakadganj
          [79.1700, 21.1500], // Pardi Naka
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
          [79.2800, 21.1700], // Tarodi
          [79.4200, 21.1850], // Mauda Power Plant
          [79.6500, 21.1700], // Bhandara Bypass
        ],
      },
    },

    // 6. Complete Inner Ring Road Loop (Arterial Urban Distributor)
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 38, roadName: "Inner Ring Road (South-West: Pratap Nagar - Chhatrapati)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0450, 21.1250], // Trimurti Nagar
          [79.0550, 21.1200], // Pratap Nagar
          [79.0680, 21.1120], // Chhatrapati Square
          [79.0800, 21.1150], // Narendra Nagar
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "heavy", speedKmh: 24, roadName: "Inner Ring Road (South-East: Medical Sq - Sakkardara)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0800, 21.1150],
          [79.0980, 21.1220], // Medical College Square
          [79.1120, 21.1250], // Sakkardara Square
          [79.1300, 21.1300], // Dighori Naka
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 35, roadName: "Inner Ring Road (East: Dighori - Nandanvan - Pardi)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.1300, 21.1300],
          [79.1450, 21.1380], // Nandanvan
          [79.1600, 21.1450], // Hasanbagh
          [79.1700, 21.1500], // Pardi Junction
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 55, roadName: "Inner Ring Road (North-East: Kalamna - Uppalwadi)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.1700, 21.1500],
          [79.1650, 21.1750], // Kalamna Market
          [79.1450, 21.1950], // Kamptee Road Link
          [79.1200, 21.2050], // Uppalwadi
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 42, roadName: "Inner Ring Road (North-West: Mankapur - Friends Colony)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.1200, 21.2050],
          [79.0850, 21.1950], // Mankapur Stadium
          [79.0600, 21.1850], // Friends Colony
          [79.0450, 21.1650], // Katol Naka
          [79.0400, 21.1540], // University / Ravi Nagar
        ],
      },
    },

    // 7. Full 4-Lane Outer Ring Road Bypass (Orbital Freeway)
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 85, roadName: "Outer Ring Road (North Arc: Kanhan - Kalamna)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.2200, 21.2900], // Kanhan Junction
          [79.2100, 21.2400],
          [79.1850, 21.1900],
          [79.1850, 21.1500], // Pardi Bypass
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 90, roadName: "Outer Ring Road (South-East Arc: Tarodi - Hudkeshwar)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.1850, 21.1500],
          [79.1650, 21.1000], // Tarodi
          [79.1250, 21.0600], // Hudkeshwar Bypass
          [79.0550, 21.0500], // NH 44 Jamtha Interchange
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 95, roadName: "Outer Ring Road (South-West Arc: Samruddhi - Hingna)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0550, 21.0500],
          [78.9650, 21.0400], // Samruddhi Interchange
          [78.9800, 21.1200], // Hingna MIDC Bypass
          [79.0050, 21.1600], // Amravati Rd Gondkhairi
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 90, roadName: "Outer Ring Road (North-West Arc: Gondkhairi - Kalmeshwar)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0050, 21.1600],
          [78.9950, 21.2200], // Kalmeshwar Link
          [79.0500, 21.2600], // Fetri Bypass
          [79.1200, 21.2800], // Koradi North
          [79.2200, 21.2900], // Kanhan Junction
        ],
      },
    },

    // 8. Koradi Road & Power Corridor (Sadar -> Mankapur -> Koradi Thermal)
    {
      type: "Feature",
      properties: { congestion: "heavy", speedKmh: 25, roadName: "Koradi Road (Sadar to Mankapur)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0820, 21.1610], // Sadar
          [79.0850, 21.1750], // Pagalkhana Square
          [79.0850, 21.1950], // Mankapur Square
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 70, roadName: "Koradi 4-Lane Highway to Mahadula" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0850, 21.1950],
          [79.0920, 21.2200], // Panjara
          [79.0980, 21.2500], // Koradi Lake / Mandir
          [79.1020, 21.2750], // Mahadula
        ],
      },
    },

    // 9. Katol Road (GPO -> Raj Bhavan -> Katol Naka -> Gorewada)
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 36, roadName: "Katol Road City Section" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0780, 21.1550], // GPO Chowk
          [79.0680, 21.1620], // Raj Bhavan
          [79.0450, 21.1650], // Katol Naka
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 68, roadName: "Katol Road Gorewada & Fetri Green Line" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0450, 21.1650],
          [79.0300, 21.1850], // Gorewada Zoo Safari
          [79.0050, 21.2100], // Fetri
          [78.9600, 21.2400], // Kalmeshwar
        ],
      },
    },

    // 10. Hingna Road & Industrial Corridor (Lokmat Sq -> Subhash Nagar -> ICAR)
    {
      type: "Feature",
      properties: { congestion: "moderate", speedKmh: 32, roadName: "Hingna Road (Lokmat Sq to Subhash Nagar)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0800, 21.1400], // Lokmat Square
          [79.0650, 21.1320], // Shankar Nagar
          [79.0450, 21.1250], // Trimurti Nagar
          [79.0250, 21.1180], // Hingna Naka
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 65, roadName: "Hingna MIDC Electronic Zone to ICAR" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0250, 21.1180],
          [78.9950, 21.1100], // MIDC Hingna
          [78.9650, 21.0950], // Electronic Zone
          [78.9300, 21.0700], // ICAR / Digdoh
        ],
      },
    },

    // 11. Umred Road Radial (Medical Sq -> Sakkardara -> Dighori -> Umred)
    {
      type: "Feature",
      properties: { congestion: "heavy", speedKmh: 22, roadName: "Umred Road Sakkardara Choke Point" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0980, 21.1220], // Medical College
          [79.1120, 21.1250], // Sakkardara
          [79.1300, 21.1300], // Dighori Naka
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 75, roadName: "Umred Highway to Kuhi & Umred" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.1300, 21.1300],
          [79.1700, 21.1000],
          [79.2400, 21.0400],
          [79.3300, 20.9800], // Umred
        ],
      },
    },

    // 12. Ambazari, VNIT, & Seminary Hills Green Corridors
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 45, roadName: "South Ambazari Road (VNIT & Bajaj Nagar)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0550, 21.1200], // Mate Chowk / VNIT Gate
          [79.0600, 21.1280], // Bajaj Nagar
          [79.0625, 21.1380], // Shankar Nagar
          [79.0625, 21.1481], // Dharampeth (Starbucks)
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 50, roadName: "Futala Lake Promenade & Telangkhedi" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0436, 21.1542], // Futala Waterfront
          [79.0500, 21.1510], // Telangkhedi Temple
          [79.0625, 21.1481], // Dharampeth
        ],
      },
    },
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 48, roadName: "Seminary Hills & Palm Road (Civil Lines)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0650, 21.1650], // Seminary Hills / TV Tower
          [79.0720, 21.1600], // High Court
          [79.0780, 21.1550], // GPO Chowk
          [79.0822, 21.1528], // Zero Mile
        ],
      },
    },

    // 13. Manewada & Besa Radial (Tukdoji Putla -> Besa -> Pipla)
    {
      type: "Feature",
      properties: { congestion: "heavy", speedKmh: 21, roadName: "Manewada Road Commercial Corridor" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.0980, 21.1220], // Tukdoji Putla
          [79.0950, 21.1080], // Manewada Chowk
          [79.0920, 21.0900], // Besa Chowk
          [79.0900, 21.0750], // Pipla
        ],
      },
    },

    // 14. Ramtek & Mansar Feeder Link
    {
      type: "Feature",
      properties: { congestion: "low", speedKmh: 72, roadName: "Ramtek Scenic Highway (SH 249)" },
      geometry: {
        type: "LineString",
        coordinates: [
          [79.2850, 21.3700], // Mansar Junction
          [79.3100, 21.3850],
          [79.3320, 21.3980], // Ramtek Town
          [79.3400, 21.4050], // Ramtek Gadmandir
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
