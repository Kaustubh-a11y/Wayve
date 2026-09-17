"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Destination } from "@/types/journey";
import { ChevronRight, MapPin, Star } from "lucide-react";

export const DestinationSelector: React.FC = () => {
  const { state, setDestination, setJourneyState } = useJourneyStore();

  if (state.journeyState !== "PLANNING" || state.destination) return null;

  return (
    <div className="absolute top-24 left-4 right-4 sm:left-6 sm:right-auto sm:w-[460px] z-30 animate-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-spatial">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Suggested Destinations</h3>
            <p className="text-xs text-slate-400">Select a destination to generate route options</p>
          </div>
          <button
            onClick={() => setJourneyState("IDLE")}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>

        <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {state.candidateDestinations.map((dest) => (
            <button
              key={dest.id}
              onClick={() => setDestination(dest)}
              className="group p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/40 text-left transition-all duration-200 flex items-center justify-between active:scale-[0.98] shadow-md hover:shadow-glow-sm"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors truncate">
                      {dest.name}
                    </h4>
                    {dest.rating && (
                      <span className="flex items-center gap-0.5 text-[11px] text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.2 rounded">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {dest.rating}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {dest.category}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-300 font-medium">
                    <span className="text-emerald-400 font-mono">
                      ~{Math.round((dest.distanceMeters || 65000) / 1000)} km
                    </span>
                    <span>•</span>
                    <span>~{dest.approximateDurationMinutes || 75} min</span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-700/50 group-hover:bg-emerald-500 text-slate-400 group-hover:text-slate-950 flex items-center justify-center transition-colors flex-shrink-0 ml-2">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
