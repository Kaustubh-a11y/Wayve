# WAYVE — MASTER REQUIREMENTS

> **Status:** Product master requirements / v1.0  
> **Product:** Wayve  
> **Document:** Master Requirements  
> **Last updated:** 2026-09-17  
> **Source of truth:** Product vision + wireframes + technical specification

---

## 0. Document Purpose

This document is the top-level product requirements document for Wayve.

It translates the existing product direction, wireframes, and technical architecture into one implementation-oriented contract covering:

- what Wayve is
- who it is for
- the core user problems
- product principles
- functional requirements
- AI/agent behavior
- navigation and trip lifecycle
- UX requirements
- data and privacy requirements
- technical boundaries
- MVP scope
- future phases
- acceptance criteria
- implementation priorities
- decisions that remain open

This document is intentionally higher-level than `WAYVE_TECHNICAL_SPEC.md` and more behaviorally complete than `WAYVE_WIREFRAMES.md`.

---

# 1. Product Definition

## 1.1 What is Wayve?

Wayve is a **conversational, agentic navigation and mobility platform**.

It combines:

1. a map-centric navigation experience
2. natural-language trip planning
3. contextual place discovery
4. route comparison
5. intelligent route recommendation
6. live trip monitoring
7. dynamic replanning
8. explainable route decisions
9. trip intelligence after arrival

The map is the spatial interface.

The agent is the intelligence layer.

The trip is the central product object.

Wayve should feel less like a traditional map application and more like a **calm mobility command center that understands the user's journey**.

---

## 1.2 Product North Star

> **Tell Wayve where you want to go and what matters to you. Wayve handles the complexity of finding, comparing, monitoring, and adapting the journey while keeping the user in control.**

A successful Wayve journey should feel like:

```text
User intent
    ↓
Wayve understands
    ↓
Destination resolved
    ↓
Journey preferences understood
    ↓
Relevant places / stops found
    ↓
Live context gathered
    ↓
Routes generated
    ↓
Routes compared
    ↓
Wayve explains its recommendation
    ↓
User confirms
    ↓
Navigation begins
    ↓
Wayve monitors the journey
    ↓
Conditions change
    ↓
Wayve evaluates alternatives
    ↓
User decides whether to switch
    ↓
Journey continues
    ↓
Arrival
    ↓
Trip intelligence
```

---

# 2. Product Principles

These principles are requirements, not decorative guidelines.

## P01 — Trip first, map second

The map is a surface through which the trip is understood.

The trip itself is the primary abstraction.

Every major feature should strengthen the journey lifecycle rather than create isolated map screens.

## P02 — Conversation first for planning

Natural language should be a first-class planning interface.

Users should be able to say things such as:

- "Take me to Lonavala."
- "Find somewhere for coffee on the way."
- "Make it scenic."
- "Avoid tolls."
- "I don't mind being ten minutes slower."
- "I don't want to drive in rain."
- "Let's leave after lunch."

Wayve should convert these requests into structured journey objectives.

## P03 — One obvious next action

Every important state must make the next useful action clear.

Avoid competing primary CTAs.

## P04 — Explain, don't expose

Wayve must explain decisions in human terms.

It must not expose:

- internal prompts
- tool traces
- agent node names
- model names
- raw scoring functions
- provider debugging
- internal logs

## P05 — User remains in control

Wayve can recommend.

The user controls consequential journey decisions in the core experience.

In particular, route switching during navigation should be user-confirmed.

## P06 — Live by default

Travel conditions are dynamic.

Where available, Wayve should account for:

- traffic
- incidents
- weather
- road conditions
- user reports
- current location
- route degradation
- ETA changes

## P07 — Progressive disclosure

Show the information necessary for the current decision first.

Expose detail only when useful.

## P08 — Calm over dense

Wayve should prioritize clarity over dashboard density.

The interface must not resemble a developer console or analytics dashboard during normal navigation.

## P09 — Privacy by design

Precise location is sensitive.

Wayve should request, use, retain, and expose location only when required for a clear product purpose.

## P10 — Resilient UX

Temporary provider or network failures should degrade the product rather than destroy the journey.

## P11 — Provider independence

Mapping, search, routing, weather, and other external providers must remain replaceable behind abstraction boundaries.

## P12 — Mobile first

The primary interaction model is:

- touch
- glanceability
- one-handed interaction
- bottom sheets
- large touch targets
- minimal navigation density

Desktop should enhance the experience, not dictate the interaction model.

---

# 3. Target Users

## 3.1 Primary user

A person who wants to travel somewhere and prefers to express intent rather than manually configure every routing parameter.

Typical needs:

- get somewhere quickly
- take a scenic route
- avoid traffic
- find food/coffee/fuel on the way
- avoid rain
- reduce tolls
- balance time against comfort
- adjust an existing journey conversationally

## 3.2 Secondary users

### Explorers

Users who know approximately where they want to go but want Wayve to help discover destinations or stops.

### Frequent travelers

Users who repeatedly travel to the same destinations and benefit from:

- saved places
- recent destinations
- preferences
- trip context

### Demonstration / development users

Internal users who need deterministic simulation of traffic, weather, incidents, and replanning behavior.

---

# 4. Core User Jobs

Wayve must support five foundational jobs.

## J01 — Discover

The user can:

- search for a destination
- ask Wayve for a destination conversationally
- search for places
- resolve ambiguous destinations
- inspect a place
- view a place on the map
- discover useful places nearby or along a route

## J02 — Plan

The user can:

- choose origin
- choose destination
- express journey preferences
- choose travel mode
- add stops
- compare route alternatives
- understand ETA, duration, and distance
- understand meaningful route differences
- understand why Wayve recommends a route

## J03 — Navigate

The user can:

- start a trip
- see current location
- follow the route
- receive maneuver guidance
- see ETA and remaining distance
- receive meaningful warnings
- recover from off-route conditions
- continue during temporary degradation
- complete or cancel the trip

## J04 — Adapt

The user can:

