# WAYVE BRAIN — MASTER REPOSITORY LOG & ARCHITECTURE RECORD

> **Commit Reference:** `1b94d85` (`feat: complete Wayve agentic navigation platform implementation`)  
> **Repository:** [Kaustubh-a11y/Wayve](https://github.com/Kaustubh-a11y/Wayve)  
> **Branch:** `main`  
> **Date:** September 2026  
> **Core Principle:** *"Complex intelligence underneath. Ridiculously simple experience."*

---

## 1. Executive Summary

This commit establishes the complete, production-ready foundation and primary vertical slice for **WAYVE**, an agentic, conversational, spatial navigation platform.

Wayve is engineered as a **map-first, spatial UI application**—not a generic SaaS dashboard with sidebars. The map is the continuous visual reality, with glanceable, high-contrast, frosted-glass HUD cards sitting contextually on top. Underneath the serene interface runs a deterministic mathematical scoring engine, explainable AI (XAI) travel time predictions, Gemini-powered conversational intent parsing, and a simulation-capable dynamic replanning pipeline.

---

## 2. Complete File Inventory & Directory Structure

```
c:\Users\Kaustubh\Wayve\
├── .env.example                               # Environment template (Mapbox, Gemini keys)
├── .gitignore                                 # Protects .env, node_modules, .next, .npm-cache
├── next.config.mjs                            # Next.js 14 config with strict mode
├── package.json                               # Dependencies & scripts (build, dev, test, typecheck)
├── postcss.config.mjs                         # PostCSS Tailwind integration
├── tailwind.config.ts                         # Custom spatial theme tokens & animations
├── tsconfig.json                              # TypeScript strict configuration with path aliases (@/*)
├── brain.md                                   # This master architecture and commit log
├── WAYVE_IMPLEMENTATION_PLAN.md               # Original phased implementation plan
│
├── tests/
│   └── test-runner.ts                         # Independent unit test suite for core decision logic
│
├── src/
│   ├── types/
│   │   └── journey.ts                         # Strongly-typed domain models & state definitions
│   │
│   ├── lib/
│   │   ├── state/
│   │   │   └── journeyStore.ts                # Global reactive state hook for UI & journey machine
│   │   │
│   │   ├── services/
│   │   │   ├── deterministicData.ts           # Fallback routes, destinations, maneuvers & stops
│   │   │   ├── mlPredictor.ts                 # Travel time prediction & XAI feature attributions
│   │   │   ├── routeScorer.ts                 # Mathematical scoring engine & explanation generator
│   │   │   └── simulationEngine.ts            # Incident processing & hysteresis replanning pipeline
│   │   │
│   │   └── providers/
│   │       ├── gemini.ts                      # Conversational NLP parser with rule-based fallback
│   │       ├── mapbox.ts                      # Mapbox Directions & Geocoding client
│   │       └── weather.ts                     # Open-Meteo corridor weather provider
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Badge.tsx                      # Glowing contextual status badge
│   │   │   ├── Button.tsx                     # Spatial glassmorphic button with micro-animations
│   │   │   └── Modal.tsx                      # Accessible dialog primitive
│   │   │
│   │   ├── map/
│   │   │   └── MapCanvas.tsx                  # Mapbox GL JS 3D canvas with vector SVG fallback
│   │   │
│   │   ├── hud/
│   │   │   ├── WayveHeader.tsx                # Top navigation bar with Demo Tour CTA & controls
│   │   │   ├── ManeuverBanner.tsx             # Turn-by-turn instruction HUD (Screen 06)
│   │   │   ├── SpeedometerHud.tsx             # Live speed gauge, speed limit & traffic status
│   │   │   └── RouteScrubber.tsx              # Interactive route progress bar & step controller
│   │   │
│   │   ├── planning/
│   │   │   ├── AskWayveBar.tsx                # Natural language search input & mode selector pills
│   │   │   ├── ConversationDrawer.tsx         # Multi-turn conversational chat drawer (Screen 02)
│   │   │   ├── DestinationSelector.tsx        # Multi-destination candidate resolver (Screen 03)
│   │   │   └── RouteComparison.tsx            # Route alternative cards & "WAYVE'S PICK" (Screen 04)
│   │   │
│   │   ├── replanning/
│   │   │   ├── SimulationDrawer.tsx           # Incident scenario injector (traffic, crash, rain)
│   │   │   └── IncidentAlertModal.tsx         # Dynamic replanning alert with delay & switch CTA (Screen 07)
│   │   │
│   │   └── overlays/
│   │       ├── WhyThisRouteModal.tsx          # Explainable AI (XAI) attribution factor modal
│   │       ├── ReportIncidentModal.tsx        # Typed crowd-sourced incident reporting modal
│   │       ├── TripIntelligenceModal.tsx      # Arrival analytics modal with confetti (Screen 08)
│   │       ├── WeatherModal.tsx               # Corridor weather forecast modal
│   │       └── SettingsModal.tsx              # User preferences & API key management modal
│   │
│   └── app/
│       ├── globals.css                        # Design tokens, custom scrollbars & glass styling
│       ├── layout.tsx                         # Viewport, meta tags, and root theme wrapper
│       ├── page.tsx                           # Master spatial application orchestration shell
│       └── api/v1/
│           ├── config/route.ts                # Client tokens & runtime config
│           ├── conversation/route.ts          # Natural language intent extraction endpoint
│           ├── routes/route.ts                # Route generation & scoring endpoint
│           ├── search/route.ts                # Geocoding & place search endpoint
│           └── weather/route.ts               # Weather forecast endpoint
```

---

## 3. Core Subsystems Implemented

### 3.1. Journey State Machine (`src/types/journey.ts`, `src/lib/state/journeyStore.ts`)
The application is governed by an explicit finite state machine:
```
IDLE
  ↓ (Ask Wayve / Search query)
PLANNING
  ↓ (Destination extracted)
DESTINATION_RESOLVED
  ↓ (Candidate selected)
ROUTES_LOADING
  ↓ (Routes computed & scored)
ROUTES_READY / AWAITING_CONFIRMATION
  ↓ (Start Journey CTA)
NAVIGATING
  ↓ (Corridor monitor)
MONITORING
  ↕ (Incident injected / delay detected)
REPLANNING
  ↓ (Alternative exceeds hysteresis threshold)
ROUTE_SWITCH_PENDING
  ↓ (User switches route or arrives at destination)
ARRIVED
  ↓ (Post-trip celebration)
TRIP_INTELLIGENCE
```
- Invalid transitions are guarded.
- All UI components derive visibility and layout directly from `journeyState`.

---

### 3.2. Conversational Intent Parser (`src/lib/providers/gemini.ts`, `/api/v1/conversation`)
- Integrates with the **Gemini 1.5 Flash API** using structured JSON output prompts.
- **Offline Rule-Based NLP Fallback**: Guaranteed zero-failure operation even when offline or during API rate limits. Handles:
  - Destination resolution (*"Take me to the nearest hill station"* → `Lonavala`).
  - Contextual modifiers (*"Find snacks on the way and make it scenic"* → keeps Lonavala, appends snacks stop, sets mode to `scenic`).
  - Preference adjustments (*"avoid tolls"*, *"prefer highways"*).

---

### 3.3. Deterministic Route Scoring Engine (`src/lib/services/routeScorer.ts`)
Wayve rejects arbitrary AI "hallucinated" route picks. The route recommendation is calculated via a deterministic multi-factor formula:
$$\text{Score} = \sum_{i=1}^{n} w_i \times f_i$$
Where weights $w_i$ adapt based on the selected driving mode:
- **Fast Mode**: Prioritizes time ($w = 0.50$) and highway usage ($w = 0.20$).
- **Scenic Mode**: Prioritizes scenic factor ($w = 0.45$) and low congestion ($w = 0.30$).
- **Relaxed Mode**: Minimizes congestion ($w = 0.35$) and maximizes road quality ($w = 0.25$).
- **Economy Mode**: Minimizes tolls and fuel consumption ($w = 0.40$).

The highest-scoring option is marked as **"WAYVE'S PICK"** and receives a human-readable justification synthesized by `generateRecommendationExplanation()`.

---

### 3.4. Explainable AI (XAI) & ML Predictor (`src/lib/services/mlPredictor.ts`, `WhyThisRouteModal.tsx`)
- Estimates real-world travel times accounting for nonlinear congestion curves, precipitation drag, and highway limits.
- Generates **SHAP-like Feature Attributions**:
  - High arterial congestion: $+20.2 \text{ min}$
  - Monsoon rain / wet surface: $+10.8 \text{ min}$
  - Expressway speed limit: $-5.0 \text{ min}$
- Surfaced directly to the user inside the **"Why this route?"** modal.

---

### 3.5. Simulation Engine & Dynamic Replanning Pipeline (`src/lib/services/simulationEngine.ts`)
- **First-Class Subsystem**: Not a UI animation gimmick. Simulated incidents flow through the real event processing and scoring pipeline.
- Supports 4 incident types:
  1. `heavy_traffic` (Severe standstill congestion)
  2. `accident` (Multi-vehicle collision blocking lanes)
  3. `weather` (Heavy monsoon downpour / low visibility)
  4. `road_closure` (Landslide / construction blockade)
- **Hysteresis Threshold Gate**: An alternative route is recommended **only if** $\Delta t \ge 3 \text{ minutes}$. This prevents erratic route switching for trivial gains.
- Computes time saved and provides a one-tap **"Switch to Alternate Route"** decision modal.

---

### 3.6. Glanceable Spatial UI (`src/components/`, `src/app/globals.css`)
- **Dark Spatial Canvas**: `#070d17` background, `#0b131e` panel surfaces, `#10b981` emerald brand accents, and 8px border-radius frosted glass panels (`backdrop-blur-md`).
- **Map-First Visual Hierarchy**: The map occupies 100% of the viewport. UI elements float unobtrusively:
  - Top header with instant Demo Tour trigger.
  - Floating Ask Wayve search bar with driving mode selector.
  - Turn-by-turn maneuver banner at top center.
  - Real-time speedometer and speed limit indicator at bottom left.
  - Route scrubber and progress controls at bottom center/right.
- **Arrival Celebration**: Triggers `canvas-confetti` and renders the **Trip Intelligence** summary (distance, net time saved, reroute history, fuel consumption, and decision timeline).

---

## 4. Verification & Testing Matrix

| Layer | Command | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Type Integrity** | `tsc --noEmit` | **PASS** | Clean compilation with zero TypeScript errors. |
| **Logic Unit Tests** | `npm test` (`tests/test-runner.ts`) | **PASS** | 4/4 test suites passed: Intent Parsing, ML Predictor, Scoring Engine, Replanning Hysteresis. |
| **Production Build** | `npm run build` | **PASS** | Next.js 14 build completed in 3.3s with zero warnings. |
| **Dev Server** | `npm run dev` | **PASS** | Running at `http://localhost:3000` with hot reload enabled. |
| **Browser E2E Tour** | Chrome subagent session | **PASS** | Verified full flow: Search → Route Pick → HUD → Incident Injection → Reroute → Arrival Confetti. |

---

## 5. Canonical Demo Tour Walkthrough

To showcase Wayve's capabilities in under 60 seconds:
1. Open `http://localhost:3000`.
2. Click **"✨ Demo Tour"** in the top header.
3. Observe automatic query resolution: *"Take me to Lonavala"* → Destination resolved.
4. Observe Route Comparison: **"Old Highway & Scenic Ghat Pass"** chosen as **WAYVE'S PICK** ($89/100$).
5. Click **"Why this route?"** to inspect feature attribution factors.
6. Click **"Start Journey"** to enter the high-contrast Live Navigation HUD.
7. Click the **Beaker** icon (Simulation Engine) and select **"Simulate Heavy Congestion"**.
8. Observe the **Replanning Alert Modal** ($+18 \text{ min delay}$, alternative route saves $10 \text{ min}$).
9. Click **"Switch to Alternate Route"**.
10. Click **"Arrive"** on the route scrubber to see the confetti explosion and **Trip Intelligence** analytics.

---

## 6. Security & Hygiene Checklist

- [x] `.env` is omitted from Git via `.gitignore`.
- [x] `.env.example` provides non-sensitive configuration keys.
- [x] All client tokens safely delivered via `/api/v1/config`.
- [x] Mapbox and Gemini services feature deterministic fallbacks to guarantee uptime.
- [x] Clean Git history committed to `main` and pushed to remote origin `https://github.com/Kaustubh-a11y/Wayve.git`.
