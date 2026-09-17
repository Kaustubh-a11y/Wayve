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
      return <CornerUpLeft className="w-8 h-8 text-emerald-400" />;
    }
    if (modifier?.includes("right") || type?.includes("right")) {
      return <CornerUpRight className="w-8 h-8 text-emerald-400" />;
    }
    if (modifier?.includes("slight_left")) {
      return <ArrowUpLeft className="w-8 h-8 text-emerald-400" />;
    }
    if (modifier?.includes("slight_right")) {
      return <ArrowUpRight className="w-8 h-8 text-emerald-400" />;
    }
    return <ArrowUp className="w-8 h-8 text-emerald-400" />;
  }

  const distanceText =
    currentManeuver.distanceMeters >= 1000
      ? `${(currentManeuver.distanceMeters / 1000).toFixed(1)} km`
      : `${currentManeuver.distanceMeters} m`;

  return (
    <div className="absolute top-20 left-4 z-20 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto animate-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-4 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl flex items-start gap-4">
        {/* Turn Direction Icon Box */}
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          {getManeuverIcon(currentManeuver.type, currentManeuver.modifier)}
        </div>

        {/* Turn Instructions & Road Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {distanceText}
            </span>
            {currentManeuver.roadName && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 border border-emerald-500/20 truncate">
                {currentManeuver.roadName}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-200 mt-1 leading-snug line-clamp-2">
            {currentManeuver.instruction}
          </p>
        </div>
      </div>
    </div>
  );
};
