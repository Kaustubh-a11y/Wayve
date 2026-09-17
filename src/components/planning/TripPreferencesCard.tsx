"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { JourneyMode } from "@/types/journey";
import {
  ArrowLeft,
  ArrowRight,
  Coffee,
  DollarSign,
  Fuel,
  MapPin,
  MessageSquare,
  Mountain,
  Navigation,
  Shield,
  Utensils,
  Zap,
} from "lucide-react";

export const TripPreferencesCard: React.FC = () => {
  const {
    state,
    setJourneyMode,
    setPreferences,
    toggleStop,
    calculateRoutes,
    setPlanningStep,
    toggleConversation,
    resetJourney,
  } = useJourneyStore();

  // Visible only when destination is chosen and we are in preferences step
  if (!state.destination || state.planningStep !== "preferences") return null;

  const modes: { id: JourneyMode; label: string; icon: any; desc: string }[] = [
    { id: "fast", label: "Fast", icon: Zap, desc: "Expressway & quickest ETA" },
    { id: "scenic", label: "Scenic", icon: Mountain, desc: "Mountain ghats & viewpoints" },
    { id: "relaxed", label: "Relaxed", icon: Coffee, desc: "Low traffic & smooth curves" },
    { id: "economy", label: "Economy", icon: DollarSign, desc: "Zero tolls & fuel saver" },
  ];

  const handleCalculate = async () => {
    await calculateRoutes();
  };

  return (
    <div className="absolute top-20 sm:top-24 left-4 right-4 sm:left-6 sm:right-auto sm:w-[480px] z-20 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-4 sm:p-5 rounded-3xl shadow-xl border border-white/10">
        {/* Destination Header Banner */}
        <div className="flex items-start justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPlanningStep("destination");
                resetJourney();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Back to search"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {state.destination.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {state.destination.category || "Scenic Destination"} • ~64.8 km from Pune
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Selected
          </span>
        </div>

        {/* Driving Mode Selection Cards */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            How should we drive?
          </label>

          <div className="grid grid-cols-2 gap-2">
            {modes.map((m) => {
              const Icon = m.icon;
              const isSelected = state.journeyMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setJourneyMode(m.id)}
                  className={`p-3 rounded-2xl text-left transition-all active:scale-95 border ${
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500/60 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-500" : "text-slate-400"}`} />
                      {m.label}
                    </span>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {m.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Route Preference Toggles */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Route Preferences
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPreferences({ avoidTolls: !state.preferences.avoidTolls })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                state.preferences.avoidTolls
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              Avoid Tolls
            </button>

            <button
              onClick={() => setPreferences({ avoidHighways: !state.preferences.avoidHighways })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                state.preferences.avoidHighways
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              Avoid Highways
            </button>

            <button
              onClick={() => setPreferences({ avoidRain: !state.preferences.avoidRain })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                state.preferences.avoidRain
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              Rain Protection
            </button>
          </div>
        </div>

        {/* Stops along the way */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Add Stops On The Way
          </label>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {state.stops.map((stop) => {
              const isAdded = stop.added;
              const Icon = stop.type === "snacks" ? Utensils : stop.type === "coffee" ? Coffee : Fuel;
              return (
                <button
                  key={stop.id}
                  onClick={() => toggleStop(stop.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    isAdded
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 font-bold shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{stop.name}</span>
                  <span className="text-[10px] opacity-75">+{stop.detourMinutes}m</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCalculate}
            disabled={state.journeyState === "ROUTES_LOADING"}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {state.journeyState === "ROUTES_LOADING" ? (
              <span>Calculating Best Corridors...</span>
            ) : (
              <>
                <span>Calculate Routes</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            onClick={() => toggleConversation(true)}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
            title="Add natural language travel requests"
          >
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
