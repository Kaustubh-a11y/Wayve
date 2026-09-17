"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { MapViewMode } from "@/types/journey";
import { Compass, Eye, Layers, Minus, Navigation2, Plus } from "lucide-react";

export const MapCanvas: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userMarkerElementRef = useRef<HTMLDivElement | null>(null);
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const incidentMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const { state, selectRoute, setMapViewMode } = useJourneyStore();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const isLight = state.theme === "light";
  const viewMode = state.mapViewMode;

  // Determine active Mapbox style URL
  const getStyleUrl = (mode: MapViewMode, light: boolean) => {
    if (mode === "satellite") return "mapbox://styles/mapbox/satellite-streets-v12";
    if (light) return "mapbox://styles/mapbox/light-v11";
    return "mapbox://styles/mapbox/dark-v11";
  };

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const rawToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
    const cleanToken = rawToken.replace(/^['"\s]+|['"\s]+$/g, "");

    if (!cleanToken || cleanToken.includes("your_mapbox_token")) {
      setMapError(true);
      return;
    }

    mapboxgl.accessToken = cleanToken;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: getStyleUrl(state.mapViewMode, isLight),
        center: [state.origin.coordinate.lng, state.origin.coordinate.lat],
        zoom: 11,
        pitch: state.mapViewMode === "3d" ? 55 : 0,
        bearing: state.bearing || 0,
        attributionControl: false,
      });

      map.on("load", () => {
        setMapLoaded(true);

        // Add 3D building extrusion layer for spatial depth if 3D
        try {
          const layers = map.getStyle().layers;
          const labelLayerId = layers?.find(
            (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
          )?.id;

          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 14,
              paint: {
                "fill-extrusion-color": isLight ? "#cbd5e1" : "#111827",
                "fill-extrusion-height": ["get", "height"],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.6,
              },
            },
            labelLayerId
          );
        } catch {
          // Non-critical layer
        }
      });

      map.on("error", () => {
        setMapError(true);
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch {
      setMapError(true);
    }
  }, []);

  // Update map style when theme or view mode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const targetStyle = getStyleUrl(state.mapViewMode, isLight);
    map.setStyle(targetStyle);

    if (state.mapViewMode === "2d") {
      map.easeTo({ pitch: 0, duration: 600 });
    } else if (state.mapViewMode === "3d") {
      map.easeTo({ pitch: 58, duration: 600 });
    }
  }, [state.mapViewMode, isLight, mapLoaded]);

  // Update Route Polyline Layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    ["route-alt-casing-1", "route-alt-line-1", "route-alt-casing-2", "route-alt-line-2", "route-active-casing", "route-active-line"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ["routes-active-source", "routes-alt-source-1", "routes-alt-source-2"].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });

    if (!state.routes || state.routes.length === 0) return;

    // Draw Alternative Routes first
    const alternatives = state.routes.filter((r) => r.id !== state.selectedRouteId);
    alternatives.forEach((alt, idx) => {
      const sourceId = `routes-alt-source-${idx + 1}`;
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { id: alt.id },
          geometry: {
            type: "LineString",
            coordinates: alt.geometry,
          },
        },
      });

      map.addLayer({
        id: `route-alt-casing-${idx + 1}`,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": isLight ? "#94a3b8" : "#0f172a",
          "line-width": 7,
          "line-opacity": 0.5,
        },
      });

      map.addLayer({
        id: `route-alt-line-${idx + 1}`,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": isLight ? "#64748b" : "#475569",
          "line-width": 4,
          "line-dasharray": [2, 1],
          "line-opacity": 0.8,
        },
      });

      map.on("click", `route-alt-line-${idx + 1}`, () => {
        selectRoute(alt.id);
      });
    });

    // Draw Active Selected Route
    const active = state.routes.find((r) => r.id === state.selectedRouteId) || state.routes[0];
    if (active && active.geometry.length > 0) {
      map.addSource("routes-active-source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: active.geometry,
          },
        },
      });

      map.addLayer({
        id: "route-active-casing",
        type: "line",
        source: "routes-active-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": isLight ? "#d1fae5" : "#064e3b",
          "line-width": 10,
          "line-opacity": 0.8,
        },
      });

      map.addLayer({
        id: "route-active-line",
        type: "line",
        source: "routes-active-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": active.trafficCondition === "heavy" ? "#ef4444" : "#10b981",
          "line-width": 6,
          "line-opacity": 1.0,
        },
      });

      // Fit bounds if in route comparison / preview
      if (state.journeyState === "ROUTES_READY" || state.journeyState === "AWAITING_CONFIRMATION") {
        const bounds = new mapboxgl.LngLatBounds();
        active.geometry.forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, {
          padding: { top: 100, bottom: 200, left: 60, right: 60 },
          pitch: state.mapViewMode === "3d" ? 45 : 0,
          duration: 1200,
        });
      }
    }
  }, [state.routes, state.selectedRouteId, mapLoaded, selectRoute, state.journeyState, isLight, state.mapViewMode]);

  // Update Directional Vehicle Navigation Marker & Camera Heading
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const isNavigating = state.journeyState === "NAVIGATING" || state.journeyState === "MONITORING";

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "relative flex items-center justify-center";
      el.innerHTML = `
        <div id="vehicle-pointer" class="transition-transform duration-500 ease-out flex items-center justify-center">
          <div class="relative flex items-center justify-center w-11 h-11">
            <div class="absolute inset-0 bg-emerald-500/25 rounded-full animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl border-2 border-white text-white">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 21L12 17L20 21L12 2Z" />
              </svg>
            </div>
          </div>
        </div>
      `;

      userMarkerElementRef.current = el.querySelector("#vehicle-pointer");

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([state.currentLocation.lng, state.currentLocation.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([state.currentLocation.lng, state.currentLocation.lat]);
    }

    // Rotate directional pointer along road heading
    if (userMarkerElementRef.current) {
      userMarkerElementRef.current.style.transform = `rotate(${state.bearing || 0}deg)`;
    }

    // Camera following road heading in navigation mode
    if (isNavigating) {
      map.easeTo({
        center: [state.currentLocation.lng, state.currentLocation.lat],
        zoom: 15.5,
        bearing: state.bearing || 0,
        pitch: state.mapViewMode === "2d" ? 0 : 60,
        duration: 900,
      });
    }
  }, [state.currentLocation, state.bearing, mapLoaded, state.journeyState, state.mapViewMode]);

  // Update Destination Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (state.destination) {
      if (!destMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "flex flex-col items-center cursor-pointer";
        el.innerHTML = `
          <div class="px-3 py-1 rounded-full ${isLight ? "bg-white text-slate-900 border border-slate-200" : "bg-slate-900/95 text-white border border-white/10"} text-xs font-semibold shadow-xl backdrop-blur-md mb-1 whitespace-nowrap">
            📍 ${state.destination.name}
          </div>
          <div class="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
        `;
        destMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([state.destination.coordinate.lng, state.destination.coordinate.lat])
          .addTo(map);
      } else {
        destMarkerRef.current.setLngLat([state.destination.coordinate.lng, state.destination.coordinate.lat]);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  }, [state.destination, mapLoaded, isLight]);

  // Update Active Incident Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (state.activeIncident) {
      if (!incidentMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "flex items-center gap-1.5 px-3 py-1.5 bg-red-600/95 text-white rounded-full shadow-2xl border border-white/20 text-xs font-semibold backdrop-blur-md animate-bounce";
        el.innerHTML = `
          <span>⚠️</span>
          <span>Traffic +14m</span>
        `;
        incidentMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([state.activeIncident.coordinate.lng, state.activeIncident.coordinate.lat])
          .addTo(map);
      } else {
        incidentMarkerRef.current.setLngLat([state.activeIncident.coordinate.lng, state.activeIncident.coordinate.lat]);
      }
    } else if (incidentMarkerRef.current) {
      incidentMarkerRef.current.remove();
      incidentMarkerRef.current = null;
    }
  }, [state.activeIncident, mapLoaded]);

  // Spatial Camera Controls
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [state.currentLocation.lng, state.currentLocation.lat],
        zoom: 14.5,
        bearing: state.bearing || 0,
        pitch: state.mapViewMode === "2d" ? 0 : 55,
        duration: 1000,
      });
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  return (
    <div className={`relative w-full h-full ${isLight ? "bg-[#f8fafc]" : "bg-[#070d17]"} overflow-hidden`}>
      {/* Mapbox Canvas Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full transition-opacity duration-700 ${mapError ? "hidden" : "block"}`}
      />

      {/* High-Fidelity Vector Canvas Fallback (if offline or token unavailable) */}
      {mapError && (
        <div className={`relative w-full h-full ${isLight ? "bg-[#f1f5f9]" : "bg-[#070d17]"} flex items-center justify-center overflow-hidden`}>
          {/* Subtle geographic grid and road network simulation */}
          <svg className={`absolute inset-0 w-full h-full ${isLight ? "opacity-25" : "opacity-30"} pointer-events-none`} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mapGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke={isLight ? "#cbd5e1" : "#1e293b"} strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mapGrid)" />
            <path d="M -100,200 Q 300,350 700,250 T 1400,450" fill="none" stroke={isLight ? "#cbd5e1" : "#1e293b"} strokeWidth="6" />
            <path d="M 200,-50 Q 400,400 500,900" fill="none" stroke={isLight ? "#cbd5e1" : "#1e293b"} strokeWidth="5" />
            <path d="M 600,100 Q 800,500 1100,750" fill="none" stroke={isLight ? "#cbd5e1" : "#1e293b"} strokeWidth="4" />
          </svg>

          {/* Active Route Curve */}
          {state.activeRoute && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 220,620 C 350,540 450,420 540,360 C 650,290 720,240 820,200"
                fill="none"
                stroke={isLight ? "#a7f3d0" : "#064e3b"}
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 220,620 C 350,540 450,420 540,360 C 650,290 720,240 820,200"
                fill="none"
                stroke={state.activeRoute.trafficCondition === "heavy" ? "#ef4444" : "#10b981"}
                strokeWidth="6"
                strokeLinecap="round"
                className="drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              />
            </svg>
          )}

          {/* Directional Vehicle Indicator rotated to road heading */}
          <div className="absolute left-[220px] top-[620px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div
              className="relative flex items-center justify-center transition-transform duration-500 ease-out"
              style={{ transform: `rotate(${state.bearing || 48}deg)` }}
            >
              <div className="absolute w-12 h-12 bg-emerald-500/25 rounded-full animate-ping" />
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl border-2 border-white text-white">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 21L12 17L20 21L12 2Z" />
                </svg>
              </div>
            </div>
            <span className={`mt-2 block px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-center whitespace-nowrap shadow-md ${
              isLight ? "bg-white text-slate-800 border border-slate-200" : "bg-slate-900/90 text-emerald-300 border border-emerald-500/30"
            }`}>
              Pune (Start)
            </span>
          </div>

          {state.destination && (
            <div className="absolute left-[820px] top-[200px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md mb-1 whitespace-nowrap ${
                isLight ? "bg-white text-slate-900 border border-slate-200" : "bg-slate-900/90 text-white border border-white/10"
              }`}>
                📍 {state.destination.name}
              </div>
              <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white mx-auto shadow-md" />
            </div>
          )}

          {state.activeIncident && (
            <div className="absolute left-[540px] top-[360px] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-bounce">
              <div className="px-3 py-1.5 bg-red-600/95 text-white rounded-full text-xs font-bold shadow-2xl border border-white/20 whitespace-nowrap">
                ⚠️ Congestion (+14m)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Map View Selector [ 2D | 3D | Satellite ] (Bottom-Right) */}
      <div className="absolute right-4 bottom-24 sm:bottom-8 z-20 flex items-center gap-1.5 p-1 glass-panel rounded-full shadow-lg border border-white/10 pointer-events-auto">
        {(["2d", "3d", "satellite"] as MapViewMode[]).map((mode) => {
          const isSelected = state.mapViewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setMapViewMode(mode)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 ${
                isSelected
                  ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              {mode}
            </button>
          );
        })}
      </div>

      {/* Right Edge Spatial Zoom & Recenter Controls */}
      <div className="absolute right-4 top-24 sm:top-28 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleRecenter}
          className="w-10 h-10 rounded-2xl glass-panel flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-all shadow-lg active:scale-95"
          title="Center map on current location and heading"
          aria-label="Center map"
        >
          <Navigation2 className="w-4 h-4 text-emerald-500" />
        </button>

        <div className="flex flex-col rounded-2xl glass-panel overflow-hidden border border-white/10 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className={`h-[1px] ${isLight ? "bg-slate-200" : "bg-slate-800/80"} w-full`} />
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
