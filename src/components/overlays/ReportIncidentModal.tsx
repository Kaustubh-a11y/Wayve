"use client";

import React, { useState } from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { IncidentType } from "@/types/journey";
import { AlertCircle, AlertTriangle, CloudRain, Flame, HelpCircle, Send, TrafficCone, X } from "lucide-react";

export const ReportIncidentModal: React.FC = () => {
  const { state, toggleReportModal, reportIncident } = useJourneyStore();

  const [selectedType, setSelectedType] = useState<IncidentType>("heavy_traffic");
  const [distanceAhead, setDistanceAhead] = useState("< 500 m");

  if (!state.isReportModalOpen) return null;

  const incidentTypes: { type: IncidentType; label: string; icon: any }[] = [
    { type: "heavy_traffic", label: "Heavy Traffic", icon: AlertCircle },
    { type: "accident", label: "Car Accident", icon: Flame },
    { type: "construction", label: "Road Construction", icon: AlertTriangle },
    { type: "road_blocked", label: "Road Blocked", icon: TrafficCone },
    { type: "flooding", label: "Waterlogging / Rain", icon: CloudRain },
    { type: "hazard", label: "Hazard on Road", icon: HelpCircle },
  ];

  const distances = ["< 500 m", "< 1 km", "< 2 km", "> 2 km"];

  const handleSubmit = () => {
    reportIncident(selectedType, distanceAhead);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => toggleReportModal(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 z-10 flex flex-col gap-4">
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-1" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Human-In-The-Loop Intelligence
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">Report Incident Ahead</h2>
          </div>
          <button
            onClick={() => toggleReportModal(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: What is happening? */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            What is happening?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {incidentTypes.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedType === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => setSelectedType(item.type)}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 text-xs font-semibold transition-all active:scale-95 ${
                    isSelected
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/60 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: How far ahead? */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            How far ahead?
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {distances.map((dist) => (
              <button
                key={dist}
                onClick={() => setDistanceAhead(dist)}
                className={`py-2 px-1 rounded-2xl text-xs font-semibold text-center border transition-all active:scale-95 ${
                  distanceAhead === dist
                    ? "bg-emerald-500 text-slate-950 font-bold border-emerald-500 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                {dist}
              </button>
            ))}
          </div>
        </div>

        {/* Notice */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 leading-relaxed">
          Your report will immediately update road cost estimates and trigger route re-evaluation for all nearby Wayve drivers.
        </p>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Submit Report</span>
        </button>
      </div>
    </div>
  );
};
