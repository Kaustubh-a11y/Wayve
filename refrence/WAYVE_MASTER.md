Absolutely. We should turn the frozen Wayve definition into a **single implementation-ready requirements package for Antigravity**—not just another product description.

The uploaded spec gives us the north star and explicitly says the next step is to freeze **modules, agents, tools, APIs, ML, database, state flow, feature specs, IA, wireframes, design system, technical architecture, and implementation plan** before coding. 

I’d structure the Antigravity handoff as a **WAYVE MASTER BUILD SPEC** with these sections:

---

# WAYVE — MASTER BUILD REQUIREMENTS

## 0. Product North Star

**Wayve is a conversational agentic navigation system that transforms natural-language travel intent into personalized route objectives, combines routing, traffic, weather, places and human-reported road conditions, uses predictive models to estimate route outcomes, selects and explains a suitable route, and continuously monitors the journey to autonomously recommend replanning when conditions change.** 

### Product principle

> **Complex intelligence underneath. Ridiculously simple experience.**

Wayve is **not**:

* A Mapbox clone
* A chatbot attached to a map
* A generic AI dashboard
* An LLM that arbitrarily decides routes
* A collection of fake agents

Wayve **is**:

* A navigation product
* With conversational interaction
* Powered by an agentic decision layer
* Using deterministic routing/optimization + ML
* With real-time context
* With human-in-the-loop intelligence
* With continuous replanning

---

# 1. PRODUCT REQUIREMENTS

## 1.1 Core capabilities

Wayve must support:

### Navigation

* Current location
* Destination search
* Geocoding
* Route generation
* Multiple route alternatives
* Turn-by-turn navigation UI
* ETA
* Distance
* Current route
* Route switching

### Conversational planning

* Natural-language destination requests
* Natural-language preferences
* Follow-up instructions
* Context retention throughout a journey
* Destination resolution
* Stop requests
* Journey-mode selection
* Conversational modifications

Example:

> "Take me to Lonavala."

followed by:

> "Find coffee on the way."

must modify the existing journey rather than create an unrelated request.

This contextual interaction is a core part of Wayve's intended agentic behavior. 

---

# 2. JOURNEY INTENT MODEL

Every conversation should ultimately resolve into structured state.

Example:

```json
{
  "origin": {},
  "destination": {},
  "destination_type": null,
  "stops": [],
  "journey_mode": "custom",
  "preferences": {
    "fastest": 0.5,
    "scenic": 0.5,
    "traffic": 0.5,
    "fuel": 0.5,
    "tolls": 0.5,
    "weather": 0.5
  },
  "constraints": {
    "avoid_highways": false,
    "avoid_tolls": false,
    "max_detour_minutes": null
  },
  "weather_preference": null,
  "urgency": "normal"
}
```

The LLM's job is to convert language into this structured objective.

It should **not** independently calculate route scores.

---

# 3. JOURNEY MODES

Wayve requires four predefined modes:

### ⚡ Fast

Prioritize:

* ETA
* Traffic
* Distance

Deprioritize:

* Scenic value
* Stops

### 🌿 Scenic

Prioritize:

* Scenic roads
* Experience
* Reasonable traffic

Allow:

* Longer ETA

### ☕ Leisure

Prioritize:

* Scenic
* Low stress
* Stops
* Comfortable journey

### 💰 Economy

Prioritize:

* Fuel
* Toll cost
* Efficient distance

And:

### 🎯 Custom

Natural language determines the weights.

The existing definition explicitly requires journey modes to alter actual route optimization, not merely change UI styling. 

---

# 4. AGENT ARCHITECTURE

We should freeze **four meaningful agents**, rather than creating unnecessary micro-agents.

## Agent A — Conversation Agent

Responsibilities:

* Parse natural language
* Extract intent
* Extract preferences
* Maintain conversation context
* Resolve ambiguous requests
* Produce structured journey objectives
* Request clarification when necessary

Input:

```text
"I want a chill scenic drive and don't mind
taking 10 minutes longer."
```

Output:

```json
{
  "journey_mode": "leisure",
  "preferences": {
    "scenic": 0.85,
    "fastest": 0.3,
    "traffic": 0.8
  },
  "urgency": "low"
}
```