- modify the journey conversationally
- add or remove stops
- change preferences
- respond to route changes
- switch routes
- stay on the current route
- report incidents

## J05 — Remember and return

The user can:

- save destinations
- create Home / Work / Favorite places
- access recent searches
- access recent destinations
- resume an active journey
- inspect completed trip intelligence where supported

---

# 5. Information Architecture

The primary product surfaces are:

```text
WAYVE

01 Home / Explore
   ├── Search / Ask Wayve
   ├── Quick journey modes
   ├── Current journey
   ├── Recent / saved destinations
   └── Report

02 AI Trip Conversation
   ├── Natural-language planning
   ├── Intent extraction
   ├── Destination resolution
   ├── Preference refinement
   └── Contextual modifications

03 Destination / Place Selection
   ├── Destination candidates
   ├── Place results
   ├── Stop candidates
   └── Confirm destination

04 Route Comparison
   ├── Wayve recommendation
   ├── Alternatives
   ├── Route details
   └── Why this route?

05 Trip Preview
   ├── Journey summary
   ├── Stops
   ├── Weather
   ├── Mode / preferences
   └── Start Journey

06 Live Navigation
   ├── Maneuver
   ├── Map
   ├── ETA / distance
   ├── Route attributes
   ├── Report
   └── Wayve Intelligence

07 Replanning / Incident
   ├── Route update
   ├── Alternative
   ├── Switch
   └── Stay

08 Trip Intelligence
   ├── Journey metrics
   ├── Route changes
   ├── Time saved
   └── Why Wayve changed route

Supporting overlays:
   ├── Location Picker
   ├── Search
   ├── Report Incident
   ├── Wayve Reasoning
   ├── Weather
   ├── Places
   ├── Settings
   └── Simulation
```

---

# 6. Core Journey Lifecycle

The canonical journey state machine is:

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
  ├──────────────→ REPLANNING
  │                    ↓
  │              ROUTE_SWITCH_PENDING
  │                    ↓
  │                MONITORING
  │
  ↓
ARRIVED
  ↓
TRIP_INTELLIGENCE
```

Error and degraded states can occur at any stage.

The system must preserve journey identity through transitions.

---

# 7. Functional Requirements

## 7.1 Home / Explore

### Required

The home experience must provide:

- Wayve identity
- current/selected location status
- primary Ask Wayve input
- map
- recent destinations where available
- saved destinations where available
- quick journey modes where useful
- active journey resume card
- report entry point where relevant
- my-location control

### Home requirement

A user must be able to move from:

```text
Home
→ destination
→ route planning
```

without navigating through unrelated settings.

### Location denied

If location permission is denied:

- the interface remains usable
- the user can manually choose a starting point
- Wayve must not invent a current location

---

# 8. Search Requirements

## 8.1 Supported inputs

Search must support:

- free-text destinations
- addresses
- place names
- landmarks
- coordinates
- saved destinations
- natural-language location requests

## 8.2 Search behavior

Search should support:

- autocomplete
- debouncing
- recent searches
- fuzzy matching
- relevance ranking
- proximity-aware ranking where location is available
- request cancellation
- empty states
- provider errors
- partial results

## 8.3 Search result

A normalized result should contain:

```ts
type SearchResult = {
  id: string;
  type: "place" | "address" | "landmark" | "coordinate";
  name: string;
  secondaryLabel?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  category?: string;
};
```

---

# 9. Destination Resolution

Wayve must distinguish between:

1. a clearly resolved destination
2. an ambiguous destination
3. an unavailable destination
4. a destination requiring user confirmation

## 9.1 Ambiguity rule

Wayve must not silently choose between materially different destinations.

Example:

> "nearest hill station"

may produce:

- Lonavala
- Panchgani
- Matheran

Wayve should present candidates and ask the user to select.

## 9.2 Destination confirmation

A destination selection must preserve:

- place identity
- coordinates
- human-readable label
- provider identity when applicable
- relevant category/context

---

# 10. Conversational Planning Requirements

## 10.1 Planning model

Wayve's conversational interface is an **AI planning layer over navigation**, not a generic chatbot.

Its output should ultimately modify structured journey state.

## 10.2 Intent extraction

Wayve must be able to extract, where expressed:

- destination
- origin
- travel mode
- departure time
- arrival requirement
- stops
- route preferences
- constraints
- avoidances
- relative priorities
- tolerance for additional time/distance
- weather preferences
- traffic preferences

## 10.3 Context persistence

Follow-up requests must modify the current journey.

Example:

```text
User:
Take me to Lonavala.

Wayve:
Destination found.

User:
Find coffee before we get there.

Wayve:
Adds a coffee-stop objective to the current journey.
```

The second request must not create an unrelated new trip.

## 10.4 Preference examples

Natural language such as:

- "make it scenic"
- "I don't care if it's ten minutes longer"
- "avoid tolls"
- "avoid rain"
- "keep traffic low"
- "get me there fastest"

must be converted into route optimization objectives.

## 10.5 Clarification

When user intent is materially ambiguous, Wayve should ask a concise clarification rather than fabricate intent.

---

# 11. Journey Preference Model

Wayve should represent journey preferences as structured objectives rather than UI-only labels.

Example conceptual model:

```ts
type JourneyPreferences = {
  optimizeFor?: "time" | "scenic" | "comfort" | "economy" | "custom";
  trafficTolerance?: number;
  extraTimeToleranceSeconds?: number;
  extraDistanceToleranceMeters?: number;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  avoidRain?: boolean;
  scenicPreference?: number;
  stopRequests?: StopRequest[];
};
```

The exact implementation may evolve.

The requirement is that preferences influence actual route evaluation.

---

# 12. Journey Modes

Initial user-facing modes may include:

- Fast
- Scenic
- Relaxed
- Economy
- Custom

These modes are not cosmetic filters.

Selecting a mode must alter route optimization behavior.

---

# 13. Place Requirements

A place result/page may provide:

- name
- category
- address
- coordinates
- photos where available
- opening hours where available
- contact information where available
- save
- share
- directions
- nearby places

Provider-dependent fields must remain optional.

Wayve must never imply that unavailable provider data is known.

---

# 14. Contextual Stop Discovery

Wayve must support contextual requests such as:

> "Need coffee before we get there."

or:

> "Find somewhere for snacks on the way."

## Required behavior

```text
Current journey
    ↓
