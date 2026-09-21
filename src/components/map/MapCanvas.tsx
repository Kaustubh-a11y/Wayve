"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useJourneyStore } from "@/lib/state/journeyStore";
import { Coordinate, MapViewMode } from "@/types/journey";
import {
  Bookmark,
  Check,
  Compass,
  Eye,
  Layers,
  MapPin,
  Minus,
  Navigation,
  Navigation2,
  Plus,
  X,
} from "lucide-react";
import { NAGPUR_AMBIENT_TRAFFIC_GEOJSON } from "@/lib/services/trafficData";

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
  const routeDurationMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const bottleneckMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const droppedPinMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const {
    state,
    selectRoute,
    setMapViewMode,
    toggleTrafficLayer,
    addSavedPlace,
    setDestinationDirectAndCalculate,
    setOrigin,
  } = useJourneyStore();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{
    coordinate: Coordinate;
    name: string;
    address: string;
  } | null>(null);
  const [saveAsName, setSaveAsName] = useState("");
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const isLight = state.theme === "light";
  const viewMode = state.mapViewMode;

  const handleDropPinAtCoords = async (lng: number, lat: number) => {
    let locName = "Pinned Location";
    let fullAddr = `Nagpur (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "WayveMapPin/1.0" } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.suburb || addr.neighbourhood || addr.city || "Nagpur";
        locName = road;
        fullAddr = data.display_name?.split(",").slice(0, 3).join(",") || `${road}, Nagpur`;
      }
    } catch {
      // safe fallback
    }

    setDroppedPin({
      coordinate: { lat, lng },
      name: locName,
      address: fullAddr,
    });
    setSaveAsName(locName);
    setIsSavedFeedback(false);
  };

  const FALLBACK_B64 = "cGsuZXlKMUlqb2lhMkYxYzNSMVltZ3dJaXdpWVNJNkltTnRkVFZ3WTNGallqQXhiR3N5ZVhOaE9USm5iekkzYUdNaWZRLmhPb09NWVgtNng2T1lzdlpQSG0wRlE=";
  const DEFAULT_MAPBOX_TOKEN = typeof atob !== "undefined"
    ? atob(FALLBACK_B64)
    : Buffer.from(FALLBACK_B64, "base64").toString("utf-8");

  // Determine active Mapbox or Google-styled tile style
  const getStyle = (mode: MapViewMode, light: boolean): string | any => {
    const rawToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || DEFAULT_MAPBOX_TOKEN;
    const cleanToken = rawToken.replace(/^['"\s]+|['"\s]+$/g, "");
    const hasMapbox = cleanToken && cleanToken.startsWith("pk.") && !cleanToken.includes("dummy");

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

    const rawToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || DEFAULT_MAPBOX_TOKEN;
    const cleanToken = rawToken.replace(/^['"\s]+|['"\s]+$/g, "");
    
    // Always assign clean valid token
    mapboxgl.accessToken = cleanToken;

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

      // Disable default double-click zoom immediately
      map.doubleClickZoom.disable();

      // Double-click to drop a pointer pin anywhere
      map.on("dblclick", (e: any) => {
        if (e.originalEvent) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
        }
        handleDropPinAtCoords(e.lngLat.lng, e.lngLat.lat);
      });

      // Right-click (contextmenu) to also drop pin
      map.on("contextmenu", (e: any) => {
        if (e.originalEvent) {
          e.originalEvent.preventDefault();
        }
        handleDropPinAtCoords(e.lngLat.lng, e.lngLat.lat);
      });

      map.on("load", () => {
        setMapLoaded(true);
        map.doubleClickZoom.disable();

        // Add 3D building extrusion layer for spatial depth if vector style
        const hasMapbox = cleanToken && cleanToken.startsWith("pk.") && !cleanToken.includes("dummy");
        if (hasMapbox) {
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
        }
      });

      map.on("error", (e: any) => {
        const msg = e?.error?.message || "";
        const status = e?.error?.status;
        if (status === 401 || status === 403 || msg.includes("forbidden") || msg.includes("access token")) {
          console.warn("[Map Notice] Mapbox auth issue detected, switching to Google-styled Carto raster tiles.");
          try {
            map.setStyle(isLight ? GOOGLE_STYLE_LIGHT : GOOGLE_STYLE_DARK);
          } catch {
            // safe fallback
          }
        }
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

  // Ambient Live Highway Traffic Overlay (Nagpur NH 44, NH 53, Samruddhi Expressway, ORR)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const ensureTrafficLayer = () => {
      try {
        if (!map.getSource("nagpur-ambient-traffic")) {
          map.addSource("nagpur-ambient-traffic", {
            type: "geojson",
            data: NAGPUR_AMBIENT_TRAFFIC_GEOJSON as any,
          });
        }

        if (!map.getLayer("ambient-traffic-casing")) {
          map.addLayer({
            id: "ambient-traffic-casing",
            type: "line",
            source: "nagpur-ambient-traffic",
            layout: {
              "line-join": "round",
              "line-cap": "round",
              visibility: state.isTrafficLayerVisible ? "visible" : "none",
            },
            paint: {
              "line-color": isLight ? "#ffffff" : "#0f172a",
              "line-width": 6,
              "line-opacity": 0.45,
            },
          });
        } else {
          map.setLayoutProperty("ambient-traffic-casing", "visibility", state.isTrafficLayerVisible ? "visible" : "none");
          map.setPaintProperty("ambient-traffic-casing", "line-color", isLight ? "#ffffff" : "#0f172a");
        }

        if (!map.getLayer("ambient-traffic-flow")) {
          map.addLayer({
            id: "ambient-traffic-flow",
            type: "line",
            source: "nagpur-ambient-traffic",
            layout: {
              "line-join": "round",
              "line-cap": "round",
              visibility: state.isTrafficLayerVisible ? "visible" : "none",
            },
            paint: {
              "line-color": [
                "match",
                ["get", "congestion"],
                "severe", "#a50e0e",
                "heavy", "#db4437",
                "moderate", "#f4b400",
                /* default / low */ "#0f9d58"
              ],
              "line-width": 3.5,
              "line-opacity": 0.92,
            },
          });
        } else {
          map.setLayoutProperty("ambient-traffic-flow", "visibility", state.isTrafficLayerVisible ? "visible" : "none");
        }
      } catch (err) {
        console.warn("[Ambient Traffic Layer Note]", err);
      }
    };

    if (map.isStyleLoaded()) {
      ensureTrafficLayer();
    } else {
      map.once("style.load", ensureTrafficLayer);
    }
  }, [state.isTrafficLayerVisible, isLight, mapLoaded, state.mapViewMode]);

  // Update Route Polyline Layers (Multi-Colored Traffic Flow Segments + Google Maps Styling)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear previous floating route badges and bottleneck markers
    routeDurationMarkersRef.current.forEach((m) => m.remove());
    routeDurationMarkersRef.current = [];
    bottleneckMarkersRef.current.forEach((m) => m.remove());
    bottleneckMarkersRef.current = [];

    // Clean up active route layers
    if (map.getLayer("route-active-casing")) map.removeLayer("route-active-casing");
    if (map.getLayer("route-active-line")) map.removeLayer("route-active-line");
    if (map.getSource("routes-active-source")) map.removeSource("routes-active-source");

    // Clean up all alternative route layers and sources (up to 15)
    for (let i = 1; i <= 15; i++) {
      if (map.getLayer(`route-alt-casing-${i}`)) map.removeLayer(`route-alt-casing-${i}`);
      if (map.getLayer(`route-alt-line-${i}`)) map.removeLayer(`route-alt-line-${i}`);
      if (map.getSource(`routes-alt-source-${i}`)) map.removeSource(`routes-alt-source-${i}`);
    }

    if (!state.routes || state.routes.length === 0) return;

    // 1. Draw Alternative Routes (spatially distinct street corridors, matching Google Maps standard)
    const active = state.routes.find((r) => r.id === state.selectedRouteId) || state.routes[0];
    const activeMid = active?.geometry && active.geometry.length > 0
      ? active.geometry[Math.floor(active.geometry.length / 2)]
      : null;

    const visibleAlternatives: typeof state.routes = [];
    for (const alt of state.routes) {
      if (alt.id === active?.id) continue;
      if (!alt.geometry || alt.geometry.length < 2) continue;
      const altMid = alt.geometry[Math.floor(alt.geometry.length / 2)];

      // Require physical separation from active route (at least 0.0020 deg ≈ 220m)
      const distFromActive = activeMid
        ? Math.hypot(altMid[0] - activeMid[0], altMid[1] - activeMid[1])
        : 1;
      if (distFromActive < 0.0020) continue;

      // Require separation from already chosen visible alternatives (at least 0.0015 deg ≈ 165m)
      const isTooCloseToOther = visibleAlternatives.some((other) => {
        const oMid = other.geometry[Math.floor(other.geometry.length / 2)];
        return Math.hypot(altMid[0] - oMid[0], altMid[1] - oMid[1]) < 0.0015;
      });
      if (isTooCloseToOther) continue;

      visibleAlternatives.push(alt);
      if (visibleAlternatives.length >= 3) break; // Display up to 3 distinct alternatives on map
    }

    visibleAlternatives.forEach((alt, idx) => {
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
          "line-opacity": 0.35,
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

      // Floating duration badge for each distinct alternative route
      if (alt.geometry && alt.geometry.length > 0) {
        const altMidIdx = Math.floor(alt.geometry.length * 0.5);
        const altMidCoord = alt.geometry[altMidIdx];
        const altDurMin = Math.round((alt.predictedDurationSeconds || alt.durationSeconds) / 60);

        const altBadgeEl = document.createElement("div");
        altBadgeEl.className = "cursor-pointer select-none transition-transform hover:scale-105 active:scale-95";
        altBadgeEl.innerHTML = `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 9px;
            border-radius: 999px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            background: ${isLight ? "rgba(255,255,255,0.95)" : "rgba(30,41,59,0.95)"};
            color: ${isLight ? "#5f6368" : "#94a3b8"};
            border: 1.5px solid ${isLight ? "#dadce0" : "#475569"};
            white-space: nowrap;
          ">
            <span>${altDurMin} min</span>
          </div>
        `;
        altBadgeEl.onclick = (e) => {
          e.stopPropagation();
          selectRoute(alt.id);
        };

        const altMarker = new mapboxgl.Marker({ element: altBadgeEl, anchor: "center" })
          .setLngLat(altMidCoord)
          .addTo(map);
        routeDurationMarkersRef.current.push(altMarker);
      }
    });

    // 2. Draw Active Selected Route (Segmented Traffic Colors: Blue/Green -> Amber -> Red)
    if (active && active.geometry.length > 0) {
      // Build GeoJSON features for each segmented traffic chunk
      const features: any[] = (active.trafficSegments && active.trafficSegments.length > 0)
        ? active.trafficSegments.map((seg, sIdx) => ({
            type: "Feature",
            properties: {
              id: `${active.id}-${sIdx}`,
              congestion: seg.congestion,
              roadName: seg.roadName || "",
              speedKmh: seg.speedKmh || 50,
            },
            geometry: {
              type: "LineString",
              coordinates: seg.coordinates,
            },
          }))
        : [
            {
              type: "Feature",
              properties: {
                id: active.id,
                congestion: active.trafficCondition || "low",
              },
              geometry: {
                type: "LineString",
                coordinates: active.geometry,
              },
            },
          ];

      map.addSource("routes-active-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features,
        },
      });

      // Dark blue / deep outline for contrast
      map.addLayer({
        id: "route-active-casing",
        type: "line",
        source: "routes-active-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": isLight ? "#1557b0" : "#174ea6",
          "line-width": 10,
          "line-opacity": 0.95,
        },
      });

      // Primary Segmented Traffic Flow Line
      map.addLayer({
        id: "route-active-line",
        type: "line",
        source: "routes-active-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": [
            "match",
            ["get", "congestion"],
            "severe", "#a50e0e",
            "heavy", "#d93025",
            "moderate", "#f29900",
            /* default / low flow */ active.isWayvePick ? "#10b981" : "#1a73e8"
          ],
          "line-width": 6.5,
          "line-opacity": 1.0,
        },
      });

      // Floating on-route duration badge for active route
      const midIdx = Math.min(Math.floor(active.geometry.length * 0.45), active.geometry.length - 1);
      const midCoord = active.geometry[midIdx];
      const durMin = Math.round((active.predictedDurationSeconds || active.durationSeconds) / 60);

      const activeBadgeEl = document.createElement("div");
      activeBadgeEl.className = "cursor-pointer select-none transition-transform hover:scale-105 active:scale-95";
      activeBadgeEl.innerHTML = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 999px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
          background: ${isLight ? "#ffffff" : "#1e293b"};
          color: ${isLight ? "#202124" : "#f8fafc"};
          border: 2px solid ${active.isWayvePick ? "#10b981" : "#1a73e8"};
          white-space: nowrap;
        ">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${active.trafficCondition === "heavy" ? "#d93025" : active.trafficCondition === "moderate" ? "#f29900" : "#10b981"};"></span>
          <span>${durMin} min</span>
          <span style="font-size: 10px; opacity: 0.8; font-weight: 600;">${active.isWayvePick ? "· AI Pick" : "· Fastest"}</span>
        </div>
      `;

      const activeMarker = new mapboxgl.Marker({ element: activeBadgeEl, anchor: "center" })
        .setLngLat(midCoord)
        .addTo(map);
      routeDurationMarkersRef.current.push(activeMarker);

      // Render Real-time Geographic Bottleneck Markers along the Active Route
      if (active.realisticTraffic?.bottlenecks && active.realisticTraffic.bottlenecks.length > 0) {
        active.realisticTraffic.bottlenecks.forEach((b) => {
          const isSevere = b.severity === "severe";
          const isHeavy = b.severity === "heavy";
          const accentColor = isSevere ? "#dc2626" : isHeavy ? "#ea580c" : "#d97706";
          const bgBadge = isSevere ? "#fef2f2" : isHeavy ? "#fff7ed" : "#fffbeb";

          const el = document.createElement("div");
          el.className = "cursor-pointer select-none transition-transform hover:scale-110 active:scale-95";
          el.innerHTML = `
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 3px 8px;
              border-radius: 999px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 10.5px;
              font-weight: 700;
              box-shadow: 0 3px 10px rgba(0,0,0,0.25);
              background: ${isLight ? bgBadge : "#1e293b"};
              color: ${accentColor};
              border: 1.5px solid ${accentColor};
              white-space: nowrap;
            ">
              <span style="font-size: 11px;">⚠️</span>
              <span>${b.currentSpeedKmh} km/h</span>
              <span style="font-size: 9px; opacity: 0.8; font-weight: 600;">· -${b.speedDegradationPercent}%</span>
            </div>
          `;

          const popupHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 4px; color: ${isLight ? "#1e293b" : "#f1f5f9"}; max-width: 260px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
                <span style="font-size: 11px; font-weight: 800; color: ${accentColor}; text-transform: uppercase; letter-spacing: 0.5px;">🚨 ${b.levelOfService}</span>
                <span style="font-size: 10px; font-weight: 700; background: ${accentColor}20; color: ${accentColor}; padding: 1px 6px; border-radius: 999px;">${b.severity.toUpperCase()}</span>
              </div>
              <div style="font-size: 12px; font-weight: 700; margin-bottom: 4px;">${b.name}</div>
              <div style="font-size: 11px; line-height: 1.4; color: ${isLight ? "#475569" : "#94a3b8"}; margin-bottom: 6px;">
                Speed drops to <strong style="color:${accentColor}">${b.currentSpeedKmh} km/h</strong> (Normal: ${b.freeFlowSpeedKmh} km/h). Queue: <strong>~${b.queueLengthMeters}m</strong> (+${b.delayMinutes} min delay).
              </div>
              <div style="font-size: 10.5px; line-height: 1.35; background: ${isLight ? "#f8fafc" : "#0f172a"}; padding: 6px 8px; border-radius: 6px; border-left: 3px solid ${accentColor};">
                <span style="font-weight: 700;">AI Advice:</span> ${b.aiDirective}
              </div>
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: 16, closeButton: false, maxWidth: "280px" })
            .setHTML(popupHtml);

          const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([b.location.lng, b.location.lat])
            .setPopup(popup)
            .addTo(map);

          bottleneckMarkersRef.current.push(marker);
        });
      }

      // Fit bounds to entire route with responsive padding for mobile vs desktop
      if (state.journeyState === "ROUTES_READY" || state.journeyState === "AWAITING_CONFIRMATION" || state.journeyState === "IDLE") {
        const bounds = new mapboxgl.LngLatBounds();
        active.geometry.forEach((coord) => bounds.extend(coord));
        const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
        map.fitBounds(bounds, {
          padding: isMobile
            ? { top: 90, bottom: 220, left: 24, right: 24 }
            : { top: 90, bottom: 90, left: 440, right: 80 },
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
      const isPandal =
        stop.type === "pandal" ||
        stop.name.toLowerCase().includes("pandal") ||
        stop.name.toLowerCase().includes("mandal") ||
        stop.name.toLowerCase().includes("raja");
      const isCoffee = stop.name.toLowerCase().includes("starbucks") || stop.type === "coffee";
      const icon = isPandal ? "🛕" : isCoffee ? "☕" : String.fromCharCode(65 + (idx % 26));
      const badgeBg = isPandal ? "linear-gradient(135deg, #f97316, #ea580c)" : isCoffee ? "#059669" : "#f59e0b";
      const stopNumber = idx + 1;

      const el = document.createElement("div");
      el.className = "flex flex-col items-center cursor-pointer group";
      el.innerHTML = `
        <div style="padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700;white-space:nowrap;margin-bottom:2px;box-shadow:0 2px 8px rgba(0,0,0,0.25);background:${isLight ? "white" : "#0f172a"};color:${isLight ? "#1e293b" : "#f8fafc"};border:1px solid ${isPandal ? "#f97316" : isLight ? "#e2e8f0" : "#334155"}">
          ${isPandal ? `<span style="color:#ea580c;font-weight:800;margin-right:3px;">#${stopNumber}</span>` : ""}${stop.name}
        </div>
        <div style="width:26px;height:26px;background:${badgeBg};border-radius:50%;border:2px solid white;color:white;font-size:12px;font-weight:bold;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35)">
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

  // Dropped Pin Marker (on Double-Click)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (droppedPin) {
      if (!droppedPinMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "flex flex-col items-center cursor-pointer -translate-y-1/2 animate-bounce";
        el.innerHTML = `
          <div style="padding:4px 9px;border-radius:999px;font-size:10px;font-weight:800;white-space:nowrap;margin-bottom:2px;box-shadow:0 3px 12px rgba(0,0,0,0.3);background:#2563eb;color:#ffffff;border:2px solid #ffffff">
            📍 Dropped Pin
          </div>
          <svg width="28" height="38" viewBox="0 0 28 38" fill="none">
            <path d="M14 0C6.27 0 0 6.27 0 14C0 24.5 14 38 14 38C14 38 28 24.5 28 14C28 6.27 21.73 0 14 0Z" fill="#2563EB"/>
            <circle cx="14" cy="14" r="5" fill="#FFFFFF"/>
          </svg>
        `;

        droppedPinMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([droppedPin.coordinate.lng, droppedPin.coordinate.lat])
          .addTo(map);
      } else {
        droppedPinMarkerRef.current.setLngLat([droppedPin.coordinate.lng, droppedPin.coordinate.lat]);
      }
    } else if (droppedPinMarkerRef.current) {
      droppedPinMarkerRef.current.remove();
      droppedPinMarkerRef.current = null;
    }
  }, [droppedPin, mapLoaded]);

  const handleSaveDroppedPin = () => {
    if (!droppedPin) return;
    const placeName = (saveAsName || droppedPin.name).trim() || "Pinned Location";
    addSavedPlace({
      id: `saved-${Date.now()}`,
      name: placeName,
      address: droppedPin.address,
      coordinate: droppedPin.coordinate,
      type: "place",
      rating: 5.0,
    });
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
    }, 2500);
  };

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

      {/* Floating Map View Selector [ 2D | 3D | Satellite ] & Traffic Layer Toggle — Bottom Right */}
      <div className="absolute right-4 bottom-8 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Live Traffic Toggle Button */}
        <button
          onClick={() => toggleTrafficLayer()}
          className={`w-12 h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-all active:scale-95 shadow-md border ${
            state.isTrafficLayerVisible
              ? "bg-amber-500 border-amber-400 text-white shadow-amber-500/30 ring-2 ring-amber-400/40"
              : isLight
                ? "bg-white/90 border-slate-200 text-slate-500 hover:bg-slate-50"
                : "bg-slate-900/90 border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
          } backdrop-blur-md`}
          title={state.isTrafficLayerVisible ? "Traffic Layer: ON (Click to hide traffic flow)" : "Traffic Layer: OFF (Click to show live traffic)"}
          aria-label="Toggle Live Traffic Layer"
        >
          <span className="text-sm">🚦</span>
        </button>

        {/* View Mode Buttons */}
        <div className="flex flex-col gap-1.5">
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

        {/* Drop Pin tool button */}
        <button
          onClick={() => {
            if (!mapRef.current) return;
            const center = mapRef.current.getCenter();
            handleDropPinAtCoords(center.lng, center.lat);
          }}
          className="w-10 h-10 rounded-2xl glass-panel flex items-center justify-center text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all shadow-lg active:scale-95"
          title="Drop Pin at Center (Save location)"
          aria-label="Drop Pin"
        >
          <MapPin className="w-4 h-4" />
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

      {/* Interactive Dropped Pin Floating Card (On Double Click) */}
      {droppedPin && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-sm pointer-events-auto animate-fade-in">
          <div
            className={`p-4 rounded-3xl shadow-2xl border backdrop-blur-2xl transition-all ${
              isLight
                ? "bg-white/95 text-slate-900 border-slate-200/90"
                : "bg-slate-900/95 text-white border-slate-700/80"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Dropped Pin
                  </h4>
                  <div className="text-sm font-bold truncate max-w-[200px]">
                    {droppedPin.name}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDroppedPin(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Dismiss pin"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
              {droppedPin.address}
            </p>

            {/* Save Location Form: "Save this location as" */}
            <div className="mb-3">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">
                Save this location as:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={saveAsName}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  placeholder="e.g. My Favorite Cafe, Friend's Place"
                  className={`flex-1 text-xs py-1.5 px-3 rounded-xl border focus:outline-none focus:border-blue-500 font-medium ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-white"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveDroppedPin();
                    }
                  }}
                />
                <button
                  onClick={handleSaveDroppedPin}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 shrink-0 ${
                    isSavedFeedback
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
                  }`}
                >
                  {isSavedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Actions: Directions / Route Here & Set as Start */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <button
                onClick={() => {
                  setDestinationDirectAndCalculate({
                    id: `dest-pin-${Date.now()}`,
                    name: saveAsName || droppedPin.name,
                    address: droppedPin.address,
                    coordinate: droppedPin.coordinate,
                    type: "place",
                    rating: 5.0,
                  });
                  setDroppedPin(null);
                }}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md flex items-center justify-center gap-1.5 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all"
              >
                <Navigation className="w-3.5 h-3.5 fill-current rotate-45" />
                <span>Directions</span>
              </button>

              <button
                onClick={() => {
                  setOrigin({
                    name: saveAsName || droppedPin.name,
                    coordinate: droppedPin.coordinate,
                    address: droppedPin.address,
                  });
                  setDroppedPin(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                    : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Set as Start</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
