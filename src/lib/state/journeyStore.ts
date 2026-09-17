"use client";

import { useEffect, useState } from "react";
import {
  AIDiagnostics,
  ChatMessage,
  Coordinate,
  Destination,
  Incident,
  IncidentType,
  JourneyMode,
  JourneyPreferences,
  JourneyState,
  MapViewMode,
  PlanningStep,
  ReplanningAssessment,
  RouteOption,
  SimulationEventType,
  Stop,
  ThemeMode,
  TripIntelligenceData,
} from "@/types/journey";
import {
  DEFAULT_ORIGIN,
  DETERMINISTIC_DESTINATIONS,
  DETERMINISTIC_STOPS,
} from "../services/deterministicData";
import { scoreRoutes } from "../services/routeScorer";
import { processSimulationEvent } from "../services/simulationEngine";
import { getRouteSegmentBearing } from "../services/navigationUtils";

export interface JourneyStoreState {
  // Theme & View Settings
  theme: ThemeMode;
  mapViewMode: MapViewMode;
  planningStep: PlanningStep;

  // State Machine
  journeyState: JourneyState;
  origin: { name: string; coordinate: Coordinate; address?: string };
  destination: Destination | null;
  candidateDestinations: Destination[];
  stops: Stop[];
  journeyMode: JourneyMode;
  preferences: JourneyPreferences;

  // Routes
  routes: RouteOption[];
  selectedRouteId: string | null;
  activeRoute: RouteOption | null;

  // Navigation HUD
  currentLocation: Coordinate;
  bearing: number; // 0 to 360 degrees road heading
  currentSpeedKmh: number;
  speedLimitKmh: number;
  currentManeuverIndex: number;
  routeProgress: number; // 0.0 to 1.0
  elapsedSeconds: number;

  // Replanning & Simulation
  activeIncident: Incident | null;
  replanningAssessment: ReplanningAssessment | null;
  isSimulating: boolean;
  incidentsList: Incident[];
  reroutesCount: number;
  timeSavedMinutes: number;

  // Conversational Agent, Key & Diagnostics
  chatMessages: ChatMessage[];
  isAiThinking: boolean;
  customGeminiKey: string;
  aiDiagnostics: AIDiagnostics;

  // Post-Trip Intelligence
  tripIntelligence: TripIntelligenceData | null;
  tripStartTime: string | null;

  // Overlays & Sheet Visibility
  isConversationOpen: boolean;
  isSearchOpen: boolean;
  isLocationPickerOpen: boolean;
  isReportModalOpen: boolean;
  isSimulationOpen: boolean;
  isWhyThisRouteOpen: boolean;
  isWeatherModalOpen: boolean;
  isTripIntelligenceOpen: boolean;
  isSettingsOpen: boolean;
  isDemoPlaying: boolean;
  demoStep: number;
}

const initialPreferences: JourneyPreferences = {
  fastest: 0.5,
  scenic: 0.85,
  traffic: 0.8,
  fuel: 0.5,
  tolls: 0.5,
  weather: 0.6,
  avoidHighways: false,
  avoidTolls: false,
  avoidRain: false,
  maxDetourMinutes: 10,
};