Understand stop request
    ↓
Search candidate POIs along/near route
    ↓
Evaluate detour cost
    ↓
Consider availability/relevance where supported
    ↓
Present candidates
    ↓
User selects
    ↓
Add stop to journey
    ↓
Re-evaluate route
```

## Stop information

Useful information includes:

- name
- category
- detour time
- relative route position
- availability/open status where available
- distance
- relevant context

---

# 15. Route Planning

A route request must contain at minimum:

```ts
type RouteRequest = {
  origin: Coordinate;
  destination: Coordinate;
  mode: TravelMode;
  departureTime?: string;
  arrivalTime?: string;
  avoid?: RouteAvoidance[];
};
```

Supported travel modes should be extensible.

Initial candidates:

- driving
- walking
- cycling
- transit
- two_wheeler

Only modes supported reliably by the launch provider should be enabled.

---

# 16. Route Comparison

Wayve should compare routes using information that helps the user make a decision.

Required comparison dimensions:

1. route identity
2. ETA
3. duration
4. distance
5. meaningful route attributes
6. traffic/incident state where available
7. weather influence where relevant
8. toll information where available
9. meaningful warnings
10. difference from fastest/current route

The UI must avoid overwhelming users with low-value routing metadata.

---

# 17. Wayve Route Recommendation

Wayve may recommend a route based on the current journey objectives.

The recommendation must be contextual.

It must not imply:

> "This is universally the best route."

Instead, it should explain:

> "I selected this route because it matches your scenic preference, has lower predicted congestion, and includes your snack stop."

## Recommendation requirements

A recommendation should expose:

- route selected
- ETA
- distance
- relevant attributes
- key trade-offs
- concise reason

If a confidence value is shown, it must be backed by a real confidence signal.

No invented confidence percentages.

---

# 18. Explainability

The user should be able to ask:

> "Why this route?"

Wayve should explain the recommendation using human-readable factors such as:

- user's stated preference
- predicted traffic
- weather
- stop inclusion
- ETA trade-off
- route characteristics
- incident information

Do not expose:

- hidden chain-of-thought
- internal prompts
- tool traces
- private system state
- raw proprietary scores

The explanation should describe the decision without revealing implementation internals.

---

# 19. Trip Preview

Before navigation begins, Wayve should provide a calm confirmation surface.

It should show:

- destination
- origin
- stops
- selected route
- journey mode
- key preferences
- relevant weather
- number of alternatives
- major route trade-offs
- primary Start Journey action

Avoid raw-data overload.

---

# 20. Active Trip Requirements

An active trip is a first-class application state.

Conceptual model:

```ts
type ActiveTrip = {
  id: string;
  origin: Coordinate;
  destination: Destination;
  selectedRouteId: string;
  mode: TravelMode;
  startedAt: string;
  status: "active" | "paused" | "completed" | "cancelled";
  currentPosition?: Coordinate;
  etaSeconds?: number;
  remainingDistanceMeters?: number;
};
```

The active trip must survive, where platform capabilities permit:

- page refresh
- temporary network loss
- background/foreground transitions

---

# 21. Live Navigation

Live navigation must prioritize safety and glanceability.

## Required information

- next maneuver
- maneuver distance
- current location
- route line
- route progress
- ETA
- remaining distance
- destination
- current route attributes
- meaningful warnings
- report action
- relevant Wayve intelligence status

## Navigation must not show

- agent traces
- tool call logs
- internal model names
- raw route scores
- excessive analytics
- large conversation transcripts

---

# 22. Location Requirements

Location is permission-based.

States:

```text
unknown
requesting
granted
denied
unavailable
stale
```

The application must remain usable if location permission is denied.

## Location quality

Track:

- accuracy
- timestamp
- source
- age

Navigation decisions should reject obviously invalid or stale readings.

Precise location should not be retained indefinitely without a clear product reason.

---

# 23. Off-Route Behavior

Wayve must avoid repeated reroutes caused by GPS noise.

Required sequence:

```text
Meaningful deviation detected
        ↓
Confirm deviation threshold
        ↓
Request new route
        ↓
Generate / normalize route
        ↓
Replace active route atomically
        ↓
Update ETA
        ↓
Update remaining distance
        ↓
Preserve trip identity
```

---

# 24. Dynamic Replanning

Dynamic replanning is one of Wayve's defining product capabilities.

Potential triggers:

- traffic change
- accident
- road closure
- construction
- weather change
- user report
- ETA degradation
- route invalidation
- new user instruction

## Replanning algorithm contract

```text
Condition changes
    ↓
Identify affected route segment
    ↓
Determine whether current route materially degrades
    ↓
Generate alternatives
    ↓
Predict ETAs
    ↓
Evaluate against current journey objectives
    ↓
Determine whether change is meaningful
    ↓
If not meaningful:
    continue monitoring

If meaningful:
    notify user
    ↓
    Switch / Stay
```

Wayve must use hysteresis/thresholding to avoid noisy route-change prompts.

---

# 25. Route Switching

When Wayve identifies a materially better alternative:

```text
Alternative identified
    ↓
Explain impact
    ↓
User chooses Switch
    ↓
Confirm transition if required
    ↓
Animate / transition route
    ↓
Update active route
    ↓
Update ETA
    ↓
Continue navigation
```

If the user chooses Stay:

- remain on current route
- continue monitoring
- do not repeatedly prompt for the same insignificant event

---

# 26. Incident Reporting

Users must be able to report:

- heavy traffic
- accident
- construction
- road blocked
- flooding
- hazard
- other

They may provide approximate distance:

- < 500 m
- < 1 km
- < 2 km
- > 2 km

A report should become a structured incident/event rather than a UI-only action.

Conceptually:

```text
User report
    ↓
Location + type + severity
    ↓
