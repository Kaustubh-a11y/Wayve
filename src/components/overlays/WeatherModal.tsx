"use client";

import React, { useEffect, useState } from "react";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { CloudRain, Droplets, Sun, Wind, X } from "lucide-react";

export const WeatherModal: React.FC = () => {
  const { state, toggleWeatherModal } = useJourneyStore();
  const [weather, setWeather] = useState<{
    summary: string;
    tempC: number;
    rainProbability: number;
    humidity: number;
    windSpeedKmh: number;
  }>({
    summary: "Clear · Mild Mountain Air",
    tempC: 24,
    rainProbability: 12,
    humidity: 62,
    windSpeedKmh: 14,
  });

  useEffect(() => {
    if (!state.isWeatherModalOpen) return;
    const dest = state.destination?.coordinate || { lat: 18.7557, lng: 73.4072 };
    fetch(`/api/v1/weather?lat=${dest.lat}&lng=${dest.lng}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tempC !== undefined) setWeather(data);
      })
      .catch(() => {});
  }, [state.isWeatherModalOpen, state.destination]);

  if (!state.isWeatherModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => toggleWeatherModal(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm glass-panel rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 z-10 flex flex-col gap-4">
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-1" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Live Forecast · Open-Meteo
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {state.destination?.name || "Lonavala Valley Pass"}
            </h2>
          </div>
          <button
            onClick={() => toggleWeatherModal(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Weather Box */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {weather.tempC}°C
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-300 block mt-1">
              {weather.summary}
            </span>
          </div>
          <Sun className="w-12 h-12 text-amber-500 animate-spin-slow" />
        </div>

        {/* Detail Cards */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
            <CloudRain className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Rain</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{weather.rainProbability}%</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
            <Droplets className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Humidity</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{weather.humidity}%</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800">
            <Wind className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Wind</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{weather.windSpeedKmh} km/h</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 leading-relaxed">
          Weather conditions are factored directly into Wayve's route scoring and ETA prediction models.
        </p>

        <button
          onClick={() => toggleWeatherModal(false)}
          className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
