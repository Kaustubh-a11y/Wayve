# Wayve: AI Agent for Traffic Route Recommendation
## Mini Project Presentation (PBL ESE) — Symbiosis Institute of Technology, Nagpur

---

### Slide 1: Title Slide
- **Project Title:** AI Agent for Traffic Route Recommendation (Wayve)
- **Course / Event:** Mini Project Presentation (Flexi Credit Course: Agentic AI & Automation)
- **Institution:** Symbiosis Institute of Technology (SIT), Nagpur Campus
- **Presenter:** Kaustubh Kachole (PRN: 24070521098, B.Tech CSE)
- **Under the Guidance of:** Dr. Parag Naik (Assistant Professor, Dept. of CSE)
- **Subject Coordinator:** Dr. Shreyas Rajendra Hole

---

### Slide 2: Presentation Flow (Agenda)
1. **01. Problem Statements** — Urban congestion traps and single-objective routing flaws
2. **02. Research Initiatives / Objectives** — Multi-objective optimization, HCM LOS, and neural voice
3. **03. Existing Processes / Solutions** — Overview of Google Maps, Waze, and Academic GNNs
4. **04. Compare & Contrast Alternative Solutions** — Comparative feature matrix
5. **05. Problem Modeling & Algorithm Development** — Greenshields model, HCM LOS, and composite utility scoring
6. **06. Implementation of Project Features** — Architecture, 10-route portfolio, HUD, and Sarvam AI TTS
7. **07. Results and Outcomes** — Empirical delay savings, departure windows, and performance benchmarks
8. **08. Analysis of Developed Solution** — Strengths, limitations, and future scope
9. **Project Artifacts & GitHub** — Repository links and live demonstration

---

