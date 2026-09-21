import { Coordinate } from "@/types/journey";

export interface UserLocationProfile {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  coordinate: Coordinate;
}

export const NAGPUR_DEFAULT: UserLocationProfile = {
  city: "Nagpur",
  region: "Maharashtra",
  country: "India",
  countryCode: "in",
  coordinate: { lat: 21.1463, lng: 79.0849 },
};

/**
 * Detects the user's real surrounding location using HTML5 GPS geolocation,
 * with fast IP geolocation fallback (which detects Nagpur, Maharashtra instantly).
 */
export async function detectUserLocation(): Promise<UserLocationProfile> {
  // 1. Try HTML5 Geolocation (browser GPS)
  if (typeof window !== "undefined" && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 60000,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // Reverse geocode to get city, country, and countryCode
      try {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const revRes = await fetch(revUrl, {
          headers: { "User-Agent": "WayveSurroundings/1.0" },
        });
        if (revRes.ok) {
          const revData = await revRes.json();
          const addr = revData.address || {};
          const city = addr.city || addr.town || addr.municipality || addr.suburb || "Your location";
          const region = addr.state || addr.county || "";
          const country = addr.country || "India";
          const countryCode = (addr.country_code || "in").toLowerCase();

          return {
            city,
            region,
            country,
            countryCode,
            coordinate: { lat, lng },
          };
        }
      } catch {
        // Continue with raw coordinates
      }

      return {
        city: "Current Location",
        region: "",
        country: "India",
        countryCode: "in",
        coordinate: { lat, lng },
      };
    } catch {
      // User declined or GPS timed out, proceed to default
    }
  }

  // 2. Reliable default to Nagpur (Zero Mile Center) for consistent local routing
  return NAGPUR_DEFAULT;
}

/**
 * Calculates Haversine distance in meters between two coordinates.
 */
export function getHaversineDistance(c1: Coordinate, c2: Coordinate): number {
  const R = 6371e3;
  const p1 = (c1.lat * Math.PI) / 180;
  const p2 = (c2.lat * Math.PI) / 180;
  const dp = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dl = ((c2.lng - c1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
