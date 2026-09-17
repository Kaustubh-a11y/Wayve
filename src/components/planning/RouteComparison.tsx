"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import {
  ArrowLeft,
  Coffee,
  HelpCircle,
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react";

export const RouteComparison: React.FC = () => {
  const {
    state,
    selectRoute,
    startJourney,
    toggleWhyThisRoute,
    setPlanningStep,
  } = useJourneyStore();

  const isLight = state.theme === "light";

  const isRoutesReady =
    state.journeyState === "ROUTES_READY" ||
    (state.destination && state.routes.length > 0 && state.planningStep === "routes" &&
      state.journeyState !== "NAVIGATING" &&
      state.journeyState !== "MONITORING" &&
      state.journeyState !== "ROUTE_SWITCH_PENDING" &&
      state.journeyState !== "ARRIVED");

  if (!isRoutesReady || state.routes.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px] z-20 pointer-events-auto max-h-[78vh] flex flex-col">
      <div className={`rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
        isLight
          ? "bg-white/97 border-slate-200"
          : "bg-slate-900/95 border-white/10"
      } backdrop-blur-xl`}>
        {/* Header */}
        <div className={`flex items-center gap-3 px-4 py-3.5 border-b flex-shrink-0 ${
          isLight ? "border-slate-100" : "border-white/6"
        }`}>
          <button
            onClick={() => setPlanningStep("preferences")}
            className={`p-1.5 rounded-xl transition-colors flex-shrink-0 ${
              isLight ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100" : "text-slate-500 hover:text-white hover:bg-white/8"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Routes to {state.destination?.name}</span>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-white/5 border-white/10 text-slate-400"
          }`}>
            {state.routes.length} options
          </span>
        </div>

        {/* Route Cards — Scrollable */}
        <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2.5">
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
                className={`cursor-pointer rounded-xl p-4 transition-all duration-200 border ${
                  isSelected
                    ? isLight
                      ? "bg-emerald-50 border-emerald-400 shadow-sm"
                      : "bg-emerald-500/10 border-emerald-500/70 shadow-sm"
                    : isLight
                      ? "bg-slate-50 border-slate-200 hover:border-slate-300"
                      : "bg-white/4 border-white/8 hover:border-white/15"
                }`}
              >
                {/* Wayve Pick Badge */}
                {route.isWayvePick && (
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wide">
                      <Sparkles className="w-2.5 h-2.5" />
                      Wayve's Pick
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWhyThisRoute(true); }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Why?</span>
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Route Name & ETA */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                      {route.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{route.summary}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className={`text-lg font-bold font-mono ${isSelected ? "text-emerald-500" : isLight ? "text-slate-900" : "text-white"}`}>
                      {durationMin}<span className="text-xs font-medium ml-0.5">min</span>
                    </span>
                    <span className={`block text-[11px] font-medium font-mono ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {distKm} km
                    </span>
                  </div>
                </div>

                {/* Traffic & Attribute Pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    route.trafficCondition === "low"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : route.trafficCondition === "moderate"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "bg-red-500/15 text-red-700 dark:text-red-300"
                  }`}>
                    🚦 {route.trafficCondition === "low" ? "Low traffic" : route.trafficCondition === "moderate" ? "Moderate" : "Heavy"}
                  </span>

                  {route.weatherCondition && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isLight ? "bg-slate-100 text-slate-600" : "bg-white/8 text-slate-300"
                    }`}>
                      ☀️ {route.weatherCondition.tempC}°C
                    </span>
                  )}

                  {route.isWayvePick && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      ✦ Score {route.score}/100
                    </span>
                  )}
                </div>

                {/* Recommendation reason for selected route */}
                {isSelected && route.recommendationReason && (
                  <p className={`text-[11px] mt-2.5 p-2.5 rounded-lg leading-relaxed ${
                    isLight ? "bg-slate-100 text-slate-600" : "bg-white/5 text-slate-400"
                  }`}>
                    {route.recommendationReason}
                  </p>
                )}

                {/* Start Journey CTA — inside selected card */}
                {isSelected && (
                  <button
                    onClick={(e) => { e.stopPropagation(); startJourney(); }}
                    className="mt-3 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Navigation className="w-4 h-4 fill-white" />
                    <span>Start Navigation</span>
                  </button>
                )}
              </div>
            );
          })}

          {/* Stops along route summary */}
          {state.stops.some((s) => s.added) && (
            <div className={`rounded-xl p-3 flex flex-wrap items-center gap-2 border ${
              isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/8 border-emerald-500/20"
            }`}>
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span className={`text-xs font-semibold ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>
                Stops included:
              </span>
              {state.stops.filter((s) => s.added).map((stop) => (
                <span
                  key={stop.id}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                >
                  <Coffee className="w-3 h-3" />
                  {stop.name}
                  <span className="opacity-60 text-[10px]">+{stop.detourMinutes}m</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