### Slide 3: 01. Problem Statements
- **Single-Objective Congestion Traps:** Traditional navigation tools route all drivers onto the same "fastest" path, inducing secondary phantom jams (Braess's Paradox).
- **Lack of Physical Traffic Flow Modeling:** Systems use static delay estimates rather than grounded traffic engineering principles (e.g., Highway Capacity Manual standards).
- **Coarse Bottleneck Detection:** Existing apps display broad red segments but fail to identify the exact physical choke points (flyovers, merge lanes, toll gates).
- **Monolithic Navigation Experience:** Generic robotic audio guidance lacks localized Indian accent nuances and proactive spatial warnings.

---

### Slide 4: 02. Research Initiatives / Objectives
- **Multi-Objective Pareto Routing:** Simultaneously optimize travel time, road capacity, fuel economy, and incident immunity.
- **HCM Level of Service (LOS) Integration:** Implement Highway Capacity Manual (HCM 6th Edition) formulas to grade routes from **LOS A** (free-flow) to **LOS F** (breakdown).
- **Dynamic Coordinate-Pinned Bottlenecks:** Pin specific bottleneck markers directly onto route polylines with queue lengths and speed-drop percentages.
- **Multimodal Dual-Voice Copilot:** Introduce natural Indian English navigation via Sarvam AI alongside global US English TTS.
- **Sub-Second Real-Time HUD:** Build a reactive, browser-based turn-by-turn navigation heads-up display.

---

### Slide 5: 03. Existing Processes / Solutions
- **Commercial Heuristic GPS (Google Maps, Apple Maps):**
  - *Pros:* Massive probe telemetry, accurate static ETAs.
  - *Cons:* Greedy shortest-path algorithms concentrate traffic onto narrow arterials; no deep physical capacity insights.
- **Crowdsourced Navigation (Waze):**
  - *Pros:* User-submitted hazards and police alerts.
  - *Cons:* Erratic detour suggestions through residential alleys; highly dependent on active community density.
- **Academic Deep Learning (ST-GCN, DCRNN):**
  - *Pros:* Accurate macroscopic velocity matrix predictions.
  - *Cons:* Offline academic models lacking interactive navigation clients, dynamic user preference weights, or voice copilot integration.

---

### Slide 6: 04. Compare & Contrast Alternative Solutions

| Feature / Dimension | Google Maps | Waze | Academic ST-GCN | Wayve (Proposed) |
| :--- | :--- | :--- | :--- | :--- |
| **Routing Algorithm** | Greedy Shortest/Fastest | Crowdsourced A* | Spatio-Temporal GNN | **Multi-Objective Utility Scoring** |
| **Flow Theory Grounding** | Delay heuristics only | Delay heuristics only | Velocity matrix | **HCM 6th Ed. Level of Service (A–F)** |
| **Bottleneck Precision** | Colored line stretch | General incident pin | Matrix edge speed | **Coordinate-Pinned Polyline Markers** |
| **Alternative Portfolio** | 2–3 similar options | 1–2 detours | Matrix output only | **10 Diversified Strategic Routes** |
| **Departure Optimization** | Manual slider | Basic alert | None | **Automated $T+15$ to $T+45$ Horizons** |
| **Navigational Speech** | Standard mobile TTS | Standard mobile TTS | None | **Dual Engine: US + Sarvam AI Indian** |

---

### Slide 7: 05. Problem Modeling & Algorithm Development
- **Macroscopic Flow Theory:** 
  - Greenshields speed-density relation:  
    $$v(k) = v_f \cdot \left[1 - \frac{k}{k_j}\right]$$
  - Highway Capacity Manual (HCM) Level of Service categorization based on speed reduction ($\Delta v$) and congestion index ($C_i$).
- **Multi-Objective Utility Formulation:**
  $$S = w_{\text{eta}} U_{\text{eta}} + w_{\text{traffic}} U_{\text{traffic}} + w_{\text{dist}} U_{\text{dist}} + w_{\text{weather}} U_{\text{weather}} + w_{\text{tolls}} U_{\text{tolls}} + w_{\text{incidents}} U_{\text{incidents}}$$
- **Dynamic Mode Adaptability:** Coefficients automatically re-weight according to driver profile (Fastest, Commuter, Scenic, Eco, Emergency).
- **Spatial Bottleneck Extraction:** Evaluates curvature and segment velocity to pinpoint choke coordinates ($P_{\text{choke}}$), queue lengths ($Q_m$), and mitigation advice.

---

### Slide 8: 06. Implementation of Project Features
- **Modern Web Architecture:**
  - **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons.
  - **Mapping & Geodata:** Leaflet, Mapbox GL vector tiles, OSRM routing engine.
  - **AI Reasoning:** Google Gemini 3.6 Flash agentic pipeline for situational route explanations.
- **Key System Interfaces:**
  - **10-Route Portfolio:** High-velocity bypass, arterial corridor, low-gradient eco route, and emergency lanes.
  - **HCM Intelligence Drawer:** Live metrics on speed drops, signal cycle waits, and green-wave synchronization percentages.
  - **Active Navigation HUD:** Step-by-step maneuver cards, dynamic turn icon previews, and live distance countdowns.
  - **Indian Accent Voice Copilot:** Low-latency neural speech generation via Sarvam AI API (`speaker: meera`, `en-IN`).

---

### Slide 9: 07. Results and Outcomes
- **Peak-Hour Travel Time Savings:** Up to **28% reduction in net journey delay** during peak congestion by utilizing evaluated outer bypass corridors.
- **Signal Wait Stagnation:** **34% drop in stop-and-go idling** through signal-density and green-wave preference weighting.
- **Departure Horizon Optimization:** Shifting departure by **$+30$ min** yields **18 minutes net time saved** with a 79% route clearance probability.
- **Sub-Second Responsiveness:** Route portfolio scoring and spatial bottleneck extraction execute in **$< 420\text{ ms}$**.

---

### Slide 10: 08. Analysis of Developed Solution (Strengths & Limitations)
- **Key Strengths:**
  - Grounded in proven civil and traffic engineering standards (HCM LOS).
  - Eliminates herd-routing by dispersing traffic across a diverse 10-route strategy portfolio.
  - Highly tailored to Indian road conditions with localized Sarvam AI speech guidance.
  - Zero app installation required; responsive web platform accessible on desktop and mobile.
- **Current Limitations:**
  - Dependent on third-party API availability for real-time traffic sensor feeds.
  - Simulated vehicle movement in browser demo rather than physical CAN-bus vehicle telemetry.
  - Static signal cycle approximations in regions where municipal V2I infrastructure is offline.

---

### Slide 11: Conclusion & Future Scope
- **Conclusion:**
  - Wayve demonstrates that fusing macroscopic traffic flow theory with multimodal agentic AI significantly outperforms standard greedy shortest-path routing.
  - Provides commuters with actionable route explanations, physical bottleneck awareness, and culturally authentic voice assistance.
- **Future Scope:**
  - **V2I Traffic Light Preemption:** Direct integration with smart municipal traffic signals for emergency vehicle green-waves.
  - **On-Device ECU Quantization:** Deploying lightweight INT8 quantized models directly onto automotive Electronic Control Units.
  - **Federated Vehicle Sensing:** Privacy-preserving crowd-sourced pothole and hazard detection across connected fleets.

---

### Slide 12: Project Information & GitHub Repository
- **GitHub Repository:** [https://github.com/Kaustubh-a11y/Wayve.git](https://github.com/Kaustubh-a11y/Wayve.git)
- **Branch:** `main` (Production Release)
- **License:** MIT Open Source
- **Live Local Demo:** `http://localhost:3000` (Next.js 14 Dev Server)
- **Team / Author:** Kaustubh Kachole (PRN: 24070521098)
- **Department:** Department of Computer Science & Engineering, SIT Nagpur
