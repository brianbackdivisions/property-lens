"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import type { Property, PhotoPoint, CaptureStatus } from "@/lib/types";

// Inline MapLibre style specs using free raster tiles — no API key required
const MAP_STYLE_STREETS: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const MAP_STYLE_SATELLITE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Esri, DigitalGlobe, GeoEye",
      maxzoom: 18,
    },
  },
  layers: [{ id: "satellite", type: "raster", source: "satellite" }],
};

const STATUS_COLORS: Record<CaptureStatus, string> = {
  captured_recent: "#22c55e",
  captured_stale: "#eab308",
  missing: "#ef4444",
  flagged: "#f97316",
};

interface MultiPropertyMapProps {
  mode: "library";
  properties: Property[];
  onSelectProperty: (id: string) => void;
}

interface DetailMapProps {
  mode: "detail";
  property: Property;
  activeSlot: string | null;
  onSelectSlot: (slotId: string) => void;
  showDiagram: boolean;
}

type Props = MultiPropertyMapProps | DetailMapProps;

export default function PropertyMap(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [satellite, setSatellite] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let center: [number, number] = [-84.47, 39.09];
    let zoom = 12;

    if (props.mode === "detail") {
      center = [props.property.center_lng, props.property.center_lat];
      zoom = 17;
    } else if (props.mode === "library" && props.properties.length > 0) {
      const lngs = props.properties.map((p) => p.center_lng);
      const lats = props.properties.map((p) => p.center_lat);
      center = [
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ];
      zoom = 10;
    }

    import("maplibre-gl").then((maplibregl) => {
      if (!containerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE_STREETS,
        center,
        zoom,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl(), "bottom-right");
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-left"
      );

      map.on("load", () => {
        setReady(true);
      });

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch basemap style
  useEffect(() => {
    if (!mapRef.current || !ready) return;
    mapRef.current.setStyle(satellite ? MAP_STYLE_SATELLITE : MAP_STYLE_STREETS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satellite, ready]);

  // Render library markers
  useEffect(() => {
    if (!ready || props.mode !== "library") return;
    const map = mapRef.current;
    if (!map) return;

    import("maplibre-gl").then((maplibregl) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      props.properties.forEach((property) => {
        const el = makeLibraryPin(property.name);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([property.center_lng, property.center_lat])
          .addTo(map);

        el.addEventListener("click", () =>
          (props as MultiPropertyMapProps).onSelectProperty(property.property_id)
        );
        markersRef.current.push(marker);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, props.mode === "library" && (props as MultiPropertyMapProps).properties]);

  // Render detail markers and polygon
  useEffect(() => {
    if (!ready || props.mode !== "detail") return;
    const map = mapRef.current;
    if (!map) return;
    const detailProps = props as DetailMapProps;

    import("maplibre-gl").then((maplibregl) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Draw parcel polygon
      if (detailProps.property.parcel_polygon) {
        const sourceId = "parcel";
        if (map.getSource(sourceId)) {
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [detailProps.property.parcel_polygon],
            },
          });
        } else {
          map.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [detailProps.property.parcel_polygon],
              },
            },
          });
          map.addLayer({
            id: "parcel-fill",
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": "#1976d2",
              "fill-opacity": 0.08,
            },
          });
          map.addLayer({
            id: "parcel-outline",
            type: "line",
            source: sourceId,
            paint: {
              "line-color": "#1976d2",
              "line-width": 2,
              "line-opacity": 0.6,
            },
          });
        }
      }

      // Place slot pins
      detailProps.property.photo_points.forEach((point) => {
        const isActive = detailProps.activeSlot === point.slot_id;
        const el = makeSlotPin(point, isActive);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([point.lng, point.lat])
          .addTo(map);

        el.addEventListener("click", () =>
          detailProps.onSelectSlot(point.slot_id)
        );
        markersRef.current.push(marker);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, satellite]);

  // Update pin states when active slot changes (without re-rendering all)
  useEffect(() => {
    if (!ready || props.mode !== "detail") return;
    const map = mapRef.current;
    if (!map) return;
    const detailProps = props as DetailMapProps;

    markersRef.current.forEach((marker, i) => {
      const point = detailProps.property.photo_points[i];
      if (!point) return;
      const el = marker.getElement();
      const isActive = detailProps.activeSlot === point.slot_id;
      el.style.transform = isActive ? "scale(1.25)" : "scale(1)";
      el.style.zIndex = isActive ? "10" : "1";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(props as DetailMapProps).activeSlot]);

  // Diagram overlay toggle
  useEffect(() => {
    if (!ready || props.mode !== "detail") return;
    const map = mapRef.current;
    if (!map) return;
    const detailProps = props as DetailMapProps;

    const sourceId = "diagram-overlay";
    if (!detailProps.property.diagram_image || !detailProps.property.parcel_polygon) {
      return;
    }

    const coords = detailProps.property.parcel_polygon;
    const lngs = coords.map(([lng]) => lng);
    const lats = coords.map(([, lat]) => lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const existing = map.getSource(sourceId);
    if (detailProps.showDiagram) {
      if (!existing) {
        map.addSource(sourceId, {
          type: "image",
          url: detailProps.property.diagram_image,
          coordinates: [
            [minLng, maxLat],
            [maxLng, maxLat],
            [maxLng, minLat],
            [minLng, minLat],
          ],
        });
        map.addLayer({
          id: "diagram-layer",
          type: "raster",
          source: sourceId,
          paint: { "raster-opacity": 0.7 },
        });
      }
    } else {
      if (map.getLayer("diagram-layer")) map.removeLayer("diagram-layer");
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, (props as DetailMapProps).showDiagram, satellite]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
        <button
          onClick={() => setSatellite((s) => !s)}
          className="bg-white shadow rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 border border-gray-200"
        >
          {satellite ? "Streets" : "Satellite"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pin builders
// ---------------------------------------------------------------------------

function makeLibraryPin(name: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "cursor-pointer";
  el.style.cssText = `
    width: 32px; height: 32px; border-radius: 50%;
    background: #1976d2; color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    border: 2px solid white;
    transition: transform 0.15s;
    cursor: pointer;
  `;
  el.title = name;
  el.textContent = name.charAt(0).toUpperCase();
  el.addEventListener("mouseenter", () => (el.style.transform = "scale(1.15)"));
  el.addEventListener("mouseleave", () => (el.style.transform = "scale(1)"));
  return el;
}

function makeSlotPin(point: PhotoPoint, isActive: boolean): HTMLDivElement {
  const el = document.createElement("div");
  const color = STATUS_COLORS[point.capture_status];
  const num = point.slot_id.replace("PP-", "");
  el.style.cssText = `
    width: ${isActive ? 36 : 30}px;
    height: ${isActive ? 36 : 30}px;
    border-radius: 50%;
    background: ${color};
    color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    border: ${isActive ? "3px" : "2px"} solid white;
    transition: transform 0.15s, box-shadow 0.15s;
    cursor: pointer;
    position: relative;
    z-index: ${isActive ? 10 : 1};
  `;
  el.title = point.slot.display_name;
  el.textContent = num;
  return el;
}
