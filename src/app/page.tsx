"use client";

import React from "react";
import { MapCanvas } from "@/components/map/MapCanvas";
import { WayveHeader } from "@/components/hud/WayveHeader";
import { ManeuverBanner } from "@/components/hud/ManeuverBanner";
import { SpeedometerHud } from "@/components/hud/SpeedometerHud";
import { RouteScrubber } from "@/components/hud/RouteScrubber";
import { AskWayveBar } from "@/components/planning/AskWayveBar";
import { DestinationSelector } from "@/components/planning/DestinationSelector";
import { RouteComparison } from "@/components/planning/RouteComparison";
import { ConversationDrawer } from "@/components/planning/ConversationDrawer";
import { IncidentAlertModal } from "@/components/replanning/IncidentAlertModal";
import { SimulationDrawer } from "@/components/replanning/SimulationDrawer";
import { ReportIncidentModal } from "@/components/overlays/ReportIncidentModal";
import { WhyThisRouteModal } from "@/components/overlays/WhyThisRouteModal";
import { TripIntelligenceModal } from "@/components/overlays/TripIntelligenceModal";
import { WeatherModal } from "@/components/overlays/WeatherModal";
import { SettingsModal } from "@/components/overlays/SettingsModal";

export default function WayveHome() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#070d17] text-slate-100 select-none">
      {/* 1. Spatial Interactive Vector Map Canvas (DOM Background) */}
      <MapCanvas />

      {/* 2. Global Floating Wayve Header HUD */}
      <WayveHeader />

      {/* 3. Screen 01: Ask Wayve Floating Search & Mode Selector */}
      <AskWayveBar />

      {/* 4. Screen 03: Destination & Place Selection */}
      <DestinationSelector />

      {/* 5. Screen 04: Route Comparison & Wayve Recommendation */}
      <RouteComparison />

      {/* 6. Screen 06: Live Navigation Turn Maneuver Banner */}
      <ManeuverBanner />

      {/* 7. Screen 06: Speedometer HUD & Speed Limit */}
      <SpeedometerHud />

      {/* 8. Screen 06: Route Progress Scrubber & Metrics HUD */}
      <RouteScrubber />

      {/* 9. Screen 02: Conversational AI Planning Drawer */}
      <ConversationDrawer />

      {/* 10. Screen 07: Dynamic Replanning / Incident Alert Card */}
      <IncidentAlertModal />

      {/* 11. Deterministic Simulation Drawer */}
      <SimulationDrawer />

      {/* 12. Human-In-The-Loop Incident Reporting Modal */}
      <ReportIncidentModal />

      {/* 13. Explainable AI (XAI) "Why This Route?" Modal */}
      <WhyThisRouteModal />

      {/* 14. Screen 08: Trip Intelligence Post-Arrival Analytics Modal */}
      <TripIntelligenceModal />

      {/* 15. Live Weather Forecast Modal */}
      <WeatherModal />

      {/* 16. Application Settings Modal */}
      <SettingsModal />
    </main>
  );
}
