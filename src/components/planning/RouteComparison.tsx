"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import {
  CheckCircle2,
  ChevronRight,
  Coffee,
  HelpCircle,
  MapPin,
  Mountain,
  Navigation,
  Plus,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export const RouteComparison: React.FC = () => {
  const {
    state,
    selectRoute,
    startJourney,
    toggleWhyThisRoute,
    toggleStop,
    setJourneyState,
  } = useJourneyStore();

  const isRoutesReady =
    state.journeyState === "ROUTES_READY" ||
    (state.destination && state.routes.length > 0 && state.journeyState !== "NAVIGATING" && state.journeyState !== "MONITORING" && state.journeyState !== "ROUTE_SWITCH_PENDING" && state.journeyState !== "ARRIVED");

  if (!isRoutesReady || state.routes.length === 0) return null;

  return (
    <div className="absolute top-20 left-4 right-4 sm:left-6 sm:right-auto sm:w-[460px] z-20 max-h-[85vh] flex flex-col gap-3 animate-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 shadow-spatial flex flex-col gap-3 overflow-y-auto max-h-[82vh]">
        {/* Header with Destination and Mode */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">Candidate Routes</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              To {state.destination?.name || "Lonavala"}
            </h2>
          </div>
          <button
            onClick={() => setJourneyState("IDLE")}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800"
          >
            Change
          </button>
        </div>

        {/* Route Cards */}
        <div className="flex flex-col gap-3">
          {state.routes.map((route) => {
            const isSelected = route.id === state.selectedRouteId;
            const durationMin = Math.round(
              (route.predictedDurationSeconds || route.durationSeconds) / 60
            );
            const distKm = (route.distanceMeters / 1000).toFixed(1);

            return (
              <div
                key={route.id}
                onClick={() => selectRoute(route.id)}
                className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border relative ${
                  isSelected
                    ? "bg-slate-800/95 border-emerald-500/50 shadow-glow-sm"
                    : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                }`}
              >
                {/* Wayve Pick Highlight Badge */}
                {route.isWayvePick && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Wayve's Pick
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWhyThisRoute(true);
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline underline-offset-2 font-medium"
                    >
                      <span>Why this route?</span>
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {route.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{route.summary}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {durationMin} min
                    </span>
                    <span className="block text-[11px] font-medium text-slate-400 font-mono">
                      {distKm} km
                    </span>
                  </div>
                </div>

                {/* Badges / Attributes */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-md font-medium ${
                      route.trafficCondition === "low"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : route.trafficCondition === "moderate"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    🚦 {route.trafficCondition === "low" ? "Low traffic" : "Moderate traffic"}
                  </span>

                  {route.weatherCondition && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                      ☀️ {route.weatherCondition.tempC}°C · {route.weatherCondition.summary}
                    </span>
                  )}

                  {route.isWayvePick && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-semibold">
                      🌿 Scenic Priority
                    </span>
                  )}
                </div>

                {/* Wayve Explanation snippet */}
                {route.recommendationReason && (
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl mt-2.5 border border-white/5 leading-relaxed">
                    {route.recommendationReason}
                  </p>
                )}

                {/* Primary CTA inside selected card */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Confidence: <strong className="text-emerald-400">{route.confidence}%</strong>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startJourney();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                    >
                      <Navigation className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Start Journey</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contextual Stops Along Route */}
        <div className="pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-white block mb-2">
            Stops along your route
          </span>
          <div className="flex flex-col gap-2">
            {state.stops.map((stop) => (
              <div
                key={stop.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                    <Coffee className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{stop.name}</span>
                    <span className="text-[11px] text-slate-400">
                      +{stop.detourMinutes} min detour · Along route
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleStop(stop.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    stop.added
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {stop.added ? "Added ✓" : "+ Add"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
