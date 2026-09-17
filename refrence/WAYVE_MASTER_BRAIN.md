# WAYVE — Revalued Product Definition

Yeah. Before we touch code, **we should freeze what Wayve actually is.**

Looking at the references you gave, there’s a very clear direction: **Wayve should not look like a college project with a map slapped onto it.** It should feel like a modern navigation product — clean, spatial, minimal, polished — while the intelligence underneath is substantially more advanced than the UI suggests.

The key idea:

> **Wayve is an AI journey agent, not a map application.**

The map is the interface.
The **agent is the product.**

---

# 1. What exactly are we building?

### **Wayve**

> **An agentic AI navigation system that understands what the user wants from a journey, builds a route around those preferences, continuously monitors conditions, and dynamically replans when circumstances change.**

Normal navigation is basically:

```text
Where are you?
        ↓
Where are you going?
        ↓
Fastest route
        ↓
Navigate
```

Wayve:

```text
What are you trying to do?
        ↓
Understand intent
        ↓
Understand preferences
        ↓
Gather context
        ↓
Generate possible routes
        ↓
Predict route conditions
        ↓
Evaluate routes
        ↓
Recommend one
        ↓
Navigate
        ↓
Monitor
        ↓
Something changes?
        ↓
Re-evaluate
        ↓
Replan
```

That's the distinction we should build the entire project around.

---

# 2. The killer feature

The first thing I would **lock in** is conversational trip planning.

Imagine opening Wayve:

### Wayve

> **Where are we going?**

User:

> "yo I wanna go to the nearest hill station"

Wayve doesn't just search for a destination.

It understands:

```json
{
  "intent": "find_destination",
  "destination_type": "hill_station",
  "distance_preference": "nearest"
}
```

It searches possible destinations.

Then:

> **I found 3 nearby hill stations. Which one are we heading to?**

User selects one.

Wayve:

> **Anything else?**

User:

> "yeah grab some snacks on the way and I don't mind taking a longer route, weather's nice and we're just out for a chill drive"

Now Wayve extracts:

```text
Destination
    ↓
Hill station

Required stop
    ↓
Snack / grocery store

Journey style
    ↓
Leisure / scenic

Time constraint
    ↓
Low urgency

Weather
    ↓
Good conditions

Optimization preference
    ↓
Experience > minimum ETA
```

And **that becomes the routing problem.**

That's WAY more interesting than:

> Start: Pune
> Destination: Lonavala
> Click "Directions"

---

# 3. Wayve's core intelligence

I would structure the product around **7 intelligence layers**.

| Layer           | What Wayve does                        |
| --------------- | -------------------------------------- |
| 🧠 Intent       | Understands natural language           |
| 📍 Context      | Location, destination, time, weather   |
| 🚦 Traffic      | Traffic + incidents + road conditions  |
| 🗺️ Routing     | Generates multiple feasible routes     |
| 🔮 Prediction   | Predicts travel time / congestion      |
| ⚖️ Optimization | Scores routes according to user intent |
| 🔄 Replanning   | Continuously reevaluates the journey   |

And then:

### **Explainability**

Wayve should be able to answer:

> **"Why this route?"**

For example:

```text
WAYVE RECOMMENDS ROUTE B

+ Scenic roads
+ Lower congestion
+ Snack stop included
+ Better weather conditions

− 8 min longer

Your trip preference:
Leisure drive
██████████████████░░

Traffic:
Low

Confidence:
87%
```

This is where the AI actually becomes visible.

---

# 4. The architecture

I'd now simplify our architecture slightly.

Don't make 15 fake agents.

We want **real agents doing meaningful reasoning.**

