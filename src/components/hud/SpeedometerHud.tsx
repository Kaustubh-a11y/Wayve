"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";

export const SpeedometerHud: React.FC = () => {
  const { state } = useJourneyStore();

  const isNavigating =
    state.journeyState === "NAVIGATING" ||
    state.journeyState === "MONITORING" ||
    state.journeyState === "ROUTE_SWITCH_PENDING";

  if (!isNavigating) return null;

  const isOverSpeed = state.currentSpeedKmh > state.speedLimitKmh;

  return (
    <div className="absolute top-20 right-4 z-20 flex items-center gap-2 animate-in fade-in duration-300">
      {/* Current Speed Badge */}
      <div className="glass-panel px-3.5 py-2 rounded-2xl flex flex-col items-center justify-center border border-white/10 shadow-xl min-w-[70px]">
        <span
          className={`text-2xl font-black font-mono leading-none tracking-tight ${
            isOverSpeed ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {state.currentSpeedKmh}
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
          km/h
        </span>
      </div>

      {/* Speed Limit Badge (Standard Highway Sign Style) */}
      <div className="w-12 h-14 rounded-xl bg-white border-2 border-red-600 flex flex-col items-center justify-center shadow-xl">
        <span className="text-[8px] font-black tracking-tighter text-slate-900 leading-none uppercase">
          Limit
        </span>
        <span className="text-lg font-black font-mono text-slate-950 leading-none mt-0.5">
          {state.speedLimitKmh}
        </span>
      </div>
    </div>
  );
};
