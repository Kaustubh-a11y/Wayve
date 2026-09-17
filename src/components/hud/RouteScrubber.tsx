"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { AlertCircle, ChevronRight, Coffee, Flag, Pause, Play, X } from "lucide-react";

export const RouteScrubber: React.FC = () => {
  const {
    state,
    progressNavigationStep,
    arriveAtDestination,
    toggleReportModal,
    resetJourney,
    toggleReplay,
    setReplaySpeed,
    seekProgress,
    tickReplay,
    sendUserMessage,
  } = useJourneyStore();

  const isNavigating =
    state.journeyState === "NAVIGATING" ||
    state.journeyState === "MONITORING" ||
    state.journeyState === "ROUTE_SWITCH_PENDING";

  // Automated Replay Simulation Loop
  React.useEffect(() => {
    if (!isNavigating || !state.isReplaying) return;
    const interval = setInterval(() => {
      tickReplay();
    }, 350);
    return () => clearInterval(interval);
  }, [isNavigating, state.isReplaying, tickReplay]);

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

  const addedStops = state.stops.filter((s) => s.added);
  const hasStarbucks = addedStops.some((s) => s.name.toLowerCase().includes("starbucks") || s.type === "coffee");

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekProgress(frac);
  };

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

          {/* Action buttons: Stop Reroute, Report Incident, Exit Trip */}
          <div className="flex items-center gap-2">
            {!hasStarbucks && (
              <button
                onClick={() => sendUserMessage("Add nearby Starbucks stop and reroute")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all active:scale-95 shadow-sm"
                title="Stop by nearby Starbucks and reroute"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-500" />
                <span>+ Starbucks</span>
              </button>
            )}

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

        {/* Traffic Progress Interactive Scrubber Bar */}
        <div
          onClick={handleScrubberClick}
          className="relative w-full my-2 cursor-pointer group py-1"
          title="Click to seek anywhere on route"
        >
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-950 overflow-hidden flex p-0.5 border border-slate-300 dark:border-slate-800 group-hover:ring-2 group-hover:ring-emerald-500/40 transition-all">
            <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: "45%" }} />
            <div
              className={`h-full ${
                state.activeRoute.trafficCondition === "heavy" ? "bg-red-500" : "bg-amber-500"
              }`}
              style={{ width: "30%" }}
            />
            <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: "25%" }} />
          </div>

          {/* Waypoint markers on scrubber */}
          {addedStops.map((stop, idx) => {
            const stopPercent = Math.min(85, Math.max(25, (idx + 1) * 35));
            return (
              <div
                key={stop.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center"
                style={{ left: `${stopPercent}%` }}
              >
                <span className="text-[10px] drop-shadow">☕</span>
              </div>
            );
          })}

          {/* User vehicle pointer on progress bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center transition-all duration-300 pointer-events-none group-hover:scale-125"
            style={{ left: `${Math.max(4, Math.min(96, state.routeProgress * 100))}%` }}
          />
        </div>

        {/* Navigation Playback & Step Controller */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
          {/* Play / Pause & Speed controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleReplay()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all active:scale-95 shadow-sm text-xs"
              title={state.isReplaying ? "Pause replay" : "Play driving simulation"}
            >
              {state.isReplaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Drive</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                const nextSpeed = state.replaySpeed === 1 ? 2 : state.replaySpeed === 2 ? 5 : 1;
                setReplaySpeed(nextSpeed);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs transition-colors"
              title="Toggle simulation replay speed"
            >
              {state.replaySpeed || 1}x
            </button>

            <span className="text-slate-400 text-[11px] hidden sm:inline">
              {state.isReplaying ? "Simulating live corridor navigation" : "Paused"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={progressNavigationStep}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all active:scale-95 text-xs"
              title="Advance to next turn maneuver"
            >
              <span>Next Turn</span>
              <ChevronRight className="w-3 h-3" />
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