```text
                    ┌───────────────────┐
                    │      USER         │
                    │ Chat / Voice / UI │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │ CONVERSATION      │
                    │ AGENT             │
                    │                   │
                    │ Intent extraction │
                    │ Preferences       │
                    │ Trip context      │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │ JOURNEY PLANNING  │
                    │ AGENT             │
                    │                   │
                    │ Plans tool calls  │
                    │ Builds trip       │
                    └─────────┬─────────┘
                              ↓
          ┌───────────────────┼───────────────────┐
          ↓                   ↓                   ↓
     MAP / ROUTING        ENVIRONMENT         USER INPUT
     ─────────────        ───────────         ─────────
     Directions           Weather             Traffic report
     Geocoding            Traffic             Accident
     Places               Road condition      Construction
     Map matching                             Road blocked
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ↓
                    ┌───────────────────┐
                    │ TRAFFIC & CONTEXT │
                    │ INTELLIGENCE      │
                    │ AGENT             │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │ ML PREDICTION     │
                    │                   │
                    │ ETA               │
                    │ Congestion        │
                    │ Delay             │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │ ROUTE DECISION    │
                    │ AGENT             │
                    │                   │
                    │ Score routes      │
                    │ Apply preferences│
                    │ Select route      │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │      WAYVE        │
                    │ Recommendation    │
                    │ + Explanation     │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │       MAP         │
                    │ Navigation        │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │ MONITORING LOOP   │
                    └─────────┬─────────┘
                              ↓
                    CHANGE DETECTED?
                       ↙           ↘
                     NO             YES
                     ↓               ↓
                  Continue       REPLAN
```

This is a **very defensible Agentic AI architecture**.

---

# 5. The agents

## Agent 1 — Conversation / Journey Agent

This is the personality/interface layer.

It converts:

> "I wanna take a chill drive, stop somewhere for snacks and avoid highways"

into structured objectives.

Example:

```json
{
  "destination": "Lonavala",
  "stops": [
    {
      "type": "grocery",
      "purpose": "snacks"
    }
  ],
  "preferences": {
    "scenic": 0.85,
    "fastest": 0.30,
    "traffic": 0.80,
    "highways": -0.40
  },
  "journey_mode": "leisure"
}
```

---

# 6. Agent 2 — Traffic & Environment Intelligence

This is where we fuse information.

### Inputs

```text
Mapbox Traffic
        +
Weather
        +
OSM
        +
Road incidents
        +
User reports
        +
Historical information
        ↓
Traffic Intelligence
```

Example:

```text
Road A

Mapbox:
Moderate traffic

Weather:
Rain expected

User:
"Heavy traffic ahead"

Historical:
Usually congested at 6 PM

                    ↓

Combined assessment:

HIGH CONGESTION RISK
Confidence: 82%
```

This gives us a proper research component.

---

# 7. Agent 3 — Route Decision Agent

Suppose routing produces:

```text
Route A
24 min
18.2 km

Route B
29 min
17.4 km

Route C
34 min
21.1 km
```

A normal navigator says:

> Route A — fastest.

Wayve asks:

```text
What does the user actually want?
```

If the user said:

> "I want a scenic drive and don't mind taking longer."

Then:

```text
Route A
Fast       ██████████
Scenic     ████
Traffic    ██████

Route B
Fast       ███████
Scenic     █████████
Traffic    ███

Route C
Fast       █████
Scenic     ██████████
Traffic    ██
```

Wayve might select B.

Not because:

> "B is objectively the best route."

But:

> **"B best matches the current trip objectives."**

That's an important distinction for our project/report.

---

# 8. Agent 4 — Replanning Agent

This is the **agentic loop**.

Suppose we're already driving.

```text
CURRENT ROUTE

A ────────────────→ B ───────────────→ C
                       🚗
```

User says:

> "yo there's crazy traffic ahead"

Wayve:

```text
USER REPORT
     ↓
Current GPS
     ↓
Map-match to road
     ↓
Identify affected segment
     ↓
Increase estimated road cost
     ↓
Generate alternatives
     ↓
Predict new ETAs
     ↓
Evaluate
     ↓
Recommend
```

Then:

> **Traffic detected ahead.**
>
> **Route B is now estimated to save 13 min.**
>
> Switch route?

That is probably our **best demo moment**.

---

# 9. User-reported intelligence

This deserves its own major feature.

A floating button:

### `+ Report`

opens:

```text
What's happening?

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

Then:

> **Report submitted**

Backend creates:

```json
{
  "type": "heavy_traffic",
  "location": {...},
  "reported_at": "...",
  "source": "user",
  "severity": 0.8,
  "confidence": 0.65
}
```

Multiple reports can increase confidence.

This gives us:

### **Human-in-the-loop traffic intelligence**

which is a very nice phrase for the paper.

---

# 10. Simulation Mode

**Absolutely mandatory.**

We cannot depend on an actual accident happening during the presentation 💀.

So Wayve needs:

### `LIVE` | `SIMULATION`

Simulation panel:

```text
SIMULATION

