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

  const isLight = state.theme === "light";

  // Visible only when destination is chosen and we are in preferences step
  if (!state.destination || state.planningStep !== "preferences") return null;

  const modes: { id: JourneyMode; label: string; emoji: string; desc: string }[] = [
    { id: "fast", label: "Fastest", emoji: "⚡", desc: "Expressway & quickest ETA" },
    { id: "scenic", label: "Scenic", emoji: "🌿", desc: "Mountain ghats & viewpoints" },
    { id: "relaxed", label: "Relaxed", emoji: "😌", desc: "Low traffic & smooth curves" },
    { id: "economy", label: "Economy", emoji: "₹", desc: "No tolls & fuel-efficient" },
  ];

  const handleCalculate = async () => {
    await calculateRoutes();
  };

  return (
    <div className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px] z-20 pointer-events-auto">
      <div className={`rounded-2xl shadow-2xl border overflow-hidden ${
        isLight
          ? "bg-white/97 border-slate-200"
          : "bg-slate-900/95 border-white/10"
      } backdrop-blur-xl`}>
        {/* Destination Header */}
        <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${
          isLight ? "border-slate-100" : "border-white/6"
        }`}>
          <button
            onClick={() => { setPlanningStep("destination"); resetJourney(); }}
            className={`p-1.5 rounded-xl transition-colors ${
              isLight ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100" : "text-slate-500 hover:text-white hover:bg-white/8"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                {state.destination.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {state.destination.category || "Scenic Destination"} · ~65 km
              </p>
            </div>
          </div>

          <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            Selected ✓
          </span>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Driving Mode — 4 pill-style tiles */}
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-slate-400" : "text-slate-500"}`}>
              How should we drive?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {modes.map((m) => {
                const isSelected = state.journeyMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setJourneyMode(m.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center transition-all active:scale-95 border ${
                      isSelected
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                        : isLight
                          ? "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="text-xl leading-none">{m.emoji}</span>
                    <span className={`text-[11px] font-bold leading-none ${isSelected ? "text-white" : ""}`}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route Preference Toggles — compact row */}
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-slate-400" : "text-slate-500"}`}>
              Route Preferences
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "avoidTolls" as const, label: "No Tolls" },
                { key: "avoidHighways" as const, label: "No Highways" },
                { key: "avoidRain" as const, label: "🌦 Rain Safe" },
              ].map(({ key, label }) => {
                const isActive = state.preferences[key];
                return (
                  <button
                    key={key}
                    onClick={() => setPreferences({ [key]: !isActive })}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      isActive
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isLight
                          ? "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stops Along the Way */}
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-slate-400" : "text-slate-500"}`}>
              Add Stops
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
              {state.stops.map((stop) => {
                const isAdded = stop.added;
                const Icon = stop.type === "snacks" ? Utensils : stop.type === "coffee" ? Coffee : Fuel;
                return (
                  <button
                    key={stop.id}
                    onClick={() => toggleStop(stop.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isAdded
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                        : isLight
                          ? "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{stop.name}</span>
                    {isAdded && <span className="text-[10px] opacity-80">+{stop.detourMinutes}m</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCalculate}
              disabled={state.journeyState === "ROUTES_LOADING"}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.journeyState === "ROUTES_LOADING" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Finding best routes…</span>
                </>
              ) : (
                <>
                  <span>Show Routes</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={() => toggleConversation(true)}
              className={`p-3 rounded-xl transition-colors border ${
                isLight
                  ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              }`}
              title="Chat with Wayve AI"
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
