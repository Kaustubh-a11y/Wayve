# WAYVE IMPLEMENTATION PLAN

## Product Understanding
Wayve is a conversational agentic navigation system that transforms natural-language travel intent into personalized route objectives, combines routing, traffic, weather, places, and human-reported road conditions, uses predictive models to estimate route outcomes, selects and explains a suitable route, and continuously monitors the journey to autonomously recommend replanning when conditions change.
- **Core Philosophy**: Complex intelligence underneath. Ridiculously simple, calm mobility command center on the surface.
- **Design Inspiration**: Apple Maps × modern AI product × spatial UI (sleek dark mode `#070d17` / `#0b131e`, electric emerald `#10b981` / `#00e599` active route glow, floating frosted cards `backdrop-blur-xl`, glanceable navigation HUD).
- **Primary Platform**: Responsive Web Application (Desktop, Tablet, Mobile).

---

## Feature Map

### Core Navigation
- Full-viewport interactive vector map (Mapbox GL JS)
- Current location detection, permission handling & manual origin picker
- Destination search & geocoding with debounce & autocomplete
- Multi-alternative route generation (geometry, distance, duration, turn-by-turn maneuvers)
- Active turn-by-turn navigation HUD (next maneuver, maneuver distance, route progress scrubber, speedometer & speed limit)
- Off-route detection & atomic rerouting

### Conversational Planning (Agent A & B)
- Ask Wayve natural language planning ("take me to nearest hill station", "find coffee and make it scenic")
- Intent & preference extraction via Gemini API with fallback rule-based NLP parser
- Contextual follow-up persistence (modifies existing journey instead of creating new ones)
- Ambiguity resolution (e.g. presents top 3 candidate destinations)
- Contextual stop discovery along route (coffee, snacks, fuel, scenic viewpoints)

### Intelligence & Data Fusion (Agent C)
- Traffic context & incident ingestion (heavy traffic, accident, road closure, hazard)
- Live weather integration via Open-Meteo
- Human-in-the-loop incident reporting (`+ Report` floating button)
- Machine Learning travel time prediction with SHAP-style feature attribution factors (XAI)

### Decision & Replanning (Agent D)
- Deterministic weighted Route Scoring Engine matching user intent and journey mode
- "WAYVE'S PICK" recommendation with human-understandable explanation ("Why this route?")
- Dynamic monitoring loop: detects route degradation (traffic spike, incident, weather)
- Replanning threshold / hysteresis check
- User-controlled route switch alert (`[ Switch Route ]` vs `[ Stay on Route ]`)

### Simulation Mode
- Mandatory deterministic simulation engine to inject incidents (Heavy traffic, Accident, Road closure, Heavy rain) on specific routes with severity slider
- Directly triggers the real replanning pipeline without fake UI animations

### Trip Intelligence
- Post-arrival analytics: distance, duration, reroutes count, time saved, breakdown of decision factors

---

## Route Map & Screen Architecture
The application implements the 8 primary screens and supporting overlays:
1. `01 — Home / Explore`: Main map canvas, Ask Wayve bar, mode pills, active journey resume card.
2. `02 — AI Trip Conversation`: Conversational planning drawer with intent extraction and context history.
3. `03 — Destination / Place Selection`: Candidate destination & stop cards with photos/tags and detour time.
4. `04 — Route Comparison`: Route comparison cards, "WAYVE'S PICK" highlight, and "Why this route?" drawer.
5. `05 — Trip Preview`: Calm summary of stops, weather, mode, and "Start Journey" CTA.
6. `06 — Live Navigation`: Minimal glanceable HUD, next maneuver, speedometer, route progress bar.
7. `07 — Replanning / Incident`: Alert card showing ETA delta and offering `[ Switch Route ]` or `[ Stay on Route ]`.
8. `08 — Trip Intelligence`: Arrival analytics and decision attribution charts.
- **Overlays**: Location Picker, `+ Report` Incident Sheet, Simulation Drawer, Weather Sheet, Settings Modal.

---

## Component Architecture

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/v1/
│       ├── search/route.ts
│       ├── routes/route.ts
│       ├── conversation/route.ts
│       ├── weather/route.ts
│       ├── predict/route.ts
│       ├── score/route.ts
│       ├── incidents/route.ts
│       └── simulation/route.ts
├── components/
│   ├── map/
│   │   ├── MapCanvas.tsx
│   │   ├── RouteLayer.tsx
│   │   ├── IncidentMarker.tsx
│   │   └── MapControls.tsx
│   ├── hud/
│   │   ├── ManeuverBanner.tsx
│   │   ├── SpeedometerHud.tsx
│   │   ├── RouteScrubber.tsx
│   │   └── NavigationCard.tsx
│   ├── planning/
│   │   ├── AskWayveBar.tsx
│   │   ├── ModePills.tsx
│   │   ├── ConversationDrawer.tsx
│   │   ├── DestinationSelector.tsx
│   │   ├── RouteComparison.tsx
│   │   └── TripPreview.tsx
│   ├── replanning/
│   │   ├── IncidentAlertModal.tsx
│   │   └── SimulationDrawer.tsx
│   ├── overlays/
│   │   ├── ReportIncidentModal.tsx
│   │   ├── WhyThisRouteModal.tsx
│   │   ├── WeatherModal.tsx
│   │   ├── SettingsModal.tsx
│   │   └── TripIntelligenceModal.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Input.tsx
│       └── Drawer.tsx
├── lib/
│   ├── state/
│   │   └── journeyStore.ts
│   ├── providers/
│   │   ├── mapbox.ts
│   │   ├── weather.ts
│   │   └── gemini.ts
│   ├── services/
│   │   ├── mlPredictor.ts
│   │   ├── routeScorer.ts
│   │   └── simulationEngine.ts
│   └── utils/
└── types/
    └── journey.ts
