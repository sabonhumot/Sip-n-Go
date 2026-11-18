import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import type { RefillStation, UserLocation } from '../types';
import { Navigation } from './Icons';

interface MapViewProps {
  userLocation: UserLocation;
  stations: RefillStation[];
  selectedStation: RefillStation | null;
  onSelectStation: (station: RefillStation) => void;
  onLocateUser: () => void;
  isLocating: boolean;
  navRouteCoordinates?: [number, number][];
  isNavigating?: boolean;
}

export const MapView: FC<MapViewProps> = ({
  userLocation,
  stations,
  selectedStation,
  onSelectStation,
  onLocateUser,
  isLocating,
  navRouteCoordinates,
  isNavigating = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const stationMarkersRef = useRef<{ [id: string]: any }>({});
  const routePolylineRef = useRef<any>(null);
  const routeGlowRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 16,
        zoomControl: false,
      });

      // Tile provider: supports custom Mapbox API key via .env or defaults to free CartoDB Voyager tiles
      const mapboxToken = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN;
      const tileUrl = mapboxToken
        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileAttribution = mapboxToken
        ? '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        : '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

      L.tileLayer(tileUrl, {
        attribution: tileAttribution,
        maxZoom: 19,
        subdomains: 'abcd',
        tileSize: mapboxToken ? 256 : 256,
        zoomOffset: mapboxToken ? 0 : 0,
      }).addTo(map);

      // Custom zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup if component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update high-visibility user location marker and accuracy circle when userLocation changes
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // 1. Accuracy Radius Circle (Google / Apple Maps style blue halo)
    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userAccuracyCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: 75,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.16,
        weight: 1.5,
        dashArray: '4, 4',
        interactive: false,
      }).addTo(map);
    }

    // 2. High-Visibility Pulsing User Beacon with "YOU" Pill Tag
    const userIconHtml = `
      <div class="user-beacon-wrapper">
        <div class="user-label-pill">
          <span>📍 YOU</span>
        </div>
        <div class="pulse-ring-outer"></div>
        <div class="pulse-ring-inner"></div>
        <div class="user-core-dot"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userIconHtml,
      className: 'custom-user-marker',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 2500, // Always stays above station pins
      })
        .addTo(map)
        .bindPopup(
          `<div style="text-align: center; padding: 4px 2px;">
            <b style="color: #0284c7; font-size: 13px;">📍 You are here</b><br/>
            <span style="font-size: 11px; color: #475569;">Sip n Go Reusable Bottle Connected</span>
          </div>`,
          { offset: [0, -32] }
        );
    }

    map.flyTo([userLocation.lat, userLocation.lng], 16, { animate: true, duration: 1.2 });
  }, [userLocation]);

  // Update stations markers
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear old station markers
    Object.values(stationMarkersRef.current).forEach((marker: any) => {
      marker.remove();
    });
    stationMarkersRef.current = {};

    stations.forEach((station) => {
      const isSelected = selectedStation?.id === station.id;

      const stationIconHtml = `
        <div class="station-pin ${isSelected ? 'selected' : ''}">
          <div class="pin-bubble">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor"/>
            </svg>
          </div>
          <div class="pin-tip"></div>
        </div>
      `;

      const stationIcon = L.divIcon({
        html: stationIconHtml,
        className: 'custom-station-marker',
        iconSize: [36, 44],
        iconAnchor: [18, 44],
      });

      const marker = L.marker([station.lat, station.lng], { icon: stationIcon })
        .addTo(map)
        .on('click', () => {
          onSelectStation(station);
        });

      stationMarkersRef.current[station.id] = marker;
    });
  }, [stations, selectedStation]);

  // When selectedStation changes, center map on it
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStation) return;

    map.panTo([selectedStation.lat, selectedStation.lng], { animate: true, duration: 0.8 });
  }, [selectedStation]);

  // Draw / update in-app walking route polyline when navRouteCoordinates change
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (routeGlowRef.current) {
      routeGlowRef.current.remove();
      routeGlowRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (navRouteCoordinates && navRouteCoordinates.length > 1 && isNavigating) {
      // Wide cyan glow backing line
      routeGlowRef.current = L.polyline(navRouteCoordinates, {
        color: '#06b6d4',
        weight: 9,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Distinct walking route line (electric blue with dash pattern)
      routePolylineRef.current = L.polyline(navRouteCoordinates, {
        color: '#0284c7',
        weight: 4.5,
        opacity: 0.95,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Smoothly fit route in view
      const bounds = L.latLngBounds(navRouteCoordinates);
      map.fitBounds(bounds, { padding: [80, 50], maxZoom: 17, animate: true });
    }
  }, [navRouteCoordinates, isNavigating]);

  const handleLocateMe = () => {
    onLocateUser();
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { animate: true, duration: 1 });
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.openPopup();
    }
  };

  return (
    <div className="relative w-full h-full min-h-0 rounded-none md:rounded-3xl overflow-hidden shadow-none md:shadow-md border-0 md:border md:border-slate-200 md:dark:border-slate-800">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-0 z-0" />

      {/* Floating GPS and quick control buttons */}
      <div className="absolute top-16 right-3 z-[400] flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 text-cyan-600 dark:text-cyan-400 shadow-xl border border-slate-200/80 dark:border-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center active:scale-95"
          title="Center on my Current Location"
        >
          <Navigation
            size={18}
            className={`${isLocating ? 'animate-spin' : ''} transition-transform`}
          />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute top-16 left-3 z-[400] px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-md text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/80 animate-pulse"></span>
          <span>You (Bottle)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          <span>Refill Station</span>
        </div>
      </div>
    </div>
  );
};
