"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { ArrowUp, ArrowUpLeft, ArrowUpRight, CornerUpLeft, CornerUpRight, Navigation } from "lucide-react";

export const ManeuverBanner: React.FC = () => {
  const { state } = useJourneyStore();

  const isNavigating =
    state.journeyState === "NAVIGATING" ||
    state.journeyState === "MONITORING" ||
    state.journeyState === "ROUTE_SWITCH_PENDING";

  if (!isNavigating || !state.activeRoute) return null;

  const maneuvers = state.activeRoute.maneuvers || [];
  const currentManeuver = maneuvers[state.currentManeuverIndex] || maneuvers[0];

  function getManeuverIcon(type?: string, modifier?: string) {
    if (modifier?.includes("left") || type?.includes("left")) {
      return <CornerUpLeft className="w-7 h-7 text-emerald-500" />;
    }
    if (modifier?.includes("right") || type?.includes("right")) {
      return <CornerUpRight className="w-7 h-7 text-emerald-500" />;
    }
    if (modifier?.includes("slight_left")) {
      return <ArrowUpLeft className="w-7 h-7 text-emerald-500" />;
    }
    if (modifier?.includes("slight_right")) {
      return <ArrowUpRight className="w-7 h-7 text-emerald-500" />;
    }
    return <ArrowUp className="w-7 h-7 text-emerald-500" />;
  }

  const distanceText =
    currentManeuver.distanceMeters >= 1000
      ? `${(currentManeuver.distanceMeters / 1000).toFixed(1)} km`
      : `${currentManeuver.distanceMeters} m`;

  return (
    <div className="absolute top-20 left-4 z-20 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-4 rounded-3xl border border-white/10 shadow-xl flex items-start gap-3.5">
        {/* Turn Direction Icon Box */}
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center shadow-sm">
          {getManeuverIcon(currentManeuver.type, currentManeuver.modifier)}
        </div>

        {/* Turn Instructions & Road Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {distanceText}
            </span>
            {currentManeuver.roadName && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 truncate">
                {currentManeuver.roadName}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5 leading-snug line-clamp-2">
            {currentManeuver.instruction}
          </p>
        </div>
      </div>
    </div>
  );
};
