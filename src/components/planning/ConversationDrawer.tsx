"use client";

import React, { useState } from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Bot, CornerDownLeft, Sparkles, User, X } from "lucide-react";

export const ConversationDrawer: React.FC = () => {
  const {
    state,
    toggleConversation,
    sendUserMessage,
  } = useJourneyStore();

  const [inputVal, setInputVal] = useState("");

  if (!state.isConversationOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const text = inputVal.trim();
    setInputVal("");
    sendUserMessage(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => toggleConversation(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg glass-panel rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 z-10 max-h-[85vh] flex flex-col">
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-500">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Travel Assistant</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Conversational trip planning & objectives</p>
            </div>
          </div>
          <button
            onClick={() => toggleConversation(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 min-h-[220px] max-h-[420px]">
          {state.chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-sm ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "wayve" && (
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`px-4 py-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-emerald-500 text-slate-950 font-semibold rounded-tr-sm shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.text}
              </div>

              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* AI Thinking Activity */}
          {state.isAiThinking && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-full w-fit animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Wayve is evaluating routes, weather & traffic...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar border-t border-slate-200/80 dark:border-slate-800/80">
          {["Lonavala", "Panchgani", "Find coffee", "Make it scenic", "Avoid tolls"].map(
            (chip, idx) => (
              <button
                key={idx}
                onClick={() => sendUserMessage(chip)}
                className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-xs text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-all active:scale-95"
              >
                {chip}
              </button>
            )
          )}
        </div>

        {/* Follow-up input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Tell Wayve (e.g. 'find snacks on the way')..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || state.isAiThinking}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-40 transition-all flex items-center justify-center shadow-sm"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