Current trip
────────────────────

Inject event

○ Heavy traffic
○ Accident
○ Road closure
○ Construction
○ Heavy rain
○ Event congestion

Affected route
[ Route A ▼ ]

Severity
[████████░░]

Apply
```

Then:

```text
BEFORE

Route A → 24 min
Route B → 29 min


SIMULATED EVENT

Heavy traffic on Route A


AFTER

Route A → 41 min
Route B → 29 min

WAYVE:
"Route B now saves 12 min."
```

This makes the project **reproducible and demonstrable**.

---

# 11. ML component

We should also have an actual predictive model.

Not:

> "LLM predicts traffic."

No.

Use an actual ML model.

For example:

### XGBoost / LightGBM

Inputs:

```text
Hour
Day of week
Road type
Distance
Current traffic
Historical traffic
Weather
Temperature
Rain
Incident severity
Road speed
```

Output:

```text
Predicted travel time
```

Then we can report:

```text
Actual ETA:       31 min
Map ETA:          34 min
Wayve ML ETA:     30.8 min
```

And evaluate:

* MAE
* RMSE
* R²

That gives the project genuine ML depth.

---

# 12. XAI

Since we want this to look like a serious engineering project, we can add:

### "Why did Wayve choose this route?"

And internally:

```text
Route score

Traffic              ████████████
User preference       ██████████
Predicted ETA         ████████
Weather               █████
Distance              ████
Scenic value          █████████
```

For the ML model:

### SHAP

could explain:

```text
Prediction: 31.4 min

Factors increasing ETA
──────────────────────
Heavy traffic       +4.2 min
Rain                +1.7 min
Peak hour           +2.1 min

Factors reducing ETA
──────────────────────
Highway             -3.8 min
Low distance        -1.4 min
```

Now our report has:

**Agentic AI + ML + XAI + optimization + real-time systems.**

---

# 13. The UI should NOT look like a dashboard

This is important after looking at your references.

The UI references are telling us something.

We should **not** make:

```text
┌──────────┬────────────────────────────┐
│ Sidebar  │                            │
│ Dashboard│       MAP                 │
│ Analytics│                            │
│ Agents   │                            │
│ Settings │                            │
└──────────┴────────────────────────────┘
```

That's enterprise software.

Wayve should feel like:

### **Navigation product + AI companion**

---

# 14. Main Wayve screen

Something like:

```text
┌──────────────────────────────────────────────────────────────┐
│ WAYVE                                    ◉ LIVE     ☼   ⚙    │
│                                                              │
│   ┌─────────────────────────┐                                │
│   │  Where are we going?    │                                │
│   │  🔍 Ask Wayve...        │                                │
│   └─────────────────────────┘                                │
│                                                              │
│                         MAP                                  │
│                                                              │
│                    ────────                                  │
│                  ╱          ╲                                │
│                ╱              ╲                              │
│                                                              │
│                                              ◉               │
│                                                              │
│             ┌─────────────────────┐                          │
│             │  📍  Current route  │                          │
│             │  24 min · 18.2 km   │                          │
│             └─────────────────────┘                          │
│                                                              │
│       + Report                    ◉ My Location              │
└──────────────────────────────────────────────────────────────┘
```

Clean.

Lots of whitespace.

Rounded cards.

Minimal typography.

Map remains dominant.

---

# 15. Search / conversation experience

Instead of a giant chatbot occupying half the screen, make it feel like an **AI search layer**.

Initial:

> **Where are we going?**

Then:

> **I'm thinking about a weekend drive.**

Wayve:

> *Nice. What kind of drive are we looking for?*

Quick options:

```text
⚡ Fastest
🌿 Scenic
☕ Relaxed
💰 Economy
🎯 Custom
```

But the user can always type naturally.

---

# 16. Trip Planning Sheet

Once Wayve understands the request:

```text
YOUR JOURNEY

Lonavala
────────────────────────────

📍 Starting from
Current location

🥪 Stop
Snack shop

🌤 Weather
24°C · Clear

🚗 Journey
Leisure

🛣 Preference
Scenic + Low traffic

────────────────────────────

3 routes found

