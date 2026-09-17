"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Moon, Play, RotateCcw, Settings, SlidersHorizontal, Sun } from "lucide-react";

export const WayveHeader: React.FC = () => {
  const {
    state,
    setTheme,
    toggleSimulation,
    toggleSettings,
    toggleWeatherModal,
    resetJourney,
    selectDestination,
    calculateRoutes,
    startJourney,
    injectSimulationIncident,
  } = useJourneyStore();

  const isLight = state.theme === "light";

  // Canonical Signature Demo Tour Runner
  const runDemoTour = async () => {
    // Step 1: Select Lonavala
    const destinations = (await import("@/lib/services/deterministicData")).DETERMINISTIC_DESTINATIONS;
    selectDestination(destinations[0]);

    // Step 2: Calculate routes after short delay
    setTimeout(async () => {
      await calculateRoutes();
    }, 600);

    // Step 3: Start journey
    setTimeout(() => {
      startJourney();
    }, 1600);

    // Step 4: Inject traffic after 3.5 seconds
    setTimeout(() => {
      injectSimulationIncident("heavy_traffic", 0.85);
    }, 3800);
  };

  return (
    <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
      {/* Wayve Brand Pill */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 shadow-lg border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="font-bold tracking-wider text-sm sm:text-base text-slate-900 dark:text-white">
              WAYVE
            </span>
          </div>

          <div className={`h-4 w-[1px] ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />

          {/* AI Engine Status Pill */}
          <button
            onClick={() => toggleSettings(true)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:opacity-80 transition-opacity"
            title="Click to view AI Engine Diagnostics"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${state.aiDiagnostics.status === "connected" ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span>{state.aiDiagnostics.engine === "gemini" ? "Gemini AI" : "NLP Engine"}</span>
          </button>
        </div>
      </div>

      {/* Action Controls: Theme Switcher, Demo Tour, Simulation, Settings */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={() => setTheme(isLight ? "dark" : "light")}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-emerald-500 transition-all shadow-md active:scale-95"
          title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
          aria-label="Toggle Theme"
        >
          {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Canonical Demo Storyline CTA */}
        <button
          onClick={runDemoTour}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-all shadow-md active:scale-95 group"
          title="Run canonical signature demo tour"
        >
          <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
          <span>Demo Tour</span>
        </button>

        {/* Simulation Incident Trigger */}
        <button
          onClick={() => toggleSimulation()}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-panel text-xs font-semibold transition-all shadow-md active:scale-95 ${
            state.isSimulationOpen
              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
              : "text-slate-700 dark:text-slate-300 hover:text-amber-500"
          }`}
          title="Open Simulation Incident Drawer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden md:inline">Simulate</span>
        </button>

        {/* Reset Journey Button */}
        {state.destination && (
          <button
            onClick={resetJourney}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-md active:scale-95"
            title="Reset to home"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Settings Modal Toggle */}
        <button
          onClick={() => toggleSettings()}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-md active:scale-95"
          title="Settings & Diagnostics"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
