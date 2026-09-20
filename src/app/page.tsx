"use client";

import React from "react";
import { MapCanvas } from "@/components/map/MapCanvas";
import { GoogleMapsLayout } from "@/components/layout/GoogleMapsLayout";
import { TripIntelligenceModal } from "@/components/overlays/TripIntelligenceModal";
import { WeatherModal } from "@/components/overlays/WeatherModal";
import { SettingsModal } from "@/components/overlays/SettingsModal";

export default function WayveHome() {
  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      {/* 1. Spatial Interactive Vector Map Canvas (DOM Background) */}
      <MapCanvas />

      {/* 2. Google Maps-Standard Navigation Layout & UI (Search, Directions, Route Cards, HUD, AI) */}
      <GoogleMapsLayout />

      {/* 3. Auxiliary Modals (Post-Trip Intelligence, Weather, Settings) */}
      <TripIntelligenceModal />
      <WeatherModal />
      <SettingsModal />
    </main>
  );
}
