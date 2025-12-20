"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTranslation } from "react-i18next";

// You can set your Mapbox access token here or via environment variable
// Get a free token at https://account.mapbox.com/
const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "pk.eyJ1IjoibW9ra3MiLCJhIjoiY21qZWprbW13MGhjaDNrcjBoaGxxN2V6bSJ9.t_jLTRUo3vLZFwXHxEoYlA";

if (typeof window !== "undefined" && MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  mapKey?: string | number; // used to force remount from parent when needed
}

export function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  mapKey,
}: MapPickerProps) {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError(t('map.geolocationNotSupported'));
      setCurrentLocation([37.7749, -122.4194]);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setCurrentLocation([lat, lng]);
        setLoading(false);

        // If no coordinates are set yet, use current location
        if (latitude === null || longitude === null) {
          onLocationChange(lat, lng);
        }
      },
      (err) => {
        console.error("Error getting location:", err);
        setError(t('map.unableToGetLocation'));
        setCurrentLocation([37.7749, -122.4194]);
        setLoading(false);
      }
    );
    // intentionally do not depend on latitude/longitude to avoid re-requesting geo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  // Initialize or reinitialize map when mapKey changes or container is ready
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Don't initialize if still loading geolocation
    if (loading) return;

    // Clean up existing map before creating new one
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

    // Default center (San Francisco)
    const defaultCenter: [number, number] = [37.7749, -122.4194];
    const initialCenter: [number, number] =
      latitude !== null && longitude !== null
        ? [longitude, latitude]
        : defaultCenter;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: 13,
    });

    mapRef.current = map;

    // Helper to update marker - fixed, non-draggable
    const updateMarker = (lat: number, lng: number) => {
      // Always remove existing marker first to ensure only one exists
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      // Create pin-shaped marker that points down naturally
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

      // Create non-draggable marker with bottom anchor so tip is at coordinates
      const marker = new mapboxgl.Marker({
        element: el,
        draggable: false,
        anchor: "bottom",
      })
        .setLngLat([lng, lat])
        .addTo(map);

      markerRef.current = marker;
    };

    // Apply custom cursor styles
    const applyCursorStyles = () => {
      const canvasContainer = map.getCanvasContainer();
      if (canvasContainer) {
        canvasContainer.style.cursor = "crosshair";
      }
      
      // Style zoom controls
      const zoomControls = mapContainerRef.current?.querySelectorAll(
        ".mapboxgl-ctrl-zoom-in, .mapboxgl-ctrl-zoom-out"
      );
      zoomControls?.forEach((ctrl) => {
        (ctrl as HTMLElement).style.cursor = "pointer";
      });
    };

    // Wait for map to load before adding markers and handlers
    map.on("load", () => {
      // Resize map to ensure it renders correctly (important for modals)
      map.resize();
      applyCursorStyles();

      // Set initial marker if coordinates are provided
      if (latitude !== null && longitude !== null) {
        updateMarker(latitude, longitude);
      }
    });
    
    // Apply styles immediately and on style change
    applyCursorStyles();
    map.on("style.load", applyCursorStyles);

    // Add click handler to set location with visual feedback
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      
      // Update marker position immediately
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        // Create new marker if it doesn't exist
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

        const marker = new mapboxgl.Marker({
          element: el,
          draggable: false,
          anchor: "bottom",
        })
          .setLngLat([lng, lat])
          .addTo(map);

        markerRef.current = marker;
      }
      
      // Add visual feedback - briefly show a pulse effect
      const canvas = map.getCanvasContainer();
      const pulse = document.createElement("div");
      
      // Create keyframes animation inline
      const style = document.createElement("style");
      style.textContent = `
        @keyframes mapPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 0;
          }
        }
      `;
      if (!document.head.querySelector("#map-pulse-style")) {
        style.id = "map-pulse-style";
        document.head.appendChild(style);
      }
      
      pulse.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.6);
        border: 2px solid rgba(59, 130, 246, 1);
        pointer-events: none;
        transform: translate(-50%, -50%);
        animation: mapPulse 0.6s ease-out;
        z-index: 1000;
      `;
      
      const point = map.project(e.lngLat);
      pulse.style.left = `${point.x}px`;
      pulse.style.top = `${point.y}px`;
      canvas.appendChild(pulse);
      
      // Remove pulse after animation
      setTimeout(() => {
        pulse.remove();
      }, 600);
      
      onLocationChange(lat, lng);
    });
    
    // Ensure cursor is crosshair on map
    const canvasContainer = map.getCanvasContainer();
    if (canvasContainer) {
      canvasContainer.style.cursor = "crosshair";
    }

    // Handle errors
    map.on("error", (e: any) => {
      console.error("Mapbox error:", e);
      if (e.error?.message?.includes("token") || e.error?.message?.includes("Unauthorized")) {
        setError(t('map.invalidMapboxToken'));
      } else {
        setError(`${t('map.failedToLoadMap')}: ${e.error?.message || t('common.error')}`);
      }
    });

    // Resize map after a short delay to ensure container is visible (for modals)
    const resizeTimer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(resizeTimer);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Reinitialize when mapKey changes or when loading completes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapKey, loading, t]);

  // Update map center and marker when latitude/longitude changes (after initial mount)
  useEffect(() => {
    if (!mapRef.current) return;

    if (latitude !== null && longitude !== null) {
      // Update map center
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: mapRef.current.getZoom(),
        duration: 0, // No animation for programmatic updates
      });

      // Update or create marker - always use the helper function
      if (markerRef.current) {
        markerRef.current.setLngLat([longitude, latitude]);
      } else {
        // Wait for map to be loaded before adding marker
        if (mapRef.current.loaded()) {
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

          const marker = new mapboxgl.Marker({
            element: el,
            draggable: false,
            anchor: "bottom",
          })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);

          markerRef.current = marker;
        } else {
          mapRef.current.once("load", () => {
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

            const marker = new mapboxgl.Marker({
              element: el,
              draggable: false,
              anchor: "bottom",
            })
              .setLngLat([longitude, latitude])
              .addTo(mapRef.current!);

            markerRef.current = marker;
          });
        }
      }
    }
  }, [latitude, longitude, onLocationChange]);

  // Resize map when container becomes visible (for modals)
  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;

    // Use IntersectionObserver to detect when container becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && mapRef.current) {
            // Small delay to ensure container is fully rendered
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.resize();
              }
            }, 50);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-64 bg-zinc-100 rounded-lg flex items-center justify-center">
        <p className="text-zinc-600">{t('map.loadingMap')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          {error}
        </p>
      )}

      <div className="h-64 w-full rounded-lg overflow-hidden border border-zinc-200 relative">
        <div
          ref={mapContainerRef}
          key={mapKey ? `map-${mapKey}` : "map-default"}
          className="h-full w-full cursor-crosshair map-picker-container"
        />
      </div>

      <p className="text-xs text-zinc-500">
        {t('map.clickToSetLocation')}
      </p>
    </div>
  );
}