Incident
    ↓
Context intelligence
    ↓
Route cost update
    ↓
Route re-evaluation
```

---

# 27. Weather

Weather is both information and a potential route decision factor.

Where relevant, Wayve should be able to use weather to evaluate:

- rain exposure
- severe weather
- road/weather compatibility
- user weather avoidance preferences

If weather data is unavailable:

- state that it is unavailable
- continue using valid route information
- never invent conditions

---

# 28. Wayve Intelligence

The intelligence layer should remain visible but subtle.

Collapsed state may communicate:

```text
Wayve Intelligence
Checking traffic · Comparing routes...
```

Expanded state may summarize meaningful work:

```text
✓ Understanding your trip
✓ Checking traffic
✓ Finding stops
✓ Comparing routes
✓ Predicting arrival times
```

This is a user-facing activity summary.

It is not a developer trace.

---

# 29. Agent Behavior Requirements

Wayve's agentic layer must be:

- context-aware
- tool-capable
- stateful within the journey
- deterministic enough for critical workflows
- explainable at the product level
- bounded by product permissions
- resilient to provider failures
- explicit when information is uncertain or unavailable

## Agent must not

- fabricate destinations
- fabricate traffic
- fabricate weather
- fabricate ETAs
- fabricate confidence
- silently make consequential ambiguous selections
- expose internal traces
- mutate a journey without an understandable product reason
- repeatedly interrupt the user for insignificant changes

---

# 30. Agent Tool Boundaries

Conceptual tool domains:

```text
Location
Search / Geocoding
Places
Routing
Traffic / Incidents
Weather
Journey State
User Preferences
Notifications
Analytics
```

Provider calls should be mediated through backend interfaces.

The client must not receive or control private provider credentials.

---

# 31. Simulation Mode

Wayve must include a deterministic simulation capability for development and demonstration.

## Simulation events

At minimum:

- heavy traffic
- accident
- road closure
- construction
- heavy rain
- event congestion

The user/developer can select:

- affected route
- severity

## Critical requirement

Simulation must exercise the **real replanning pipeline**.

It must not be a fake animation.

Required conceptual path:

```text
Simulation event
    ↓
Event bus
    ↓
Context intelligence
    ↓
Route cost update
    ↓
Re-evaluation
    ↓
Alternative routes
    ↓
Recommendation
```

This makes simulation a product-system validation tool rather than a visual demo.

---

# 32. Saved Places

Users can save places as:

- Home
- Work
- Favorite
- Custom label

Conceptual model:

```ts
type SavedPlace = {
  id: string;
  userId: string;
  label: string;
  placeId?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
};
```

Saved data must be user-controlled.

---

# 33. Recent Activity

Wayve may store bounded recent:

- searches
- destinations
- trips

Recent activity should:

- be privacy-conscious
- have bounded retention
- age automatically where appropriate
- never become an uncontrolled location-history database

---

# 34. Preference Memory

If implemented, preference memory must be:

- opt-in
- user-visible
- understandable
- editable
- removable
- separate from transient journey state

Examples may include:

- preferred travel mode
- recurring destination
- preference for scenic routes
- toll avoidance

Memory should never become an opaque profile.

---

# 35. Trip Intelligence

Trip Intelligence is a secondary experience shown after or around completed journeys.

Potential metrics:

- distance
- travel time
- reroutes
- time saved
- route changes
- user reports
- weather influence
- ETA prediction influence
- preference influence

Example:

```text
Today's journey

42.8 km
58 min
2 reroutes
13 min saved

Why Wayve changed your route

Traffic
User report
Weather
ETA prediction
Preference
```

Trip Intelligence must not interfere with the primary navigation experience.

---

# 36. Notifications

Notification architecture may support:

- trip reminders
- active-trip events
- meaningful route changes
- important travel alerts

Notifications must:

- be opt-in where required
- avoid noise
- avoid repeated insignificant alerts
- respect user preferences
- preserve user control

---

# 37. UX Requirements

## 37.1 Visual language

Wayve should use:

- spacious layouts
- large readable typography
- rounded surfaces
- subtle elevation
- strong primary actions
- restrained palette
- compact cards
- floating controls
- map-dominant composition
- bottom-sheet patterns
- subtle state-driven motion

## 37.2 Avoid

Do not turn Wayve into:

- a generic dashboard
- a neon cyberpunk interface
- an overly glassy UI
- a giant AI blob interface
- a developer console
- a permanently visible analytics sidebar
- a dense data cockpit

---

# 38. Responsive Requirements

Suggested breakpoints:

```text
Mobile:  < 640px
Tablet:  640–1023px
Desktop: >= 1024px
Wide:    >= 1440px
```

These are defaults, not rigid design constraints.

## Desktop

- full viewport map
- floating header
- floating planning cards
- no permanent dashboard sidebar
- map remains visible whenever possible

## Tablet

- map remains dominant
- planning and route details use sheets/panels
- avoid desktop-style persistent sidebars

## Mobile

- map is the full-screen base
- planning uses bottom/full-height sheets
- route cards use swipeable stacks
- navigation density is reduced
- controls are touch-friendly
- do not simply shrink desktop layouts

---

# 39. Global Interaction Requirements

## Primary CTA

Each state should have one dominant action, for example:

- Confirm Destination
- Start Route
- Start Journey
- Switch Route
- Try Again

## Ask Wayve

The main planning input should:

- accept natural language
- preserve current journey context
- optionally support voice
- show meaningful processing state
- never expose raw agent internals

## My Location

The location control should:

- recenter the map
- communicate acquisition state
- have an accessible label
- never imply location accuracy that is unavailable

## Report

During navigation, report should remain quickly accessible where screen space permits.

---

# 40. UI State Requirements

Every primary screen must explicitly support:

| State | Requirement |
|---|---|
| Default | Normal initial presentation |
| Loading | Clear progress |
| Empty | No results/data |
| Success | Task completed |
| Error | Recoverable failure |
| Partial | Some data unavailable |
| Degraded | Product continues with latest valid information |
| Interaction | User actively changing state |
| Transition | Clear state movement |

Navigation additionally requires:

- GPS acquiring
- GPS lost
- off route
- incident detected
- replanning
- awaiting confirmation
- route switched
- arrived

---

# 41. Loading Language

Loading copy should describe user-relevant work.

Preferred:

```text
Getting your location...
Finding nearby destinations...
Checking traffic...
Checking weather...
Finding stops along your route...
Comparing routes...
Predicting arrival times...
Preparing your journey...
Recalculating...
```

Avoid internal implementation language such as:

```text
Running Agent B...
Executing tool call #7...
LangGraph node active...
XGBoost inference...
```

---

# 42. Error and Degraded UX

Wayve must never fabricate unavailable information.

Examples:

### Map unavailable

```text
Map data is temporarily unavailable.

