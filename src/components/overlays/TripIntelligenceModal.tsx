"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Award, CheckCircle2, Clock, Navigation2, RefreshCw, Sparkles, TrendingUp, X } from "lucide-react";

export const TripIntelligenceModal: React.FC = () => {
  const { state, toggleTripIntelligence, resetJourney } = useJourneyStore();

  const isVisible = state.isTripIntelligenceOpen && state.tripIntelligence;

  useEffect(() => {
    if (isVisible) {
      // Fire celebration confetti upon arrival
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#00e599", "#3b82f6", "#f59e0b"],
      });
    }
  }, [isVisible]);

  if (!isVisible || !state.tripIntelligence) return null;

  const data = state.tripIntelligence;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="fixed inset-0"
        onClick={() => toggleTripIntelligence(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg glass-panel rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/10 z-10 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-1" />

        {/* Arrival Banner */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trip Completed</span>
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data.destinationName}
              </h2>
            </div>
          </div>
          <button
            onClick={() => toggleTripIntelligence(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Key Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Distance
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
              {data.distanceKm}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">km traveled</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Duration
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
              {data.actualDurationMinutes}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">minutes</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Reroutes
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {data.reroutesCount}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">dynamic switch</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
              Time Saved
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {data.timeSavedMinutes}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">min saved</span>
          </div>
        </div>

        {/* Contributing Factors Breakdown */}
        <div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
            Why Wayve Made These Decisions
          </span>
          <div className="flex flex-col gap-2">
            {data.factorWeights.map((fw, idx) => (
              <div key={idx} className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                  <span>{fw.factor}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{fw.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${fw.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Journey Events Timeline */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
            Journey Event Timeline
          </span>
          <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            {data.eventsTimeline.map((ev, idx) => (
              <div key={idx} className="relative flex items-baseline gap-2.5 text-xs">
                <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] whitespace-nowrap">
                  {ev.time}
                </span>
                <span className="text-slate-600 dark:text-slate-300 leading-snug">{ev.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-1 flex gap-2.5">
          <button
            onClick={() => {
              toggleTripIntelligence(false);
              resetJourney();
            }}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Plan New Journey
          </button>
          <button
            onClick={() => toggleTripIntelligence(false)}
            className="py-3 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
