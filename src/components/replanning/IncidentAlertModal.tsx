"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { AlertTriangle, ArrowRight, Check, Clock, RefreshCw, X } from "lucide-react";

export const IncidentAlertModal: React.FC = () => {
  const { state, switchRoute, stayOnRoute } = useJourneyStore();

  const isSwitchPending =
    state.journeyState === "ROUTE_SWITCH_PENDING" && state.replanningAssessment?.triggered;

  if (!isSwitchPending || !state.replanningAssessment) return null;

  const assessment = state.replanningAssessment;
  const recommended = assessment.recommendedRoute;
  const delayMin = assessment.delayMinutes;
  const savedMin = assessment.timeSavedMinutes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-5 sm:p-6 border border-amber-500/40 shadow-2xl flex flex-col gap-4">
        {/* Incident Alert Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0 animate-bounce">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Route Degradation Detected
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
              Heavy Traffic Alert Ahead
            </h2>
          </div>
        </div>

        {/* Delay vs Saving Metrics Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Current Route Delay</span>
              <span className="text-base font-bold font-mono text-red-500">
                +{delayMin} min
              </span>
            </div>
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Alternative Saves</span>
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ~{savedMin} min
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Recommended Alternative
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                {recommended.name}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono">
                {Math.round((recommended.predictedDurationSeconds || recommended.durationSeconds) / 60)} min
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
            {assessment.reason}
          </p>
        </div>

        {/* User Decision CTAs */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={switchRoute}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Switch Route (Save {savedMin} min)</span>
          </button>

          <button
            onClick={stayOnRoute}
            className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all active:scale-95"
          >
            Stay on Route
          </button>
        </div>
      </div>
    </div>
  );
};