[ Try Again ]
```

### Weather unavailable

```text
Weather data is unavailable.

I'll continue using the latest available
route information.
```

### Traffic unavailable

```text
Live traffic data is unavailable.

Route recommendations will use the
latest available information.
```

### ML unavailable

```text
Arrival prediction is temporarily unavailable.

I'll continue with available route estimates.
```

### GPS unavailable

```text
We can't access your current location.

[ Enable Location ]
[ Choose Starting Point ]
```

---

# 43. Accessibility Requirements

Target **WCAG 2.2 AA where practical**.

Required:

- keyboard navigation
- visible focus
- semantic HTML
- accessible labels
- screen-reader-friendly controls
- sufficient contrast
- reduced-motion support
- touch targets around 44×44 CSS px or larger
- no information conveyed by color alone

Traffic states must combine:

- semantic text
- iconography where appropriate
- color as supporting information

---

# 44. Motion Requirements

Motion communicates state.

Useful motion includes:

- route line drawing
- route transition
- ETA update
- incident marker appearance
- alternative route appearance
- sheet transitions
- expand/collapse

Reduced motion must:

- remove route-drawing animation
- reduce transitions
- remove unnecessary pulsing
- preserve state clarity without motion

---

# 45. Internationalization

The architecture must be i18n-ready.

Future support should include:

- localized UI
- localized distance/time
- RTL
- localized place names
- locale-aware number formatting

User-facing strings must not be embedded into business logic.

---

# 46. Data Requirements

Core entities:

```text
User
Saved Place
Recent Search
Trip
Route Snapshot
Incident
Journey Preference
Trip Event
```

## Trip

A trip must retain enough information to reconstruct the meaningful journey lifecycle without unnecessarily storing precise location history.

## Route Snapshot

A route snapshot may include:

- provider
- provider route ID
- duration
- distance
- geometry
- normalized metadata

## Location history

Exact location history should not be retained indefinitely without a clear product reason and user-facing policy.

---

# 47. Technical Requirements

Wayve should initially be implemented as a **modular monolith**.

Recommended stack:

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS or token-based equivalent
- MapLibre GL JS where compatible
- TanStack Query
- Zustand or React Context for limited client state
- Zod

### Backend

- TypeScript
- Next.js server/BFF or Node.js API
- PostgreSQL
- PostGIS
- Redis
- Zod/OpenAPI contracts

### Infrastructure

- managed PostgreSQL
- managed Redis
- object storage where required
- CDN
- HTTPS
- centralized logs
- error monitoring
- metrics/tracing

---

# 48. Provider Abstraction

External geospatial services must be behind interfaces.

Conceptual interfaces:

```ts
interface GeocodingProvider {
  search(query: string, context?: SearchContext): Promise<SearchResult[]>;
  getPlace(id: string): Promise<Place | null>;
}

interface RoutingProvider {
  route(request: RouteRequest): Promise<RouteOption[]>;
}
```

Additional providers may exist for:

- weather
- traffic
- incidents
- transit

Provider abstraction is required so Wayve can change vendors by:

- geography
- price
- quality
- licensing
- availability

---

# 49. API Requirements

Base API path:

```text
/api/v1
```

Core endpoints:

```http
POST   /auth/session
DELETE /auth/session
GET    /auth/me

GET    /search?q={query}&lat={lat}&lng={lng}

GET    /places/{id}

POST   /routes

POST   /trips
GET    /trips/{id}
PATCH  /trips/{id}
POST   /trips/{id}/complete
POST   /trips/{id}/cancel

GET    /saved-places
POST   /saved-places
PATCH  /saved-places/{id}
DELETE /saved-places/{id}
```

Additional endpoints may be introduced for incidents, journey events, preferences, and intelligence.

---

# 50. API Error Contract

API responses must use predictable error semantics.

Example:

```json
{
  "error": {
    "code": "ROUTE_PROVIDER_UNAVAILABLE",
    "message": "Route service is temporarily unavailable.",
    "requestId": "req_123"
  }
}
```

Supported classes should include:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
RATE_LIMITED
PROVIDER_UNAVAILABLE
PROVIDER_TIMEOUT
CONFLICT
INTERNAL_ERROR
```

Do not expose:

- stack traces
- SQL errors
- provider secrets
- infrastructure details

---

# 51. State Management

Use three categories.

## Server state

Managed by TanStack Query or equivalent:

- search
- places
- routes
- trips
- saved places

## Session state

- authentication
- current user
- preferences

## Ephemeral UI state

- active sheet
- selected route
- map viewport
- search input
- filters
- modal state

Do not duplicate server state into global client state without a demonstrated need.

---

# 52. Caching

Good cache candidates:

- popular place metadata
- short-lived search responses
- short-lived route responses where provider terms permit
- static configuration

Avoid blind caching of:

- private user data
- highly dynamic navigation state
- sensitive location information

Cache keys must contain all meaningful routing/search parameters.

---

# 53. Geospatial Requirements

Use WGS84 coordinates.

```text
latitude:  -90 to +90
longitude: -180 to +180
```

PostGIS should support:

- radius searches
- nearby places
- distance calculations
- bounding boxes
- spatial indexes

Client coordinates must be validated before:

- persistence
- provider forwarding
- route calculation

---

# 54. Security Requirements

Required controls:

- HTTPS
- secure HTTP-only session cookies where applicable
- CSRF protection for cookie authentication
- input validation
- output encoding
- parameterized SQL
- rate limiting
- server-side provider keys
- secret management
- audit logging for sensitive account actions
- payload limits
- authentication abuse protection
- provider quota protection
- bot mitigation where needed

---

# 55. Privacy Requirements

Wayve should minimize precise location collection and retention.

Users should understand:

- why location is requested
- whether it is currently used
- what trip/location data is stored
- how saved data can be removed
- what optional memory exists

Analytics must not receive raw precise coordinates by default.

---

# 56. Performance Requirements

These are engineering targets.

## Initial page

- fast first contentful rendering on normal mobile connections
- non-essential map resources should not block core UI

## Search

- debounced requests
- warm/cached requests should target perceived response under approximately 500 ms

## Route planning

- loading state appears immediately
- usable route results should target a few seconds under normal provider conditions

## Map

- avoid unnecessary full-map rerenders
- cluster large point collections
- lazy-load secondary layers

## Web

Target good Core Web Vitals on primary screens.

---

# 57. Offline / Degraded Requirements

At minimum, Wayve should:

- preserve last known destination
- preserve active-trip UI state
- show offline status
- avoid destructive mutations while offline
- retry recoverable requests
- prevent duplicate trip creation

Future versions may support:

- offline routes
- downloadable map regions
- deeper offline navigation

---

# 58. Observability

Every request should carry a correlation/request ID.

Monitor:

- API latency
- API errors
- provider failures
- provider timeouts
- authentication failures
- client crashes
- Web Vitals
- route calculation success
- reroute frequency
- incident processing
- journey completion

Avoid logging raw precise location unless explicitly required and governed.

---

# 59. Analytics Requirements

Analytics should measure product behavior without unnecessary sensitive data.

Suggested events:

```text
app_opened
search_started
search_completed
place_viewed
destination_selected
journey_planning_started
route_requested
route_selected
trip_started
trip_rerouted
trip_completed
trip_cancelled
place_added_to_trip
place_saved
place_unsaved
incident_reported
location_permission_granted
location_permission_denied
```

Do not send raw precise coordinates to analytics by default.

---

# 60. Feature Flags

Feature flags should support progressive rollout.

Examples:

```text
routing.transit
routing.cycling
routing.two_wheeler
places.photos
trip.notifications
offline.maps
new.home
ai.preference_memory
trip.intelligence
simulation
```

Flags must:

- have safe defaults
- be observable
- be removable after rollout
- support rollback

---

# 61. Repository Requirements

Recommended monorepo:

```text
wayve/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── ui/
│   ├── types/
│   ├── config/
│   ├── maps/
│   ├── routing/
│   └── validation/
├── db/
│   ├── migrations/
│   └── seeds/
├── docs/
├── tests/
├── .github/
│   └── workflows/
├── package.json
└── README.md
```

If a separate API is unnecessary initially, the web server layer may fulfill the API role.

---

# 62. Testing Requirements

## Unit

Test:

- validation
- intent normalization
- route normalization
- provider adapters
- geospatial calculations
- journey state transitions
- reroute thresholds
- preference extraction
- utilities

## Integration

Test:

- API + database
- authentication
- search provider
- routing provider
- place provider
- trip lifecycle
- incident ingestion
- replanning pipeline

## E2E

Critical journey:

```text
Open Wayve
→ search
→ select destination
→ request routes
→ compare
→ select route
→ start
→ navigate
→ simulate deviation
→ reroute
→ complete
→ save destination
```

## Visual regression

Protect:

- Home
- Search
- Conversation
- Destination selection
- Route comparison
- Trip preview
- Live navigation
- Replanning
- Place detail
- Trip Intelligence
- Mobile sheets
- Desktop map composition

---

# 63. CI/CD Requirements

Every pull request should run:

```text
lint
typecheck
unit tests
integration tests
build
```

Main branch should additionally run:

```text
E2E tests
security/dependency checks
deployment
```

Environments:

```text
local
development
staging
production
```

Database migrations must be version-controlled and forward-compatible.

---

# 64. MVP Definition

The MVP must allow a user to:

1. Open Wayve
2. Obtain or choose an origin
3. Search for a destination
4. Use natural-language destination requests
5. Resolve ambiguous destinations
6. Select a place
7. View the destination on a map
8. Express basic journey preferences
9. Request routes
10. Compare available routes
11. Understand Wayve's recommendation
12. Select a route
13. Preview the journey
14. Start a trip
15. Track live progress
16. Handle a basic off-route reroute
17. Receive a meaningful route update
18. Switch or stay when prompted
19. Complete/cancel a trip
20. Save a destination
21. Return to recent/saved destinations

## MVP must demonstrate

The core differentiator:

```text
Natural-language request
→ structured journey
→ intelligent route selection
→ live monitoring
→ meaningful replanning
→ user-confirmed route switch
```

The MVP should not attempt to launch every mobility capability at once.

---

# 65. MVP Non-Goals

The first release should not require:

- every possible travel mode
- full multimodal routing
- real-time transit integrations
- parking marketplace
- EV charging marketplace
- fleet management
- collaborative trips
- downloadable offline maps
- extensive trip analytics
- native iOS and Android clients simultaneously
- broad mobility-provider marketplace integrations

These can follow after the core journey is reliable.

---

# 66. Phase 2

Potential additions:

- multi-stop journeys
- stronger transit routing
- rich nearby discovery
- richer route explanations
- trip history
- notifications
- sharing
- collaborative trips
- offline route support
- personalized destinations
- native mobile clients
- richer preference memory

---

# 67. Phase 3

Potential platform capabilities:

- multimodal trip planning
- real-time mobility availability
- public-transit live data
- parking
- EV charging
- fleet/business accounts
- advanced trip intelligence
- external mobility provider integrations

All future capabilities should remain modular and provider-independent.

---

# 68. Launch Scope Decisions

