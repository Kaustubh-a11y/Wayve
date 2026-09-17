"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { ArrowDownRight, ArrowUpRight, BarChart3, CheckCircle2, ShieldCheck, Sparkles, X } from "lucide-react";

export const WhyThisRouteModal: React.FC = () => {
  const { state, toggleWhyThisRoute } = useJourneyStore();

  if (!state.isWhyThisRouteOpen) return null;

  const active = state.activeRoute || state.routes.find((r) => r.isWayvePick) || state.routes[0];
  if (!active) return null;

  const breakdown = active.scoreBreakdown || {
    scenic: 96,
    detour: 94,
    traffic: 92,
    weather: 88,
    tolls: 90,
    eta: 74,
  };

  const attributions = active.shapAttribution || [
    { feature: "Low congestion arterial", impactMinutes: 4.8, direction: "decrease" },
    { feature: "Valley scenery road", impactMinutes: 0.0, direction: "decrease" },
    { feature: "Clear weather forecast", impactMinutes: 1.5, direction: "decrease" },
    { feature: "Scenic curve speed limits", impactMinutes: 3.2, direction: "increase" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => toggleWhyThisRoute(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg glass-panel rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-emerald-500/30 z-10 flex flex-col gap-4 max-h-[88vh] overflow-y-auto">
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Why Wayve Chose This Route</h2>
              <p className="text-xs text-slate-400">Explainable AI (XAI) & optimization transparency</p>
            </div>
          </div>
          <button
            onClick={() => toggleWhyThisRoute(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Summary */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Selected Route
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              Confidence {active.confidence}%
            </span>
          </div>
          <h3 className="text-base font-bold text-white">{active.name}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {active.recommendationReason}
          </p>
        </div>

        {/* Feature Factor Attribution (SHAP-like XAI) */}
        <div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Predicted ETA Contributing Factors</span>
          </span>

          <div className="flex flex-col gap-2">
            {attributions.map((attr, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  {attr.direction === "decrease" ? (
                    <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="font-medium text-slate-200">{attr.feature}</span>
                </div>

                <span
                  className={`font-mono font-bold ${
                    attr.direction === "decrease" ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {attr.direction === "decrease" ? "-" : "+"}
                  {attr.impactMinutes} min
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Route Objective Factor Scores */}
        <div className="pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
            Objective Fit Breakdown (0-100)
          </span>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {[
              { label: "Scenic Experience", score: breakdown.scenic },
              { label: "Low Traffic Flow", score: breakdown.traffic },
              { label: "Weather Safety", score: breakdown.weather },
              { label: "Convenient Stops", score: breakdown.detour },
              { label: "Toll Road Savings", score: breakdown.tolls },
              { label: "ETA Efficiency", score: breakdown.eta },
            ].map((factor, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 text-[11px] font-medium">{factor.label}</span>
                  <span className="text-emerald-400 font-mono font-bold">{factor.score}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => toggleWhyThisRoute(false)}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
