"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { MapViewMode } from "@/types/journey";
import { Compass, Eye, Layers, Minus, Navigation2, Plus } from "lucide-react";

// Google Maps-like zero-config raster styles (works 100% reliably worldwide with 0 API tokens!)
const GOOGLE_STYLE_LIGHT: any = {
  version: 8,
  name: "Google Maps Clean Light",
  sources: {
    "carto-voyager": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors, © CartoDB",
    },
  },
  layers: [
    {
      id: "carto-voyager-layer",
      type: "raster",
      source: "carto-voyager",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

const GOOGLE_STYLE_DARK: any = {
  version: 8,
  name: "Google Maps Night Dark",
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors, © CartoDB",
    },
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export const MapCanvas: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userMarkerElementRef = useRef<HTMLDivElement | null>(null);
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const incidentMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const { state, selectRoute, setMapViewMode } = useJourneyStore();
  const [mapLoaded, setMapLoaded] = useState(false);

  const isLight = state.theme === "light";
  const viewMode = state.mapViewMode;

  // Determine active Mapbox or Google-styled tile style
  const getStyle = (mode: MapViewMode, light: boolean): string | any => {
    const rawToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
    const cleanToken = rawToken.replace(/^['"\s]+|['"\s]+$/g, "");
    const hasMapbox = cleanToken && cleanToken.startsWith("pk.");

    if (mode === "satellite") {
      return hasMapbox ? "mapbox://styles/mapbox/satellite-streets-v12" : GOOGLE_STYLE_LIGHT;
    }
    if (!hasMapbox) {
      return light ? GOOGLE_STYLE_LIGHT : GOOGLE_STYLE_DARK;
    }
    return light ? "mapbox://styles/mapbox/streets-v12" : "mapbox://styles/mapbox/dark-v11";
  };

  // Initialize Mapbox map with zero-fail fallback
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const rawToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
    const cleanToken = rawToken.replace(/^['"\s]+|['"\s]+$/g, "");
    
    // Set token if available, or use dummy token for raster tiles
    mapboxgl.accessToken = cleanToken && cleanToken.startsWith("pk.") ? cleanToken : "pk.eyJ1Ijoid2F5dmUtZGVtbyIsImEiOiJjbTAifQ.dummy";

    try {
      const is3D = state.mapViewMode === "3d";
      const initialCenter = state.destination?.coordinate
        ? [state.destination.coordinate.lng, state.destination.coordinate.lat]
        : [state.origin.coordinate.lng, state.origin.coordinate.lat];

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: getStyle(state.mapViewMode, isLight),
        center: [initialCenter[0], initialCenter[1]],
        zoom: is3D ? 14 : 12,
        pitch: is3D ? 55 : 0,
        bearing: state.bearing || 0,
        attributionControl: false,
      });

      map.on("load", () => {
        setMapLoaded(true);

        // Add 3D building extrusion layer for spatial depth if vector style
        try {
          const layers = map.getStyle().layers;
          const labelLayerId = layers?.find(
            (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
          )?.id;

          if (labelLayerId) {
            map.addLayer(
              {
                id: "3d-buildings",
                source: "composite",
                "source-layer": "building",
                filter: ["==", "extrude", "true"],
                type: "fill-extrusion",
                minzoom: 14,
                paint: {
                  "fill-extrusion-color": isLight ? "#e2e8f0" : "#1e293b",
                  "fill-extrusion-height": ["get", "height"],
                  "fill-extrusion-base": ["get", "min_height"],
                  "fill-extrusion-opacity": 0.5,
                },
              },
              labelLayerId
            );
          }
        } catch {
          // Non-critical layer
        }
      });

      map.on("error", (e) => {
        // Soft error handler: don't crash to black screen
        console.warn("[Map Notice]", e?.error?.message || "Map render note");
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error("Map initialization note:", err);
    }
  }, []);

  // Update map style when theme or view mode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const targetStyle = getStyle(state.mapViewMode, isLight);
    map.setStyle(targetStyle);

    if (state.mapViewMode === "2d") {
      map.easeTo({ pitch: 0, zoom: 12, duration: 700 });
    } else if (state.mapViewMode === "3d") {
      map.easeTo({ pitch: 58, zoom: Math.max(map.getZoom(), 13), duration: 700 });
    } else if (state.mapViewMode === "satellite") {
      map.easeTo({ pitch: 0, zoom: 12, duration: 700 });
    }
  }, [state.mapViewMode, isLight, mapLoaded]);

  // Update Route Polyline Layers (Google Maps Blue #1a73e8 + Alternatives #9aa0a6)
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
          "line-color": isLight ? "#5f6368" : "#3c4043",
          "line-width": 8,
          "line-opacity": 0.4,
        },
      });

      map.addLayer({
        id: `route-alt-line-${idx + 1}`,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": isLight ? "#9aa0a6" : "#80868b",
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });

      map.on("click", `route-alt-line-${idx + 1}`, () => {
        selectRoute(alt.id);
      });
    });

    // Draw Active Selected Route (Iconic Google Maps Blue)
    const active = state.routes.find((r) => r.id === state.selectedRouteId) || state.routes[0];
    if (active && active.geometry.length > 0) {
      map.addSource("routes-active-source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { id: active.id },
          geometry: {
            type: "LineString",
            coordinates: active.geometry,
          },
        },
      });

      // Dark blue casing for contrast
      map.addLayer({
        id: "route-active-casing",
        type: "line",
        source: "routes-active-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": isLight ? "#1557b0" : "#174ea6",
          "line-width": 10,
          "line-opacity": 0.9,
        },
      });

      // Primary Route Line
      map.addLayer({
        id: "route-active-line",
        type: "line",
        source: "routes-active-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": active.trafficCondition === "heavy" ? "#d93025" : active.isWayvePick ? "#10b981" : "#1a73e8",
          "line-width": 6,
          "line-opacity": 1.0,
        },
      });

      // Fit bounds to entire route
      if (state.journeyState === "ROUTES_READY" || state.journeyState === "AWAITING_CONFIRMATION" || state.journeyState === "IDLE") {
        const bounds = new mapboxgl.LngLatBounds();
        active.geometry.forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, {
          padding: { top: 90, bottom: 90, left: 420, right: 60 },
          pitch: state.mapViewMode === "3d" ? 45 : 0,
          duration: 1200,
        });
      }
    }
  }, [state.routes, state.selectedRouteId, mapLoaded, selectRoute, state.journeyState, isLight, state.mapViewMode]);

  // Directional Vehicle / Origin Navigation Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const isNavigating = state.journeyState === "NAVIGATING" || state.journeyState === "MONITORING";

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "relative flex items-center justify-center cursor-pointer";
      el.innerHTML = `
        <div id="vehicle-pointer" class="transition-transform duration-300 ease-out flex items-center justify-center">
          <div class="relative flex items-center justify-center w-10 h-10">
            <div class="absolute inset-0 bg-blue-500/30 rounded-full animate-ping"></div>
            <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
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

    if (userMarkerElementRef.current) {
      userMarkerElementRef.current.style.transform = `rotate(${state.bearing || 0}deg)`;
    }

    if (isNavigating) {
      map.easeTo({
        center: [state.currentLocation.lng, state.currentLocation.lat],
        zoom: 16,
        bearing: state.bearing || 0,
        pitch: state.mapViewMode === "2d" ? 0 : 58,
        duration: 800,
      });
    }
  }, [state.currentLocation, state.bearing, mapLoaded, state.journeyState, state.mapViewMode]);

  // Destination Marker (Iconic Google Maps Red Teardrop Pin)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (state.destination) {
      if (!destMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "flex flex-col items-center cursor-pointer -translate-y-1/2";
        el.innerHTML = `
          <div style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;margin-bottom:2px;box-shadow:0 3px 12px rgba(0,0,0,0.2);background:${isLight ? "white" : "#1e293b"};color:${isLight ? "#202124" : "#ffffff"};border:1px solid ${isLight ? "#dadce0" : "#334155"}">
            ${state.destination.name}
          </div>
          <svg width="28" height="38" viewBox="0 0 28 38" fill="none" class="drop-shadow-md">
            <path d="M14 0C6.27 0 0 6.27 0 14C0 24.5 14 38 14 38C14 38 28 24.5 28 14C28 6.27 21.73 0 14 0Z" fill="#EA4335"/>
            <circle cx="14" cy="14" r="5" fill="#FFFFFF"/>
          </svg>
        `;
        destMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
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

  // Intermediate Stop / Waypoint Markers (Google Maps A, B, C or Coffee Icons)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    const activeStops = state.stops.filter((s) => s.added);
    activeStops.forEach((stop, idx) => {
      const letter = String.fromCharCode(65 + idx); // A, B, C
      const isCoffee = stop.name.toLowerCase().includes("starbucks") || stop.type === "coffee";
      const icon = isCoffee ? "☕" : letter;

      const el = document.createElement("div");
      el.className = "flex flex-col items-center cursor-pointer";
      el.innerHTML = `
        <div style="padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700;white-space:nowrap;margin-bottom:2px;box-shadow:0 2px 8px rgba(0,0,0,0.2);background:${isLight ? "white" : "#0f172a"};color:${isLight ? "#1e293b" : "#f8fafc"};border:1px solid ${isLight ? "#e2e8f0" : "#334155"}">
          ${stop.name}
        </div>
        <div style="width:24px;height:24px;background:#f59e0b;border-radius:50%;border:2px solid white;color:white;font-size:12px;font-weight:bold;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
          ${icon}
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([stop.coordinate.lng, stop.coordinate.lat])
        .addTo(map);
      stopMarkersRef.current.push(marker);
    });
  }, [state.stops, mapLoaded, isLight]);

  // Active Incident Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (state.activeIncident) {
      if (!incidentMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-full shadow-2xl border border-white/20 text-xs font-semibold backdrop-blur-md animate-bounce";
        el.innerHTML = `
          <span>⚠️</span>
          <span>Traffic Alert +12m</span>
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
    <div className={`relative w-full h-full ${isLight ? "bg-[#e5e3df]" : "bg-[#242f3e]"} overflow-hidden`}>
      {/* Real Vector/Raster Mapbox & Carto Canvas Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
      />

      {/* Floating Map View Selector [ 2D | 3D | Satellite ] — Bottom Right */}
      <div className="absolute right-4 bottom-8 z-20 flex flex-col gap-1.5 pointer-events-auto">
        {(["3d", "2d", "satellite"] as MapViewMode[]).map((mode) => {
          const isSelected = state.mapViewMode === mode;
          const label = mode === "satellite" ? "🛰" : mode.toUpperCase();
          return (
            <button
              key={mode}
              onClick={() => setMapViewMode(mode)}
              className={`w-12 h-10 rounded-xl text-xs font-bold uppercase tracking-wide transition-all active:scale-95 shadow-md border ${
                isSelected
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/30"
                  : isLight
                    ? "bg-white/90 border-slate-200 text-slate-600 hover:bg-slate-50"
                    : "bg-slate-900/90 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
              } backdrop-blur-md`}
              title={`Switch to ${mode} view`}
            >
              {label}
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
