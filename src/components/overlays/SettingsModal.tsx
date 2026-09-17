"use client";

import React, { useState } from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { MapViewMode, ThemeMode } from "@/types/journey";
import {
  Activity,
  CheckCircle2,
  Globe,
  Key,
  Layers,
  MapPin,
  Moon,
  RotateCcw,
  Shield,
  Sparkles,
  Sun,
  Volume2,
  X,
  Zap,
} from "lucide-react";

export const SettingsModal: React.FC = () => {
  const {
    state,
    toggleSettings,
    setTheme,
    setMapViewMode,
    setCustomGeminiKey,
    setAiDiagnostics,
  } = useJourneyStore();

  const [inputKey, setInputKey] = useState(state.customGeminiKey || "");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!state.isSettingsOpen) return null;

  const isLight = state.theme === "light";

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    setCustomGeminiKey(inputKey);

    try {
      const res = await fetch("/api/v1/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Nearest hill station",
          customKey: inputKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.diagnostics) {
        setAiDiagnostics(data.diagnostics);
        if (data.diagnostics.status === "connected") {
          setTestResult(`✓ Connected to Gemini (${data.diagnostics.latencyMs}ms)`);
        } else {
          setTestResult(`Notice: ${data.diagnostics.message}`);
        }
      } else {
        setTestResult("Test completed via local NLP engine.");
      }
    } catch (err: any) {
      setTestResult("Connection test failed. Local NLP engine remains active.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => toggleSettings(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md glass-panel rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 z-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Settings & Diagnostics</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Application theme, map view & AI engine</p>
          </div>
          <button
            onClick={() => toggleSettings(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Appearance Theme */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Appearance Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "light" as ThemeMode, label: "Light", icon: Sun },
              { id: "dark" as ThemeMode, label: "Dark", icon: Moon },
              { id: "system" as ThemeMode, label: "System", icon: Globe },
            ].map((theme) => {
              const Icon = theme.icon;
              const isSelected = state.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 font-bold shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Map View Perspective */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Map Camera Perspective
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["2d", "3d", "satellite"] as MapViewMode[]).map((mode) => {
              const isSelected = state.mapViewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setMapViewMode(mode)}
                  className={`py-2 px-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 font-bold shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: AI Engine Diagnostics & Custom Key */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              AI Conversation Engine
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                state.aiDiagnostics.status === "connected"
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              }`}
            >
              {state.aiDiagnostics.engine === "gemini" ? "Gemini 1.5 Flash" : "Local NLP Engine"}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
            {state.aiDiagnostics.message}
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Google AI Studio API Key (Starts with 'AIzaSy...')
            </label>

            <div className="flex items-center gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <button
                onClick={handleTestKey}
                disabled={isTesting}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {isTesting ? "Testing..." : "Test Key"}
              </button>
            </div>

            {testResult && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                {testResult}
              </span>
            )}

            <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
              * Note: If an API key is not provided or quota is exceeded, Wayve automatically executes all intent parsing, destination routing, and scenic preferences locally with zero interruption.
            </span>
          </div>
        </div>

        {/* Section 4: System Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Wayve Spatial Mobility Engine</span>
          <span className="font-mono">v1.2 (Step 2)</span>
        </div>

        <button
          onClick={() => toggleSettings(false)}
          className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
