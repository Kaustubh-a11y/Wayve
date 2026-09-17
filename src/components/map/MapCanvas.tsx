"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Compass, Layers, Maximize2, Minus, Navigation2, Plus } from "lucide-react";

export const MapCanvas: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const incidentMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const { state, selectRoute } = useJourneyStore();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [is3D, setIs3D] = useState(true);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const rawToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
    const cleanToken = rawToken.replace(/^['"\s]+|['"\s]+$/g, "");

    if (!cleanToken || cleanToken.includes("your_mapbox_token")) {
      // Fallback mode without live mapbox token
      setMapError(true);
      return;
    }

    mapboxgl.accessToken = cleanToken;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [state.origin.coordinate.lng, state.origin.coordinate.lat],
        zoom: 11,
        pitch: 45,
        bearing: 0,
        attributionControl: false,
      });

      map.on("load", () => {
        setMapLoaded(true);

        // Add 3D building extrusion layer for spatial depth
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
              "fill-extrusion-color": "#111827",
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-base": ["get", "min_height"],
              "fill-extrusion-opacity": 0.5,
            },
          },
          labelLayerId
        );
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

  // Update Route Polyline Layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove existing route layers and sources
    ["route-alt-casing-1", "route-alt-line-1", "route-alt-casing-2", "route-alt-line-2", "route-active-casing", "route-active-line"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    ["routes-active-source", "routes-alt-source-1", "routes-alt-source-2"].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });

    if (!state.routes || state.routes.length === 0) return;

    // Draw Alternative Routes first (underneath)
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
          "line-color": "#0f172a",
          "line-width": 7,
          "line-opacity": 0.6,
        },
      });

      map.addLayer({
        id: `route-alt-line-${idx + 1}`,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#475569",
          "line-width": 4,
          "line-dasharray": [2, 1],
          "line-opacity": 0.7,
        },
      });

      // Allow clicking alternative route to select it
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

      // Glow casing
      map.addLayer({
        id: "route-active-casing",
        type: "line",
        source: "routes-active-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#064e3b",
          "line-width": 10,
          "line-opacity": 0.8,
        },
      });

      // Inner glowing emerald line
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

      // Fit bounds to route
      const bounds = new mapboxgl.LngLatBounds();
      active.geometry.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds, {
        padding: { top: 120, bottom: 180, left: 60, right: 60 },
        pitch: state.journeyState === "NAVIGATING" ? 55 : 35,
        duration: 1500,
      });
    }
  }, [state.routes, state.selectedRouteId, mapLoaded, selectRoute, state.journeyState]);

  // Update User Location Pulse Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "relative flex items-center justify-center w-8 h-8";
      el.innerHTML = `
        <div class="absolute w-8 h-8 bg-emerald-500/20 rounded-full animate-ping"></div>
        <div class="absolute w-6 h-6 bg-emerald-500/40 rounded-full"></div>
        <div class="relative w-4 h-4 bg-emerald-400 border-2 border-slate-900 rounded-full shadow-glow"></div>
      `;

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([state.currentLocation.lng, state.currentLocation.lat])
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([state.currentLocation.lng, state.currentLocation.lat]);
    }

    if (state.journeyState === "NAVIGATING" || state.journeyState === "MONITORING") {
      map.easeTo({
        center: [state.currentLocation.lng, state.currentLocation.lat],
        zoom: 14.5,
        pitch: 58,
        duration: 800,
      });
    }
  }, [state.currentLocation, mapLoaded, state.journeyState]);

  // Update Destination Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (state.destination) {
      if (!destMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "flex flex-col items-center cursor-pointer";
        el.innerHTML = `
          <div class="px-2.5 py-1 bg-slate-900/90 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-semibold shadow-xl backdrop-blur-md mb-1 whitespace-nowrap">
            📍 ${state.destination.name}
          </div>
          <div class="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></div>
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
  }, [state.destination, mapLoaded]);

  // Update Active Incident Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (state.activeIncident) {
      if (!incidentMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 text-white rounded-xl shadow-2xl border border-white/20 text-xs font-semibold backdrop-blur-md animate-bounce";
        el.innerHTML = `
          <span>⚠️</span>
          <span>Heavy Traffic +14m</span>
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
        zoom: 14,
        pitch: is3D ? 50 : 0,
        duration: 1200,
      });
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const togglePitch = () => {
    if (mapRef.current) {
      const next3D = !is3D;
      setIs3D(next3D);
      mapRef.current.easeTo({
        pitch: next3D ? 55 : 0,
        duration: 600,
      });
    }
  };

  return (
    <div className="relative w-full h-full bg-[#070d17] overflow-hidden">
      {/* Mapbox Canvas Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full transition-opacity duration-700 ${mapError ? "hidden" : "block"}`}
      />

      {/* High-Fidelity Vector Canvas Fallback (if offline or token unavailable) */}
      {mapError && (
        <div className="relative w-full h-full bg-[#070d17] flex items-center justify-center overflow-hidden">
          {/* Subtle geographic grid and road network simulation */}
          <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mapGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mapGrid)" />
            {/* Background arterial contours */}
            <path d="M -100,200 Q 300,350 700,250 T 1400,450" fill="none" stroke="#1e293b" strokeWidth="6" />
            <path d="M 200,-50 Q 400,400 500,900" fill="none" stroke="#1e293b" strokeWidth="5" />
            <path d="M 600,100 Q 800,500 1100,750" fill="none" stroke="#1e293b" strokeWidth="4" />
          </svg>

          {/* Render Active Route SVG Curve when route exists */}
          {state.activeRoute && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 220,620 C 350,540 450,420 540,360 C 650,290 720,240 820,200"
                fill="none"
                stroke="#064e3b"
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

          {/* Spatial Pins & Markers */}
          <div className="absolute left-[220px] top-[620px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-10 h-10 bg-emerald-500/20 rounded-full animate-ping" />
              <div className="w-5 h-5 bg-emerald-400 border-2 border-slate-900 rounded-full shadow-glow" />
            </div>
            <span className="mt-1 px-2 py-0.5 bg-slate-900/90 text-emerald-300 rounded text-[10px] font-medium border border-emerald-500/30 whitespace-nowrap">
              Pune (Current Location)
            </span>
          </div>

          {state.destination && (
            <div className="absolute left-[820px] top-[200px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="px-3 py-1 bg-slate-900/90 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-md mb-1 whitespace-nowrap">
                📍 {state.destination.name}
              </div>
              <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white mx-auto shadow-glow" />
            </div>
          )}

          {state.activeIncident && (
            <div className="absolute left-[540px] top-[360px] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-bounce">
              <div className="px-3 py-1 bg-red-600/95 text-white rounded-xl text-xs font-bold shadow-2xl border border-white/20 whitespace-nowrap">
                ⚠️ Congestion (+14m)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Right Edge Spatial Map Controls (floating pills matching reference images) */}
      <div className="absolute right-4 top-24 sm:top-28 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all shadow-lg active:scale-95"
          title="Center map on my location"
          aria-label="Center map on my location"
        >
          <Navigation2 className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          onClick={togglePitch}
          className={`w-10 h-10 rounded-xl glass-panel flex items-center justify-center transition-all shadow-lg active:scale-95 ${
            is3D ? "text-emerald-400 border-emerald-500/40" : "text-slate-300 hover:text-white"
          }`}
          title="Toggle 3D perspective"
          aria-label="Toggle 3D perspective"
        >
          <Compass className="w-4 h-4" />
        </button>

        <div className="flex flex-col rounded-xl glass-panel overflow-hidden border border-white/10 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-[1px] bg-slate-800/80 w-full" />
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
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
