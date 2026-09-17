"use client";

import React, { useState } from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { SimulationEventType } from "@/types/journey";
import { AlertCircle, CloudRain, Flame, Sliders, TrafficCone, X, Zap } from "lucide-react";

export const SimulationDrawer: React.FC = () => {
  const { state, toggleSimulation, injectSimulationIncident } = useJourneyStore();

  const [selectedType, setSelectedType] = useState<SimulationEventType>("heavy_traffic");
  const [severity, setSeverity] = useState(0.8);

  if (!state.isSimulationOpen) return null;

  const events: { type: SimulationEventType; label: string; icon: any }[] = [
    { type: "heavy_traffic", label: "Heavy Traffic Congestion", icon: Sliders },
    { type: "accident", label: "Road Collision / Accident", icon: Flame },
    { type: "road_closure", label: "Road Closure / Blocked", icon: TrafficCone },
    { type: "construction", label: "Active Construction", icon: AlertCircle },
    { type: "heavy_rain", label: "Heavy Rain / Waterlogging", icon: CloudRain },
    { type: "event_congestion", label: "Event Surge Congestion", icon: Zap },
  ];

  const handleApply = () => {
    injectSimulationIncident(selectedType, severity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => toggleSimulation(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-500/30 z-10 flex flex-col gap-4">
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5" />
              <span>Deterministic Simulation Engine</span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">Inject Route Incident</h2>
          </div>
          <button
            onClick={() => toggleSimulation(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Incident Type Radios */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Event Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {events.map((ev) => {
              const Icon = ev.icon;
              const isSelected = selectedType === ev.type;
              return (
                <button
                  key={ev.type}
                  onClick={() => setSelectedType(ev.type)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition-all active:scale-95 ${
                    isSelected
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                      : "bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{ev.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Severity Slider */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400 uppercase tracking-wider">
              Incident Severity
            </span>
            <span className="font-bold font-mono text-amber-400">
              {Math.round(severity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.1"
            value={severity}
            onChange={(e) => setSeverity(parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Moderate (+5 min)</span>
            <span>Severe (+14 min)</span>
            <span>Critical (+25 min)</span>
          </div>
        </div>

        {/* Description of real replanning pipeline */}
        <p className="text-[11px] text-slate-400 bg-slate-950/70 p-2.5 rounded-xl border border-white/5 leading-relaxed">
          ⚡ <strong>Real Replanning Pipeline:</strong> This injects an event on your active route, updates segment road costs, triggers ML delay prediction, re-evaluates all alternatives, and tests the 3-minute hysteresis threshold.
        </p>

        {/* Apply CTA */}
        <button
          onClick={handleApply}
          className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Sliders className="w-4 h-4" />
          <span>Apply Event & Trigger Replan</span>
        </button>
      </div>
    </div>
  );
};