24 min    Fastest
28 min    Scenic       ← Wayve
31 min    Low traffic
```

Then:

### `Start Journey`

---

# 17. Route comparison

This is another screen we absolutely need.

Not just colored lines on a map.

When alternatives exist:

```text
ROUTES

┌─────────────────────────────┐
│ WAYVE'S PICK                │
│                             │
│ 28 min    18.7 km           │
│                             │
│ 🌿 Scenic                   │
│ 🚦 Low traffic              │
│ 🥪 Snack stop               │
│                             │
│ +4 min vs fastest            │
│                             │
│ [ Start Route ]             │
└─────────────────────────────┘

┌─────────────────────────────┐
│ FASTEST                     │
│                             │
│ 24 min    17.9 km           │
│ 🚦 Moderate traffic         │
└─────────────────────────────┘
```

---

# 18. Navigation screen

This should take inspiration from your second/third reference.

Very minimal.

```text
┌─────────────────────────────────────────────┐
│                                             │
│  ↰  500 m                                   │
│     Turn left onto NH 48                    │
│                                             │
│                    MAP                      │
│                                             │
│                         ▲                   │
│                         │                   │
│                         │                   │
│                                             │
│                                             │
│      ┌─────────────────────────────────┐    │
│      │ 28 min       18.7 km             │    │
│      │ Lonavala                         │    │
│      │                                  │    │
│      │ 🌿 Scenic · 🚦 Low traffic       │    │
│      └─────────────────────────────────┘    │
│                                             │
│     + Report          ◉                     │
└─────────────────────────────────────────────┘
```

---

# 19. AI activity should be subtle

We **should show the agent working**, because that's important for the project.

But don't dump LangGraph logs onto the user 😂.

Instead:

### Wayve Intelligence

```text
✓ Understanding your trip
✓ Checking traffic
✓ Finding snack stops
✓ Comparing 3 routes
✓ Predicting arrival times
✓ Selecting your route
```

Expandable:

> **Why this route?**

Then show the reasoning summary.

This makes the AI feel alive without looking like a developer console.

---

# 20. Live incident card

If something changes:

```text
⚠️ ROUTE UPDATE

Heavy traffic detected ahead

Route A
ETA +14 min

Wayve found an alternative:

Route B
ETA −11 min

──────────────────

Save approximately
11 minutes

[ Switch Route ]
[ Stay on Route ]
```

That's a **beautiful demo interaction**.

---

# 21. Wayve should have journey modes

Not just visual presets.

These should actually alter route optimization.

### ⚡ Fast

```text
ETA       ██████████
Traffic   ███████
Scenic    ██
Stops     ██
```

### 🌿 Scenic

```text
ETA       █████
Traffic   ██████
Scenic    ██████████
Stops     █████
```

### ☕ Leisure

```text
ETA       ████
Traffic   ███████
Scenic    █████████
Stops     █████████
```

### 💰 Economy

```text
Fuel      ██████████
Tolls     ██████████
Distance  ███████
ETA       █████
```

And:

### `Custom`

User simply tells Wayve what they want.

---

# 22. Places should be context-aware

This is where our conversational system gets interesting.

User:

> "Need coffee before we get there."

Wayve shouldn't restart the whole trip.

It understands:

```text
CURRENT JOURNEY
      +
NEW CONSTRAINT
      ↓
Find coffee stops
      ↓
Evaluate detour
      ↓
Update route
```

Then:

> **Found 4 coffee stops along your route.**

That is **agentic interaction**.

---

# 23. Weather should actually affect decisions

Not just:

> 24°C ☀️

Weather becomes a routing factor.

Example:

```text
Route A
Rain probability: 70%
Mountain road

Route B
Rain probability: 20%
Highway
```

If user says:

> "I don't want to drive in rain."

Wayve adjusts the route.

Again:

**natural language → objective → tool calls → decision.**

---

# 24. The data sources

Our backend roughly becomes:

```text
                 WAYVE
                   │
       ┌───────────┼────────────┐
       ↓           ↓            ↓
    MAPBOX       WEATHER       OSM
       │           │            │
    Routes       Weather     Road/POI
    Traffic                   data
    Geocode
    Map Match
       │           │            │
       └───────────┼────────────┘
                   ↓
             WAYVE DATA LAYER
                   ↑
                   │
            USER REPORTS
                   │
                   ↓
             ML PREDICTOR
                   │
                   ↓
             ROUTE SCORER
