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
      interactive: true,
    });

    mapRef.current = map;

    // Create a proper marker element
    const el = document.createElement("div");
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.alignItems = "center";
    el.style.justifyContent = "flex-end";
    el.style.width = "40px";
    el.style.height = "50px";
    el.style.cursor = "pointer";
    
    // Pin circle (top part)
    const pinCircle = document.createElement("div");
    pinCircle.style.cssText = `
      width: 32px;
      height: 32px;
      background-color: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    `;
    
    // Inner white dot
    const innerDot = document.createElement("div");
    innerDot.style.cssText = `
      width: 10px;
      height: 10px;
      background-color: white;
      border-radius: 50%;
    `;
    pinCircle.appendChild(innerDot);
    
    // Pin point (triangle)
    const pinPoint = document.createElement("div");
    pinPoint.style.cssText = `
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 12px solid #3b82f6;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      flex-shrink: 0;
    `;
    
    el.appendChild(pinCircle);
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