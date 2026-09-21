import { Coordinate, Stop } from "@/types/journey";

export interface PandalLocation {
  id: string;
  name: string;
  theme: string;
  locality: string;
  ground: string;
  address: string;
  coordinate: Coordinate;
}

export const NAGPUR_GANPATI_PANDALS: PandalLocation[] = [
  {
    id: "pandal-tumbbad",
    name: "Tumbbad Theme Pandal",
    theme: "Tumbbad Mythological Mystery",
    locality: "Bajaj Nagar",
    ground: "MBYS Ground",
    address: "MBYS Ground, Bajaj Nagar, Nagpur, Maharashtra 440010",
    coordinate: { lat: 21.1278, lng: 79.0632 },
  },
  {
    id: "pandal-kantara",
    name: "Kantara Theme Pandal",
    theme: "Kantara Divine Forest Folklore",
    locality: "Bajaj Nagar",
    ground: "Near Bajaj Nagar Square",
    address: "Bajaj Nagar Ground, Nagpur, Maharashtra 440010",
    coordinate: { lat: 21.1292, lng: 79.0648 },
  },
  {
    id: "pandal-elemental-galaxy",
    name: "Elemental Galaxy Pandal (Manacha Raja)",
    theme: "Elemental Cosmic Galaxy",
    locality: "Trimurti Nagar",
    ground: "Hanuman Mandir Ground, Trimurti Nagar Square",
    address: "Hanuman Mandir Ground, Trimurti Nagar Square, Nagpur 440022",
    coordinate: { lat: 21.1165, lng: 79.0492 },
  },
  {
    id: "pandal-disneyland",
    name: "Disneyland Theme Pandal",
    theme: "Disneyland Magical Castle",
    locality: "Vivekanand Nagar",
    ground: "Vivekanand Nagar Ground",
    address: "Vivekanand Nagar, Wardha Road Link, Nagpur, Maharashtra 440015",
    coordinate: { lat: 21.1220, lng: 79.0725 },
  },
  {
    id: "pandal-harry-potter",
    name: "Harry Potter Theme (Hogwarts Pandal)",
    theme: "Hogwarts School of Witchcraft",
    locality: "Wardha Road",
    ground: "Ramkrishna Nagar Ground, behind Sai Mandir",
    address: "Ramkrishna Nagar Ground, Behind Sai Mandir, Wardha Road, Nagpur 440015",
    coordinate: { lat: 21.1152, lng: 79.0760 },
  },
  {
    id: "pandal-ancient-india",
    name: "Ancient India Science & Tech Pandal",
    theme: "Vedic Astronomy & Ancient Science",
    locality: "Bhende Layout",
    ground: "Bhende Layout Open Ground",
    address: "Bhende Layout, Near Swawlambi Nagar, Nagpur 440025",
    coordinate: { lat: 21.1120, lng: 79.0680 },
  },
  {
    id: "pandal-wonders-dreams",
    name: "Wonders of Dreams Pandal",
    theme: "Surreal Fantasy Worlds",
    locality: "Pratap Nagar",
    ground: "Pratap Nagar Sports Ground",
    address: "Pratap Nagar Main Road, Nagpur, Maharashtra 440022",
    coordinate: { lat: 21.1210, lng: 79.0550 },
  },
  {
    id: "pandal-dakshinamurti",
    name: "Dakshinamurti Mandal (Alandi Temple Replica)",
    theme: "Alandi Indrayani Temple Replica",
    locality: "Mahal",
    ground: "Dakshinamurti Chowk",
    address: "Dakshinamurti Chowk, Mahal Old City, Nagpur 440032",
    coordinate: { lat: 21.1445, lng: 79.1120 },
  },
  {
    id: "pandal-pataleshwar",
    name: "Pataleshwar Mandal (Golden Chariot Replica)",
    theme: "Royal Golden Chariot of Sun God",
    locality: "Mahal",
    ground: "Pataleshwar Mandir Area",
    address: "Near Pataleshwar Temple, Mahal, Nagpur 440032",
    coordinate: { lat: 21.1425, lng: 79.1105 },
  },
  {
    id: "pandal-jaripatka-dwarka",
    name: "Jaripatka Cha Raja (Underwater Dwarka Theme)",
    theme: "Submerged Golden City of Dwarka",
    locality: "Jaripatka",
    ground: "Mangalwari Market Road",
    address: "Mangalwari Market Road, Jaripatka, North Nagpur 440014",
    coordinate: { lat: 21.1820, lng: 79.0880 },
  },
  {
    id: "pandal-friends-group",
    name: "Friends Group Cha Raja (Vaikunth Dham Theme)",
    theme: "Vaikunth Celestial Abode",
    locality: "Jaripatka",
    ground: "Sindhu Nagar Society Chowk",
    address: "Sindhu Nagar Society Chowk, Jaripatka, Nagpur 440014",
    coordinate: { lat: 21.1850, lng: 79.0910 },
  },
  {
    id: "pandal-vaikunth-dharampeth",
    name: "Vaikunth Dham Pandal - Dharampeth",
    theme: "Vaikunth Dham Spiritual Sanctum",
    locality: "Dharampeth",
    ground: "Near Zenda Chowk",
    address: "Near Zenda Chowk, Dharampeth, West Nagpur 440010",
    coordinate: { lat: 21.1460, lng: 79.0640 },
  },
  {
    id: "pandal-govardhan-leela",
    name: "Govardhan Leela Pandal",
    theme: "Lord Krishna's Govardhan Parvat Leela",
    locality: "Tatya Tope Nagar",
    ground: "Tatya Tope Nagar Ground",
    address: "Tatya Tope Nagar, West High Court Link, Nagpur 440015",
    coordinate: { lat: 21.1285, lng: 79.0520 },
  },
  {
    id: "pandal-paris-theme",
    name: "Paris Theme Pandal",
    theme: "Eiffel Tower & Parisian Streets",
    locality: "Sindhi Colony",
    ground: "Sindhi Colony / Khamla Ground",
    address: "Sindhi Colony, Khamla Road, Nagpur 440025",
    coordinate: { lat: 21.1180, lng: 79.0660 },
  },
  {
    id: "pandal-kal-nagari",
    name: "Kal Nagari / Krishna Kunj",
    theme: "Eternal Krishna Kunj Vrindavan",
    locality: "Bidipeth",
    ground: "Bidipeth Community Ground",
    address: "Bidipeth / Reshimbagh Corridor, South-East Nagpur 440024",
    coordinate: { lat: 21.1260, lng: 79.1150 },
  },
];