---

## Agent B — Journey Planning Agent

Responsibilities:

* Decide which tools are needed
* Resolve destinations
* Find POIs/stops
* Request routes
* Request weather
* Gather traffic/context
* Construct candidate journeys
* Coordinate downstream systems

This is the primary **tool-orchestration agent**.

---

## Agent C — Traffic & Context Intelligence Agent

Inputs:

```text
Traffic
Weather
Road data
Incidents
User reports
Historical information
```

Outputs:

```json
{
  "segment": "...",
  "congestion_level": "high",
  "risk": 0.82,
  "confidence": 0.87,
  "factors": []
}
```

The system should be able to fuse an API signal with a fresh user report rather than blindly trusting a single provider. 

---

## Agent D — Route Decision / Replanning Agent

Responsibilities:

* Evaluate candidate routes
* Apply user objectives
* Compare predicted outcomes
* Detect route degradation
* Trigger replanning
* Generate recommendation
* Provide explanation

---

# 5. CRITICAL AI ARCHITECTURE RULE

This needs to be an explicit **NON-NEGOTIABLE REQUIREMENT** for Antigravity.

### ❌ Wrong

```text
User
 ↓
LLM
 ↓
"Route B seems better"
```

### ✅ Required

```text
Natural Language
      ↓
LLM
      ↓
Structured Intent
      ↓
Tool Calls
      ↓
Real Data
      ↓
ML Prediction
      ↓
Optimization
      ↓
Route Score
      ↓
Decision
      ↓
LLM Explanation
```

The original architecture specifically separates language/planning from numerical decision-making. 

This makes the system much easier to test and defend academically.

---

# 6. EXTERNAL SERVICES

## Mapping / Navigation

Primary:

* Mapbox
* Mapbox Maps
* Mapbox Directions
* Mapbox Geocoding
* Mapbox Search/Places where applicable
* Map matching where applicable
* Traffic data where available

## Geographic data

* OpenStreetMap

## Weather

* Open-Meteo

The current system definition explicitly identifies Mapbox, OSM and Open-Meteo as the external infrastructure layer. 

### Architectural rule

**Never expose API keys to the frontend.**

Frontend → Wayve backend → external API.

---

# 7. DATA LAYER

Recommended:

```text
PostgreSQL
     +
PostGIS
```

Core entities:

### User

```text
id
preferences
created_at
```

### Journey

```text
id
user_id
origin
destination
status
journey_mode
started_at
completed_at
```

### JourneyPreferences

```text
journey_id
fastest_weight
traffic_weight
scenic_weight
fuel_weight
toll_weight
weather_weight
stop_weight
```

### Route

```text
id
journey_id
provider
geometry
distance
base_eta
predicted_eta
score
```

### Incident

```text
id
type
location
severity
confidence
source
reported_at
expires_at
```

### RouteDecision

```text
journey_id
selected_route
reason
score_breakdown
confidence
created_at
```

### UserReport

```text
id
user_id
type
location
severity
confidence
reported_at
```

---

# 8. USER REPORT SYSTEM

A persistent:

**`+ Report`**

action.

Supported reports:

```text
🚦 Heavy traffic
🚗 Accident
🚧 Construction
⛔ Road blocked
🌊 Flooding
⚠️ Hazard
📍 Other
```

Then:

```text
How far ahead?

< 500 m
< 1 km
< 2 km
> 2 km
```

Backend creates an incident.

Multiple nearby reports should increase confidence.

This becomes the project's:

> **Human-in-the-loop traffic intelligence layer.** 

---

# 9. SIMULATION ENGINE

This is **mandatory**, not optional.

We cannot depend on real traffic incidents for the demo.

UI:

```text
SIMULATION

Inject event

○ Heavy traffic
○ Accident
○ Road closure
○ Construction
○ Heavy rain
○ Event congestion

Affected route
[ Route A ]

Severity
[────────●──]

[ Apply ]
```

The simulation engine must be capable of modifying route conditions and triggering the same replanning pipeline used by real events.

Therefore:

```text
Simulation Event
      ↓
Event Bus
      ↓
Context Intelligence
      ↓
Route Cost Update
      ↓
Re-evaluation
      ↓
Alternative Routes
      ↓
Recommendation
```

The simulation should **not be a fake UI animation**. It must exercise the real backend decision pipeline.

---

# 10. ML REQUIREMENTS

We need a genuine predictive model.

Candidate:

**XGBoost / LightGBM**

Input features:

```text
hour
day_of_week
road_type
distance
current_traffic
historical_traffic
weather
temperature
rain
incident_severity
road_speed
```

Output:

```text
predicted_travel_time
```

The specification explicitly calls for a real ML predictor rather than having the LLM pretend to predict traffic. 

## Evaluation

Report:

* MAE
* RMSE
* R²

We also need a reproducible training/evaluation pipeline.

---

# 11. XAI

Use SHAP for the predictive model where applicable.

Example:

```text
Predicted ETA: 31.4 min

Increasing ETA
Heavy traffic      +4.2 min
Rain               +1.7 min
Peak hour          +2.1 min

Reducing ETA
Highway            -3.8 min
Low distance       -1.4 min
```

Additionally, Wayve should provide a **route-level explanation**.

Example:

```text
WHY THIS ROUTE?

+ Lower congestion
+ Matches scenic preference
+ Snack stop included
+ Better weather conditions

− 4 min slower than fastest route
```

XAI is part of the intended academic depth of the project. 

---

# 12. ROUTE SCORING ENGINE

Route selection must be deterministic/reproducible.

Conceptually:

```text
Route Score =
    w1 × ETA
  + w2 × Traffic
  + w3 × Distance
  + w4 × Weather Risk
  + w5 × Toll Cost
  + w6 × Scenic Value
  + w7 × Stop Detour
  + w8 × Incident Risk
```

Weights originate from:

```text
Natural language
        ↓
Intent extraction
        ↓
Preference vector
        ↓
Optimization
```

Not from arbitrary LLM output.

The route scorer is the mathematical bridge between conversational intent and actual navigation decisions. 

---

# 13. REPLANNING ENGINE

This is one of Wayve's defining features.

### Trigger sources

* Traffic API update
* Weather change
* User report
* Simulated incident
* Road closure
* ETA degradation
* Route becoming invalid
* User instruction

Pipeline:

```text
EVENT
 ↓
Identify affected segment
 ↓
Map-match
 ↓
Update road cost
 ↓
Check whether current route is degraded
 ↓
Generate alternatives
 ↓
Predict ETAs
 ↓
Score routes
 ↓
Compare against current route
 ↓
Decide whether rerouting is worthwhile
 ↓
Notify user
```

Important:

**Don't reroute for every tiny change.**

Introduce a configurable threshold/hysteresis so Wayve doesn't constantly oscillate between routes.

---

# 14. NAVIGATION STATE MACHINE

We should explicitly implement journey state.

```text
IDLE
 ↓
PLANNING
 ↓
DESTINATION_RESOLVED
 ↓
ROUTES_LOADING
 ↓
ROUTES_READY
 ↓
AWAITING_CONFIRMATION
 ↓
NAVIGATING
 ↓
MONITORING
 ↓
REPLANNING
 ↓
ROUTE_SWITCH_PENDING
 ↓
NAVIGATING
 ↓
ARRIVED
```

Possible error state:

```text
ERROR
```

Every transition should be deterministic and testable.

---

# 15. FRONTEND INFORMATION ARCHITECTURE

The product should have **8 primary screens**, as already defined. 

### 01 — Home / Explore

Purpose:
Start a journey.

### 02 — AI Trip Conversation

Purpose:
Natural-language planning.

### 03 — Destination / Place Selection

Purpose:
Resolve ambiguous destinations.

### 04 — Route Comparison

Purpose:
Compare candidates.

### 05 — Trip Preview

Purpose:
Confirm journey.

### 06 — Live Navigation

Purpose:
Navigate.

### 07 — Replanning / Incident

Purpose:
Handle changes.

### 08 — Trip Intelligence

Purpose:
Analytics + explanations.

---

# 16. SUPPORTING UI

Overlays/sheets:

```text
Location Picker
Search
Report Incident
Wayve Reasoning
Weather
Places
Settings
Simulation
```

These should generally appear as floating sheets/cards rather than permanent navigation panels.

---

# 17. HOME SCREEN

Primary hierarchy:

```text
WAYVE

Where are we going?
[ Ask Wayve... ]

               MAP

        Current location

[ Current Journey Card ]

+ Report                My Location
```

The map remains dominant.

The original design direction explicitly calls for a navigation product + AI companion rather than a dashboard. 

---

# 18. AI CONVERSATION UX

Don't make it look like ChatGPT embedded in a map.

Instead:

```text
Where are we going?

[ Ask Wayve... ]
```

Example quick actions:

```text
⚡ Fastest
🌿 Scenic
☕ Relaxed
💰 Economy
🎯 Custom
```

Natural language always remains available.

---

# 19. DESTINATION RESOLUTION

If user says:

> "nearest hill station"

Wayve should:

1. Understand destination type.
2. Resolve current location.
3. Search candidate destinations.
4. Rank by geographic relevance.
5. Present candidates.
6. Ask user to select.

Do not silently choose an ambiguous destination.

---

# 20. ROUTE COMPARISON

Must visually communicate:

### Wayve's recommendation

```text
WAYVE'S PICK

28 min
18.7 km

🌿 Scenic
🚦 Low traffic
🥪 Snack stop

+4 min vs fastest

[ Start Route ]
```

Alternative:

```text
FASTEST

24 min
17.9 km

🚦 Moderate traffic
```

The key is that the recommendation has a **reason**, not just a colored route line.

---

# 21. TRIP PREVIEW

Display:

```text
YOUR JOURNEY

Destination
Starting point

Stops

Weather

Journey mode

Preferences

3 routes found

24 min — Fastest
28 min — Scenic ← Wayve
31 min — Low traffic

[ Start Journey ]
```

---

# 22. LIVE NAVIGATION

The navigation screen must be extremely minimal.

Show:

* Next maneuver
* Distance to maneuver
* Map
* Current location
* ETA
* Remaining distance
* Destination
* Current route attributes
* Report action
* AI status when relevant

Do **not** expose backend agent traces.

---

# 23. AI ACTIVITY

Subtle status:

```text
Wayve Intelligence

✓ Understanding your trip
✓ Checking traffic
✓ Finding snack stops
✓ Comparing 3 routes
✓ Predicting arrival times
✓ Selecting your route
```

Expandable:

**Why this route?**

This allows us to demonstrate agentic behavior without exposing developer logs. 

---

# 24. INCIDENT UX

When something changes:

```text
⚠️ ROUTE UPDATE

Heavy traffic detected ahead

Current route
ETA +14 min

Alternative
ETA −11 min

Save approximately 11 minutes

[ Switch Route ]
[ Stay on Route ]
```

The user remains in control.

---

# 25. WEATHER INTEGRATION

Weather must affect decisions where relevant.

Example:

```text
Route A
Mountain road
Rain probability: 70%

Route B
Highway
Rain probability: 20%
```

If user says:

> "I don't want to drive in rain."

that becomes a route constraint/objective.

Weather isn't merely informational UI. 

---

# 26. TRIP INTELLIGENCE

Secondary analytics screen.

Show:

```text
TRIP INTELLIGENCE

Distance
42.8 km

Travel time
58 min

Reroutes
2

Time saved
13 min
```

And:

```text
WHY WAYVE CHANGED YOUR ROUTE

Traffic
User report
Weather
ETA prediction
Preference
```

This screen is particularly useful for demonstrating the intelligence behind the navigation experience. 

---

# 27. MEMORY

Optional/lightweight.

User can opt into preferences such as:

```text
Likes scenic routes
Avoids tolls
Likes coffee stops
Usually prefers relaxed driving
```

Memory must be:

* Opt-in
* User-visible
* Editable
* Deletable
* Separated from transient journey state

For the MVP, this can be deferred.

---

# 28. VOICE

Phase 3 enhancement.

Example:

> "Yo, there's heavy traffic ahead."

Speech recognition → structured incident:

```json
{
  "type": "heavy_traffic",
  "location": "current_route"
}
```

