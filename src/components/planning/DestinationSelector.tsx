"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Destination } from "@/types/journey";
import { ChevronRight, MapPin, Star, X } from "lucide-react";

export const DestinationSelector: React.FC = () => {
  const { state, selectDestination, setJourneyState } = useJourneyStore();

  if (state.journeyState !== "PLANNING" || state.destination || state.planningStep !== "destination") return null;

  return (
    <div className="absolute top-20 sm:top-24 left-4 right-4 sm:left-6 sm:right-auto sm:w-[480px] z-30 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Suggested Destinations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select a destination to configure your journey</p>
          </div>
          <button
            onClick={() => setJourneyState("IDLE")}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {state.candidateDestinations.map((dest) => (
            <button
              key={dest.id}
              onClick={() => selectDestination(dest)}
              className="group p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/70 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left transition-all flex items-center justify-between active:scale-[0.98] shadow-sm"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {dest.name}
                    </h4>
                    {dest.rating && (
                      <span className="flex items-center gap-0.5 text-[11px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-500" />
                        {dest.rating}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {dest.category}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      ~{Math.round((dest.distanceMeters || 65000) / 1000)} km
                    </span>
                    <span>•</span>
                    <span>~{dest.approximateDurationMinutes || 75} min</span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 group-hover:bg-emerald-500 text-slate-500 group-hover:text-slate-950 flex items-center justify-center transition-colors flex-shrink-0 ml-2">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
