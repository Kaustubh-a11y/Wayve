"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import {
  ArrowLeft,
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
    setPlanningStep,
    setJourneyState,
  } = useJourneyStore();

  const isRoutesReady =
    state.journeyState === "ROUTES_READY" ||
    (state.destination && state.routes.length > 0 && state.planningStep === "routes" &&
      state.journeyState !== "NAVIGATING" &&
      state.journeyState !== "MONITORING" &&
      state.journeyState !== "ROUTE_SWITCH_PENDING" &&
      state.journeyState !== "ARRIVED");

  if (!isRoutesReady || state.routes.length === 0) return null;

  return (
    <div className="absolute top-20 sm:top-24 left-4 right-4 sm:left-6 sm:right-auto sm:w-[480px] z-20 max-h-[85vh] flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-4 sm:p-5 rounded-3xl shadow-xl border border-white/10 flex flex-col gap-3 overflow-y-auto max-h-[82vh]">
        {/* Header with Destination and Back Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setPlanningStep("preferences")}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Back to Preferences"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended Corridors</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                To {state.destination?.name || "Lonavala"}
              </h2>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {state.routes.length} options
          </span>
        </div>

        {/* Route Cards */}
        <div className="flex flex-col gap-2.5">
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
                    ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-850/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Wayve Pick Highlight Badge */}
                {route.isWayvePick && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Wayve's Pick
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWhyThisRoute(true);
                      }}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Why this route?</span>
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {route.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{route.summary}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {durationMin} min
                    </span>
                    <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">
                      {distKm} km
                    </span>
                  </div>
                </div>

                {/* Badges / Attributes */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-medium ${
                      route.trafficCondition === "low"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : route.trafficCondition === "moderate"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "bg-red-500/15 text-red-700 dark:text-red-300"
                    }`}
                  >
                    🚦 {route.trafficCondition === "low" ? "Low traffic" : "Moderate traffic"}
                  </span>

                  {route.weatherCondition && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      ☀️ {route.weatherCondition.tempC}°C
                    </span>
                  )}

                  {route.isWayvePick && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                      🌿 Optimal Match
                    </span>
                  )}
                </div>

                {/* Wayve Explanation snippet */}
                {route.recommendationReason && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-900/80 p-2.5 rounded-xl mt-2.5 border border-slate-200 dark:border-slate-800 leading-relaxed">
                    {route.recommendationReason}
                  </p>
                )}

                {/* Primary CTA inside selected card */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Match: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{route.score}/100</strong>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startJourney();
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
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

        {/* Waypoints / Stops Along Route */}
        {state.stops.some((s) => s.added) && (
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
            <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1.5">
              Included Stops
            </span>
            <div className="flex flex-wrap gap-2">
              {state.stops
                .filter((s) => s.added)
                .map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                  >
                    <Coffee className="w-3 h-3 text-emerald-500" />
                    <span>{stop.name}</span>
                    <span className="text-[10px] text-slate-500">(+{stop.detourMinutes}m)</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
