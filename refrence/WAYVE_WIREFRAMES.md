# WAYVE — WIREFRAMES

> **Status:** Frozen low-fidelity product wireframe specification  
> **Artifact:** `WAYVE_WIREFRAMES.md`  
> **Purpose:** Implementation-ready screen, state, interaction, and responsive-layout reference for Wayve.

---

## 0. Wireframe North Star

Wayve is a **conversational agentic navigation system**. The map is the interface; the agent is the product.

The interface must feel like:

> **Apple Maps × modern AI product × spatial UI**

The intelligence underneath can be complex, but the visible experience must remain simple.

### Core UI principles

1. **Map-dominant** — the map owns the visual field.
2. **Conversation-first planning** — natural language is the primary planning interface.
3. **Floating UI** — use sheets, cards, pills, and overlays instead of permanent dashboard sidebars.
4. **One obvious next action** — every state should make the next useful action clear.
5. **Explain recommendations** — a route should have a concise reason, not merely a highlighted line.
6. **Keep the agent visible but subtle** — show useful intelligence status, never raw agent traces.
7. **User remains in control** — Wayve can recommend a reroute, but route switching is user-confirmed in the core experience.
8. **Context persists** — follow-up requests modify the current journey instead of restarting it.
9. **Semantic traffic colors** — green/amber/red are reserved for road-condition meaning and must not be the only indicator.
10. **Every screen is stateful** — loading, empty, success, error, degraded, and interaction states are designed explicitly.

The product definition identifies eight primary screens: Home / Explore, AI Trip Conversation, Destination / Place Selection, Route Comparison, Trip Preview, Live Navigation, Replanning / Incident, and Trip Intelligence. Supporting overlays include location, search, incident reporting, Wayve reasoning, weather, places, settings, and simulation.

---

# 1. Information Architecture

```text
WAYVE
│
├── 01 Home / Explore
│   ├── Search / Ask Wayve
│   ├── Quick journey modes
│   ├── Current journey
│   └── Report
│
├── 02 AI Trip Conversation
│   ├── Natural-language planning
│   ├── Intent extraction
│   ├── Preference refinement
│   └── Contextual modifications
│
├── 03 Destination / Place Selection
│   ├── Destination candidates
│   ├── Place results
│   └── Confirm destination
│
├── 04 Route Comparison
│   ├── Wayve recommendation
│   ├── Alternative routes
│   ├── Route details
│   └── Why this route?
│
├── 05 Trip Preview
│   ├── Journey summary
│   ├── Stops
│   ├── Weather
│   ├── Mode / preferences
│   └── Start Journey
│
├── 06 Live Navigation
│   ├── Maneuver
│   ├── Map
│   ├── ETA / distance
│   ├── Route attributes
│   ├── Report
│   └── Wayve Intelligence
│
├── 07 Replanning / Incident
│   ├── Route update
│   ├── Alternative route
│   ├── Switch
│   └── Stay
│
└── 08 Trip Intelligence
    ├── Journey metrics
    ├── Route changes
    ├── Time saved
    └── Why Wayve changed route

Supporting overlays
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

# 2. Global Layout Model

## Desktop

```text
┌──────────────────────────────────────────────────────────────────────┐
│ WAYVE                                  LIVE     ○    ☼    ⚙          │
│                                                                      │
│                 FLOATING PLANNING / STATUS UI                       │
│                                                                      │
│                                                                      │
│                         MAP CANVAS                                   │
│                                                                      │
│                                                                      │
│                                      route / incidents / location    │
│                                                                      │
│                                                                      │
│        + Report                              ◎ My Location           │
└──────────────────────────────────────────────────────────────────────┘
```

### Desktop rules

- Full viewport map.
- Header controls float above map.
- Planning UI occupies only the minimum space needed.
- Cards may anchor to map edges but must not create a permanent dashboard.
- Primary action should generally sit inside the active sheet/card.
- Map remains visible whenever possible.

## Tablet

```text
┌──────────────────────────────────────────────┐
│ WAYVE                              LIVE  ⚙   │
│                                              │
│                 MAP                          │
│                                              │
│                                              │
│                                              │
│       ┌────────────────────────────────┐     │
│       │ Active planning/navigation     │     │
│       │ sheet                          │     │
│       │                                │     │
│       └────────────────────────────────┘     │
│                                              │
│ + Report                         ◎ Location  │
└──────────────────────────────────────────────┘
```

### Tablet rules

- Map remains dominant.
- Planning and route information use bottom sheets or floating panels.
- Avoid a desktop-style permanent sidebar.

## Mobile

```text
┌─────────────────────────────┐
│ WAYVE                LIVE   │
│                             │
│                             │
│            MAP              │
│                             │
│                             │
│                             │
│ + Report             ◎      │
│                             │
│ ┌─────────────────────────┐ │
│ │ Active sheet            │ │
│ │                         │ │
│ │ Primary action         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Mobile rules

- Navigation-first.
- Bottom sheets are preferred for planning and route details.
- Never simply shrink the desktop composition.
- Touch targets must be comfortable.
- During active navigation, information density decreases rather than increases.

---

# 3. Global Components

These components recur across screens.

## 3.1 Wayve Header

```text
WAYVE                         LIVE     ☼     ⚙
```

### Contains

- Wayve wordmark.
- Current system mode/status where relevant.
- Theme control where implemented.
- Settings entry.

### Behavior

- Minimal.
- Floats over map.
- Does not become a permanent navigation bar.

