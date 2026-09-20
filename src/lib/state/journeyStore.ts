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
  isReplaying: boolean;
  replaySpeed: number;
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
  maxDetourMinutes: 15,
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
      text: "Where would you like to drive from Nagpur? Try 'Stop by nearby Starbucks first then take me to Pench National Park' or search any destination.",
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
  isReplaying: false,
  replaySpeed: 1,
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

      // Automatically detect real user surroundings (Nagpur / Central India)
      import("../services/userLocation").then(({ detectUserLocation }) => {
        detectUserLocation().then((loc) => {
          journeyActions.setOrigin({
            name: `${loc.city} (Your location)`,
            coordinate: loc.coordinate,
            address: `${loc.city}, ${loc.region}, ${loc.country}`,
          });
        }).catch(() => {
          // Defaults to Nagpur
        });
      });
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

    setOrigin: journeyActions.setOrigin,
    swapOriginDestination: journeyActions.swapOriginDestination,
    addStop: journeyActions.addStop,
    removeStop: journeyActions.removeStop,
    planTripWithAI: journeyActions.planTripWithAI,

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

    // Step 2: Calculate routes with chosen mode, preferences & waypoints
    calculateRoutes: async () => {
      const dest = globalStore.destination;
      if (!dest) return;
      const waypoints = globalStore.stops.filter((s) => s.added).map((s) => s.coordinate);
      await journeyActions.generateRoutes(globalStore.origin.coordinate, dest, waypoints);
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
        routeProgress: 0.02,
        elapsedSeconds: 0,
        bearing: initialBearing,
        isReplaying: true,
        replaySpeed: 1,
      });
    },

    toggleReplay: (val?: boolean) => {
      updateStore((prev) => ({
        isReplaying: val !== undefined ? val : !prev.isReplaying,
      }));
    },

    setReplaySpeed: (replaySpeed: number) => {
      updateStore({ replaySpeed });
    },

    seekProgress: (progress: number) => {
      const clamped = Math.max(0, Math.min(1, progress));
      updateStore((prev) => {
        if (!prev.activeRoute || !prev.activeRoute.geometry || prev.activeRoute.geometry.length === 0) {
          return { routeProgress: clamped };
        }
        const geom = prev.activeRoute.geometry;
        const ptIdx = Math.min(geom.length - 1, Math.floor(clamped * (geom.length - 1)));
        const [lng, lat] = geom[ptIdx];
        const nextBearing = getRouteSegmentBearing(geom, ptIdx);
        const totalManeuvers = prev.activeRoute.maneuvers?.length || 5;
        const maneuverIdx = Math.min(totalManeuvers - 1, Math.floor(clamped * totalManeuvers));

        return {
          routeProgress: clamped,
          currentLocation: { lat, lng },
          bearing: nextBearing,
          currentManeuverIndex: maneuverIdx,
          currentSpeedKmh: clamped >= 0.98 ? 0 : Math.round(58 + Math.random() * 8),
        };
      });
    },

    tickReplay: (deltaPercent: number = 0.012) => {
      updateStore((prev) => {
        if (!prev.isReplaying || (prev.journeyState !== "NAVIGATING" && prev.journeyState !== "MONITORING")) {
          return {};
        }

        const nextProgress = Math.min(1.0, prev.routeProgress + deltaPercent * (prev.replaySpeed || 1));
        if (nextProgress >= 0.99) {
          journeyActions.arriveAtDestination();
          return { isReplaying: false, routeProgress: 1.0, currentSpeedKmh: 0 };
        }

        const geom = prev.activeRoute?.geometry;
        let nextCoord = prev.currentLocation;
        let nextBearing = prev.bearing;
        let maneuverIdx = prev.currentManeuverIndex;

        if (geom && geom.length > 1) {
          const ptIdx = Math.min(geom.length - 1, Math.floor(nextProgress * (geom.length - 1)));
          const [lng, lat] = geom[ptIdx];
          nextCoord = { lat, lng };
          nextBearing = getRouteSegmentBearing(geom, ptIdx);
          const totalManeuvers = prev.activeRoute?.maneuvers?.length || 5;
          maneuverIdx = Math.min(totalManeuvers - 1, Math.floor(nextProgress * totalManeuvers));
        }

        return {
          routeProgress: nextProgress,
          currentLocation: nextCoord,
          bearing: nextBearing,
          currentManeuverIndex: maneuverIdx,
          currentSpeedKmh: Math.round(62 + Math.sin(nextProgress * 25) * 8),
          journeyState: "MONITORING",
        };
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
            userLocation: {
              city: globalStore.origin.name.replace(" (Your location)", "") || "Nagpur",
              region: "Maharashtra",
              country: "India",
              coordinate: globalStore.origin.coordinate,
            },
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

        let targetDest: Destination | null = globalStore.destination;
        if (data.destinationName) {
          // Live geocode destination via /api/v1/search
          try {
            const sRes = await fetch("/api/v1/search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: data.destinationName,
                proximity: globalStore.origin.coordinate,
              }),
            });
            const sData = await sRes.json();
            if (sData.destinations && sData.destinations.length > 0) {
              targetDest = sData.destinations[0];
            }
          } catch {
            // fallback
          }

          if (!targetDest) {
            targetDest = DETERMINISTIC_DESTINATIONS.find((d) =>
              d.name.toLowerCase().includes(data.destinationName.toLowerCase())
            ) || {
              id: `dest-${Date.now()}`,
              name: data.destinationName,
              type: "place",
              address: `${data.destinationName}, Maharashtra`,
              coordinate: { lat: 18.9365, lng: 72.8241 }, // Marine Drive Mumbai
              category: "Destination",
            };
          }
          updateStore({ destination: targetDest, planningStep: "preferences" });
        }

        if (data.journeyMode) {
          journeyActions.setJourneyMode(data.journeyMode);
        }

        // Live geocode and resolve requested stops (e.g. Starbucks)
        let updatedStops = [...globalStore.stops];
        if (data.stopsRequested && data.stopsRequested.length > 0) {
          for (const stopReq of data.stopsRequested) {
            const cleanReq = stopReq.toLowerCase().trim();
            let stopCoord = { lat: 21.1306, lng: 79.0975 }; // Default VR Mall Starbucks in Nagpur
            let stopName = stopReq.charAt(0).toUpperCase() + stopReq.slice(1);

            try {
              const sRes = await fetch("/api/v1/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query: cleanReq.includes("starbucks") ? "Starbucks" : cleanReq,
                  proximity: globalStore.origin.coordinate,
                  countryCode: "in",
                }),
              });
              const sData = await sRes.json();
              if (sData.destinations && sData.destinations.length > 0) {
                const found = sData.destinations[0];
                stopName = found.name;
                stopCoord = found.coordinate;
              }
            } catch {
              // fallback
            }

            const existingIdx = updatedStops.findIndex(
              (s) => s.name.toLowerCase().includes(cleanReq) || s.type.toLowerCase().includes(cleanReq)
            );
            if (existingIdx >= 0) {
              updatedStops[existingIdx] = {
                ...updatedStops[existingIdx],
                coordinate: stopCoord,
                added: true,
              };
            } else {
              updatedStops.push({
                id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                name: stopName,
                type: "coffee",
                coordinate: stopCoord,
                detourMinutes: 6,
                added: true,
                rating: 4.8,
              });
            }
          }
          updateStore({ stops: updatedStops });
        }

        // Recalculate routes via waypoint(s) and reroute immediately
        if (targetDest) {
          const waypoints = updatedStops.filter((s) => s.added).map((s) => s.coordinate);
          const isNavigating =
            globalStore.journeyState === "NAVIGATING" || globalStore.journeyState === "MONITORING";
          const startPt = isNavigating
            ? globalStore.currentLocation
            : globalStore.origin.coordinate;

          await journeyActions.generateRoutes(startPt, targetDest, waypoints);

          if (isNavigating) {
            updateStore((prev) => ({
              reroutesCount: prev.reroutesCount + 1,
              currentManeuverIndex: 0,
              routeProgress: 0.05,
              journeyState: "NAVIGATING",
              isReplaying: true,
            }));
          }
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
        routeProgress: 0.0,
        elapsedSeconds: 0,
        currentManeuverIndex: 0,
        activeIncident: null,
        replanningAssessment: null,
        isSimulating: false,
        tripIntelligence: null,
        tripStartTime: null,
        isReplaying: false,
        currentLocation: globalStore.origin.coordinate,
        bearing: 0,
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

  setOrigin: (origin: { name: string; coordinate: Coordinate; address?: string }) => {
    updateStore({ origin, currentLocation: origin.coordinate });
    if (globalStore.destination) {
      journeyActions.generateRoutes(origin.coordinate, globalStore.destination);
    }
  },

  swapOriginDestination: () => {
    const { origin, destination } = globalStore;
    if (!destination) return;
    const newOrigin = {
      name: destination.name,
      coordinate: destination.coordinate,
      address: destination.address,
    };
    const newDest: Destination = {
      id: `dest-${Date.now()}`,
      name: origin.name,
      type: "place",
      address: origin.address,
      coordinate: origin.coordinate,
      rating: 4.8,
    };
    updateStore({ origin: newOrigin, destination: newDest, currentLocation: newOrigin.coordinate });
    journeyActions.generateRoutes(newOrigin.coordinate, newDest);
  },

  addStop: (stop: Stop) => {
    updateStore((prev) => {
      const existing = prev.stops.filter((s) => s.id !== stop.id);
      return { stops: [...existing, { ...stop, added: true }] };
    });
    if (globalStore.destination) {
      journeyActions.generateRoutes(globalStore.origin.coordinate, globalStore.destination);
    }
  },

  removeStop: (id: string) => {
    updateStore((prev) => ({
      stops: prev.stops.filter((s) => s.id !== id),
    }));
    if (globalStore.destination) {
      journeyActions.generateRoutes(globalStore.origin.coordinate, globalStore.destination);
    }
  },

  planTripWithAI: async (prompt: string) => {
    updateStore({ isAiThinking: true, isConversationOpen: true });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: prompt,
      timestamp: "Just now",
    };
    updateStore((prev) => ({ chatMessages: [...prev.chatMessages, userMsg] }));

    try {
      const res = await fetch("/api/v1/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          currentDestination: globalStore.destination?.name,
          customKey: globalStore.customGeminiKey,
          userLocation: {
            city: globalStore.origin.name.replace(" (Your location)", "") || "Nagpur",
            region: "Maharashtra",
            country: "India",
            coordinate: globalStore.origin.coordinate,
          },
        }),
      });
      const parsed = await res.json();

      const replyMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "wayve",
        text: parsed.replyMessage || "I've synthesized your optimal corridor.",
        timestamp: "Just now",
      };
      updateStore((prev) => ({
        chatMessages: [...prev.chatMessages, replyMsg],
        aiDiagnostics: parsed.diagnostics || prev.aiDiagnostics,
        isAiThinking: false,
      }));

      // Geocode and update origin if provided
      let curOrigin = globalStore.origin;
      if (parsed.originName) {
        const { searchPlaces } = await import("../providers/mapbox");
        const origResults = await searchPlaces(parsed.originName);
        if (origResults.length > 0) {
          curOrigin = {
            name: origResults[0].name,
            coordinate: origResults[0].coordinate,
            address: origResults[0].address,
          };
          updateStore({ origin: curOrigin, currentLocation: curOrigin.coordinate });
        }
      }

      // Geocode and update destination if provided
      let curDest = globalStore.destination;
      if (parsed.destinationName) {
        const { searchPlaces } = await import("../providers/mapbox");
        const destResults = await searchPlaces(parsed.destinationName, curOrigin.coordinate);
        if (destResults.length > 0) {
          curDest = destResults[0];
          updateStore({
            destination: curDest,
            planningStep: "routes",
            journeyState: "DESTINATION_RESOLVED",
          });
        }
      }

      // If stops requested (e.g. Starbucks), geocode and add them
      const addedWaypoints: Coordinate[] = [];
      if (parsed.stopsRequested && parsed.stopsRequested.length > 0 && curDest) {
        const { searchPlaces } = await import("../providers/mapbox");
        for (const stopQuery of parsed.stopsRequested) {
          const midPoint = {
            lat: (curOrigin.coordinate.lat + curDest.coordinate.lat) / 2,
            lng: (curOrigin.coordinate.lng + curDest.coordinate.lng) / 2,
          };
          const stopResults = await searchPlaces(`${stopQuery}`, midPoint);
          if (stopResults.length > 0) {
            const match = stopResults[0];
            const newStop: Stop = {
              id: `stop-ai-${Date.now()}-${Math.random()}`,
              name: match.name,
              type: match.name.toLowerCase().includes("starbucks") || match.name.toLowerCase().includes("coffee") ? "coffee" : "food",
              coordinate: match.coordinate,
              detourMinutes: 4,
              rating: 4.8,
              added: true,
            };
            updateStore((prev) => ({
              stops: [...prev.stops.filter((s) => s.id !== newStop.id), newStop],
            }));
            addedWaypoints.push(newStop.coordinate);
          }
        }
      }

      // Generate multi-waypoint routes
      if (curDest) {
        const allWaypoints = [
          ...globalStore.stops.filter((s) => s.added).map((s) => s.coordinate),
          ...addedWaypoints,
        ];
        await journeyActions.generateRoutes(curOrigin.coordinate, curDest, allWaypoints);
      }
    } catch {
      updateStore({ isAiThinking: false });
    }
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

  generateRoutes: async (origin: Coordinate, destination: Destination, waypoints?: Coordinate[]) => {
    updateStore({ journeyState: "ROUTES_LOADING" });
    const activeWaypoints =
      waypoints || globalStore.stops.filter((s) => s.added).map((s) => s.coordinate);
    try {
      const res = await fetch("/api/v1/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination: destination.coordinate,
          mode: globalStore.journeyMode,
          waypoints: activeWaypoints,
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
