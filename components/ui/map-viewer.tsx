"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// You can set your Mapbox access token here or via environment variable
const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoibW9ra3MiLCJhIjoiY21qZWprbW13MGhjaDNrcjBoaGxxN2V6bSJ9.t_jLTRUo3vLZFwXHxEoYlA";

if (typeof window !== "undefined" && MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

interface MapViewerProps {
  latitude: number;
  longitude: number;
  height?: string;
}

export function MapViewer({ latitude, longitude, height = "400px" }: MapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map
    if (mapRef.current) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Clear container
    mapContainerRef.current.innerHTML = "";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 13,
      interactive: true, // Allow zoom/pan but no clicking
    });

    mapRef.current = map;

    // Create pin-shaped marker
    const el = document.createElement("div");
    el.className = "custom-marker";
    el.style.cssText = `
      width: 0;
      height: 0;
      position: relative;
      cursor: default;
      pointer-events: none;
    `;
    
    // Pin head (circular top)
    const pinHead = document.createElement("div");
    pinHead.style.cssText = `
      width: 32px;
      height: 32px;
      background-color: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    el.appendChild(pinHead);
    
    // Inner dot on pin head
    const innerDot = document.createElement("div");
    innerDot.style.cssText = `
      width: 12px;
      height: 12px;
      background-color: white;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;
    pinHead.appendChild(innerDot);
    
    // Pin point (triangle pointing down)
    const pinPoint = document.createElement("div");
    pinPoint.style.cssText = `
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 16px solid #3b82f6;
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    `;
    el.appendChild(pinPoint);

    // Create marker
    const marker = new mapboxgl.Marker({
      element: el,
      draggable: false,
      anchor: "bottom",
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    // Wait for map to load
    map.on("load", () => {
      map.resize();
    });

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div className="w-full rounded-lg overflow-hidden border border-zinc-200">
      <div
        ref={mapContainerRef}
        className="w-full"
        style={{ height }}
      />
    </div>
  );
}

