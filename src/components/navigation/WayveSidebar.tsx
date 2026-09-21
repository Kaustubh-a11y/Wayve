"use client";

import React, { useState } from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Destination } from "@/types/journey";
import {
  Bookmark,
  Sparkles,
  Settings as SettingsIcon,
  X,
  MapPin,
  Navigation,
  Trash2,
  Plus,
  Send,
  Loader2,
  Home,
  Briefcase,
  Compass,
  Moon,
  Sun,
  Volume2,
  Sliders,
  Check,
  ChevronRight,
  Route,
} from "lucide-react";

export type SidebarTab = "saved" | "ai" | "settings";

const PANDAL_TOUR_PROMPT = `I want to roam in the city and visit ganpati pandals here are the locations [Tumbbad Theme Pandal – MBYS Ground, Bajaj NagarKantara Theme Pandal – Bajaj NagarElemental Galaxy Pandal (Manacha Raja) – Hanuman Mandir Ground, Trimurti Nagar SquareDisneyland Theme Pandal – Vivekanand NagarHarry Potter Theme (Hogwarts Pandal) – Ramkrishna Nagar Ground, behind Sai Mandir, Wardha RoadAncient India Science & Tech Pandal – Bhende LayoutWonders of Dreams Pandal – Pratap NagarDakshinamurti Mandal (Alandi Temple Replica) – Dakshinamurti Chowk, MahalPataleshwar Mandal (Golden Chariot Replica) – MahalJaripatka Cha Raja (Underwater Dwarka Theme) – Mangalwari Market Road, JaripatkaFriends Group Cha Raja (Vaikunth Dham Theme) – Sindhu Nagar Society Chowk, JaripatkaVaikunth Dham Pandal – Near Zenda Chowk, DharampethGovardhan Leela Pandal – Tatya Tope NagarParis Theme Pandal – Sindhi ColonyKal Nagari / Krishna Kunj – Bidipeth]

so go from my current location and make a city tour mark each location on map and make a route putting all of them and come back to current location in the end`;