// Global in-memory state object
let globalStore: JourneyStoreState = {
  theme: "dark",
  mapViewMode: "3d",
  planningStep: "destination",
  journeyState: "IDLE",
  origin: DEFAULT_ORIGIN,
  destination: null,
  candidateDestinations: DETERMINISTIC_DESTINATIONS,
  stops: DETERMINISTIC_STOPS,
  journeyMode: "scenic",
  preferences: initialPreferences,
  routes: [],
  selectedRouteId: null,
  activeRoute: null,
  currentLocation: DEFAULT_ORIGIN.coordinate,
  bearing: 0,
  currentSpeedKmh: 58,
  speedLimitKmh: 60,
  currentManeuverIndex: 0,
  routeProgress: 0.0,
  elapsedSeconds: 0,
  activeIncident: null,
  replanningAssessment: null,
  isSimulating: false,
  incidentsList: [],
  reroutesCount: 0,
  timeSavedMinutes: 0,
  chatMessages: [
    {
      id: "msg-welcome",
      sender: "wayve",
      text: "Where are we going today? You can search any destination, or tap quick hill station getaways like Lonavala or Panchgani.",
      timestamp: "Just now",
    },
  ],
  isAiThinking: false,
  customGeminiKey: "",
  aiDiagnostics: {
    status: "fallback",
    engine: "rule_based",
    message: "Built-in offline NLP engine active (100% demo & route reliability)",
  },
  tripIntelligence: null,
  tripStartTime: null,
  isConversationOpen: false,
  isSearchOpen: false,
  isLocationPickerOpen: false,
  isReportModalOpen: false,
  isSimulationOpen: false,
  isWhyThisRouteOpen: false,
  isWeatherModalOpen: false,
  isTripIntelligenceOpen: false,
  isSettingsOpen: false,
  isDemoPlaying: false,
  demoStep: 0,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function updateStore(updater: Partial<JourneyStoreState> | ((prev: JourneyStoreState) => Partial<JourneyStoreState>)) {
  const patch = typeof updater === "function" ? updater(globalStore) : updater;
  globalStore = { ...globalStore, ...patch };
  notify();
}

/**
 * Custom React Hook to subscribe to the Wayve Journey State Machine
 */
export function useJourneyStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    listeners.add(onChange);

    // Synchronize Theme from localStorage on mount
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("wayve_theme") as ThemeMode | null;
      if (savedTheme) {
        journeyActions.setTheme(savedTheme);
      } else {
        journeyActions.setTheme("dark");
      }

      const savedView = localStorage.getItem("wayve_map_view") as MapViewMode | null;
      if (savedView) {
        journeyActions.setMapViewMode(savedView);
      }

      const savedKey = localStorage.getItem("wayve_gemini_key") || "";
      if (savedKey) {
        journeyActions.setCustomGeminiKey(savedKey);
      }
    }

    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return {
    state: globalStore,

    // Theme & Map View
    setTheme: journeyActions.setTheme,
    setMapViewMode: journeyActions.setMapViewMode,
    setPlanningStep: journeyActions.setPlanningStep,
    setBearing: (bearing: number) => updateStore({ bearing }),
    setCustomGeminiKey: journeyActions.setCustomGeminiKey,
    setAiDiagnostics: (aiDiagnostics: AIDiagnostics) => updateStore({ aiDiagnostics }),

    // Journey Actions
    setJourneyState: (st: JourneyState) => updateStore({ journeyState: st }),

    setOrigin: (origin: { name: string; coordinate: Coordinate; address?: string }) => {
      updateStore({ origin, currentLocation: origin.coordinate });
    },

    // Step 1: Select destination and smoothly present preferences
    selectDestination: (dest: Destination) => {
      updateStore({
        destination: dest,
        planningStep: "preferences",
        journeyState: "PLANNING",
        isConversationOpen: false,
        isSearchOpen: false,
      });
    },

    // Step 2: Calculate routes with chosen mode & preferences
    calculateRoutes: async () => {
      const dest = globalStore.destination;
      if (!dest) return;
      await journeyActions.generateRoutes(globalStore.origin.coordinate, dest);
    },

    setDestinationDirectAndCalculate: (dest: Destination) => {
      journeyActions.setDestination(dest);
    },

    setJourneyMode: journeyActions.setJourneyMode,

    setPreferences: (prefs: Partial<JourneyPreferences>) => {
      updateStore((prev) => {
        const merged = { ...prev.preferences, ...prefs };
        const updatedRoutes = scoreRoutes(prev.routes, prev.journeyMode, merged, prev.stops.some((s) => s.added));
        return { preferences: merged, routes: updatedRoutes };
      });
    },

    toggleStop: (stopId: string) => {
      updateStore((prev) => {
        const stops = prev.stops.map((s) => (s.id === stopId ? { ...s, added: !s.added } : s));
        const hasStops = stops.some((s) => s.added);
        const updatedRoutes = scoreRoutes(prev.routes, prev.journeyMode, prev.preferences, hasStops);
        return { stops, routes: updatedRoutes };
      });
    },

    selectRoute: (routeId: string) => {
      updateStore((prev) => {
        const route = prev.routes.find((r) => r.id === routeId) || null;
        let bearing = prev.bearing;
        if (route && route.geometry && route.geometry.length > 1) {
          bearing = getRouteSegmentBearing(route.geometry, 0);
        }
        return {
          selectedRouteId: routeId,
          activeRoute: route,
          bearing,
        };
      });
    },

    startJourney: () => {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const active = globalStore.activeRoute;
      let initialBearing = 0;
      if (active && active.geometry && active.geometry.length > 1) {
        initialBearing = getRouteSegmentBearing(active.geometry, 0);
      }

      updateStore({
        journeyState: "NAVIGATING",
        tripStartTime: now,
        currentManeuverIndex: 0,
        routeProgress: 0.05,
        elapsedSeconds: 0,
        bearing: initialBearing,
      });
    },

    progressNavigationStep: () => {
      updateStore((prev) => {
        if (prev.journeyState !== "NAVIGATING" && prev.journeyState !== "MONITORING") return {};
        const totalManeuvers = prev.activeRoute?.maneuvers?.length || 7;
        const nextIndex = prev.currentManeuverIndex + 1;
        const nextProgress = Math.min(0.95, prev.routeProgress + 0.15);

        if (nextIndex >= totalManeuvers) {
          journeyActions.arriveAtDestination();
          return {};
        }

        let nextCoord = prev.currentLocation;
        let nextBearing = prev.bearing;

        if (prev.activeRoute && prev.activeRoute.geometry.length > 0) {
          const ptIdx = Math.floor(nextProgress * (prev.activeRoute.geometry.length - 1));
          const [lng, lat] = prev.activeRoute.geometry[ptIdx];
          nextCoord = { lat, lng };
          nextBearing = getRouteSegmentBearing(prev.activeRoute.geometry, ptIdx);
        }

        return {
          currentManeuverIndex: nextIndex,
          routeProgress: nextProgress,
          currentLocation: nextCoord,
          bearing: nextBearing,
          currentSpeedKmh: Math.round(54 + Math.random() * 12),
          journeyState: "MONITORING",
        };
      });
    },

    injectSimulationIncident: (type: SimulationEventType, severity: number = 0.8) => {
      journeyActions.injectSimulationIncident(type, severity);
    },

    switchRoute: () => {
      updateStore((prev) => {
        const alt = prev.replanningAssessment?.recommendedRoute;
        if (!alt) return { journeyState: "MONITORING" };

        const savedMinutes = prev.replanningAssessment?.timeSavedMinutes || 11;
        const newReroutes = prev.reroutesCount + 1;
        const newSaved = prev.timeSavedMinutes + savedMinutes;
        const newBearing = alt.geometry.length > 1 ? getRouteSegmentBearing(alt.geometry, 0) : prev.bearing;

        return {
          selectedRouteId: alt.id,
          activeRoute: alt,
          bearing: newBearing,
          replanningAssessment: null,
          activeIncident: null,
          reroutesCount: newReroutes,
          timeSavedMinutes: newSaved,
          journeyState: "MONITORING",
        };
      });
    },

    stayOnRoute: () => {
      updateStore({
        replanningAssessment: null,
        journeyState: "MONITORING",
      });
    },

    reportIncident: (type: IncidentType, distanceAhead: string) => {
      const incident: Incident = {
        id: `user-report-${Date.now()}`,
        type,
        coordinate: globalStore.currentLocation,
        severity: 0.75,
        confidence: 0.85,
        reportedAt: "Just now",
        source: "user",
        description: `User reported ${type.replace("_", " ")} (${distanceAhead})`,
      };

      updateStore((prev) => ({
        incidentsList: [incident, ...prev.incidentsList],
        isReportModalOpen: false,
      }));

      journeyActions.injectSimulationIncident(type === "road_blocked" ? "road_closure" : (type as any), 0.8);
    },

    arriveAtDestination: () => {
      journeyActions.arriveAtDestination();
    },

    sendUserMessage: async (text: string) => {
      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: "Just now",
      };

      updateStore((prev) => ({
        chatMessages: [...prev.chatMessages, userMsg],
        isAiThinking: true,
      }));

      try {
        const res = await fetch("/api/v1/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            currentDestination: globalStore.destination?.name,
            customKey: globalStore.customGeminiKey || undefined,
          }),
        });

        const data = await res.json();
        const wayveMsg: ChatMessage = {
          id: `msg-wayve-${Date.now()}`,
          sender: "wayve",
          text: data.replyMessage || "I've updated your trip parameters.",
          timestamp: "Just now",
          structuredIntent: data,
        };

        if (data.diagnostics) {
          updateStore({ aiDiagnostics: data.diagnostics });
        }

        updateStore((prev) => ({
          chatMessages: [...prev.chatMessages, wayveMsg],
          isAiThinking: false,
        }));

        if (data.intent === "find_destination") {
          updateStore({
            journeyState: "PLANNING",
            planningStep: "destination",
            candidateDestinations: DETERMINISTIC_DESTINATIONS,
          });
        } else if (data.destinationName) {
          const matched = DETERMINISTIC_DESTINATIONS.find((d) =>
            d.name.toLowerCase().includes(data.destinationName.toLowerCase())
          ) || DETERMINISTIC_DESTINATIONS[0];
          updateStore({ destination: matched, planningStep: "preferences" });
          journeyActions.generateRoutes(globalStore.origin.coordinate, matched);
        }

        if (data.journeyMode) {
          journeyActions.setJourneyMode(data.journeyMode);
        }

        if (data.stopsRequested && data.stopsRequested.length > 0) {
          updateStore((prev) => {
            const stops = prev.stops.map((s) => ({
              ...s,
              added: data.stopsRequested.includes(s.type) || s.added,
            }));
            return { stops };
          });
        }
      } catch {
        updateStore((prev) => ({
          chatMessages: [
            ...prev.chatMessages,
            {
              id: `msg-err-${Date.now()}`,
              sender: "wayve",
              text: "Understood. Updating your route parameters using local NLP optimization.",
              timestamp: "Just now",
            },
          ],
          isAiThinking: false,
        }));
      }
    },

    resetJourney: () => {
      updateStore({
        journeyState: "IDLE",
        planningStep: "destination",
        destination: null,
        routes: [],
        selectedRouteId: null,
        activeRoute: null,
        bearing: 0,
        currentManeuverIndex: 0,
        routeProgress: 0.0,
        activeIncident: null,
        replanningAssessment: null,
        isSimulating: false,
        tripIntelligence: null,
        isConversationOpen: false,
        isSearchOpen: false,
      });
    },

    // Sheet and modal toggles
    toggleConversation: (val?: boolean) =>
      updateStore((prev) => ({ isConversationOpen: val !== undefined ? val : !prev.isConversationOpen })),
    toggleSearch: (val?: boolean) =>
      updateStore((prev) => ({ isSearchOpen: val !== undefined ? val : !prev.isSearchOpen })),
    toggleLocationPicker: (val?: boolean) =>
      updateStore((prev) => ({ isLocationPickerOpen: val !== undefined ? val : !prev.isLocationPickerOpen })),
    toggleReportModal: (val?: boolean) =>
      updateStore((prev) => ({ isReportModalOpen: val !== undefined ? val : !prev.isReportModalOpen })),
    toggleSimulation: (val?: boolean) =>
      updateStore((prev) => ({ isSimulationOpen: val !== undefined ? val : !prev.isSimulationOpen })),
    toggleWhyThisRoute: (val?: boolean) =>
      updateStore((prev) => ({ isWhyThisRouteOpen: val !== undefined ? val : !prev.isWhyThisRouteOpen })),
    toggleWeatherModal: (val?: boolean) =>
      updateStore((prev) => ({ isWeatherModalOpen: val !== undefined ? val : !prev.isWeatherModalOpen })),
    toggleTripIntelligence: (val?: boolean) =>
      updateStore((prev) => ({ isTripIntelligenceOpen: val !== undefined ? val : !prev.isTripIntelligenceOpen })),
    toggleSettings: (val?: boolean) =>
      updateStore((prev) => ({ isSettingsOpen: val !== undefined ? val : !prev.isSettingsOpen })),
  };
}

