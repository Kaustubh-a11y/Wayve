"use client";

import React from "react";
import { MapCanvas } from "@/components/map/MapCanvas";
import { WayveHeader } from "@/components/hud/WayveHeader";
import { ManeuverBanner } from "@/components/hud/ManeuverBanner";
import { SpeedometerHud } from "@/components/hud/SpeedometerHud";
import { RouteScrubber } from "@/components/hud/RouteScrubber";
import { WhereToCard } from "@/components/planning/WhereToCard";
import { DestinationSelector } from "@/components/planning/DestinationSelector";
import { TripPreferencesCard } from "@/components/planning/TripPreferencesCard";
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
    <main className="relative w-screen h-screen overflow-hidden select-none">
      {/* 1. Spatial Interactive Vector Map Canvas (DOM Background) */}
      <MapCanvas />

      {/* 2. Global Floating Wayve Header HUD */}
      <WayveHeader />

      {/* 3. Screen 01: Destination-First "Where To?" Minimal Card (No Front-Page Chatbot) */}
      <WhereToCard />

      {/* 4. Screen 03: Multi-Destination Suggestions Selector */}
      <DestinationSelector />

      {/* 5. Destination Resolved -> Driving Requirements & Preferences Selection */}
      <TripPreferencesCard />

      {/* 6. Screen 04: Route Comparison & Wayve Recommendation */}
      <RouteComparison />

      {/* 7. Screen 06: Live Navigation Turn Maneuver Banner */}
      <ManeuverBanner />

      {/* 8. Screen 06: Speedometer HUD & Speed Limit */}
      <SpeedometerHud />

      {/* 9. Screen 06: Route Progress Scrubber & Metrics HUD */}
      <RouteScrubber />

      {/* 10. Screen 02: Conversational AI Planning Drawer (On-Demand Enhancement) */}
      <ConversationDrawer />

      {/* 11. Screen 07: Dynamic Replanning / Incident Alert Card */}
      <IncidentAlertModal />

      {/* 12. Deterministic Simulation Drawer */}
      <SimulationDrawer />

      {/* 13. Crowd-Sourced Incident Reporting Modal */}
      <ReportIncidentModal />

      {/* 14. Explainable AI (XAI) "Why This Route?" Modal */}
      <WhyThisRouteModal />

      {/* 15. Screen 08: Trip Intelligence Post-Arrival Analytics Modal */}
      <TripIntelligenceModal />

      {/* 16. Live Weather Forecast Modal */}
      <WeatherModal />

      {/* 17. Application Settings & AI Diagnostics Modal */}
      <SettingsModal />
    </main>
  );
}