```

Important:

### Mapbox is not our AI.

Mapbox gives us navigation infrastructure.

### Wayve is the intelligence layer sitting above it.

---

# 25. What happens when an API doesn't know about traffic?

This was one of our strongest ideas.

Suppose:

```text
Mapbox:
Normal traffic
```

User:

> "Traffic is horrible ahead."

Wayve:

```text
GPS
 ↓
Current road
 ↓
User incident
 ↓
Traffic intelligence
 ↓
Temporary road penalty
 ↓
Alternative route generation
 ↓
Re-score
```

So Wayve doesn't blindly say:

> "API says traffic is fine."

It incorporates **fresh human input**.

That's a proper human-in-the-loop system.

---

# 26. Memory

We can eventually have:

### "Wayve remembers your preferences."

For example:

```text
Kaustubh's preferences

🌿 Likes scenic routes
🚫 Avoids tolls
☕ Likes coffee stops
🚗 Usually prefers relaxed driving
```

Then:

> "Let's go to Lonavala."

Wayve can use those preferences.

This should be **opt-in**, and for CA3 we can keep it lightweight.

---

# 27. Voice

Potentially extremely cool.

During navigation:

> **"Yo, there's heavy traffic ahead."**

Speech → intent:

```text
REPORT_INCIDENT
type = heavy_traffic
location = current_route + GPS
```

Wayve responds:

> **"Got it. I'm checking alternatives."**

Then:

> **"Route B is currently 12 minutes faster. Want me to switch?"**

That would look insane in a demo.

Voice can be an enhancement after the core system works.

---

# 28. Dashboard / Analytics

We should have a secondary **Trip Intelligence** screen, but not make it the main interface.

Something like:

```text
TRIP INTELLIGENCE

Today's journey
────────────────────

Distance
42.8 km

Travel time
58 min

Reroutes
2

Time saved
13 min

────────────────────

WHY WAYVE CHANGED YOUR ROUTE

Traffic              █████████
User report          ███████
Weather              ████
ETA prediction       ████████
Preference           █████████
```

For the academic presentation, this screen is gold.

---

# 29. Architecture of the actual software

I'd go with something approximately like:

```text
Frontend
────────────────────
Next.js / React
Tailwind
Mapbox GL JS
Framer Motion


Backend
────────────────────
Python
FastAPI

Agent Framework
────────────────────
LangGraph

LLM
────────────────────
Local / API
Ollama / DeepSeek / etc.


ML
────────────────────
XGBoost / LightGBM
scikit-learn
SHAP


Data
────────────────────
PostgreSQL
PostGIS


External
────────────────────
Mapbox
OpenStreetMap
Open-Meteo


Testing
────────────────────
Pytest
Simulation Engine
```

---

# 30. One VERY important architectural rule

### Don't let the LLM directly calculate everything.

Bad:

```text
LLM
 ↓
"Route B seems better."
```

That's hard to defend academically.

Instead:

```text
LLM
 ↓
Intent
 ↓
Tools
 ↓
Data
 ↓
ML
 ↓
Optimization
 ↓
Route score
 ↓
Agent decision
 ↓