Then:

> "Got it. I'm checking alternatives."

Voice should **not block the core product**.

---

# 29. DESIGN SYSTEM

Visual direction:

> **Apple Maps × modern AI product × spatial UI**

Requirements:

### Avoid

* Neon cyberpunk
* Excessive gradients
* Excessive glassmorphism
* Giant AI blobs
* Excessive colors
* Generic dashboard layouts

### Use

* Neutral palette
* One Wayve accent
* Large typography
* Rounded cards
* Floating panels
* Line icons
* Generous whitespace
* Map-dominant layouts
* Subtle motion

The design definition explicitly calls for neutral colors with one Wayve accent and semantic traffic colors. 

---

# 30. RESPONSIVE DESIGN

Must support:

### Desktop

Map-dominant large canvas.

### Tablet

Map + floating planning/navigation sheets.

### Mobile

Navigation-first experience.

Never simply shrink the desktop UI.

The information hierarchy must adapt.

---

# 31. ACCESSIBILITY

Required:

* Keyboard navigation
* Focus states
* Sufficient contrast
* Screen-reader labels
* Semantic HTML
* Accessible buttons
* Reduced-motion support
* Don't communicate traffic status through color alone
* Touch targets appropriate for mobile

---

# 32. FRONTEND STACK

Recommended from the frozen architecture:

```text
Next.js
React
TypeScript
Tailwind CSS
Mapbox GL JS
Framer Motion
```

Backend:

```text
Python
FastAPI
```

Agent framework:

```text
LangGraph
```

ML:

```text
XGBoost / LightGBM
scikit-learn
SHAP
```

Database:

```text
PostgreSQL
PostGIS
```

Testing:

```text
Pytest
Simulation Engine
```

These technologies are the current architecture baseline in the product definition. 

---

# 33. API CONTRACTS

Antigravity should create typed contracts before implementation.

Example:

```text
POST /api/journey/plan
POST /api/journey/modify
GET  /api/journey/:id
POST /api/journey/:id/start
POST /api/journey/:id/report
POST /api/journey/:id/replan
GET  /api/journey/:id/routes
GET  /api/journey/:id/intelligence
POST /api/simulation/event
```

Potential internal services:

```text
/geocode
/directions
/places
/weather
/traffic
/predict
/score
/replan
```

Frontend must never directly couple itself to individual providers.

---

# 34. TOOL DEFINITIONS

The agent should have explicit tools such as:

```text
get_current_location()
geocode_destination()
search_destinations()
search_places()
get_route()
get_alternative_routes()
get_weather()
get_traffic()
get_road_conditions()
predict_eta()
score_routes()
create_incident()
evaluate_replan()
start_navigation()
```

Each tool needs:

* Input schema
* Output schema
* Error schema
* Timeout
* Retry behavior
* Provider
* Authentication requirement

---

# 35. ERROR HANDLING

Every external service can fail.

Examples:

```text
Map provider unavailable
Weather unavailable
Traffic unavailable
LLM unavailable
ML prediction unavailable
Database unavailable
GPS unavailable
```

Wayve should degrade gracefully.

Example:

```text
Traffic data unavailable.

I'll continue using the latest available
route information.
```

Never fabricate traffic/weather data.

---

# 36. SECURITY

Mandatory:

* Environment variables for secrets
* Server-side API keys
* Request validation
* Rate limiting
* Input sanitization
* Authentication architecture
* Authorization checks
* No secrets in git
* No sensitive information in logs
* Secure error responses

---

# 37. OBSERVABILITY

Backend should log structured events such as:

```text
journey.created
intent.extracted
destination.resolved
routes.generated
prediction.generated
route.selected
incident.created
replan.triggered
route.switched
journey.completed
```

But:

**Developer logs ≠ user UI.**

---

# 38. TESTING REQUIREMENTS

## Unit tests

* Intent parser
* Preference extraction
* Route scoring
* ETA predictor
* Incident confidence
* Replanning threshold
* State transitions

## Integration tests

* LLM → tool
* Tools → data layer
* Route → ML
* ML → scorer
* Incident → replan

## E2E tests

At minimum:

### Scenario A