Before implementation lock, finalize:

- launch geography
- supported launch travel modes
- map tile provider
- geocoding/search provider
- routing provider
- weather provider
- traffic/incident source
- transit provider if applicable
- authentication provider
- cloud/deployment provider
- analytics provider
- error monitoring provider
- final visual tokens
- location retention policy
- privacy/legal requirements
- whether native apps are required at launch

---

# 69. Product Acceptance Criteria

A release candidate should not be considered complete unless:

## Core journey

- destination can be found
- ambiguity is handled
- journey preferences influence planning
- routes can be generated
- route alternatives can be compared
- recommendation is explainable
- user can confirm and start
- navigation can run
- active trip survives normal refresh/degradation
- off-route behavior works
- meaningful route changes are detected
- route switching works
- arrival is recognized
- trip can complete

## Agent

- context persists across follow-ups
- agent does not fabricate unavailable information
- agent does not expose internal traces
- agent decisions are reflected in structured journey state
- user remains in control of route switching

## UX

- map remains visually dominant
- mobile is first-class
- loading/empty/error/degraded states exist
- primary CTA is clear
- route reasoning is understandable
- accessibility requirements are met

## Engineering

- contracts are validated
- critical paths have automated tests
- observability exists
- secrets are protected
- provider credentials stay server-side
- privacy implications are documented
- rollback/feature-flag strategy exists

---

# 70. Definition of Done

A feature is production-ready when:

- UX matches approved design
- responsive behavior is verified
- accessibility requirements are met
- loading state exists
- empty state exists where relevant
- error state exists
- degraded state exists where relevant
- API contracts are validated
- unit tests cover critical logic
- integration tests cover external boundaries
- E2E coverage exists for critical user paths
- logs/metrics exist for failure-prone operations
- no secrets are exposed
- privacy implications are documented
- performance is acceptable on mobile
- rollback strategy exists where appropriate
- documentation is updated

---

# 71. Recommended Implementation Order

## Sprint 1 — Foundation

- monorepo
- TypeScript
- design tokens
- UI primitives
- database
- authentication
- CI
- provider interfaces
- core journey state model

## Sprint 2 — Maps + Search

- map shell
- location state
- search API
- search UI
- destination resolution
- place selection
- provider adapter

## Sprint 3 — Conversational Planning + Routing

- Ask Wayve input
- intent extraction
- preference extraction
- journey context
- route API
- route normalization
- route comparison
- route rendering
- travel modes

## Sprint 4 — Trips + Navigation

- trip model
- start/complete/cancel
- active-trip persistence
- progress UI
- navigation
- off-route detection
- basic rerouting

## Sprint 5 — Intelligence

- traffic/incident context
- weather context
- contextual stops
- route scoring
- Wayve recommendation
- route explanation
- replanning thresholds
- route switching

## Sprint 6 — Personalization

- saved places
- recents
- preferences
- preference memory if approved
- persistence

## Sprint 7 — Simulation + Hardening

- simulation event injection
- real replanning pipeline validation
- accessibility
- error/degraded UX
- performance
- offline/degraded behavior
- security
- observability
- E2E
- production deployment

---

# 72. Architecture Boundaries

The product should maintain clear boundaries between:

```text
UI
 ↓
Journey State
 ↓
Agent / Planning Orchestration
 ↓
Domain Services
 ├── Search
 ├── Places
 ├── Routing
 ├── Traffic / Incidents
 ├── Weather
 └── Location
 ↓
Provider Adapters
 ↓
External Services
```

The UI must not contain provider-specific business logic.

The agent must not directly manipulate low-level UI state.

The routing provider must not define Wayve's product concepts.

Journey state must remain the shared domain abstraction.

---

# 73. Core Domain Objects

The minimum domain vocabulary should include:

```text
User
Journey
Destination
Place
Stop
Route
RouteOption
ActiveTrip
Incident
JourneyPreference
JourneyEvent
SavedPlace
RecentSearch
TripIntelligence
```

The naming may evolve during implementation, but the conceptual separation should remain.

---

# 74. Journey as the Central Abstraction

The central product object is the journey.

Conceptually:

```ts
type Journey = {
  id: string;

  origin?: Coordinate;
  destination?: Destination;

  mode?: TravelMode;

  preferences: JourneyPreferences;

  stops: Stop[];

  routeOptions: RouteOption[];

  selectedRouteId?: string;

  status: JourneyStatus;

  activeTripId?: string;
};
```

This allows conversational modifications to update the same journey rather than restarting planning.

---

# 75. Journey Event Model

Important journey events should be represented explicitly.

Examples:

```text
journey_created
destination_resolved
preference_added
stop_requested
stop_added
routes_requested
routes_ready
route_selected
trip_started
position_updated
route_degraded
incident_detected
reroute_evaluated
reroute_offered
route_switched
route_declined
trip_arrived
trip_completed
trip_cancelled
```

Events should support:

- observability
- Trip Intelligence
- debugging
- analytics
- simulation
- future event-driven architecture

Sensitive data should not be attached unnecessarily.

---

# 76. Decision Logic Requirements

Wayve's recommendation logic must be contextual.

A conceptual route evaluation may consider:

```text
ETA
traffic
distance
scenic preference
weather
stops
tolls
road characteristics
user constraints
current journey priorities
confidence / data quality
```

No single factor should be assumed universally dominant.

The route evaluator must use the user's current journey objectives.

---

# 77. Data Quality Rules

Wayve must distinguish:

- known
- estimated
- stale
- unavailable
- user-reported
- provider-reported
- simulated

The UI should not represent estimated or stale information as exact live truth.

Where data quality materially affects a decision, the product should communicate the limitation.

---

# 78. Trust Requirements

Wayve's intelligence must be trustworthy.

Trust is built through:

- accurate state
- clear explanations
- visible uncertainty
- no fabricated data
- reversible decisions
- predictable behavior
- user control
- privacy transparency

A simpler honest answer is preferable to a detailed invented answer.

---

# 79. Safety-Critical UX Principle