---

## 3.2 Ask Wayve Input

```text
┌──────────────────────────────────────┐
│ Where are we going?                  │
│ 🔍  Ask Wayve...                 🎙  │
└──────────────────────────────────────┘
```

### Behavior

- Accepts natural language.
- Voice is optional enhancement.
- Enter/submit sends the current request into the conversation state.
- Existing journey context is retained when a journey already exists.

---

## 3.3 Journey Mode Pills

```text
⚡ Fast     🌿 Scenic     ☕ Relaxed     💰 Economy     🎯 Custom
```

### Behavior

Selecting a predefined mode changes route-optimization weights, not merely visual styling.

---

## 3.4 Primary CTA

Use one dominant action per state:

```text
[ Start Journey ]
[ Start Route ]
[ Switch Route ]
[ Confirm Destination ]
```

Avoid multiple competing primary buttons.

---

## 3.5 Report Button

```text
+ Report
```

Persistent during navigation where screen space permits.

Opens the incident-report sheet.

---

## 3.6 My Location

```text
◎
```

Behavior:

- Re-centers map.
- Shows location acquisition state when GPS is not ready.
- Accessible label: `Center map on my location`.

---

## 3.7 Wayve Intelligence Indicator

Collapsed:

```text
Wayve Intelligence
Checking traffic · Comparing routes...
```

Expanded:

```text
WAYVE INTELLIGENCE

✓ Understanding your trip
✓ Checking traffic
✓ Finding snack stops
✓ Comparing 3 routes
✓ Predicting arrival times
✓ Selecting your route

[ Why this route? ]
```

Never expose LangGraph traces, internal prompts, tool logs, or developer diagnostics.

---

# 4. SCREEN 01 — HOME / EXPLORE

## Purpose

Start a journey and establish Wayve as a navigation product rather than a chatbot or dashboard.

## Default desktop wireframe

```text
┌──────────────────────────────────────────────────────────────────────┐
│ WAYVE                                      LIVE      ☼       ⚙       │
│                                                                      │
│       ┌─────────────────────────────┐                                │
│       │ Where are we going?         │                                │
│       │ 🔍 Ask Wayve...         🎙  │                                │
│       └─────────────────────────────┘                                │
│                                                                      │
│                         MAP                                          │
│                                                                      │
│                  current location ◎                                  │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
│       + Report                              ◎ My Location             │
└──────────────────────────────────────────────────────────────────────┘
```

## Default mobile

```text
┌─────────────────────────────┐
│ WAYVE                 ⚙     │
│                             │
│ ┌─────────────────────────┐ │
│ │ Where are we going?     │ │
│ │ 🔍 Ask Wayve...      🎙 │ │
│ └─────────────────────────┘ │
│                             │
│            MAP              │
│                             │
│             ◎               │
│                             │
│                             │
│ + Report                 ◎  │
└─────────────────────────────┘
```

## Optional quick-start state

After first interaction or when the input is focused:

```text
Where are we going?

⚡ Fast       🌿 Scenic
☕ Relaxed   💰 Economy
🎯 Custom

Recent / Suggested
──────────────────
Lonavala
Panchgani
Mahabaleshwar
```

## Home states

### Loading — location

```text
Getting your location...
```

Map remains visible with neutral loading treatment.

### Location ready

```text
Where are we going?
```

### Location unavailable

```text
Location unavailable

You can still search for a destination.

[ Search destination ]
```

Do not fabricate a current location.

### Existing journey

```text
CURRENT JOURNEY

Lonavala
28 min · 18.7 km

[ Continue Journey ]
```

### Error

```text
Wayve couldn't load the map.

[ Try Again ]
```

---

# 5. SCREEN 02 — AI TRIP CONVERSATION

## Purpose

Turn natural language into structured journey intent while preserving conversational context.

## Design principle

This should feel like an **AI planning layer over navigation**, not ChatGPT embedded in a map.

## Initial state

```text
┌──────────────────────────────────────────────────────────────┐
│ WAYVE                                                        │
│                                                              │
│                         Where are we going?                  │
│                                                              │
│                 ┌──────────────────────────┐                 │
│                 │ Ask Wayve...             │                 │
│                 └──────────────────────────┘                 │
│                                                              │
│             ⚡ Fast   🌿 Scenic   ☕ Relaxed   💰 Economy     │
│                                                              │
│                           MAP                                │
└──────────────────────────────────────────────────────────────┘
```

## Conversation state

Example:

```text
┌─────────────────────────────────────────────┐
│ WAYVE                                       │
│                                             │
│ You                                         │
│ "nearest hill station"                      │
│                                             │
│ Wayve                                       │
│ I found 3 nearby hill stations.             │
│ Which one are we heading to?                │
│                                             │
│ [ Lonavala ] [ Panchgani ] [ Matheran ]     │
│                                             │
│ You                                         │
│ "Find snacks and make it scenic."           │
│                                             │
│ Wayve                                       │
│ Got it. I'll look for a convenient snack    │
│ stop and prioritize a scenic drive.         │
│                                             │
│ [ Continue ]                                │
└─────────────────────────────────────────────┘
```

## Required interaction behavior

### New journey

```text
User request
   ↓
Intent extraction
   ↓
Destination resolution
   ↓
Preference extraction
   ↓
Planning
```

### Existing journey modification

```text
CURRENT JOURNEY
       +
NEW USER REQUEST
       ↓
Update journey context
       ↓
Recalculate affected objectives
       ↓
Update route candidates
```

