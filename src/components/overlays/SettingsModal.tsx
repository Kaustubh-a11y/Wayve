"use client";

import React from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Globe, MapPin, Moon, Shield, Volume2, X } from "lucide-react";

export const SettingsModal: React.FC = () => {
  const { state, toggleSettings } = useJourneyStore();

  if (!state.isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => toggleSettings(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm glass-panel rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 z-10 flex flex-col gap-4">
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Settings</h2>
            <p className="text-xs text-slate-400">Application & navigation preferences</p>
          </div>
          <button
            onClick={() => toggleSettings(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 text-slate-200">
              <Moon className="w-4 h-4 text-emerald-400" />
              <span>Appearance</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">Dark Spatial</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 text-slate-200">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Distance Units</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">Kilometers (km)</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 text-slate-200">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Privacy & Location</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">Session Only</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 text-slate-200">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Voice Guidance</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">Maneuver Prompts</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 font-medium">Wayve Mobility Engine v1.0</span>
        </div>

        <button
          onClick={() => toggleSettings(false)}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