/**
 * Intelligent parser that extracts pandal locations from free-form user query strings,
 * including raw bracketed strings, comma-separated lists, or concatenated names.
 */
export function extractPandalsFromQuery(text: string): PandalLocation[] {
  const lower = text.toLowerCase();
  const matched: PandalLocation[] = [];

  for (const p of NAGPUR_GANPATI_PANDALS) {
    const nameWords = p.name.toLowerCase().split(/[\s–\-()]+/);
    const themeWords = p.theme.toLowerCase().split(/[\s–\-()]+/);
    const locLower = p.locality.toLowerCase();

    // Check key distinct keywords
    const matchesLocality = lower.includes(locLower);
    const matchesKeyTheme =
      (p.id.includes("tumbbad") && lower.includes("tumbbad")) ||
      (p.id.includes("kantara") && lower.includes("kantara")) ||
      (p.id.includes("elemental") && (lower.includes("elemental") || lower.includes("manacha raja"))) ||
      (p.id.includes("disneyland") && lower.includes("disneyland")) ||
      (p.id.includes("harry-potter") && (lower.includes("harry potter") || lower.includes("hogwarts"))) ||
      (p.id.includes("ancient-india") && (lower.includes("ancient india") || lower.includes("science"))) ||
      (p.id.includes("wonders-dreams") && (lower.includes("wonders of dreams") || lower.includes("pratap nagar"))) ||
      (p.id.includes("dakshinamurti") && (lower.includes("dakshinamurti") || lower.includes("alandi"))) ||
      (p.id.includes("pataleshwar") && (lower.includes("pataleshwar") || lower.includes("golden chariot"))) ||
      (p.id.includes("jaripatka-dwarka") && (lower.includes("dwarka") || (lower.includes("jaripatka") && lower.includes("mangalwari")))) ||
      (p.id.includes("friends-group") && (lower.includes("friends group") || lower.includes("sindhu nagar"))) ||
      (p.id.includes("vaikunth-dharampeth") && (lower.includes("dharampeth") || lower.includes("zenda chowk"))) ||
      (p.id.includes("govardhan-leela") && (lower.includes("govardhan") || lower.includes("tatya tope"))) ||
      (p.id.includes("paris-theme") && (lower.includes("paris") || lower.includes("sindhi colony"))) ||
      (p.id.includes("kal-nagari") && (lower.includes("kal nagari") || lower.includes("krishna kunj") || lower.includes("bidipeth")));

    if (matchesKeyTheme) {
      matched.push(p);
    }
  }

  // If the user pasted the entire prompt or generic "all pandals" / "city tour" request, return all 15
  if (
    matched.length >= 6 ||
    lower.includes("all ganpati") ||
    lower.includes("all pandals") ||
    lower.includes("tumbbad") ||
    (lower.includes("pandal") && lower.includes("city tour"))
  ) {
    return NAGPUR_GANPATI_PANDALS;
  }

  return matched.length > 0 ? matched : NAGPUR_GANPATI_PANDALS;
}

/**
 * Calculates Euclidean/Haversine distance between two points
 */
function getApproxDistanceKm(p1: Coordinate, p2: Coordinate): number {
  const dLat = (p2.lat - p1.lat) * 111;
  const dLng = (p2.lng - p1.lng) * 103;
  return Math.hypot(dLat, dLng);
}

/**
 * Nearest-Neighbor TSP Tour Optimizer:
 * Sorts locations starting from user's current location to form a smooth, non-zigzagging loop.
 */
export function optimizeTourOrder(
  startCoordinate: Coordinate,
  locations: PandalLocation[]
): PandalLocation[] {
  if (locations.length <= 2) return [...locations];

  const unvisited = [...locations];
  const ordered: PandalLocation[] = [];
  let currentPos = startCoordinate;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = getApproxDistanceKm(currentPos, unvisited[i].coordinate);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    ordered.push(nextStop);
    currentPos = nextStop.coordinate;
  }

  return ordered;
}

/**
 * Converts PandalLocation objects into Wayve Stop models for the journey store and map markers
 */
export function convertPandalsToStops(pandals: PandalLocation[]): Stop[] {
  return pandals.map((p, idx) => ({
    id: `stop-pandal-${p.id}-${idx}`,
    name: `${idx + 1}. ${p.name}`,
    type: "pandal" as const,
    coordinate: p.coordinate,
    address: `${p.ground}, ${p.locality}, Nagpur`,
    detourMinutes: 12,
    rating: 4.9,
    added: true,
  }));
}