```text
Search destination
→ routes
→ select route
→ navigation
```

### Scenario B

```text
Natural language planning
→ preferences
→ route selection
```

### Scenario C

```text
Navigation
→ simulated traffic
→ replan
→ switch route
```

### Scenario D

```text
Navigation
→ user reports traffic
→ re-evaluate
```

---

# 39. DEMO MODE

Antigravity should build a **Demo Mode** around the signature storyline.

The canonical demo:

```text
OPEN WAYVE
 ↓
"Nearest hill station"
 ↓
Destination candidates
 ↓
Select destination
 ↓
"Find snacks and make it scenic"
 ↓
Route generation
 ↓
Wayve recommendation
 ↓
Start navigation
 ↓
Inject traffic
 ↓
Route degradation
 ↓
Replanning
 ↓
Alternative route
 ↓
Switch
 ↓
Trip Intelligence
```

This storyline exercises almost the complete system. 

---

# 40. MVP BOUNDARY

## Phase 1 — MUST WORK

* Map
* Current location
* Destination search
* Route generation
* Alternative routes
* Basic chat
* Intent extraction
* Route selection
* Navigation UI

This matches the defined core MVP. 

## Phase 2 — INTELLIGENCE

* Traffic
* Weather
* Places
* User reports
* Route scoring
* ML ETA
* Agent orchestration
* Dynamic replanning

## Phase 3 — POLISH

* Animations
* Route comparison refinement
* Agent activity
* XAI
* Simulation mode
* Voice
* Trip analytics
* Preference memory
* Themes
* Responsive refinement

The original definition uses this same three-phase boundary. 

---

# 41. DEFINITION OF DONE

Antigravity should **not** consider Wayve complete because the UI renders.

A feature is done only when:

```text
UI
+
Frontend state
+
API
+
Backend logic
+
Data
+
Error handling
+
Loading state
+
Empty state
+
Test
```

are implemented.

For AI functionality:

```text
Prompt
+
Structured output
+
Validation
+
Tool execution
+
Deterministic processing
+
Persisted state
+
UI representation
```

must exist.

---

# 42. EVERY SCREEN NEEDS EVERY STATE

This is something I'd explicitly put into the Antigravity instructions.

For every screen define:

```text
Default
Loading
Empty
Success
Error
Partial data
Offline/degraded
Interaction
Transition
```

For navigation additionally:

```text
GPS acquiring
GPS lost
Off route
Incident detected
Replanning
Awaiting confirmation
Route switched
Arrived
```

---

# 43. REPOSITORY STRUCTURE

I'd have Antigravity target something along these lines:

```text
wayve/
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   │
│   └── api/
│       ├── app/
│       ├── agents/
│       ├── tools/
│       ├── services/
│       ├── models/
│       ├── schemas/
│       ├── routes/
│       └── tests/
│
├── ml/
│   ├── training/
│   ├── features/
│   ├── models/
│   ├── evaluation/
│   └── notebooks/
│
├── simulation/
│   ├── scenarios/
│   ├── engine/
│   └── events/
│
├── infra/
│   ├── docker/
│   └── database/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── product/
│   └── wireframes/
│
├── .env.example
├── docker-compose.yml
└── README.md
```

Antigravity can adjust this after inspecting the existing repo, but it should preserve the architectural separation.

---

# 44. ENVIRONMENT CONFIGURATION

Create:

```text
.env.example
```

with placeholders for:

```text
MAPBOX_ACCESS_TOKEN=
WEATHER_API_KEY=
LLM_API_KEY=
DATABASE_URL=
```

No credentials committed.

---

# 45. DOCUMENTATION ANTIGRAVITY MUST PRODUCE

Before/alongside implementation, it should create:

```text
README.md

docs/
├── PRODUCT.md
├── ARCHITECTURE.md
├── AGENTS.md
├── API.md
├── DATA_MODEL.md
├── ML.md
├── XAI.md
├── SIMULATION.md
├── STATE_MACHINE.md
├── DESIGN_SYSTEM.md
├── TESTING.md
└── DEMO.md
```

---

# 46. BUILD ORDER

This is the order I would force Antigravity to follow:

```text
01  Inspect existing repository
 ↓
02  Establish architecture
 ↓
03  Define schemas/types
 ↓
04  Setup database
 ↓
05  Setup backend
 ↓
06  Setup frontend shell
 ↓
07  Implement Map
 ↓
08  Implement location
 ↓
09  Implement destination search
 ↓
10  Implement routing
 ↓
11  Implement conversation agent
 ↓
12  Implement preference extraction
 ↓
13  Implement route scoring
 ↓
14  Implement weather/traffic
 ↓
15  Implement incidents
 ↓
16  Implement ML prediction
 ↓
17  Implement replanning
 ↓
18  Implement simulation
 ↓
19  Implement XAI
 ↓
20  Implement analytics
 ↓
21  Polish UX
 ↓
22  Testing
 ↓
23  Demo scenario
 ↓
24  Production cleanup
```

---

# 47. NON-NEGOTIABLE PRODUCT RULES

I would put these at the **very top of the Antigravity prompt**.

### Rule 1

**Do not turn Wayve into a generic AI chatbot.**

### Rule 2

**Do not turn Wayve into a dashboard.**

### Rule 3

**Do not allow the LLM to arbitrarily calculate route decisions.**

### Rule 4

**Every route recommendation must have structured reasoning/data behind it.**

### Rule 5

**Simulation must use the real replanning pipeline.**

### Rule 6

**The frontend must remain map-dominant.**

### Rule 7

**Natural language must modify an existing journey contextually.**

### Rule 8

**User reports must become real backend events.**

### Rule 9

**Traffic/weather must influence decisions, not merely appear as decorative information.**

### Rule 10

**Every external API failure must have a graceful fallback.**

### Rule 11

**Every major feature needs loading, empty and error states.**

### Rule 12

**Do not over-engineer with dozens of fake agents.**

### Rule 13

**Do not implement Phase 3 polish before Phase 1 functionality works.**

### Rule 14

**Do not invent functionality that isn't in the product specification without documenting the change.**

### Rule 15

**Preserve the product philosophy: sophisticated system, simple interface.**

---

# 48. THE SINGLE MOST IMPORTANT ARCHITECTURAL DIAGRAM

Antigravity should implement the system around this flow:

```text
                         USER
                           │
                           ▼
                 CONVERSATION AGENT
                  Intent + Preferences
                           │
                           ▼
                   JOURNEY PLANNER
                  Agentic Tool Calling
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       ROUTING          TRAFFIC          WEATHER
       MAP / POI         DATA              DATA
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                TRAFFIC INTELLIGENCE
                 Data Fusion + Events
                           │
                           ▼
                    ML PREDICTION
                    ETA / Congestion
                           │
                           ▼
                  ROUTE OPTIMIZATION
                 Preference-based Score
                           │
                           ▼
                   WAYVE DECISION
                    + XAI EXPLANATION
                           │
                           ▼
                       MAP / NAV
                           │
                           ▼
                    MONITOR ROUTE
                           │
                    Change detected?
                      /          \
                    NO            YES
                    │              │
                    ▼              ▼
                 CONTINUE        REPLAN
                                   │
                                   └──────► Route evaluation
```

That is effectively the system's core identity. 

---

## What I recommend we do next

**Don't send this whole conversational discussion to Antigravity yet.**

We should turn it into **4 concrete artifacts**:

1. **`WAYVE_MASTER_REQUIREMENTS.md`** — everything above, implementation requirements.
2. **`WAYVE_WIREFRAMES.md`** — every screen + every state + interaction flow.
3. **`WAYVE_TECHNICAL_SPEC.md`** — APIs, database schema, agent graphs, tool contracts, ML pipeline, state machine.
4. **`WAYVE_ANTIGRAVITY_PROMPT.md`** — the actual master instruction we paste into Antigravity so it can inspect the repo and build in controlled phases.

Then we can give Antigravity **one authoritative source of truth** instead of repeatedly explaining Wayve.

**The next artifact I would build is the full `WAYVE_MASTER_REQUIREMENTS.md` as a proper implementation document**, followed by the complete screen-by-screen wireframe/state specification. That is the missing bridge between the product definition you already froze and actual development.