Example:

> "Need coffee before we get there."

must modify the current journey rather than start a new journey.

## Conversation states

### Thinking / processing

```text
Wayve

Understanding your trip...
```

Optional expanded activity:

```text
✓ Understanding destination
✓ Reading preferences
● Finding places
○ Comparing routes
```

### Clarification required

```text
I found a few places that match.
Which one do you mean?

[ Place A ]
[ Place B ]
[ Place C ]
```

### Preference confirmation

```text
I can make this a scenic, relaxed drive.

Prioritizing:
🌿 Scenic roads
🚦 Lower traffic
🥪 Convenient stop

[ Sounds good ]
[ Change preferences ]
```

### Error

```text
I couldn't finish planning this journey.

[ Try Again ]
```

---

# 6. SCREEN 03 — DESTINATION / PLACE SELECTION

## Purpose

Resolve ambiguous destinations and select context-aware places/stops.

## Destination selection

```text
┌──────────────────────────────────────────────────────────────┐
│ ← Back                                                       │
│                                                              │
│ I found 3 nearby hill stations                              │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Lonavala                                                  │ │
│ │ 65 km · ~1h 35m                                           │ │
│ │ Hill station · Popular                                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Panchgani                                                 │ │
│ │ 118 km · ~2h 35m                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Matheran                                                  │ │
│ │ 92 km · ~2h 10m                                           │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Rule

Do not silently choose an ambiguous destination.

Flow:

```text
Understand destination type
        ↓
Search candidates
        ↓
Rank geographic relevance
        ↓
Present candidates
        ↓
User selects
```

## Place selection

Example: user asks for snacks.

```text
┌──────────────────────────────────────────┐
│ Stops along your route                   │
│                                          │
│ 🥪 Snack stop                            │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Local Market                         │ │
│ │ 7 min detour                         │ │
│ │ Open · Along route                   │ │
│ │                         [ Add ]      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Grocery Store                        │ │
│ │ 4 min detour                         │ │
│ │ Along route                          │ │
│ │                         [ Add ]      │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

## Place states

- Loading places.
- Places found.
- No suitable places.
- Provider error.
- Partial results.
- Selected place.
- Added to journey.

No-result example:

```text
No suitable snack stops were found along the current route.

[ Search nearby ]
[ Continue without a stop ]
```

---

# 7. SCREEN 04 — ROUTE COMPARISON

## Purpose

Present candidate routes and make Wayve's decision understandable.

## Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back                         ROUTES                                │
│                                                                      │
│                         MAP                                          │
│                                                                      │
│            ───────────── Route A ─────────────                     │
│                    ───────── Route B ─────────                      │
│                       ───── Route C ─────                           │
│                                                                      │
│ ┌──────────────────────────────┐                                    │
│ │ WAYVE'S PICK                 │                                    │
│ │                              │                                    │
│ │ 28 min       18.7 km         │                                    │
│ │                              │                                    │
│ │ 🌿 Scenic                    │                                    │
│ │ 🚦 Low traffic               │                                    │
│ │ 🥪 Snack stop                │                                    │
│ │                              │                                    │
│ │ +4 min vs fastest            │                                    │
│ │                              │                                    │
│ │ [ Start Route ]              │                                    │
│ │                              │                                    │
│ │ [ Why this route? ]          │                                    │
│ └──────────────────────────────┘                                    │
└──────────────────────────────────────────────────────────────────────┘
```

## Route cards

### Wayve recommendation

```text
WAYVE'S PICK

28 min · 18.7 km

🌿 Scenic
🚦 Low traffic
🥪 Snack stop

+4 min vs fastest

[ Start Route ]
[ Why this route? ]
```

### Alternative

```text
FASTEST

24 min · 17.9 km

🚦 Moderate traffic

[ Select ]
```

### Another alternative

```text
LOW TRAFFIC

31 min · 19.8 km

🚦 Low traffic
🌧 Lower weather exposure

[ Select ]
```

## Route comparison information hierarchy

1. Route identity.
2. ETA.
3. Distance.
4. Meaningful attributes.
5. Difference from fastest/current route.
6. Primary action.
7. Explanation.

## Route selection interaction

Selecting an alternative:

```text
Route B selected
        ↓
Map highlights Route B
        ↓
Card becomes active
        ↓
Primary CTA becomes "Start Route"
```

## Why this route overlay

```text
WHY THIS ROUTE?

Wayve selected this route because it:

+ Matches your scenic preference
+ Has lower predicted congestion
+ Includes your snack stop
+ Has favorable weather conditions

− 4 min slower than the fastest route

Confidence
87%
```

Do not present a route as universally "best". Explain why it matches the current journey objectives.

---

# 8. SCREEN 05 — TRIP PREVIEW

## Purpose

Provide a final, calm confirmation before navigation starts.

## Desktop

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back                         YOUR JOURNEY                         │
│                                                                      │
│                         MAP                                          │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐     │
│ │ Lonavala                                                     │     │
│ │                                                              │     │
│ │ 📍 Starting from                                             │     │
│ │ Current location                                             │     │
│ │                                                              │     │
│ │ 🥪 Stop                                                       │     │
│ │ Snack shop                                                   │     │
│ │                                                              │     │
│ │ 🌤 Weather                                                    │     │
│ │ 24°C · Clear                                                  │     │
│ │                                                              │     │
│ │ 🚗 Journey                                                    │     │
│ │ Leisure                                                       │     │
│ │                                                              │     │
│ │ 🛣 Preference                                                 │     │
│ │ Scenic + Low traffic                                         │     │
│ │                                                              │     │
│ │ 3 routes found                                               │     │
│ │ 24 min  Fastest                                              │     │
│ │ 28 min  Scenic ← Wayve                                       │     │
│ │ 31 min  Low traffic                                          │     │
│ │                                                              │     │
│ │ [ Start Journey ]                                            │     │
│ └──────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

## Preview rules

Show:

- Destination.
- Starting point.
- Stops.
- Weather.
- Journey mode.
- Key preferences.
- Number of route alternatives.
- Selected route.
- Primary CTA.

Do not overload the preview with raw data.

## States

### Loading

```text
Preparing your journey...
Checking route, weather and stops.
```

### Ready

Full journey summary.

### Partial data

```text
Your route is ready.