Navigation is a safety-sensitive context.

During active navigation:

- minimize interaction complexity
- prioritize essential information
- avoid unnecessary notifications
- avoid large chat interfaces
- use glanceable controls
- keep route changes understandable
- avoid requiring unnecessary confirmation steps
- preserve navigation when non-critical services fail

---

# 80. Product Metrics

Initial product health should be measurable through metrics such as:

## Planning

- search completion rate
- destination resolution rate
- planning completion rate
- route generation success rate
- route selection rate

## Navigation

- trip start rate
- trip completion rate
- off-route frequency
- reroute frequency
- route-switch acceptance
- navigation failure rate

## Intelligence

- meaningful replanning rate
- repeated-prompt rate
- route explanation usage
- stop-addition success
- incident report processing success

## Reliability

- provider failure rate
- API error rate
- route latency
- search latency
- client crash rate

Metrics should not require invasive location tracking.

---

# 81. Open Product Questions

These questions should be resolved through product/design/engineering decisions rather than silently assumed:

1. What is the initial launch geography?
2. Which travel mode is the primary MVP mode?
3. Which map provider is used at launch?
4. Which routing provider is used at launch?
5. Which search/geocoding provider is used at launch?
6. Which traffic source is trusted?
7. Which weather source is trusted?
8. What exact route-switch threshold is considered meaningful?
9. How should conflicting user preferences be resolved?
10. Should preference memory ship in MVP?
11. What completed trip history is retained?
12. What notification system ships initially?
13. What authentication method ships initially?
14. Which analytics events are strictly necessary?
15. What native/mobile capabilities are required at launch?
16. Which capabilities are deliberately web/PWA-only initially?

---

# 82. Non-Negotiable Requirements

The following are hard product requirements for Wayve:

### N01
Wayve must be a trip product, not merely a map wrapper.

### N02
Natural-language planning must be a first-class interaction.

### N03
Follow-up requests must preserve journey context.

### N04
Ambiguous destinations must be clarified rather than silently selected.

### N05
User preferences must affect route evaluation.

### N06
Wayve recommendations must have understandable reasons.

### N07
Wayve must not fabricate unavailable traffic, weather, ETA, location, or confidence information.

### N08
Live navigation must remain simple and glanceable.

### N09
Meaningful route degradation must trigger replanning evaluation.

### N10
Route switching must preserve trip identity.

### N11
The user must remain in control of consequential route switching.

### N12
Simulation must exercise the real replanning pipeline.

### N13
Precise location must be handled with privacy-first defaults.

### N14
External providers must be abstracted.

### N15
The product must degrade gracefully when individual providers fail.

### N16
Mobile must be treated as a primary experience.

### N17
Every major state must have explicit loading, error, empty, and degraded behavior where applicable.

### N18
Internal agent/tool traces must never become normal user-facing UI.

---

# 83. Canonical Signature Experience

The following flow should remain the benchmark for product completeness:

```text
OPEN WAYVE
    ↓
GET / CHOOSE LOCATION
    ↓
"Where are we going?"
    ↓
USER:
"nearest hill station"
    ↓
INTENT EXTRACTION
    ↓
DESTINATION CANDIDATES
    ↓
USER SELECTS DESTINATION
    ↓
WAYVE:
"Anything else?"
    ↓
USER:
"Find somewhere for snacks and make it scenic.
I don't care if it's 10 minutes longer."
    ↓
UPDATE JOURNEY CONTEXT
    ↓
PREFERENCE EXTRACTION
    ↓
FIND STOP
    ↓
GATHER TRAFFIC / WEATHER / ROUTING
    ↓
GENERATE CANDIDATE ROUTES
    ↓
PREDICT ETAs
    ↓
ROUTE OPTIMIZATION
    ↓
WAYVE RECOMMENDATION
    ↓
ROUTE COMPARISON
    ↓
USER CONFIRMS
    ↓
TRIP PREVIEW
    ↓
START JOURNEY
    ↓
LIVE NAVIGATION
    ↓
MONITORING LOOP
    ↓
TRAFFIC / WEATHER / INCIDENT EVENT
    ↓
ROUTE DEGRADATION
    ↓
REPLANNING
    ↓
WAYVE:
"Alternative route saves 11 minutes."
    ↓
USER:
"Switch."
    ↓
ROUTE SWITCH
    ↓
NAVIGATION CONTINUES
    ↓
ARRIVAL
    ↓
TRIP INTELLIGENCE
```

If this flow works reliably, the core Wayve concept works.

---

# 84. Final Product Principle

Wayve should be built as:

> **a mobility intelligence platform centered around journeys, not a collection of map screens.**

The system should make complex mobility decisions feel simple without pretending that uncertainty does not exist.

The visible experience should remain:

- calm
- spatial
- intelligent
- conversational
- explainable
- responsive
- trustworthy
- user-controlled

The underlying system can be sophisticated.

The user should not have to be.

---

# 85. Source Documents

This master requirements document consolidates the current product direction from:

- `WAYVE_WIREFRAMES.md`
- `WAYVE_TECHNICAL_SPEC.md`

The wireframes define the map-dominant, conversation-first experience, the eight primary screens, responsive behavior, state matrix, canonical journey flow, simulation requirements, and UX rules. fileciteturn0file3L11-L43

The technical specification defines the modular-monolith architecture, provider abstraction, trip-first domain model, MVP boundary, implementation sequence, and production-readiness requirements. fileciteturn2file1L1005-L1179

---

# 86. Document Control

| Field | Value |
|---|---|
| Product | Wayve |
| Document | Master Requirements |
| Version | v1.0 |
| Status | Active product baseline |
| Date | 2026-09-17 |
| Primary abstraction | Journey / Trip |
| Primary UX | Map + conversational agent |
| Primary platform | Responsive Web / PWA |
| Architecture | Modular monolith first |
| MVP focus | Discover → Plan → Navigate → Replan → Arrive |
| Next source of truth | Approved product/design decisions |

---

**End of `WAYVE_MASTER_REQUIREMENTS.md`**
