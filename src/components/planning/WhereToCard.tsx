"use client";

import React, { useState } from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Destination } from "@/types/journey";
import { DETERMINISTIC_DESTINATIONS } from "@/lib/services/deterministicData";
import { ArrowRight, ChevronRight, MapPin, Mic, Search, Sparkles, X } from "lucide-react";

export const WhereToCard: React.FC = () => {
  const { state, selectDestination, toggleConversation, sendUserMessage } = useJourneyStore();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [liveResults, setLiveResults] = useState<Destination[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const isLight = state.theme === "light";

  // Live Geocoding effect as user types
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setLiveResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch("/api/v1/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            proximity: state.origin.coordinate,
          }),
        });
        const data = await res.json();
        if (data.destinations && data.destinations.length > 0) {
          setLiveResults(data.destinations);
        } else {
          setLiveResults([]);
        }
      } catch {
        setLiveResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, state.origin.coordinate]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    // Check if prompt is natural language conversational (e.g. "take me to...", "stop by starbucks")
    const isConversational =
      q.toLowerCase().includes("take me") ||
      q.toLowerCase().includes("stop by") ||
      q.toLowerCase().includes("starbucks") ||
      q.toLowerCase().includes("coffee") ||
      q.toLowerCase().includes("via") ||
      q.toLowerCase().includes("scenic");

    if (isConversational) {
      toggleConversation(true);
      sendUserMessage(q);
      setQuery("");
      return;
    }

    // If live suggestions exist, pick the first one
    if (liveResults.length > 0) {
      selectDestination(liveResults[0]);
      setQuery("");
      return;
    }

    // Otherwise do a fast geocoding fetch
    try {
      const res = await fetch("/api/v1/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, proximity: state.origin.coordinate }),
      });
      const data = await res.json();
      if (data.destinations && data.destinations.length > 0) {
        selectDestination(data.destinations[0]);
      } else {
        // Fallback to custom destination
        selectDestination({
          id: `custom-${Date.now()}`,
          name: q,
          type: "place",
          address: q,
          coordinate: { lat: 18.9365, lng: 72.8241 },
          category: "Destination",
        });
      }
    } catch {
      selectDestination(DETERMINISTIC_DESTINATIONS[0]);
    }
    setQuery("");
  };

  // Determine which suggestions to display
  const suggestions =
    liveResults.length > 0
      ? liveResults
      : query.trim()
      ? DETERMINISTIC_DESTINATIONS.filter(
          (d) =>
            d.name.toLowerCase().includes(query.toLowerCase()) ||
            d.category?.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  // Only visible when idle or initial planning step
  if (state.journeyState !== "IDLE" && state.planningStep !== "destination") return null;

  return (
    <div className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px] z-20 flex flex-col gap-2 pointer-events-auto">
      {/* Live Geocoded Destination Suggestions */}
      {isFocused && query.trim().length >= 2 && suggestions.length > 0 && (
        <div
          className={`rounded-2xl shadow-2xl border overflow-hidden max-h-64 overflow-y-auto ${
            isLight
              ? "bg-white/97 border-slate-200"
              : "bg-slate-900/95 border-white/10"
          } backdrop-blur-xl`}
        >
          {isSearching && (
            <div className="px-4 py-2 text-[11px] font-medium text-slate-400 flex items-center gap-2 border-b border-slate-100 dark:border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Searching places...</span>
            </div>
          )}
          {suggestions.slice(0, 5).map((dest, i) => (
            <button
              key={dest.id || `sugg-${i}`}
              onMouseDown={() => {
                selectDestination(dest);
                setQuery("");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                i !== 0
                  ? isLight
                    ? "border-t border-slate-100"
                    : "border-t border-white/5"
                  : ""
              } ${isLight ? "hover:bg-emerald-50/60" : "hover:bg-white/5"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isLight ? "bg-emerald-50" : "bg-emerald-500/15"
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  {dest.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {dest.address || `${dest.category || "Place"}`}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Main "Where to?" Search Card — Google Maps Bottom Sheet Style */}
      <div className={`rounded-2xl shadow-2xl border overflow-hidden ${
        isLight
          ? "bg-white/97 border-slate-200"
          : "bg-slate-900/95 border-white/10"
        } backdrop-blur-xl`}>
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-4 py-3">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder="Where to?"
            className={`flex-1 text-base font-medium bg-transparent placeholder-slate-400 focus:outline-none ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => toggleConversation(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"
              title="Ask Wayve AI"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Divider */}
        <div className={`h-[1px] mx-4 ${isLight ? "bg-slate-100" : "bg-white/6"}`} />

        {/* Quick Escapes — Scrollable Pill Chips */}
        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? "text-slate-400" : "text-slate-500"}`}>
              Weekend Escapes
            </span>
            <button
              onClick={() => toggleConversation(true)}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 hover:text-emerald-400"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ask AI</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            {DETERMINISTIC_DESTINATIONS.map((dest) => (
              <button
                key={dest.id}
                onClick={() => selectDestination(dest)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 border ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                    : "bg-white/6 border-white/10 text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400"
                }`}
              >
                <MapPin className="w-3 h-3 text-emerald-500" />
                <span>{dest.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