Weather data is temporarily unavailable.
The latest available route information will be used.
```

### Error

```text
Wayve couldn't prepare this journey.

[ Try Again ]
[ Review route ]
```

---

# 9. SCREEN 06 — LIVE NAVIGATION

## Purpose

Provide safe, minimal turn-by-turn navigation while Wayve monitors the journey.

## Desktop

```text
┌──────────────────────────────────────────────────────────────────────┐
│ WAYVE                                                        LIVE    │
│                                                                      │
│ ┌────────────────────────────────┐                                   │
│ │ ↰  500 m                       │                                   │
│ │ Turn left onto NH 48           │                                   │
│ └────────────────────────────────┘                                   │
│                                                                      │
│                              MAP                                     │
│                                                                      │
│                              ▲                                       │
│                              │                                       │
│                              │                                       │
│                                                                      │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐     │
│ │ 28 min              18.7 km                                  │     │
│ │ Lonavala                                                     │     │
│ │ 🌿 Scenic · 🚦 Low traffic                                   │     │
│ └──────────────────────────────────────────────────────────────┘     │
│                                                                      │
│ + Report                                             ◎               │
└──────────────────────────────────────────────────────────────────────┘
```

## Mobile

```text
┌─────────────────────────────┐
│ WAYVE                 LIVE  │
│                             │
│ ┌─────────────────────────┐ │
│ │ ↰ 500 m                 │ │
│ │ Turn left onto NH 48    │ │
│ └─────────────────────────┘ │
│                             │
│            MAP              │
│                             │
│              ▲              │
│              │              │
│                             │
│                             │
│ ┌─────────────────────────┐ │
│ │ 28 min      18.7 km     │ │
│ │ Lonavala                │ │
│ │ 🌿 Scenic · 🚦 Low      │ │
│ └─────────────────────────┘ │
│ + Report                 ◎  │
└─────────────────────────────┘
```

## Navigation must show

- Next maneuver.
- Distance to maneuver.
- Map.
- Current location.
- ETA.
- Remaining distance.
- Destination.
- Current route attributes.
- Report action.
- AI status when relevant.

## Navigation must NOT show

- Agent traces.
- Tool call logs.
- Internal model names.
- Raw route scores.
- Excessive analytics.
- Large chat transcript.

## Navigation states

### GPS acquiring

```text
Finding your location...
```

### GPS active

Normal navigation.

### GPS lost

```text
GPS signal lost

Showing the latest available route.
```

Keep route visible if possible.

### Off route

```text
You left the planned route.

Recalculating...
```

### Recalculating

```text
Wayve is checking the best path from here...
```

### Arrived

```text
You've arrived.

Lonavala

[ Trip Intelligence ]
```

---

# 10. SCREEN 07 — REPLANNING / INCIDENT

## Purpose

Communicate meaningful route degradation and offer a route change.

## Trigger examples

- Traffic update.
- Weather change.
- User report.
- Simulated incident.
- Road closure.
- ETA degradation.
- Route invalidation.
- User instruction.

## Incident card

```text
┌──────────────────────────────────────────┐
│ ⚠ ROUTE UPDATE                           │
│                                          │
│ Heavy traffic detected ahead             │
│                                          │
│ CURRENT ROUTE                            │
│ ETA +14 min                              │
│                                          │
│ WAYVE FOUND AN ALTERNATIVE               │
│                                          │
│ Route B                                  │
│ ETA −11 min                              │
│                                          │
│ Save approximately 11 minutes            │
│                                          │
│ [ Switch Route ]                         │
│ [ Stay on Route ]                        │
└──────────────────────────────────────────┘
```

## Expanded incident reasoning

```text
WHY THE UPDATE?

Traffic signal: Moderate → Heavy
User report: 1 recent report
Predicted delay: +14 min
Alternative improvement: ~11 min

Confidence: 82%
```

## Switch interaction

```text
[ Switch Route ]
       ↓
Confirm route transition
       ↓
Map animates to new route
       ↓
Navigation resumes
```

The route switch should be understandable and reversible through normal navigation controls.

## Stay state

If user chooses:

```text
Staying on current route.