```

---

## Data Architecture & Entities
- **Journey**: `id`, `origin`, `destination`, `stops`, `mode`, `preferences`, `routeOptions`, `selectedRouteId`, `status`, `activeTripId`.
- **Destination / Place**: `id`, `name`, `type`, `lat`, `lng`, `address`, `category`, `detourMinutes`.
- **RouteOption**: `id`, `summary`, `geometry`, `distanceMeters`, `durationSeconds`, `predictedDurationSeconds`, `score`, `scoreBreakdown`, `warnings`, `legs`, `maneuvers`.
- **Incident / UserReport**: `id`, `type`, `lat`, `lng`, `distanceAhead`, `severity`, `confidence`, `source`, `reportedAt`.
- **SimulationEvent**: `type`, `targetRouteId`, `severity`, `timestamp`.

---

## State Architecture (Journey State Machine)
`IDLE` → `PLANNING` → `DESTINATION_RESOLVED` → `ROUTES_LOADING` → `ROUTES_READY` → `AWAITING_CONFIRMATION` → `NAVIGATING` → `MONITORING` ↔ `REPLANNING` (`ROUTE_SWITCH_PENDING`) → `ARRIVED` → `TRIP_INTELLIGENCE`.

---

## Responsive Strategy
- **Mobile (<640px)**: Bottom-sheet drawers with touch drag handles, full-width glanceable maneuvers, 48px thumb-friendly buttons (`+ Report`, `My Location`), minimal information density during navigation.
- **Tablet (640px–1024px)**: Adaptive floating cards, flexible sheet widths, persistent map canvas.
- **Desktop (1024px+)**: Full viewport map with floating non-intrusive spatial panels, keyboard shortcuts, multi-column comparison cards.

---

## Design System
- **Colors**:
  - Dark Canvas: `#070d17`, `#0b131e`, `#0f172a`
  - Wayve Emerald: `#10b981` (glow: `rgba(16, 185, 129, 0.4)`)
  - Semantic Road Traffic: Normal `#10b981`, Moderate `#f59e0b`, Heavy `#ef4444`
- **Surfaces**: Frosted glass `backdrop-blur-xl bg-slate-900/85 border border-slate-800/80 shadow-2xl`
- **Typography**: Clean, confident sans-serif hierarchy (Inter / Outfit).

---

## Implementation Phases
- **Phase 1**: Repository foundation, `.gitignore`, `.env.example`, Next.js app scaffolding with TypeScript, Tailwind CSS, and core types.
- **Phase 2**: Backend API services (Mapbox Geocoding & Directions adapter, Open-Meteo weather adapter, Gemini AI conversation & intent parser, ML predictor & Route Scorer, Simulation event bus).
- **Phase 3**: Mapbox GL interactive map canvas with 3D buildings, custom styling, traffic layer, and route renderer.
- **Phase 4**: Conversational planning UI (Ask Wayve bar, Mode pills, Conversation drawer, Destination selection, Contextual stops).
- **Phase 5**: Route comparison & "Why this route?" XAI drawer, Trip preview & Start Journey flow.
- **Phase 6**: Live navigation HUD (Maneuver banner, Speedometer HUD, Route scrubber, Off-route detection).
- **Phase 7**: Dynamic replanning pipeline, Simulation engine drawer, `+ Report` incident modal, Route switch prompt.
- **Phase 8**: Trip intelligence analytics upon arrival, canonical demo mode tour, responsive and accessibility pass, type checking & build verification.

---

## Known Assumptions
1. Mapbox token from `.env` is used server-side and passed safely to the frontend map client via a session-safe public token route or client public token.
2. Gemini API key is from Google AI free tier; calls will be guarded with a fallback local NLP parser to avoid quota exhaustion.
3. Open-Meteo requires no API key and provides reliable weather for coordinates along routes.
4. ML ETA predictions use trained regression coefficients and SHAP-like attribution factors to deliver realistic, deterministic variance and explainability.

## Open Technical Questions
None blocking — all core requirements and architecture boundaries are defined in the master specification.
