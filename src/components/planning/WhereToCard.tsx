"use client";

import React, { useState } from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Destination } from "@/types/journey";
import { DETERMINISTIC_DESTINATIONS } from "@/lib/services/deterministicData";
import { ArrowRight, MapPin, MessageSquare, Mic, Navigation, Search, Sparkles } from "lucide-react";

export const WhereToCard: React.FC = () => {
  const { state, selectDestination, toggleConversation, sendUserMessage } = useJourneyStore();
  const [query, setQuery] = useState("");
  const isLight = state.theme === "light";

  // Only visible when idle or initial planning step
  if (state.journeyState !== "IDLE" && state.planningStep !== "destination") return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const trimmed = query.trim().toLowerCase();
    const matched = DETERMINISTIC_DESTINATIONS.find((d) =>
      d.name.toLowerCase().includes(trimmed) || d.category?.toLowerCase().includes(trimmed)
    );

    if (matched) {
      selectDestination(matched);
    } else {
      // Natural language query: send to conversation assistant
      toggleConversation(true);
      sendUserMessage(query);
    }
  };

  return (
    <div className="absolute top-20 sm:top-24 left-4 right-4 sm:left-6 sm:right-auto sm:w-[480px] z-20 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-4 sm:p-5 rounded-3xl shadow-xl border border-white/10">
        {/* Title & Subtitle */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Where are you going?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Search a city, landmark, or pick a weekend hill getaway
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleConversation(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
            title="Chat with Wayve AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        </div>

        {/* Minimal Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <div className="absolute left-3.5 text-slate-400">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destination (e.g. Lonavala)..."
            className="w-full pl-10 pr-20 py-3 rounded-2xl text-sm font-medium bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border border-slate-200 dark:border-slate-700/60 transition-all"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {query.trim() ? (
              <button
                type="submit"
                className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold hover:bg-emerald-400 transition-transform active:scale-95 shadow-md"
                title="Search"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleConversation(true)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-emerald-500 flex items-center justify-center transition-colors"
                title="Speak to Wayve"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Quick Destination Pill Suggestions */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Popular Escapes
          </span>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {DETERMINISTIC_DESTINATIONS.map((dest) => (
              <button
                key={dest.id}
                onClick={() => selectDestination(dest)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-slate-100/90 dark:bg-slate-800/90 hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all active:scale-95 shadow-sm"
              >
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>{dest.name}</span>
                <span className="text-[10px] text-slate-400">~65km</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