I'll continue monitoring conditions.
```

Do not repeatedly prompt for the same insignificant event.

## Replanning threshold

Wayve should not reroute for every tiny change.

The UI should only interrupt navigation when the backend determines the change is meaningful according to configured thresholds/hysteresis.

---

# 11. SCREEN 08 — TRIP INTELLIGENCE

## Purpose

Secondary analytics and explanation screen demonstrating what happened during the journey.

This is **not** the primary navigation interface.

## Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ ← Back                    TRIP INTELLIGENCE                  │
│                                                              │
│ Today's journey                                              │
│                                                              │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ Distance   │ │ Travel     │ │ Reroutes   │ │ Time saved │ │
│ │ 42.8 km    │ │ 58 min     │ │ 2          │ │ 13 min     │ │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                              │
│ WHY WAYVE CHANGED YOUR ROUTE                                 │
│                                                              │
│ Traffic          ███████████                                 │
│ User report      ███████                                     │
│ Weather          ████                                        │
│ ETA prediction   ████████                                    │
│ Preference       █████████                                   │
│                                                              │
│ ROUTE CHANGES                                                │
│                                                              │
│ 18:42  Heavy traffic detected                                │
│ 18:43  Alternative route evaluated                            │
│ 18:44  Route switched                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Metrics

Primary:

- Distance.
- Travel time.
- Reroutes.
- Time saved.

Supporting:

- Route changes.
- Reasons for changes.
- User reports.
- Weather influence.
- ETA prediction influence.
- Preference influence.

## Empty state

```text
TRIP INTELLIGENCE

Complete a journey to see route decisions,
changes and insights here.
```

## Partial-data state

```text
Some trip intelligence is unavailable.

The journey itself completed successfully.
```

---

# 12. SUPPORTING OVERLAY — LOCATION PICKER

## Purpose

Choose or change origin.

```text
┌──────────────────────────────────────────┐
│ LOCATION                                 │
│                                          │
│ ◎ Current location                       │
│                                          │
│ Search a starting point                  │
│ ┌──────────────────────────────────────┐ │
│ │ 🔍 Search                             │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Recent locations                         │
│ • Home                                   │
│ • Pune                                   │
│ • Previous location                      │
└──────────────────────────────────────────┘
```

States:

- Detecting.
- Located.
- Permission unavailable.
- Search.
- Selected.
- Error.

---

# 13. SUPPORTING OVERLAY — SEARCH

```text
┌──────────────────────────────────────────┐
│ ← Search                                │
│                                          │
│ 🔍 Lonavala                              │
│                                          │
│ RESULTS                                  │
│                                          │
│ 📍 Lonavala, Maharashtra                 │
│ 📍 Lonavala Lake                         │
│ 📍 Lonavala market                       │
│                                          │
│ RECENT                                   │
│ • Panchgani                              │
└──────────────────────────────────────────┘
```

Search can resolve:

- Destinations.
- Places.
- Stops.
- Route-related locations.

Search should remain compatible with natural-language requests.

---

# 14. SUPPORTING OVERLAY — REPORT INCIDENT

## Entry

```text
+ Report
```

## Step 1

```text
WHAT'S HAPPENING?

🚦 Heavy traffic
🚗 Accident
🚧 Construction
⛔ Road blocked
🌊 Flooding
⚠ Hazard
📍 Other
```

## Step 2

```text
HOW FAR AHEAD?

○ < 500 m
○ < 1 km
○ < 2 km
○ > 2 km

[ Submit Report ]
```

## Success

```text
Report submitted

Thanks — Wayve will use this to evaluate
road conditions.
```

## Error

```text
Couldn't submit the report.

[ Try Again ]
```

## Backend implication

A submitted report becomes a real incident/event:

```text
user report
    ↓
location + type + severity
    ↓
incident
    ↓
traffic/context intelligence
    ↓
route cost update
    ↓
re-evaluation
```

---

# 15. SUPPORTING OVERLAY — WAYVE REASONING

## Purpose

Expose useful reasoning without exposing internal agent traces.

```text
┌──────────────────────────────────────────┐
│ WHY THIS ROUTE?                          │
│                                          │
│ Wayve selected this route because it:    │
│                                          │
│ + Matches your scenic preference         │
│ + Has lower predicted congestion         │
│ + Includes your snack stop               │
│ + Has favorable weather conditions       │
│                                          │
│ − 4 min slower than fastest route        │
│                                          │
│ Confidence                               │
│ 87%                                      │
│                                          │
│ [ Close ]                                │
└──────────────────────────────────────────┘
```

Optional route-level factors:

```text
ROUTE FACTORS

