"use client";

import React, { useState } from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { JourneyMode } from "@/types/journey";
import { Coffee, Compass, CornerDownLeft, Fuel, Mic, Mountain, Search, Sparkles, Zap } from "lucide-react";

export const AskWayveBar: React.FC = () => {
  const {
    state,
    setJourneyMode,
    sendUserMessage,
    toggleConversation,
    setDestination,
  } = useJourneyStore();

  const [inputQuery, setInputQuery] = useState("");

  const isIdleOrPlanning =
    state.journeyState === "IDLE" ||
    state.journeyState === "PLANNING" ||
    state.journeyState === "DESTINATION_RESOLVED";

  if (!isIdleOrPlanning) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    const query = inputQuery.trim();
    setInputQuery("");
    toggleConversation(true);
    sendUserMessage(query);
  };

  const modes: { id: JourneyMode; label: string; icon: any }[] = [
    { id: "fast", label: "Fast", icon: Zap },
    { id: "scenic", label: "Scenic", icon: Mountain },
    { id: "relaxed", label: "Relaxed", icon: Coffee },
    { id: "economy", label: "Economy", icon: Fuel },
    { id: "custom", label: "Custom", icon: Compass },
  ];

  return (
    <div className="absolute top-20 left-4 right-4 sm:left-6 sm:right-auto sm:w-[460px] z-20 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-300">
      {/* Ask Wayve Floating Spatial Search Box */}
      <div className="glass-panel p-2.5 sm:p-3 rounded-3xl border border-white/10 shadow-spatial">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <label htmlFor="ask-input" className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Where are we going?
            </label>
            <input
              id="ask-input"
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Wayve (e.g. nearest hill station)..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none font-medium truncate"
            />
          </div>

          {inputQuery.trim() ? (
            <button
              type="submit"
              className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold hover:bg-emerald-400 transition-transform active:scale-95 shadow-glow-sm"
              title="Submit request"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => toggleConversation(true)}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              title="Open conversational planning assistant"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Journey Mode Selection Pills (Alters route optimization weights) */}
        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-800/70 overflow-x-auto pb-1 no-scrollbar">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = state.journeyMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setJourneyMode(m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 shadow-glow-sm font-bold"
                    : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-slate-950" : "text-emerald-400"}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Discovery Prompts */}
      {!state.destination && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: "Nearest hill station", query: "Take me to the nearest hill station" },
            { label: "Lonavala with snacks", query: "Take me to Lonavala and find somewhere for snacks on the way" },
            { label: "Scenic Panchgani drive", query: "Panchgani scenic route avoiding highways" },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                toggleConversation(true);
                sendUserMessage(item.query);
              }}
              className="glass-panel px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-emerald-300 hover:border-emerald-500/30 whitespace-nowrap transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Search className="w-3 h-3 text-emerald-400" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
