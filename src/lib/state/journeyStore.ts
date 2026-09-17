"use client";

import { useEffect, useState } from "react";
import {
  ChatMessage,
  Coordinate,
  Destination,
  Incident,
  IncidentType,
  JourneyMode,
  JourneyPreferences,
  JourneyState,
  ReplanningAssessment,
  RouteOption,
  SimulationEventType,
  Stop,
  TripIntelligenceData,
} from "@/types/journey";
import {
  DEFAULT_ORIGIN,
  DETERMINISTIC_DESTINATIONS,
  DETERMINISTIC_STOPS,
} from "../services/deterministicData";
import { scoreRoutes } from "../services/routeScorer";
import { processSimulationEvent } from "../services/simulationEngine";

export interface JourneyStoreState {
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

  // Conversational Agent & Chat
  chatMessages: ChatMessage[];
  isAiThinking: boolean;

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

// Global in-memory state object and listeners for reactive React hooks
let globalStore: JourneyStoreState = {
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
      text: "Where are we going today? You can say 'Nearest hill station', 'Take me to Lonavala', or choose your preferred journey mode.",
      timestamp: "Just now",
    },
  ],
  isAiThinking: false,
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
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return {
    state: globalStore,

    // Actions
    setJourneyState: (st: JourneyState) => updateStore({ journeyState: st }),

    setOrigin: (origin: { name: string; coordinate: Coordinate; address?: string }) => {
      updateStore({ origin, currentLocation: origin.coordinate });
    },

    setDestination: (dest: Destination) => {
      updateStore({
        destination: dest,
        journeyState: "DESTINATION_RESOLVED",
        isConversationOpen: false,
        isSearchOpen: false,
      });
      // Automatically trigger route loading
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
        return {
          selectedRouteId: routeId,
          activeRoute: route,
        };
      });
    },

    startJourney: () => {
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      updateStore({
        journeyState: "NAVIGATING",
        tripStartTime: now,
        currentManeuverIndex: 0,
        routeProgress: 0.05,
        elapsedSeconds: 0,
      });
    },

    progressNavigationStep: () => {
      updateStore((prev) => {
        if (prev.journeyState !== "NAVIGATING" && prev.journeyState !== "MONITORING") return {};
        const totalManeuvers = prev.activeRoute?.maneuvers?.length || 7;
        const nextIndex = prev.currentManeuverIndex + 1;
        const nextProgress = Math.min(0.95, prev.routeProgress + 0.15);

        if (nextIndex >= totalManeuvers) {
          // Arrived!
          journeyActions.arriveAtDestination();
          return {};
        }

        // Interpolate current location along geometry
        let nextCoord = prev.currentLocation;
        if (prev.activeRoute && prev.activeRoute.geometry.length > 0) {
          const ptIdx = Math.floor(nextProgress * (prev.activeRoute.geometry.length - 1));
          const [lng, lat] = prev.activeRoute.geometry[ptIdx];
          nextCoord = { lat, lng };
        }

        return {
          currentManeuverIndex: nextIndex,
          routeProgress: nextProgress,
          currentLocation: nextCoord,
          currentSpeedKmh: Math.round(52 + Math.random() * 14),
          journeyState: "MONITORING",
        };
      });
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

    switchRoute: () => {
      updateStore((prev) => {
        const alt = prev.replanningAssessment?.recommendedRoute;
        if (!alt) return { journeyState: "MONITORING" };

        const savedMinutes = prev.replanningAssessment?.timeSavedMinutes || 11;
        const newReroutes = prev.reroutesCount + 1;
        const newSaved = prev.timeSavedMinutes + savedMinutes;

        return {
          selectedRouteId: alt.id,
          activeRoute: alt,
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

      // Ingest into replanning pipeline
      journeyActions.injectSimulationIncident(type === "road_blocked" ? "road_closure" : (type as any), 0.8);
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

        updateStore((prev) => ({
          chatMessages: [...prev.chatMessages, wayveMsg],
          isAiThinking: false,
        }));

        // Apply structured intent
        if (data.intent === "find_destination") {
          updateStore({
            journeyState: "PLANNING",
            candidateDestinations: DETERMINISTIC_DESTINATIONS,
          });
        } else if (data.destinationName) {
          const matched = DETERMINISTIC_DESTINATIONS.find((d) =>
            d.name.toLowerCase().includes(data.destinationName.toLowerCase())
          ) || DETERMINISTIC_DESTINATIONS[0];
          journeyActions.setDestination(matched);
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
              text: "I'm setting up your scenic trip to Lonavala with snack stops. Comparing candidate routes.",
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
        destination: null,
        routes: [],
        selectedRouteId: null,
        activeRoute: null,
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

    // UI sheet toggles
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
  setDestination: (dest: Destination) => {
    updateStore({
      destination: dest,
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

      updateStore({
        routes,
        selectedRouteId: best?.id || null,
        activeRoute: best || null,
        journeyState: "ROUTES_READY",
      });
    } catch {
      // Fallback
      const fallback = (await import("../services/deterministicData")).getDeterministicRoutes(origin, destination.coordinate);
      const scored = scoreRoutes(fallback, globalStore.journeyMode);
      const best = scored.find((r) => r.isWayvePick) || scored[0];
      updateStore({
        routes: scored,
        selectedRouteId: best?.id || null,
        activeRoute: best || null,
        journeyState: "ROUTES_READY",
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