ETA                  ████████
Traffic              █████████
Scenic                ██████████
Weather              █████
Stops                ███████
Distance             ██████
```

The UI should describe the decision, not reveal proprietary implementation details.

---

# 16. SUPPORTING OVERLAY — WEATHER

Weather is both information and a decision factor.

```text
┌──────────────────────────────────────────┐
│ WEATHER                                  │
│                                          │
│ Current route                            │
│ 24°C · Clear                             │
│                                          │
│ Route A                                  │
│ Rain probability 70%                     │
│ Mountain road                            │
│                                          │
│ Route B                                  │
│ Rain probability 20%                     │
│ Highway                                  │
│                                          │
│ Weather is influencing route selection.  │
└──────────────────────────────────────────┘
```

If user preference is:

> "I don't want to drive in rain."

The UI may show:

```text
RAIN AVOIDANCE
Active journey preference
```

Weather must affect routing when relevant, not merely appear as decorative information.

---

# 17. SUPPORTING OVERLAY — PLACES

Contextual request:

> "Need coffee before we get there."

```text
┌──────────────────────────────────────────┐
│ PLACES ALONG YOUR ROUTE                  │
│                                          │
│ ☕ Coffee                                │
│                                          │
│ Coffee Shop A                            │
│ 3 min detour · Along route               │
│ [ Add Stop ]                             │
│                                          │
│ Coffee Shop B                            │
│ 6 min detour · Near route                │
│ [ Add Stop ]                             │
│                                          │
│ Coffee Shop C                            │
│ 9 min detour                             │
│ [ Add Stop ]                             │
└──────────────────────────────────────────┘
```

Adding a place must update the current journey and trigger route evaluation.

---

# 18. SUPPORTING OVERLAY — SETTINGS

Keep settings lightweight.

```text
┌──────────────────────────────────────────┐
│ SETTINGS                                 │
│                                          │
│ Appearance                               │
│ ○ System  ○ Light  ○ Dark                │
│                                          │
│ Navigation                               │
│ ○ Units                                  │
│ ○ Route preferences                      │
│                                          │
│ Privacy                                  │
│ ○ Preference memory                      │
│                                          │
│ About Wayve                              │
│ ○ Version                                │
└──────────────────────────────────────────┘
```

Preference memory, if implemented:

- Opt-in.
- User-visible.
- Editable.
- Deletable.
- Separate from transient journey state.

---

# 19. SUPPORTING OVERLAY — SIMULATION

## Purpose

Provide a deterministic demonstration environment that exercises the real replanning pipeline.

## Entry

```text
LIVE | SIMULATION
```

## Simulation sheet

```text
┌──────────────────────────────────────────┐
│ SIMULATION                               │
│                                          │
│ Current trip                             │
│ ──────────────────────────────────────── │
│                                          │
│ INJECT EVENT                             │
│                                          │
│ ○ Heavy traffic                          │
│ ○ Accident                               │
│ ○ Road closure                           │
│ ○ Construction                           │
│ ○ Heavy rain                             │
│ ○ Event congestion                       │
│                                          │
│ Affected route                           │
│ [ Route A ▼ ]                            │
│                                          │
│ Severity                                 │
│ [────────●────]                          │
│                                          │
│ [ Apply ]                                │
└──────────────────────────────────────────┘
```

## After Apply

```text
BEFORE

Route A → 24 min
Route B → 29 min

SIMULATED EVENT

Heavy traffic on Route A

AFTER

Route A → 41 min
Route B → 29 min

WAYVE

"Route B now saves 12 min."

[ Switch Route ]
```

## Simulation architecture visible to UX

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

Simulation is not a fake animation. It must use the same decision/replanning pipeline as real events.

---

# 20. JOURNEY STATE → SCREEN MAPPING

```text
IDLE
  → Home

PLANNING
  → AI Trip Conversation

DESTINATION_RESOLVED
  → Destination / Place Selection
  → Conversation

ROUTES_LOADING
  → Route Comparison loading

ROUTES_READY
  → Route Comparison

AWAITING_CONFIRMATION
  → Trip Preview

NAVIGATING
  → Live Navigation

MONITORING
  → Live Navigation

REPLANNING
  → Replanning / Incident

ROUTE_SWITCH_PENDING
  → Replanning / Incident confirmation

ARRIVED
  → Arrival state
  → Trip Intelligence

ERROR
  → Context-specific error state
```

---

# 21. COMPLETE SIGNATURE USER FLOW

This is the canonical Wayve experience and should be used to validate the wireframes.

```text
OPEN WAYVE
    ↓
GET LOCATION
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
ML ETA PREDICTION
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
SIMULATED / REAL TRAFFIC EVENT
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

---

# 22. PRIMARY INTERACTION FLOWS

## 22.1 Natural-language destination

```text
Ask Wayve
   ↓
Parse request
   ↓
Destination known?
   ├── Yes → Continue planning
   └── No
        ↓
     Search candidates
        ↓
     User selects
```

## 22.2 Natural-language preference

```text
User says:
"I want a chill scenic drive."
        ↓
Preference extraction
        ↓
Journey mode / preference vector
        ↓
Route scoring
        ↓
Updated route recommendation
```

## 22.3 Add stop

```text
Current journey
      +
"Find coffee on the way."
      ↓
Search POIs along route
      ↓
Evaluate detours
      ↓
User selects stop
      ↓
Journey updated
      ↓
Routes re-evaluated
```

## 22.4 User report

```text
+ Report
   ↓
Select incident
   ↓
Select distance
   ↓
Submit
   ↓
Create incident
   ↓
Context intelligence
   ↓
Re-evaluate current route
```

## 22.5 Dynamic replanning

```text
Condition changes
      ↓
Affected segment identified
      ↓
Current route degraded?
      ├── No → Continue
      └── Yes
           ↓
        Generate alternatives
           ↓
        Predict ETAs
           ↓
        Score
           ↓
        Worth switching?
           ├── No → Continue monitoring
           └── Yes
                ↓
             Notify user
                ↓
             Switch / Stay
```

---

# 23. EVERY SCREEN — STATE MATRIX

Every primary screen must implement the following baseline states:

| State | Requirement |
|---|---|
| Default | Normal initial presentation |
| Loading | Data/process is being fetched or computed |
| Empty | No results/data |
| Success | Primary task completed |
| Error | Recoverable failure |
| Partial | Some services/data unavailable |
| Degraded | Product continues using latest available information |
| Interaction | User is actively changing the state |
| Transition | Movement between states/screens |

Additional navigation states:

| Navigation state | Requirement |
|---|---|
| GPS acquiring | Explicit location status |
| GPS lost | Continue gracefully where possible |
| Off route | Recalculate |
| Incident detected | Assess and communicate |
| Replanning | Show concise Wayve status |
| Awaiting confirmation | User choice |
| Route switched | Confirm transition |
| Arrived | Clear arrival state |

