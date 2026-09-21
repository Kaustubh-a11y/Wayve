"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Destination, Stop, TravelMode } from "@/types/journey";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  CornerUpRight,
  Gauge,
  Info,
  Leaf,
  List,
  MapPin,
  Menu,
  Moon,
  Navigation,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { speakNavInstruction, toggleTTSMute, isTTSMuted, stopTTS, getVoiceCast, setVoiceCast, VoiceCast } from "@/lib/services/ttsService";

export const GoogleMapsLayout: React.FC = () => {
  const {
    state,
    setOrigin,
    setDestinationDirectAndCalculate,
    swapOriginDestination,
    addStop,
    removeStop,
    selectRoute,
    startJourney,
    resetJourney,
    setTheme,
    setJourneyMode,
    planTripWithAI,
    toggleReplay,
    setReplaySpeed,
    tickReplay,
    injectSimulationIncident,
    switchRoute,
    stayOnRoute,
    toggleTrafficLayer,
    seekProgress,
    toggleSidebar,
  } = useJourneyStore();

  const isLight = state.theme === "light";
  const isNavigating = state.journeyState === "NAVIGATING" || state.journeyState === "MONITORING";

  // UI Modes
  const [isDirectionsMode, setIsDirectionsMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [originQuery, setOriginQuery] = useState("Your location");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [newStopQuery, setNewStopQuery] = useState("");
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Destination | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [activeTravelMode, setActiveTravelMode] = useState<TravelMode>("driving");
  const [activeSearchTarget, setActiveSearchTarget] = useState<"main" | "origin" | "destination">("main");
  const suppressSuggestionsRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);
  const prevManeuverIdxRef = useRef(-1);
  const gpsWatchIdRef = useRef<number | null>(null);

  // Mobile layout responsiveness states
  const [isMobileRoutesExpanded, setIsMobileRoutesExpanded] = useState(false);
  const [isMobileDirectionsCollapsed, setIsMobileDirectionsCollapsed] = useState(true);
  const [isNavStepsOpen, setIsNavStepsOpen] = useState(false);
  const [showTrafficIntel, setShowTrafficIntel] = useState(false);
  const [voiceCast, setVoiceCastState] = useState<VoiceCast>("american");

  const handleToggleVoiceCast = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next: VoiceCast = voiceCast === "american" ? "sarvam" : "american";
    setVoiceCastState(next);
    setVoiceCast(next);
    speakNavInstruction(next === "american" ? "American navigation voice active." : "Sarvam AI voice active.");
  };

  // Keep search queries in sync with store
  useEffect(() => {
    if (state.destination) {
      setDestinationQuery(state.destination.name);
      setSelectedPlace(state.destination);
    }
  }, [state.destination]);

  useEffect(() => {
    if (state.origin) {
      setOriginQuery(state.origin.name || "Your location");
    }
  }, [state.origin]);

  // If routes are ready and we aren't navigating, show directions mode
  useEffect(() => {
    if (state.routes.length > 0 && !isNavigating) {
      setIsDirectionsMode(true);
    }
  }, [state.routes.length, isNavigating]);

  // Debounced search query for whichever input is actively focused (suppressed after selection)
  useEffect(() => {
    let q = "";
    if (activeSearchTarget === "origin") {
      q = originQuery.trim();
    } else if (activeSearchTarget === "destination") {
      q = destinationQuery.trim();
    } else {
      q = searchQuery.trim();
    }

    if (
      suppressSuggestionsRef.current ||
      isDirectionsMode ||
      !q ||
      q.length < 2 ||
      q.includes("Your location") ||
      (state.destination && q.toLowerCase() === state.destination.name.toLowerCase()) ||
      (selectedPlace && q.toLowerCase() === selectedPlace.name.toLowerCase())
    ) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { searchPlaces } = await import("@/lib/providers/mapbox");
        const results = await searchPlaces(q, state.origin?.coordinate, "in");
        if (!suppressSuggestionsRef.current) {
          setSuggestions(results);
        }
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, originQuery, destinationQuery, activeSearchTarget, state.origin?.coordinate, isDirectionsMode, state.destination, selectedPlace]);

  // Automated drive replay loop when navigating (simulation mode only, opt-in)
  useEffect(() => {
    if (!state.isReplaying || !isNavigating) return;
    const interval = setInterval(() => {
      tickReplay(0.008);
    }, 500);
    return () => clearInterval(interval);
  }, [state.isReplaying, isNavigating, tickReplay]);

  // Real GPS tracking when navigating (non-simulation mode)
  useEffect(() => {
    if (!isNavigating || state.isReplaying) {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      return;
    }
    if (!navigator.geolocation) return;

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coord = { lat: position.coords.latitude, lng: position.coords.longitude };
        // Use seekProgress to snap to nearest route point
        const geom = state.activeRoute?.geometry;
        if (geom && geom.length > 1) {
          let minDist = Infinity;
          let bestIdx = 0;
          for (let i = 0; i < geom.length; i++) {
            const d = Math.hypot(geom[i][0] - coord.lng, geom[i][1] - coord.lat);
            if (d < minDist) { minDist = d; bestIdx = i; }
          }
          const progress = bestIdx / (geom.length - 1);
          seekProgress(progress);
        }
      },
      () => { /* GPS error — silent */ },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    };
  }, [isNavigating, state.isReplaying, state.activeRoute]);

  // TTS: Speak maneuver instruction when navigation begins or when maneuver index changes
  useEffect(() => {
    if (!isNavigating) {
      prevManeuverIdxRef.current = -1;
      setIsNavStepsOpen(false);
      stopTTS();
      return;
    }

    if (state.currentManeuverIndex !== prevManeuverIdxRef.current) {
      prevManeuverIdxRef.current = state.currentManeuverIndex;
      const maneuver = state.activeRoute?.maneuvers?.[state.currentManeuverIndex];
      if (maneuver?.instruction) {
        speakNavInstruction(maneuver.instruction);
      }
    }
  }, [state.currentManeuverIndex, isNavigating, state.activeRoute]);

  // Handlers
  const handleSelectSuggestion = (place: Destination) => {
    suppressSuggestionsRef.current = true;
    setSuggestions([]);
    if (activeSearchTarget === "origin") {
      setOrigin({
        name: place.name,
        coordinate: place.coordinate,
        address: place.address,
      });
      setOriginQuery(place.name);
    } else {
      setSearchQuery(place.name);
      setDestinationQuery(place.name);
      setSelectedPlace(place);
      setDestinationDirectAndCalculate(place);
      setIsDirectionsMode(true);
    }
  };

  const handleCategorySearch = async (categoryQuery: string) => {
    setSearchQuery(categoryQuery);
    try {
      const { searchPlaces } = await import("@/lib/providers/mapbox");
      const results = await searchPlaces(categoryQuery, state.currentLocation);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
  };

  const handleAddStopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = newStopQuery.trim();
    if (!q) return;

    try {
      const { searchPlaces } = await import("@/lib/providers/mapbox");
      const results = await searchPlaces(q, state.currentLocation);
      if (results.length > 0) {
        const match = results[0];
        const newStop: Stop = {
          id: `stop-${Date.now()}`,
          name: match.name,
          type: match.name.toLowerCase().includes("starbucks") || match.name.toLowerCase().includes("coffee") ? "coffee" : "food",
          coordinate: match.coordinate,
          detourMinutes: 4,
          address: match.address,
          rating: 4.8,
          added: true,
        };
        addStop(newStop);
        setNewStopQuery("");
        setIsAddingStop(false);
      }
    } catch {
      setIsAddingStop(false);
    }
  };

  const handleAiPlan = async (promptToUse?: string) => {
    const text = promptToUse || aiPrompt;
    if (!text.trim()) return;
    setIsAiDrawerOpen(false);
    setAiPrompt("");
    await planTripWithAI(text);
    setIsDirectionsMode(true);
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters} m`;
    const km = meters / 1000;
    const miles = km * 0.621371;
    return `${km.toFixed(1)} km (${miles.toFixed(1)} mi)`;
  };

  const formatDuration = (seconds: number) => {
    const min = Math.round(seconds / 60);
    if (min < 60) return `${min} min`;
    const hrs = Math.floor(min / 60);
    const rem = min % 60;
    return `${hrs} hr ${rem} min`;
  };

  const activeRoute = state.activeRoute || state.routes[0];
  const activeStops = state.stops.filter((s) => s.added);

  const displayedRoutes = state.routes.filter((route) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "fastest") return route.filterTag === "fastest" || route.isWayvePick;
    if (activeFilter === "balancer") return route.filterTag === "balancer";
    if (activeFilter === "express") return route.filterTag === "express";
    if (activeFilter === "bypass") return route.filterTag === "bypass";
    if (activeFilter === "incident_immune") return route.filterTag === "incident_immune";
    if (activeFilter === "eco") return route.filterTag === "eco";
    if (activeFilter === "scenic") return route.filterTag === "scenic";
    return true;
  });

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. GOOGLE MAPS FLOATING TOP-LEFT DOCKED CONTAINER                         */}
      {/* ========================================================================= */}
      {!isNavigating && (
        <div className="absolute top-3 left-2 sm:top-4 sm:left-4 z-30 w-[calc(100vw-16px)] sm:w-[410px] flex flex-col gap-1.5 sm:gap-2 pointer-events-none">
          
          {/* Surrounding GPS Location Status Badge */}
          <div className={`pointer-events-auto px-3.5 py-1.5 rounded-full border shadow-sm flex items-center justify-between text-xs font-semibold transition-all backdrop-blur-md ${
            isLight ? "bg-white/95 border-slate-200 text-slate-700" : "bg-[#1e293b]/95 border-slate-700 text-slate-200"
          }`}>
            <div className="flex items-center gap-2 truncate">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="truncate">📍 {state.origin?.name || "Nagpur (Your location)"}</span>
              <span className="hidden sm:inline text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Surroundings Active
              </span>
            </div>
            <button
              onClick={() => setIsAiDrawerOpen(true)}
              className="ml-2 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 flex items-center gap-1 shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Copilot</span>
            </button>
          </div>

          {/* Top Search Card / Directions Header (Pill capsule in search mode, rounded-3xl in directions mode) */}
          <div className={`pointer-events-auto shadow-xl transition-all border ${
            !isDirectionsMode ? "rounded-full" : "rounded-[28px]"
          } ${
            isLight
              ? "bg-white/95 border-slate-200/90 text-slate-800"
              : "bg-[#1e293b]/95 border-slate-700/80 text-white"
          } backdrop-blur-xl overflow-hidden`}>

            {!isDirectionsMode ? (
              /* A. NORMAL SEARCH BAR MODE: SLEEK ROUNDED CAPSULE */
              <div className="flex items-center px-3.5 py-2 gap-2">
                {/* Menu Hamburger Button: Opens Sidebar (Saved, Ask AI, Settings) */}
                <button
                  onClick={() => toggleSidebar(true)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
                  title="Open Menu (Saved Locations, Ask AI, Settings)"
                  aria-label="Open Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    suppressSuggestionsRef.current = false;
                    setActiveSearchTarget("main");
                  }}
                  onChange={(e) => {
                    suppressSuggestionsRef.current = false;
                    setActiveSearchTarget("main");
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search destination, Starbucks, Pench..."
                  className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSuggestions([]);
                    }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Blue Circular Directions Button (Iconic Google Maps) */}
                <button
                  onClick={() => setIsDirectionsMode(true)}
                  className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
                  title="Directions"
                  aria-label="Directions"
                >
                  <Navigation className="w-4 h-4 fill-current rotate-45" />
                </button>

                {/* Sparkle Agentic AI Button */}
                <button
                  onClick={() => setIsAiDrawerOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/30 transition-all shrink-0 active:scale-95"
                  title="Plan route with Wayve AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI</span>
                </button>
              </div>
            ) : (
              /* B. GOOGLE MAPS DIRECTIONS INPUT MODE: CORNER-FREE GLASS PANEL */
              <div>
                {/* Mobile Collapsed Bar: Takes only 44px when routes are calculated */}
                {state.routes.length > 0 && isMobileDirectionsCollapsed && (
                  <div className="flex sm:hidden items-center justify-between px-3.5 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => {
                          setIsDirectionsMode(false);
                          resetJourney();
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 shrink-0"
                        title="Back to search"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        <span>{state.origin?.name?.split(",")[0] || "Nagpur"}</span>
                        <span className="text-slate-400 mx-1.5 font-normal">→</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{state.destination?.name?.split(",")[0] || "Destination"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setIsMobileDirectionsCollapsed(false)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}

                {/* Full Directions Form: Always visible on desktop (sm:flex), collapsible on mobile */}
                <div className={`p-4 flex-col gap-3 ${state.routes.length > 0 && isMobileDirectionsCollapsed ? "hidden sm:flex" : "flex"}`}>
                  {/* Travel Mode Selector Tabs */}
                  <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      {(["driving", "transit", "walking", "cycling"] as TravelMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setActiveTravelMode(mode)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 transition-all ${
                            activeTravelMode === mode
                              ? "bg-blue-600 text-white shadow-sm"
                              : isLight
                                ? "text-slate-600 hover:bg-slate-100"
                                : "text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          {mode === "driving" && <Car className="w-3.5 h-3.5" />}
                          {mode === "walking" && <Navigation className="w-3.5 h-3.5" />}
                          {mode === "cycling" && <Compass className="w-3.5 h-3.5" />}
                          {mode}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      {state.routes.length > 0 && (
                        <button
                          onClick={() => setIsMobileDirectionsCollapsed(true)}
                          className="sm:hidden px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                        >
                          Hide
                        </button>
                      )}
                      <button
                        onClick={() => toggleSidebar(true)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="Open Menu (Saved Locations, Ask AI, Settings)"
                      >
                        <Menu className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsDirectionsMode(false);
                          if (state.routes.length === 0) resetJourney();
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                        title="Close directions"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                {/* Origin & Destination Inputs + Swap Icon */}
                <div className="relative flex flex-col gap-2.5 pl-6">
                  {/* Vertical dotted connector */}
                  <div className="absolute left-2.5 top-4 bottom-4 w-0.5 border-l-2 border-dotted border-slate-300 dark:border-slate-700 pointer-events-none" />

                  {/* Origin */}
                  <div className="relative flex items-center gap-2">
                    <div className="absolute -left-6 w-3 h-3 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900" />
                    <input
                      type="text"
                      value={originQuery}
                      onFocus={() => {
                        suppressSuggestionsRef.current = false;
                        setActiveSearchTarget("origin");
                      }}
                      onChange={(e) => {
                        suppressSuggestionsRef.current = false;
                        setActiveSearchTarget("origin");
                        setOriginQuery(e.target.value);
                      }}
                      placeholder="Starting point (e.g. Nagpur)..."
                      className={`w-full text-xs font-semibold py-2 px-3.5 rounded-full border focus:outline-none transition-all ${
                        isLight ? "bg-slate-50/80 border-slate-200 focus:bg-white focus:border-blue-500" : "bg-slate-800/80 border-slate-700 focus:bg-slate-800 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  {/* Intermediate Stops (A, B, C...) */}
                  {activeStops.map((stop, idx) => (
                    <div key={stop.id} className="relative flex items-center gap-2">
                      <div className="absolute -left-6 w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className={`w-full text-xs font-medium py-1.5 px-3.5 rounded-full border flex items-center justify-between ${
                        isLight ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-800 border-slate-700 text-slate-200"
                      }`}>
                        <span className="truncate">{stop.name}</span>
                        <button
                          onClick={() => removeStop(stop.id)}
                          className="text-slate-400 hover:text-red-500 ml-2"
                          title="Remove stop"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Destination */}
                  <div className="relative flex items-center gap-2">
                    <div className="absolute -left-6">
                      <MapPin className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    </div>
                    <input
                      type="text"
                      value={destinationQuery}
                      onFocus={() => {
                        suppressSuggestionsRef.current = false;
                        setActiveSearchTarget("destination");
                      }}
                      onChange={(e) => {
                        suppressSuggestionsRef.current = false;
                        setActiveSearchTarget("destination");
                        setDestinationQuery(e.target.value);
                      }}
                      placeholder="Destination (e.g. Pench, Ramtek, Starbucks)..."
                      className={`w-full text-xs font-semibold py-2 px-3.5 rounded-full border focus:outline-none transition-all ${
                        isLight ? "bg-slate-50/80 border-slate-200 focus:bg-white focus:border-blue-500" : "bg-slate-800/80 border-slate-700 focus:bg-slate-800 focus:border-blue-500"
                      }`}
                    />
                  </div>

                  {/* Swap button (floating on right) */}
                  <button
                    onClick={swapOriginDestination}
                    className={`absolute right-1 top-6 p-2 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 ${
                      isLight ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    }`}
                    title="Reverse starting point and destination"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add Stop Button / Inline Form */}
                <div className="pt-1 flex items-center justify-between text-xs">
                  {!isAddingStop ? (
                    <button
                      onClick={() => setIsAddingStop(true)}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add stop (e.g. Starbucks)</span>
                    </button>
                  ) : (
                    <form onSubmit={handleAddStopSubmit} className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        value={newStopQuery}
                        onChange={(e) => setNewStopQuery(e.target.value)}
                        placeholder="e.g. Starbucks, Shell Fuel..."
                        autoFocus
                        className={`w-full text-xs py-1.5 px-3 rounded-full border focus:outline-none ${
                          isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800 border-slate-700"
                        }`}
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold hover:bg-blue-700 shadow-sm"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingStop(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}

                  <button
                    onClick={() => setIsAiDrawerOpen(true)}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI Agent</span>
                  </button>
                </div>
              </div>
              </div>
            )}
          </div>

          {/* Category Chips Bar (when in search mode) */}
          {!isDirectionsMode && (
            <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { label: "☕ Starbucks (Nagpur)", query: "Starbucks" },
                { label: "🏞️ Pench Tiger Reserve", query: "Pench National Park" },
                { label: "🏰 Ramtek Fort", query: "Ramtek Fort" },
                { label: "🌊 Futala Lake", query: "Futala Lake" },
                { label: "⛽ Swagat Fuel/EV", query: "Fuel" },
                { label: "☕ Coffee Roasters", query: "Cafe" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleCategorySearch(chip.query)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-md border transition-all active:scale-95 flex items-center gap-1 ${
                    isLight
                      ? "bg-white/95 border-slate-200/90 text-slate-700 hover:bg-slate-50"
                      : "bg-[#1e293b]/95 border-slate-700/80 text-slate-200 hover:bg-slate-800"
                  } backdrop-blur-xl`}
                >
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Autocomplete Suggestions Dropdown (STRICTLY SUPPRESSED in directions mode or after selection) */}
          {!isDirectionsMode && suggestions.length > 0 && (
            <div className={`pointer-events-auto rounded-[24px] shadow-2xl border max-h-72 overflow-y-auto p-1.5 ${
              isLight ? "bg-white/95 border-slate-200 text-slate-800" : "bg-[#1e293b]/95 border-slate-700 text-white"
            } backdrop-blur-xl`}>
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border-b last:border-b-0 flex items-start gap-3 transition-colors ${
                    isLight ? "border-slate-100/60 hover:bg-slate-100" : "border-slate-800/60 hover:bg-slate-800/80"
                  }`}
                >
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{item.address || item.category || "Verified Location"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Docked Left Drawer: AI Traffic Route Recommendation Portfolio (10 Distinct Routes) */}
          {state.routes.length > 0 && isDirectionsMode && (
            <div className={`pointer-events-auto rounded-2xl shadow-2xl border p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3 max-h-[45vh] sm:max-h-[calc(100vh-270px)] overflow-y-auto ${
              isLight ? "bg-white/95 border-slate-200/90 text-slate-800" : "bg-[#1e293b]/95 border-slate-700/80 text-white"
            } backdrop-blur-xl`}>
              
              {/* AI Agent Route Header */}
              <div className="flex flex-col gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Traffic Copilot
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {state.routes.length} Candidate Routes
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleTrafficLayer()}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all ${
                        state.isTrafficLayerVisible
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-400"
                      }`}
                      title="Toggle Live Ambient Highway Traffic Overlay"
                    >
                      <span>🚦</span>
                      <span>{state.isTrafficLayerVisible ? "Traffic ON" : "Traffic OFF"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  To <span className="font-semibold text-slate-700 dark:text-slate-200">{state.destination?.name}</span> {activeStops.length > 0 ? `· via ${activeStops.length} stop(s)` : ""}
                </p>

                {/* Quick-Filter Strategy Pill Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                  {[
                    { id: "all", label: `All (${state.routes.length})` },
                    { id: "fastest", label: "⚡ Fastest" },
                    { id: "balancer", label: "🚦 Balancer" },
                    { id: "express", label: "🛣️ Expressway" },
                    { id: "bypass", label: "🔄 Ring Bypass" },
                    { id: "incident_immune", label: "🛡️ Immune" },
                    { id: "eco", label: "🌱 Eco" },
                    { id: "scenic", label: "🌿 Scenic" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                        activeFilter === tab.id
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : isLight
                            ? "bg-slate-100/90 border-slate-200 text-slate-600 hover:bg-slate-200/80"
                            : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 10 Route Cards with Data Structures and Agent Scores */}
              <div className="flex flex-col gap-2.5">
                {displayedRoutes.map((route) => {
                  const isSelected = route.id === (state.selectedRouteId || state.routes[0]?.id);
                  const isAiPick = route.isWayvePick;
                  const isHeavy = route.trafficCondition === "heavy";
                  const isModerate = route.trafficCondition === "moderate";

                  return (
                    <div
                      key={route.id}
                      onClick={() => selectRoute(route.id)}
                      className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${
                        !isSelected && !isMobileRoutesExpanded ? "hidden sm:block" : "block"
                      } ${
                        isSelected
                          ? isAiPick
                            ? "bg-emerald-500/10 border-emerald-500 shadow-md ring-1 ring-emerald-500/80"
                            : "bg-blue-500/10 border-blue-500 shadow-md ring-1 ring-blue-500/80"
                          : isLight
                            ? "bg-slate-50/90 border-slate-200/90 hover:bg-slate-100/90"
                            : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800"
                      }`}
                    >
                      {/* Top Metric Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-extrabold ${
                            isHeavy
                              ? "text-red-600 dark:text-red-400"
                              : isModerate
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {formatDuration(route.predictedDurationSeconds || route.durationSeconds)}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({formatDistance(route.distanceMeters)})
                          </span>
                        </div>

                        {/* Agent Score Badge */}
                        <div className="flex items-center gap-1">
                          {route.agentScore && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
                              {route.agentScore}% Score
                            </span>
                          )}
                          {isAiPick && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-sm">
                              <Sparkles className="w-2.5 h-2.5" />
                              Top Pick
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Route Algorithmic Name */}
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {route.name}
                      </p>

                      {/* Algorithmic Data Structure & Traffic Strategy Tags */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {route.dataStructureType && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold border border-blue-500/20">
                            ⚙️ {route.dataStructureType}
                          </span>
                        )}
                        {route.trafficControlStrategy && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-bold border border-purple-500/20">
                            🎯 {route.trafficControlStrategy}
                          </span>
                        )}
                      </div>

                      {/* Traffic Delay & Recommendation Reason */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {isHeavy ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            Heavy traffic · +14m delay
                          </span>
                        ) : isModerate ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Moderate slowdown · 12% congestion
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Fluid corridor · {route.trafficCongestionIndex || 18}% congestion
                          </span>
                        )}
                      </div>

                      {/* Enhanced AI Traffic Intelligence */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {route.estimatedSpeedDropZones && route.estimatedSpeedDropZones.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[9px] font-bold border border-orange-500/20">
                            ⚡ {route.estimatedSpeedDropZones[0]}
                          </span>
                        )}
                        {route.signalWaitEstimate && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[9px] font-bold border border-sky-500/20">
                            🚦 {route.signalWaitEstimate}
                          </span>
                        )}
                        {route.peakHourImpact && (
                          <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[9px] font-bold border border-violet-500/20">
                            🕐 {route.peakHourImpact}
                          </span>
                        )}
                        {route.fuelEfficiencyScore && (
                          <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[9px] font-bold border border-teal-500/20">
                            ⛽ {route.fuelEfficiencyScore}
                          </span>
                        )}
                      </div>

                      {route.recommendationReason && (
                        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 w-full">
                          ✨ {route.recommendationReason}
                        </p>
                      )}

                      {/* Action buttons if selected */}
                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startJourney();
                              }}
                              className="flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                            >
                              <Navigation className="w-3.5 h-3.5 fill-current rotate-45" />
                              <span>Start Navigation</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSteps(!showSteps);
                              }}
                              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${
                                showSteps
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : isLight
                                    ? "border-slate-200 hover:bg-slate-100 text-slate-700"
                                    : "border-slate-700 hover:bg-slate-800 text-slate-300"
                              }`}
                            >
                              <span>{showSteps ? "Hide" : "Steps"}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowTrafficIntel(!showTrafficIntel);
                              }}
                              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                showTrafficIntel
                                  ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                                  : isLight
                                    ? "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900"
                                    : "border-amber-800/80 bg-amber-950/40 text-amber-300"
                              }`}
                              title="Highway Capacity Manual & Real-time Traffic Intelligence"
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>{showTrafficIntel ? "Hide Intel" : "Traffic Intel"}</span>
                              {route.realisticTraffic && (
                                <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/15">
                                  {route.realisticTraffic.levelOfService}
                                </span>
                              )}
                            </button>
                          </div>

                          {/* Realistic AI Traffic Intelligence Diagnostics Panel */}
                          {showTrafficIntel && route.realisticTraffic && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                  <Activity className="w-3 h-3 text-amber-500" />
                                  <span>Highway Capacity (HCM) Analytics</span>
                                </span>
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    route.realisticTraffic.levelOfService === "LOS A" || route.realisticTraffic.levelOfService === "LOS B"
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                      : route.realisticTraffic.levelOfService === "LOS C"
                                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                        : route.realisticTraffic.levelOfService === "LOS D"
                                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                          : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                                  }`}
                                >
                                  {route.realisticTraffic.levelOfService} · {route.realisticTraffic.congestionIndex}% Congestion
                                </span>
                              </div>

                              <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                                &ldquo;{route.realisticTraffic.levelOfServiceDescription}&rdquo;
                              </p>

                              {/* Speed Degradation & Signal Matrix */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Flow Speed</span>
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                    {route.realisticTraffic.averageSpeedKmh} km/h
                                  </span>
                                  <span className="text-[9px] text-rose-500 block font-semibold">
                                    -{route.realisticTraffic.speedDropPercent}% vs free
                                  </span>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Signal Wait</span>
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                    {route.realisticTraffic.signalizedIntersections} Signals
                                  </span>
                                  <span className="text-[9px] text-slate-400 block font-semibold">
                                    ~{Math.round((route.realisticTraffic.signalizedIntersections * route.realisticTraffic.averageSignalWaitSeconds) / 60)}m delay
                                  </span>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Green Wave</span>
                                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                    {route.realisticTraffic.greenWaveScorePercent}%
                                  </span>
                                  <span className="text-[9px] text-slate-400 block font-semibold">Coordination</span>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Queue Net</span>
                                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                                    {route.realisticTraffic.totalQueueLengthMeters}m
                                  </span>
                                  <span className="text-[9px] text-slate-400 block font-semibold">
                                    +{route.realisticTraffic.totalDelayMinutes}m delay
                                  </span>
                                </div>
                              </div>

                              {/* Predictive Smart Departure Forecaster */}
                              <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/70 dark:to-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                  <Clock className="w-3 h-3" />
                                  <span>AI Smart Departure Time Optimizer</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 mt-0.5">
                                  {route.realisticTraffic.departurePredictions.map((dep, dIdx) => (
                                    <div
                                      key={dIdx}
                                      className={`p-1.5 rounded-lg border text-center flex flex-col justify-between ${
                                        dep.isOptimal
                                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                                          : "bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                      }`}
                                    >
                                      <div>
                                        <span className="text-[10px] font-bold block">{dep.departureLabel}</span>
                                        <span className="text-xs font-black block">{dep.etaMinutes} min</span>
                                      </div>
                                      <span className="text-[8.5px] mt-1 line-clamp-1 opacity-80">{dep.savingsDescription}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Active Geographic Bottlenecks on this Route */}
                              {route.realisticTraffic.bottlenecks.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                                    <span>Active Bottlenecks on Corridor ({route.realisticTraffic.bottlenecks.length})</span>
                                  </span>
                                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                                    {route.realisticTraffic.bottlenecks.map((b) => (
                                      <div
                                        key={b.id}
                                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col gap-1"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                                            {b.name}
                                          </span>
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                            {b.currentSpeedKmh} km/h · {b.levelOfService}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                          {b.cause} • Queue: ~{b.queueLengthMeters}m (+{b.delayMinutes}m delay)
                                        </p>
                                        <p className="text-[9.5px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded">
                                          💡 {b.aiDirective}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Fuel & Carbon Penalty */}
                              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                                <span className="flex items-center gap-1">
                                  <Leaf className="w-3 h-3 text-emerald-500" />
                                  <span>Stop-and-Go Penalty: +{route.realisticTraffic.carbonPenaltyKg} kg CO₂</span>
                                </span>
                                <span>Efficiency: {route.realisticTraffic.fuelEfficiencyScore}</span>
                              </div>
                            </div>
                          )}

                          {/* Turn-by-Turn Steps Accordion directly inside selected card */}
                          {showSteps && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Turn-by-Turn Maneuvers ({route.maneuvers?.length || 0})
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const firstInstruction = route.maneuvers?.[0]?.instruction || "Continue on current corridor";
                                    speakNavInstruction(firstInstruction);
                                  }}
                                  className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline active:scale-95"
                                  title="Preview Voice Navigation"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>Preview Voice</span>
                                </button>
                              </div>
                              {route.maneuvers && route.maneuvers.length > 0 ? (
                                <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
                                  {route.maneuvers.map((step, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="flex items-start gap-2 text-xs p-2 rounded-lg bg-slate-50/90 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-black">
                                        {sIdx + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-[11px] leading-snug">
                                          {step.instruction}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <p className="text-[10px] text-slate-400 font-medium">
                                            {formatDistance(step.distanceMeters)}
                                          </p>
                                          {step.roadName && (
                                            <p className="text-[10px] text-slate-400 truncate">· {step.roadName}</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic py-1">Calculating street maneuvers...</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Mobile Expand / Collapse Button for 10 Candidate Routes */}
                {displayedRoutes.length > 1 && !isMobileRoutesExpanded && (
                  <button
                    onClick={() => setIsMobileRoutesExpanded(true)}
                    className="sm:hidden w-full py-2 px-3 rounded-xl text-xs font-bold text-center bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <span>View all {displayedRoutes.length} candidate routes</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}

                {displayedRoutes.length > 1 && isMobileRoutesExpanded && (
                  <button
                    onClick={() => setIsMobileRoutesExpanded(false)}
                    className="sm:hidden w-full py-2 px-3 rounded-xl text-xs font-bold text-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Collapse to top route</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Congestion Simulator for Live Agent Demonstration */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Dynamic Traffic Test:</span>
                <button
                  onClick={() => injectSimulationIncident("heavy_traffic", 0.85)}
                  className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold border border-red-500/20 transition-all active:scale-95"
                >
                  Simulate Incident
                </button>
              </div>
            </div>
          )}

          {/* Place Details Sheet (when place is clicked without directions yet) */}
          {selectedPlace && !isDirectionsMode && (
            <div className={`pointer-events-auto rounded-[26px] shadow-2xl border p-4 flex flex-col gap-3 ${
              isLight ? "bg-white/95 border-slate-200 text-slate-800" : "bg-[#1e293b]/95 border-slate-700 text-white"
            } backdrop-blur-xl`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold">{selectedPlace.name}</h2>
                  <p className="text-xs text-slate-400">{selectedPlace.address || "Point of Interest"}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-amber-500 font-bold">
                    <span>★ {selectedPlace.rating || 4.8}</span>
                    <span className="text-slate-400">· {selectedPlace.category || "Destination"}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setDestinationDirectAndCalculate(selectedPlace);
                    setIsDirectionsMode(true);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5 fill-current rotate-45" />
                  <span>Directions</span>
                </button>
                <button
                  onClick={() => handleAiPlan(`Drive to ${selectedPlace.name}, stop at Starbucks on the way`)}
                  className="px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Route</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACTIVE NAVIGATION MODE HUD (GOOGLE MAPS NAVIGATION BAR)                */}
      {/* ========================================================================= */}
      {isNavigating && (
        <>
          {/* Top Green Navigation Maneuver Banner */}
          <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-auto sm:w-[460px] z-30 pointer-events-auto">
            <div className="bg-[#0d652d] text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/30 flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <CornerUpRight className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-black tracking-tight leading-none mb-1">
                  In 450 m
                </p>
                <p className="text-sm font-semibold text-emerald-100 leading-snug">
                  {activeRoute?.maneuvers?.[state.currentManeuverIndex]?.instruction || "Continue on current corridor"}
                </p>
                <p className="text-[11px] text-emerald-300/80 mt-1">
                  Then continue toward {state.destination?.name || "destination"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-bold tracking-widest uppercase">
                  GPS LIVE
                </span>
                <span className="text-xs font-bold text-emerald-200">
                  {state.currentSpeedKmh} km/h
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Replanning Alert Banner (if incident occurs during nav) */}
          {state.replanningAssessment && state.replanningAssessment.triggered && (
            <div className="absolute top-28 left-3 right-3 sm:left-6 sm:right-auto sm:w-[460px] z-30 pointer-events-auto animate-bounce">
              <div className="bg-amber-600 text-white rounded-xl p-3 shadow-2xl border border-amber-300 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black">Faster route found: Save {state.replanningAssessment.timeSavedMinutes} mins</p>
                  <p className="text-[11px] text-amber-100">{state.replanningAssessment.reason}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={switchRoute}
                    className="px-2.5 py-1 bg-white text-amber-700 rounded-lg text-xs font-bold shadow-md hover:bg-amber-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={stayOnRoute}
                    className="p-1 text-white/80 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Navigation Bar */}
          <div className="absolute bottom-3 left-2 right-2 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[540px] z-30 pointer-events-auto">
            <div className={`rounded-2xl shadow-2xl border p-3 sm:p-3.5 flex items-center justify-between gap-2 sm:gap-3 ${
              isLight ? "bg-white border-slate-200 text-slate-800" : "bg-[#1e293b] border-slate-700 text-white"
            } backdrop-blur-md`}>
              
              {/* ETA and metrics */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="text-center shrink-0">
                  <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {formatDuration(activeRoute?.predictedDurationSeconds || 3600)}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mt-0.5">Remaining</p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                    {formatDistance(activeRoute?.distanceMeters || 45000)}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                    Est. Arrival {new Date(Date.now() + (activeRoute?.predictedDurationSeconds || 3600) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* TTS Mute Toggle */}
                <button
                  onClick={() => setIsMuted(toggleTTSMute())}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    isMuted
                      ? "bg-red-500/15 text-red-500"
                      : "bg-emerald-500/15 text-emerald-500"
                  }`}
                  title={isMuted ? "Unmute Voice Navigation" : "Mute Voice Navigation"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Voice Cast Toggle */}
                <button
                  onClick={handleToggleVoiceCast}
                  className="px-2 py-1.5 rounded-full text-[10px] font-black border flex items-center gap-1 transition-all active:scale-95 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  title={`Voice Cast: ${voiceCast === "american" ? "American Copilot (US English)" : "Sarvam AI (bulbul:v3)"}. Click to switch.`}
                >
                  <span>{voiceCast === "american" ? "🇺🇸 US" : "🇮🇳 Sarvam"}</span>
                </button>

                {/* Turn-by-Turn Steps Modal Toggle */}
                <button
                  onClick={() => setIsNavStepsOpen(!isNavStepsOpen)}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-all active:scale-95 border ${
                    isNavStepsOpen
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : isLight
                        ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                  title="View All Turn-by-Turn Steps"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Steps</span>
                </button>

                {/* Simulate Drive Toggle */}
                <button
                  onClick={() => toggleReplay()}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-all active:scale-95 border ${
                    state.isReplaying
                      ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                      : isLight
                        ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                  title={state.isReplaying ? "Pause Drive Simulation" : "Start Drive Simulation"}
                >
                  {state.isReplaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span className="hidden sm:inline">{state.isReplaying ? "Simulating" : "Simulate"}</span>
                </button>
                
                {state.isReplaying && (
                  <button
                    onClick={() => setReplaySpeed(state.replaySpeed === 1 ? 2 : state.replaySpeed === 2 ? 5 : 1)}
                    className="px-1.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Simulation Speed"
                  >
                    {state.replaySpeed || 1}x
                  </button>
                )}

                {/* Exit Navigation */}
                <button
                  onClick={resetJourney}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                  title="Exit Navigation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* In-Navigation Turn-by-Turn Steps Sheet */}
            {isNavStepsOpen && (
              <div className="mt-2 rounded-2xl shadow-2xl border p-3 sm:p-4 max-h-64 overflow-y-auto backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 bg-white/95 dark:bg-[#1e293b]/95 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white flex flex-col gap-2">
                <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Route Maneuvers
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Step {state.currentManeuverIndex + 1} of {activeRoute?.maneuvers?.length || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsNavStepsOpen(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {activeRoute?.maneuvers?.map((step, idx) => {
                    const isCurrent = idx === state.currentManeuverIndex;
                    const isPast = idx < state.currentManeuverIndex;
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${
                          isCurrent
                            ? "bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/60"
                            : isPast
                              ? "opacity-50 border-transparent bg-slate-50/50 dark:bg-slate-800/30"
                              : isLight
                                ? "bg-slate-50 border-slate-200/60"
                                : "bg-slate-800/60 border-slate-700/60"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-black ${
                          isCurrent
                            ? "bg-emerald-500 text-white"
                            : isPast
                              ? "bg-slate-300 dark:bg-slate-700 text-slate-500"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] leading-snug font-bold ${isCurrent ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                            {step.instruction}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-medium">
                            <span>{formatDistance(step.distanceMeters)}</span>
                            {step.roadName && <span>· {step.roadName}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => speakNavInstruction(step.instruction)}
                          className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                          title="Speak instruction"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. AGENTIC AI PROMPT SYNTHESIZER DRAWER (GEMINI 3.6 FLASH)                */}
      {/* ========================================================================= */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl border p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 ${
            isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#1e293b] border-slate-700 text-white"
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Wayve Agentic AI Copilot</h3>
                  <p className="text-[11px] text-slate-400">Powered by Gemini 3.6 Flash</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiDrawerOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Describe your journey naturally. Wayve AI will extract stops, discover verified coordinates, and synthesize an optimized multi-waypoint route.
            </p>

            {/* Prompt Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAiPlan();
              }}
              className="flex flex-col gap-2"
            >
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Drive from San Francisco to Santa Cruz, stop by a drive-thru Starbucks on the way, and take the scenic highway..."
                rows={3}
                className={`w-full text-xs font-medium p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-white"
                }`}
              />

              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-slate-400">
                  {state.isAiThinking ? "Synthesizing corridor..." : "Press Plan to calculate"}
                </span>
                <button
                  type="submit"
                  disabled={state.isAiThinking || !aiPrompt.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{state.isAiThinking ? "Planning..." : "Synthesize Route"}</span>
                </button>
              </div>
            </form>

            {/* Quick Inspiration Pills */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Try asking:</span>
              <div className="flex flex-col gap-1.5">
                {[
                  "Stop by nearby Starbucks first then take me to Pench National Park",
                  "Scenic drive to Ramtek Fort & Gadmandir with a coffee break",
                  "Fastest route to Futala Lake avoiding peak-hour congestion",
                  "Weekend road trip from Nagpur to Tadoba Tiger Reserve with EV charging stop",
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => handleAiPlan(sample)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      isLight
                        ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                        : "bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    ✨ &quot;{sample}&quot;
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Cast Selector (Top Right) */}
      <button
        onClick={handleToggleVoiceCast}
        className={`absolute top-4 right-16 z-30 px-3 h-10 rounded-full flex items-center justify-center gap-1.5 shadow-md border text-xs font-bold transition-all active:scale-95 pointer-events-auto ${
          isLight
            ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            : "bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
        }`}
        title={`Current Voice: ${voiceCast === "american" ? "American Navigation Voice (en-US)" : "Sarvam AI (bulbul:v3)"}. Click to switch.`}
      >
        <span>{voiceCast === "american" ? "🇺🇸 US Voice" : "🇮🇳 Sarvam AI"}</span>
      </button>

      {/* Theme Toggle Button (Top Right corner) */}
      <button
        onClick={() => setTheme(isLight ? "dark" : "light")}
        className={`absolute top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-md border transition-all active:scale-95 pointer-events-auto ${
          isLight ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-slate-900 border-slate-700 text-amber-400 hover:text-amber-300"
        }`}
        title={`Switch to ${isLight ? "Dark" : "Light"} mode`}
      >
        {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>
    </>
  );
};