LLM explanation
```

The LLM handles **language, planning and tool orchestration**.

Our deterministic/ML components handle **actual numerical decisions**.

That's much stronger.

---

# 31. Route scoring

We can have an actual scoring model:

```text
Route Score =
w₁ × ETA
+ w₂ × Traffic
+ w₃ × Distance
+ w₄ × Weather Risk
+ w₅ × Toll Cost
+ w₆ × Scenic Value
+ w₇ × Stop Detour
+ w₈ × Incident Risk
```

The weights are derived from the user's intent.

For:

> "I need to reach quickly."

```text
ETA weight ↑↑↑
Scenic ↓
Stops ↓
```

For:

> "We're just going for a chill drive."

```text
Scenic ↑↑
Traffic ↑↑
ETA ↓
Stops ↑
```

This is the bridge between:

**LLM → mathematical optimization.**

---

# 32. The complete user journey

This is the workflow I'd put on our master wireframe.

```text
                    OPEN WAYVE
                        │
                        ↓
                GET LOCATION
                        │
                        ↓
                "Where we going?"
                        │
                        ↓
               USER CONVERSATION
                        │
                        ↓
              EXTRACT INTENT
                        │
                        ↓
            DESTINATION RESOLUTION
                        │
                        ↓
             UNDERSTAND PREFERENCES
                        │
                        ↓
              GATHER ENVIRONMENT
              /      |       \
          Traffic Weather    POIs
              \      |       /
                    ↓
             GENERATE ROUTES
                    │
                    ↓
              ML ETA PREDICTION
                    │
                    ↓
              ROUTE OPTIMIZATION
                    │
                    ↓
             WAYVE RECOMMENDATION
                    │
                    ↓
                USER CONFIRMS
                    │
                    ↓
                 NAVIGATE
                    │
                    ↓
               MONITOR LOOP
                    │
            ┌───────┴────────┐
            │                │
        NO CHANGE        CHANGE
            │                │
            ↓                ↓
        CONTINUE          REPLAN
                             │
                             ↓
                       NEW ROUTES
                             │
                             ↓
                     USER NOTIFICATION
                             │
                             ↓
                         NAVIGATE
```

---

# 33. MVP vs Grand Version

We need to be disciplined here.

## 🔴 Phase 1 — Core MVP

Must work:

* Map
* Current location
* Destination search
* Route generation
* Alternative routes
* Basic chat
* Intent extraction
* Route selection
* Navigation UI

---

## 🟠 Phase 2 — Actual Intelligence

Add:

* Traffic
* Weather
* Places
* User incident reports
* Route scoring
* ML ETA
* Agent orchestration
* Dynamic replanning

---

## 🟡 Phase 3 — "Holy shit this is polished"

Add:

* Beautiful animations
* Route comparison
* Agent activity
* XAI
* Simulation mode
* Voice
* Trip analytics
* Preference memory
* Dark/light themes
* Responsive design

---

# 34. The design language

Based directly on the references you uploaded, I'd establish:

### Visual philosophy

**Apple Maps × modern AI product × spatial UI**

Not:

* neon cyberpunk
* excessive gradients
* glassmorphism everywhere
* giant glowing AI blobs
* 20 different colors
* generic dashboard cards

Instead:

### Typography

Clean, large, confident.

### Cards

Soft rounded corners.

### Map

The map should occupy **most of the screen**.

### UI

Floating panels rather than permanent sidebars.

### Icons

Simple line icons.

### Colors

Mostly neutral.

One **Wayve accent color** used for:

* active route
* primary CTA
* location
* AI state

Traffic retains semantic colors:

```text
Green → normal
Amber → moderate
Red → heavy
```

### Motion

Subtle:

* route drawing
* cards sliding
* map transitions
* ETA changes
* agent status transitions

No unnecessary animation.

---

# 35. The visual hierarchy

This is extremely important.

Every screen should answer:

### 1. Where am I?

Map / location.

### 2. Where am I going?

Destination.

### 3. What's happening?

Traffic / incidents / weather.

### 4. What does Wayve recommend?

Primary route.

### 5. Why?

Compact explanation.

### 6. What can I do?

One obvious action.

That keeps the interface clean.

---

# 36. Main screens we should wireframe

I would make **8 primary screens**.

| #  | Screen                            | Purpose                   |
| -- | --------------------------------- | ------------------------- |
| 01 | **Home / Explore**                | Start a journey           |
| 02 | **AI Trip Conversation**          | Natural-language planning |
| 03 | **Destination / Place Selection** | Resolve destinations      |
| 04 | **Route Comparison**              | Compare candidate routes  |
| 05 | **Trip Preview**                  | Confirm complete journey  |
| 06 | **Live Navigation**               | Navigate                  |
| 07 | **Replanning / Incident**         | Dynamic route changes     |
| 08 | **Trip Intelligence**             | Analytics + explanations  |

And supporting overlays:

```text
Location picker
Search
Report incident
Wayve reasoning
Weather
Places
Settings
Simulation
```

---

# 37. Our "signature" interaction

If we're showing this to faculty, **this should be the demo storyline**:

### Scene 1

> **Wayve:** Where are we going?

### Scene 2

> **User:** "Nearest hill station."

Wayve finds destinations.

### Scene 3

User selects one.

> **Wayve:** Anything else?

### Scene 4

> **User:** "Yeah, find somewhere for snacks and make it a scenic drive. I don't care if it's 10 minutes longer."

### Scene 5

Wayve:

> **I found 3 routes.**
>
> I'm prioritizing scenic roads, low traffic and a convenient snack stop.

### Scene 6

Route comparison.

Wayve chooses a route that isn't simply fastest.

### Scene 7

Navigation starts.

### Scene 8

Inject simulated traffic.

### Scene 9

Wayve:

> **Traffic detected ahead.**
>
> The current route is now estimated to take 14 minutes longer.
>
> **Alternative route saves 11 minutes.**

### Scene 10

User:

> "Switch."

### Scene 11

Wayve reroutes.

### Scene 12

Show:

> **Trip Intelligence**
>
> Route changed
> Reason: congestion
> Time saved: 11 min

**That single demo demonstrates almost the entire project.**

---

# 38. What makes Wayve academically interesting?

Our final project isn't:

> "We built a map using Mapbox."

It's:

> **"We developed an agentic decision-making layer for personalized dynamic route recommendation."**

The research problem becomes:

### Existing navigation

Primarily optimizes around conventional routing objectives such as travel time and distance.

### Wayve

Introduces:

```text
Natural language intent
        +