---

# 24. LOADING STATE LANGUAGE

Loading copy should communicate what Wayve is doing in human terms.

Use:

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

Avoid:

```text
Running Agent B...
Executing tool call #7...
LangGraph node active...
XGBoost inference...
```

---

# 25. ERROR / DEGRADED UX

Wayve must never fabricate unavailable information.

## Map provider unavailable

```text
Map data is temporarily unavailable.

[ Try Again ]
```

## Weather unavailable

```text
Weather data is unavailable.

I'll continue using the latest available
route information.
```

## Traffic unavailable

```text
Live traffic data is unavailable.

Route recommendations will use the
latest available information.
```

## ML unavailable

```text
Arrival prediction is temporarily unavailable.

I'll continue with available route estimates.
```

## GPS unavailable

```text
We can't access your current location.

[ Enable Location ]
[ Choose Starting Point ]
```

## General planning failure

```text
I couldn't finish planning this journey.

[ Try Again ]
```

Never display invented traffic, weather, ETA, or confidence values.

---

# 26. ACCESSIBILITY WIREFRAME REQUIREMENTS

Every screen must support:

- Keyboard navigation.
- Visible focus states.
- Semantic HTML.
- Accessible labels.
- Sufficient contrast.
- Screen-reader-friendly controls.
- Reduced motion.
- Appropriate mobile touch targets.
- Non-color-only traffic communication.

Example:

Do not rely only on:

```text
RED ROUTE
```

Use:

```text
Heavy traffic
+ red semantic indicator
```

---

# 27. RESPONSIVE BEHAVIOR MATRIX

| Feature | Desktop | Tablet | Mobile |
|---|---|---|---|
| Map | Dominant canvas | Dominant canvas | Full-screen base |
| Ask Wayve | Floating card | Floating card | Top/bottom sheet |
| Conversation | Floating panel | Bottom/side sheet | Full-height sheet |
| Route cards | Floating stack | Bottom sheet | Swipeable stack |
| Trip preview | Floating panel | Bottom sheet | Bottom sheet |
| Navigation | Minimal overlays | Minimal overlays | Full navigation |
| Incident | Floating card | Bottom sheet | Bottom sheet |
| Trip Intelligence | Full page | Full page | Scrollable page |
| Report | Persistent | Persistent | Floating button |
| Settings | Sheet | Sheet | Full-screen sheet |

---

# 28. MOTION WIREFRAME NOTES

Motion should communicate state, not decorate the product.

## Required motion opportunities

### Route generation

```text
route line draws onto map
```

### Route switching

```text
old route de-emphasizes
        ↓
new route becomes active
        ↓
ETA updates
```

### Replanning

```text
incident marker appears
        ↓
route visibly updates
        ↓
alternative route appears
```

### Cards

Use subtle:

- slide.
- fade.
- expand/collapse.
- state transition.

### Reduced motion

If reduced-motion is enabled:

- Remove route-drawing animation.
- Reduce card transitions.
- Avoid pulsing indicators.
- Preserve state clarity without motion.

---

# 29. VISUAL DESIGN RULES FOR IMPLEMENTATION

## Use

- Neutral palette.
- One Wayve accent.
- Large confident typography.
- Rounded cards.
- Floating panels.
- Simple line icons.
- Generous whitespace.
- Map-dominant layouts.
- Subtle motion.

## Avoid

- Neon cyberpunk.
- Excessive gradients.
- Excessive glassmorphism.
- Giant AI blobs.
- Too many colors.
- Generic dashboard layouts.
- Permanent analytics sidebars.
- Developer-console aesthetics.

## Semantic colors

```text
Green  → normal traffic
Amber  → moderate traffic
Red    → heavy traffic
```

These colors must be paired with text/icons where accessibility requires it.

---

# 30. WIREFRAME COMPONENT HIERARCHY

Every state should follow approximately this hierarchy:

```text
1. CONTEXT
   Where am I?
   What journey am I in?

2. PRIMARY INFORMATION
   Where am I going?
   What is happening?

3. WAYVE DECISION
   What does Wayve recommend?

4. REASON
   Why?

5. ACTION
   What can I do now?

6. SECONDARY DETAIL
   Additional information if requested.
```

The interface should not force users to understand the underlying architecture to use the product.

---

# 31. UI ↔ INTELLIGENCE BOUNDARY

The frontend represents outcomes of the intelligence layer.

```text
USER
 ↓
CONVERSATION
 ↓
STRUCTURED INTENT
 ↓
TOOLS / DATA
 ↓
TRAFFIC & CONTEXT
 ↓
ML PREDICTION
 ↓
ROUTE OPTIMIZATION
 ↓
WAYVE DECISION
 ↓
UI
```

The UI may expose:

- recommendation.
- confidence.
- concise reason.
- relevant factors.
- current status.

The UI should not expose:

- hidden prompts.
- raw tool arguments.
- internal agent graph.
- provider implementation details unless relevant to the user.
- arbitrary model-generated numerical route decisions.

---

# 32. SCREEN ACCEPTANCE CHECKLIST

## Home

- [ ] Map is dominant.
- [ ] Ask Wayve is obvious.
- [ ] Current location is visible.
- [ ] Report is available.
- [ ] Quick modes can start planning.
- [ ] Location failure has a fallback.

## AI Trip Conversation