export const WayveSidebar: React.FC = () => {
  const {
    state,
    toggleSidebar,
    addSavedPlace,
    removeSavedPlace,
    saveCurrentLocation,
    setDestinationDirectAndCalculate,
    setOrigin,
    planTripWithAI,
    setTheme,
    setMapViewMode,
    toggleSettings,
  } = useJourneyStore();

  const [activeTab, setActiveTab] = useState<SidebarTab>("ai");
  const [aiInput, setAiInput] = useState("");
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [customPlaceName, setCustomPlaceName] = useState("");
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  if (!state.isSidebarOpen) return null;

  const isLight = state.theme === "light";

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPlaceName.trim()) {
      saveCurrentLocation();
    } else {
      saveCurrentLocation(customPlaceName.trim());
    }
    setCustomPlaceName("");
    setIsSavingCustom(false);
    setSavedFeedback("Saved to your list!");
    setTimeout(() => setSavedFeedback(null), 2500);
  };

  const handleAiSubmit = async (promptToRun?: string) => {
    const text = (promptToRun || aiInput).trim();
    if (!text) return;
    setAiInput("");
    toggleSidebar(false);
    await planTripWithAI(text);
  };

  const getPlaceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("home")) return <Home className="w-4 h-4 text-blue-500" />;
    if (lower.includes("work") || lower.includes("office") || lower.includes("sit"))
      return <Briefcase className="w-4 h-4 text-amber-500" />;
    if (lower.includes("starbucks") || lower.includes("cafe"))
      return <span className="text-sm">☕</span>;
    return <MapPin className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 animate-fade-in"
        onClick={() => toggleSidebar(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer from Left */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-full max-w-[400px] z-50 flex flex-col shadow-2xl transition-all duration-300 ${
          isLight
            ? "bg-white/95 text-slate-900 border-r border-slate-200"
            : "bg-[#0f172a]/95 text-white border-r border-slate-800"
        } backdrop-blur-2xl`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Wayve Navigator</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Intelligent Mobility Assistant</p>
            </div>
          </div>

          <button
            onClick={() => toggleSidebar(false)}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Tabs: Saved location, Ask AI, Settings */}
        <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold">
            {/* Tab 1: Saved location */}
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
                activeTab === "saved"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="truncate">Saved</span>
            </button>

            {/* Tab 2: Ask AI */}
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
                activeTab === "ai"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="truncate">Ask AI</span>
            </button>

            {/* Tab 3: Settings */}
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
                activeTab === "settings"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span className="truncate">Settings</span>
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ============================================================ */}
          {/* TAB 1: SAVED LOCATION */}
          {/* ============================================================ */}
          {activeTab === "saved" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Saved Locations</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quickly launch routes to your frequent pins
                  </p>
                </div>
                {!isSavingCustom && (
                  <button
                    onClick={() => setIsSavingCustom(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Current</span>
                  </button>
                )}
              </div>

              {savedFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{savedFeedback}</span>
                </div>
              )}

              {/* Custom Save Pin Input */}
              {isSavingCustom && (
                <form
                  onSubmit={handleSaveCurrent}
                  className="p-3 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 space-y-2"
                >
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Save {state.origin?.name || "Current Location"} as:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. My Apartment, Favorite Cafe"
                    value={customPlaceName}
                    onChange={(e) => setCustomPlaceName(e.target.value)}
                    autoFocus
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsSavingCustom(false)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              {/* List of Saved Places */}
              <div className="space-y-2">
                {state.savedPlaces && state.savedPlaces.length > 0 ? (
                  state.savedPlaces.map((place: Destination) => (
                    <div
                      key={place.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isLight
                          ? "bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-md"
                          : "bg-slate-900/80 border-slate-800 hover:border-blue-500/50 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                            {getPlaceIcon(place.name)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {place.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {place.address || "Nagpur, Maharashtra"}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeSavedPlace(place.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete saved location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setOrigin({
                              name: place.name,
                              coordinate: place.coordinate,
                              address: place.address,
                            });
                            toggleSidebar(false);
                          }}
                          className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Set as Start</span>
                        </button>

                        <button
                          onClick={() => {
                            setDestinationDirectAndCalculate(place);
                            toggleSidebar(false);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm flex items-center gap-1 transition-all active:scale-95"
                        >
                          <Navigation className="w-3 h-3 fill-current rotate-45" />
                          <span>Route Here</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <Bookmark className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p>No saved locations yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: ASK AI (SMART CITY TOUR & ROUTE GENERATOR) */}
          {/* ============================================================ */}
          {activeTab === "ai" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Ask Wayve AI</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Live Planner
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Natural language city tours, round-trips & multi-stop corridor optimization
                </p>
              </div>

              {/* Input Area */}
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  isLight
                    ? "bg-white border-slate-200 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
                    : "bg-slate-900 border-slate-800 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
                }`}
              >
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Describe your trip, e.g. 'I want to visit 15 Ganpati pandals across the city and return back to my starting point'..."
                  rows={4}
                  className="w-full text-xs bg-transparent resize-none focus:outline-none placeholder:text-slate-400 font-medium leading-relaxed"
                />

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {state.isAiThinking ? "AI Optimizing Tour..." : "Nagpur Urban Model"}
                  </span>
                  <button
                    onClick={() => handleAiSubmit()}
                    disabled={state.isAiThinking || !aiInput.trim()}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    {state.isAiThinking ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Planning...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Generate Route</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Tour Presets */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Featured City Tours & Multi-Stop Prompts
                </div>

                {/* Preset 1: The user's exact 15 Ganpati Pandals Loop! */}
                <div
                  onClick={() => handleAiSubmit(PANDAL_TOUR_PROMPT)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    isLight
                      ? "bg-gradient-to-br from-orange-50/70 to-amber-50/70 border-orange-200/80 hover:border-orange-400 hover:shadow-md"
                      : "bg-gradient-to-br from-orange-950/30 to-amber-950/20 border-orange-900/60 hover:border-orange-500/80 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                      <span className="text-base">🛕</span>
                      <span>Nagpur 15 Ganpati Pandals Tour</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-700 dark:text-orange-300">
                      15 Stops Loop
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    Tumbbad, Kantara, Elemental Galaxy, Disneyland, Harry Potter, Mahal & Jaripatka with TSP round-trip return.
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                    <span>Includes all 15 locations + Return to Start</span>
                    <span className="flex items-center gap-0.5">
                      Launch Tour <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Preset 2: Starbucks + Pench National Park */}
                <div
                  onClick={() =>
                    handleAiSubmit(
                      "Stop by nearby Starbucks first then take me to Pench National Park via scenic corridor"
                    )
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    isLight
                      ? "bg-slate-50 border-slate-200 hover:border-blue-400 hover:shadow-sm"
                      : "bg-slate-900/60 border-slate-800 hover:border-blue-500 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <span>☕</span>
                      <span>Coffee & Wildlife Gateway</span>
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">Scenic</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Stop at Starbucks VR Mall before driving out to Pench Tiger Reserve.
                  </p>
                </div>

                {/* Preset 3: Heritage & Lake Circuit */}
                <div
                  onClick={() =>
                    handleAiSubmit(
                      "Create a relaxing evening tour from my location to Futala Lake then Deekshabhoomi and return"
                    )
                  }
                  className={`p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    isLight
                      ? "bg-slate-50 border-slate-200 hover:border-blue-400 hover:shadow-sm"
                      : "bg-slate-900/60 border-slate-800 hover:border-blue-500 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <span>🏛️</span>
                      <span>Nagpur Heritage & Waterfront Loop</span>
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">City Tour</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Futala Lake promenade and architectural landmarks with scenic routing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: SETTINGS */}
          {/* ============================================================ */}
          {activeTab === "settings" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-bold">Preferences & Controls</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize navigation, appearance, and voice
                </p>
              </div>

              {/* Theme Settings */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
                }`}
              >
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Theme & Appearance</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      state.theme === "light"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light Mode</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      state.theme === "dark"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Map View Mode (3D vs 2D) */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
                }`}
              >
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-500" />
                  <span>Map Perspective</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMapViewMode("3d")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      state.mapViewMode === "3d"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>3D Perspective</span>
                  </button>
                  <button
                    onClick={() => setMapViewMode("2d")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                      state.mapViewMode === "2d"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>2D Top-Down</span>
                  </button>
                </div>
              </div>

              {/* Full Settings Modal Button */}
              <button
                onClick={() => {
                  toggleSidebar(false);
                  toggleSettings(true);
                }}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all ${
                  isLight
                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Advanced Settings & Custom API Key</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-medium">Wayve v3.6 • Offline & OSRM</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">Nagpur Spatial Grid</span>
        </div>
      </aside>
    </>
  );
};
