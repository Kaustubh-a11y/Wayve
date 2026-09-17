"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { AlertCircle, CheckCircle2, ChevronRight, Flag, X } from "lucide-react";

export const RouteScrubber: React.FC = () => {
  const {
    state,
    progressNavigationStep,
    arriveAtDestination,
    toggleReportModal,
    resetJourney,
  } = useJourneyStore();

  const isNavigating =
    state.journeyState === "NAVIGATING" ||
    state.journeyState === "MONITORING" ||
    state.journeyState === "ROUTE_SWITCH_PENDING";

  if (!isNavigating || !state.activeRoute) return null;

  const totalDistanceKm = (state.activeRoute.distanceMeters / 1000).toFixed(1);
  const totalMinutes = Math.round(
    (state.activeRoute.predictedDurationSeconds || state.activeRoute.durationSeconds) / 60
  );
  const remainingMinutes = Math.max(1, Math.round(totalMinutes * (1 - state.routeProgress)));
  const remainingKm = Math.max(0.1, parseFloat((parseFloat(totalDistanceKm) * (1 - state.routeProgress)).toFixed(1)));

  // Compute ETA clock time
  const etaDate = new Date(Date.now() + remainingMinutes * 60000);
  const etaTime = etaDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="absolute bottom-6 left-4 right-4 z-20 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl flex flex-col gap-3">
        {/* Top metrics row: Distance, Duration, Arrival Clock */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-4 sm:gap-6">
            <div>
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                {remainingKm}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">km</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

            <div>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                {remainingMinutes}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">min</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block leading-none mb-0.5">Arrival</span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                {etaTime}
              </span>
            </div>
          </div>

          {/* Action buttons: Report Incident, End Trip */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleReportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all active:scale-95 shadow-sm"
              title="Report road incident ahead"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>+ Report</span>
            </button>

            <button
              onClick={resetJourney}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors"
              title="Exit navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Traffic Progress Scrubber Bar */}
        <div className="relative w-full my-1">
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-950 overflow-hidden flex p-0.5 border border-slate-300 dark:border-slate-800">
            <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: "45%" }} />
            <div
              className={`h-full ${
                state.activeRoute.trafficCondition === "heavy" ? "bg-red-500" : "bg-amber-500"
              }`}
              style={{ width: "30%" }}
            />
            <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: "25%" }} />
          </div>

          {/* User vehicle pointer on progress bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center transition-all duration-300 pointer-events-none"
            style={{ left: `${Math.max(4, Math.min(96, state.routeProgress * 100))}%` }}
          />
        </div>

        {/* Navigation Step Controller */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate max-w-[180px] sm:max-w-xs font-medium">
              Wayve Corridor Monitoring Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={progressNavigationStep}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold transition-all active:scale-95 text-xs"
            >
              <span>Drive Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={arriveAtDestination}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all text-xs font-semibold"
              title="Simulate complete arrival"
            >
              <Flag className="w-3.5 h-3.5 text-emerald-500" />
              <span>Arrive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
