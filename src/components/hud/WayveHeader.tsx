"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Play, RotateCcw, Settings, SlidersHorizontal, Sun } from "lucide-react";

export const WayveHeader: React.FC = () => {
  const {
    state,
    toggleSimulation,
    toggleSettings,
    toggleWeatherModal,
    resetJourney,
    injectSimulationIncident,
    setDestination,
    startJourney,
    switchRoute,
  } = useJourneyStore();

  // Canonical Signature Demo Tour Runner
  const runDemoTour = async () => {
    // Step 1: Destination candidates
    const destinations = (await import("@/lib/services/deterministicData")).DETERMINISTIC_DESTINATIONS;
    // Step 2: Select Lonavala
    setDestination(destinations[0]);

    // Step 3: Start journey
    setTimeout(() => {
      startJourney();
    }, 1200);

    // Step 4: Inject traffic after 3 seconds
    setTimeout(() => {
      injectSimulationIncident("heavy_traffic", 0.85);
    }, 3500);
  };

  return (
    <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
      {/* Wayve Brand Pill */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-glow" />
            <span className="font-bold tracking-wider text-sm sm:text-base text-white">WAYVE</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-800" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
            Live
          </span>
          <span className="text-xs text-slate-400 hidden md:inline">
            {state.journeyState.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Action Controls (Weather, Demo Storyline, Simulation, Reset, Settings) */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Canonical Demo Storyline CTA */}
        <button
          onClick={runDemoTour}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-all shadow-lg active:scale-95 group"
          title="Run canonical signature demo storyline"
        >
          <Play className="w-3.5 h-3.5 fill-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Demo Tour</span>
        </button>

        {/* Simulation Mode Toggle */}
        <button
          onClick={() => toggleSimulation()}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl glass-panel text-xs font-medium transition-all shadow-lg active:scale-95 ${
            state.isSimulationOpen
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "text-slate-300 hover:text-amber-300 hover:border-amber-500/30"
          }`}
          title="Open Simulation Incident Injector"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">Simulate</span>
        </button>

        {/* Weather Quick Badge */}
        <button
          onClick={() => toggleWeatherModal()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-xs text-slate-300 hover:text-white transition-all shadow-lg active:scale-95"
          title="View destination weather forecast"
        >
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="font-medium hidden sm:inline">24°C</span>
        </button>

        {/* Reset Journey Button */}
        {state.destination && (
          <button
            onClick={resetJourney}
            className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition-all shadow-lg active:scale-95"
            title="Reset Journey to start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Settings Modal Toggle */}
        <button
          onClick={() => toggleSettings()}
          className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition-all shadow-lg active:scale-95"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