- [ ] Natural language works.
- [ ] Context persists.
- [ ] Ambiguity creates clarification.
- [ ] Preferences are represented.
- [ ] Existing journey can be modified.
- [ ] Loading/error states exist.

## Destination / Place Selection

- [ ] Multiple candidates are understandable.
- [ ] Ambiguous destinations are not silently selected.
- [ ] Place results show detour relevance.
- [ ] Add/remove stop is clear.
- [ ] Empty/error states exist.

## Route Comparison

- [ ] Multiple route alternatives visible.
- [ ] Wayve recommendation is identifiable.
- [ ] ETA and distance visible.
- [ ] Route attributes visible.
- [ ] Difference from fastest route visible.
- [ ] Why this route is available.
- [ ] User can choose another route.

## Trip Preview

- [ ] Destination visible.
- [ ] Origin visible.
- [ ] Stops visible.
- [ ] Weather visible when available.
- [ ] Mode/preferences visible.
- [ ] Start Journey is obvious.

## Live Navigation

- [ ] Next maneuver prominent.
- [ ] Map remains dominant.
- [ ] ETA/distance visible.
- [ ] Destination visible.
- [ ] Report available.
- [ ] AI status subtle.
- [ ] GPS/off-route states exist.

## Replanning / Incident

- [ ] Incident reason clear.
- [ ] Current route impact clear.
- [ ] Alternative benefit clear.
- [ ] Switch and Stay actions distinct.
- [ ] User retains control.

## Trip Intelligence

- [ ] Distance visible.
- [ ] Travel time visible.
- [ ] Reroutes visible.
- [ ] Time saved visible.
- [ ] Route-change reasons visible.
- [ ] Empty/partial states exist.

---

# 33. SIGNATURE DEMO WIREFRAME SEQUENCE

The following sequence should be visually coherent from beginning to end.

## Frame 01 — Home

```text
WAYVE

Where are we going?

[ Ask Wayve... ]

MAP
```

## Frame 02 — User request

```text
You:
"nearest hill station"
```

## Frame 03 — Destination resolution

```text
I found 3 nearby hill stations.

[ Lonavala ]
[ Panchgani ]
[ Matheran ]
```

## Frame 04 — Contextual refinement

```text
You:
"Find somewhere for snacks and make it scenic.
I don't care if it's 10 minutes longer."
```

## Frame 05 — Wayve activity

```text
✓ Understanding your trip
✓ Finding snack stops
✓ Checking traffic
✓ Checking weather
✓ Comparing 3 routes
✓ Predicting arrival times
```

## Frame 06 — Route comparison

```text
WAYVE'S PICK

28 min · 18.7 km
🌿 Scenic
🚦 Low traffic
🥪 Snack stop

+4 min vs fastest

[ Start Route ]
```

## Frame 07 — Navigation

```text
↰ 500 m
Turn left onto NH 48

MAP

28 min · 18.7 km
Lonavala
🌿 Scenic · 🚦 Low traffic
```

## Frame 08 — Simulated incident

```text
SIMULATION

Heavy traffic on Route A
```

## Frame 09 — Replanning

```text
ROUTE UPDATE

Heavy traffic detected ahead

Current route
ETA +14 min

Alternative
ETA −11 min

Save approximately 11 minutes

[ Switch Route ]
[ Stay on Route ]
```

## Frame 10 — New route

```text
ROUTE SWITCHED

Route B
27 min · 17.9 km

Continuing navigation...
```

## Frame 11 — Trip Intelligence

```text
TRIP INTELLIGENCE

Distance     42.8 km
Travel time  58 min
Reroutes     2
Time saved   13 min

WHY WAYVE CHANGED YOUR ROUTE

Traffic
User report
Weather
ETA prediction
Preference
```

This sequence demonstrates the central product identity without turning the interface into a technical dashboard.

---

# 34. FINAL WIREFRAME PRINCIPLES

These are the rules that should remain frozen while implementing the UI.

1. **Wayve is navigation first, AI second in visual presentation.**
2. **The map is the interface.**
3. **The agent is the intelligence layer behind the experience.**
4. **Natural language is a first-class input.**
5. **Conversation modifies journey context instead of restarting it.**
6. **Ambiguous destinations require user selection.**
7. **Route recommendations must communicate why they were selected.**
8. **Journey modes affect actual route optimization.**
9. **Traffic, weather, places, and user reports influence decisions where relevant.**
10. **User reports become real backend incidents.**
11. **Replanning is meaningful, not noisy.**
12. **The user remains in control of route switching.**
13. **Simulation exercises the real replanning pipeline.**
14. **AI activity is visible but never exposed as developer logs.**
15. **Trip Intelligence is secondary, not the main product interface.**
16. **Every screen has explicit loading, empty, success, error, and degraded states.**
17. **Mobile is redesigned around navigation, not a shrunken desktop.**
18. **Accessibility is part of the wireframe, not post-processing.**
19. **No fabricated traffic, weather, ETA, or confidence data.**
20. **Complex intelligence underneath; ridiculously simple experience.**

---

## 35. Relationship to the Product Specification

This wireframe artifact operationalizes the frozen Wayve definition: Wayve transforms natural-language travel intent into personalized route objectives, combines routing, traffic, weather, places, and human-reported road conditions, uses prediction and optimization to select a route, explains that decision, and continuously monitors the journey for meaningful replanning.

The eight primary screens and supporting overlays are derived from the frozen product definition and are intended to be the UI source of truth before implementation.