// Direct action helpers
export const journeyActions = {
  setTheme: (mode: ThemeMode) => {
    let activeClass = mode;
    if (mode === "system" && typeof window !== "undefined") {
      activeClass = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (typeof document !== "undefined") {
      if (activeClass === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("wayve_theme", mode);
    }
    updateStore({ theme: mode });
  },

  setMapViewMode: (mode: MapViewMode) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wayve_map_view", mode);
    }
    updateStore({ mapViewMode: mode });
  },

  setPlanningStep: (step: PlanningStep) => {
    updateStore({ planningStep: step });
  },

  setCustomGeminiKey: (key: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wayve_gemini_key", key);
    }
    updateStore({ customGeminiKey: key });
  },

  setDestination: (dest: Destination) => {
    updateStore({
      destination: dest,
      planningStep: "preferences",
      journeyState: "DESTINATION_RESOLVED",
      isConversationOpen: false,
      isSearchOpen: false,
    });
    journeyActions.generateRoutes(globalStore.origin.coordinate, dest);
  },

  setJourneyMode: (mode: JourneyMode) => {
    updateStore((prev) => {
      const updatedRoutes = scoreRoutes(prev.routes, mode, prev.preferences, prev.stops.some((s) => s.added));
      const active = updatedRoutes.find((r) => r.id === prev.selectedRouteId) || updatedRoutes.find((r) => r.isWayvePick) || updatedRoutes[0];
      return {
        journeyMode: mode,
        routes: updatedRoutes,
        activeRoute: active || null,
        selectedRouteId: active ? active.id : null,
      };
    });
  },

  generateRoutes: async (origin: Coordinate, destination: Destination) => {
    updateStore({ journeyState: "ROUTES_LOADING" });
    try {
      const res = await fetch("/api/v1/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination: destination.coordinate,
          mode: globalStore.journeyMode,
        }),
      });
      const data = await res.json();
      const routes: RouteOption[] = data.routes || [];
      const best = routes.find((r) => r.isWayvePick) || routes[0];
      const initialBearing = best?.geometry && best.geometry.length > 1 ? getRouteSegmentBearing(best.geometry, 0) : 0;

      updateStore({
        routes,
        selectedRouteId: best?.id || null,
        activeRoute: best || null,
        bearing: initialBearing,
        journeyState: "ROUTES_READY",
        planningStep: "routes",
      });
    } catch {
      const fallback = (await import("../services/deterministicData")).getDeterministicRoutes(origin, destination.coordinate);
      const scored = scoreRoutes(fallback, globalStore.journeyMode);
      const best = scored.find((r) => r.isWayvePick) || scored[0];
      const initialBearing = best?.geometry && best.geometry.length > 1 ? getRouteSegmentBearing(best.geometry, 0) : 0;

      updateStore({
        routes: scored,
        selectedRouteId: best?.id || null,
        activeRoute: best || null,
        bearing: initialBearing,
        journeyState: "ROUTES_READY",
        planningStep: "routes",
      });
    }
  },

  injectSimulationIncident: (type: SimulationEventType, severity: number = 0.8) => {
    const state = globalStore;
    const targetRouteId = state.selectedRouteId || state.routes[0]?.id || "route-scenic-ghat";
    const event = {
      type,
      targetRouteId,
      severity,
      timestamp: new Date().toISOString(),
    };

    const result = processSimulationEvent(
      event,
      targetRouteId,
      state.routes,
      state.journeyMode,
      state.preferences,
      state.stops.some((s) => s.added)
    );

    const incident: Incident = {
      id: `inc-${Date.now()}`,
      type: type === "road_closure" ? "road_blocked" : type === "heavy_rain" ? "flooding" : (type as IncidentType),
      coordinate: state.currentLocation,
      severity,
      confidence: 0.9,
      reportedAt: "Just now",
      source: "simulation",
      description: result.assessment.reason,
    };

    updateStore({
      routes: result.updatedRoutes,
      activeIncident: incident,
      incidentsList: [incident, ...state.incidentsList],
      replanningAssessment: result.assessment,
      journeyState: result.assessment.triggered ? "ROUTE_SWITCH_PENDING" : state.journeyState,
      isSimulationOpen: false,
    });
  },

  arriveAtDestination: () => {
    const state = globalStore;
    const totalMin = Math.round((state.activeRoute?.predictedDurationSeconds || 4680) / 60);
    const intelligence: TripIntelligenceData = {
      tripId: `trip-${Date.now()}`,
      destinationName: state.destination?.name || "Lonavala Hill Station",
      distanceKm: Math.round(((state.activeRoute?.distanceMeters || 64800) / 1000) * 10) / 10,
      actualDurationMinutes: totalMin,
      reroutesCount: state.reroutesCount > 0 ? state.reroutesCount : 1,
      timeSavedMinutes: state.timeSavedMinutes > 0 ? state.timeSavedMinutes : 11,
      eventsTimeline: [
        { time: state.tripStartTime || "18:30", text: "Journey started via scenic corridor", type: "start" },
        { time: "+24 min", text: "Snack stop waypoint verified along route", type: "decision" },
        { time: "+42 min", text: "Congestion spike on NH 48 arterial", type: "alert" },
        { time: "+44 min", text: "Switched to Old Highway bypass (saved 11 min)", type: "switch" },
        { time: "+78 min", text: "Arrived at destination", type: "arrived" },
      ],
      factorWeights: [
        { factor: "Traffic & Road Congestion", percentage: 38 },
        { factor: "User Leisure Preference", percentage: 28 },
        { factor: "Snack Stop Inclusion", percentage: 16 },
        { factor: "Weather Condition Quality", percentage: 12 },
        { factor: "Toll Road Avoidance", percentage: 6 },
      ],
    };

    updateStore({
      journeyState: "ARRIVED",
      tripIntelligence: intelligence,
      isTripIntelligenceOpen: true,
      routeProgress: 1.0,
    });
  },
};