User preferences
        +
Real-time context
        +
User-generated information
        +
Predictive ML
        +
Route optimization
        +
Autonomous replanning
```

into one decision loop.

---

# 39. Our final system in ONE diagram

This should eventually become our architecture figure:

```text
                         ┌─────────────┐
                         │    USER     │
                         └──────┬──────┘
                                │
                         Natural Language
                                │
                                ▼
                    ┌──────────────────────┐
                    │  CONVERSATION AGENT  │
                    │ Intent + Preferences │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ JOURNEY PLANNER      │
                    │ Agentic Tool Calling │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
          ROUTING           TRAFFIC           WEATHER
          MAP/POI            DATA              DATA
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ TRAFFIC INTELLIGENCE │
                    │ Data Fusion + Events │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   ML PREDICTION      │
                    │ ETA / Congestion     │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ ROUTE OPTIMIZATION   │
                    │ Preference-based     │
                    │ Scoring              │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  WAYVE DECISION      │
                    │ + XAI EXPLANATION    │
                    └──────────┬───────────┘
                               │
                               ▼
                         ┌───────────┐
                         │ MAP / NAV │
                         └─────┬─────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ MONITOR ROUTE │
                       └───────┬───────┘
                               │
                         Change detected?
                          /             \
                        No               Yes
                        │                 │
                     Continue         REPLAN
                                          │
                                          └──────→ ↑
```

---

# 40. So, what are we actually building?

If I had to freeze the entire project into one statement:

> **Wayve is a conversational agentic navigation system that transforms natural-language travel intent into personalized route objectives, combines routing, traffic, weather, places and human-reported road conditions, uses predictive models to estimate route outcomes, selects and explains a suitable route, and continuously monitors the journey to autonomously recommend replanning when conditions change.**

That's our **north star**.

And the UI philosophy is:

> **The intelligence should be complex underneath, but the experience should feel ridiculously simple.**

---

## Next step: DON'T CODE YET.

Before Antigravity touches the repo, I'd do this in order:

### **STEP 01 — Product architecture**

Freeze:

* modules
* agents
* tools
* APIs
* ML components
* database
* state flow

### **STEP 02 — Feature specification**

For every feature:

* input
* processing
* output
* API
* agent
* UI

### **STEP 03 — Information architecture**

Map all screens and navigation between them.

### **STEP 04 — Wireframes**

Low-fidelity first — **every screen and every state**.

### **STEP 05 — Design system**

Typography, spacing, cards, buttons, icons, map styling, animations, light/dark.

### **STEP 06 — Technical architecture**

Repo structure + frontend/backend + LangGraph + APIs + ML pipeline.

### **STEP 07 — Implementation plan**

Break the whole thing into ~18 days of actual development.

### **STEP 08 — THEN Antigravity**

Give it the architecture + wireframes + design system + implementation spec rather than just saying:

> "Build me an AI maps app."

That way we're designing **Wayve as a product first**, and coding it second.
