import { Coordinate } from "@/types/journey";

/**
 * Calculates initial geodesic bearing in degrees (0 to 360) from start to end coordinate.
 * 0° = North, 90° = East, 180° = South, 270° = West.
 */
export function calculateBearing(start: Coordinate, end: Coordinate): number {
  const startLat = (start.lat * Math.PI) / 180;
  const startLng = (start.lng * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const endLng = (end.lng * Math.PI) / 180;

  const dLng = endLng - startLng;
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Calculates the bearing between coordinate pairs in [lng, lat] GeoJSON format.
 */
export function calculateGeoJsonBearing(start: [number, number], end: [number, number]): number {
  return calculateBearing({ lat: start[1], lng: start[0] }, { lat: end[1], lng: end[0] });
}

/**
 * Computes heading from route geometry at a given maneuver index.
 */
export function getRouteSegmentBearing(
  geometry: [number, number][],
  index: number = 0
): number {
  if (!geometry || geometry.length < 2) return 0;
  const safeIndex = Math.min(Math.max(0, index), geometry.length - 2);
  const p1 = geometry[safeIndex];
  const p2 = geometry[safeIndex + 1];
  return calculateGeoJsonBearing(p1, p2);
}
