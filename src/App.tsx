import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FC } from 'react';
import type {
  RefillStation,
  BottleData,
  UserLocation,
  FilterOptions,
} from './types';
import {
  generateStationsNear,
  PRESET_CITIES,
} from './utils/geo';
import { getWalkingRoute } from './utils/routing';
import type { NavigationRoute } from './utils/routing';
import { MapView } from './components/MapView';
import { StationDetailModal } from './components/StationDetailModal';
import { BottleQRModal } from './components/BottleQRModal';
import { BottleCompanionModal } from './components/BottleCompanionModal';
import { AddStationModal } from './components/AddStationModal';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomSheet } from './components/MobileBottomSheet';
import { MobileBottomNav } from './components/MobileBottomNav';
import type { MobileTab } from './components/MobileBottomNav';
import { NavigationHUD } from './components/NavigationHUD';
import { BottleScanGate } from './components/BottleScanGate';
import { Sparkles, Check, AlertTriangle, RefreshCw } from './components/Icons';

// Initial Bottle profile
const INITIAL_BOTTLE: BottleData = {
  id: 'SIP-8821',
  name: 'Sip n Go Reusable Bottle',
  ownerName: 'Alex Rivera',
  model: 'Sip n Go 750ml Vacuum Bottle',
  material: '18/8 Stainless Steel (BPA Free)',
  colorName: 'Glacier Cyan',
  capacityMl: 750,
  lastRefillTime: '45 mins ago',
  refillsToday: 2,
  dailyGoalMl: 2000,
  currentIntakeMl: 1250,
  plasticBottlesSaved: 42,
  co2SavedKg: 3.5,
};

export const App: FC = () => {
  // Check whether user unlocked via phone camera scan (?bottle=...) or prior verified bottle
  const [isBottleUnlocked, setIsBottleUnlocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const searchParams = new URLSearchParams(window.location.search);
    const bottleParam = searchParams.get('bottle');
    // If they scanned the physical QR code with their phone camera, URL has ?bottle=... -> unlocked immediately!
    if (bottleParam) {
      try {
        localStorage.setItem('sip_n_go_unlocked_bottle', bottleParam.toUpperCase());
      } catch (e) {
        console.warn('localStorage error:', e);
      }
      return true;
    }
    // Check if bottle was previously verified and remembered in this browser
    try {
      const saved = localStorage.getItem('sip_n_go_unlocked_bottle');
      return Boolean(saved);
    } catch {
      return false;
    }
  });

  // Check URL query parameters on initial boot
  const initialBottleId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const param = searchParams.get('bottle');
      if (param) return param.toUpperCase();
      try {
        const saved = localStorage.getItem('sip_n_go_unlocked_bottle');
        if (saved) return saved.toUpperCase();
      } catch {}
    }
    return 'SIP-8821';
  }, []);

  // Bottle State loaded from localStorage (Zero sign-in, Hardware-linked ID)
  const [bottle, setBottle] = useState<BottleData>(() => {
    try {
      const saved = localStorage.getItem(`sip_n_go_bottle_${initialBottleId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
    return {
      ...INITIAL_BOTTLE,
      id: initialBottleId,
      name: `Sip n Go (${initialBottleId})`,
    };
  });

  // Save to localStorage automatically on every refill/drink log
  useEffect(() => {
    try {
      localStorage.setItem(`sip_n_go_bottle_${bottle.id}`, JSON.stringify(bottle));
    } catch (e) {
      console.warn('localStorage write error:', e);
    }
  }, [bottle]);

  const [justScannedNotice, setJustScannedNotice] = useState<string | null>(null);

  // Location State (Default to Cebu City)
  const [userLocation, setUserLocation] = useState<UserLocation>({
    lat: 10.3297,
    lng: 123.9059,
    city: 'Cebu City (I.T. Park)',
    isSimulated: true,
  });
  const [selectedCityName, setSelectedCityName] = useState<string>('Cebu City (I.T. Park)');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationErrorNotice, setLocationErrorNotice] = useState<string | null>(null);

  // Stations State
  const [stations, setStations] = useState<RefillStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<RefillStation | null>(null);
  const [inspectingStation, setInspectingStation] = useState<RefillStation | null>(null);

  // In-App Navigation State (No Google Maps redirect)
  const [navigatingStation, setNavigatingStation] = useState<RefillStation | null>(null);
  const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);

  // Mobile Navigation State
  const [activeTab, setActiveTab] = useState<MobileTab>('explore');

  // Modals
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isBottleModalOpen, setIsBottleModalOpen] = useState<boolean>(false);
  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState<boolean>(false);

  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    onlyFree: false,
    onlyChilled: false,
    onlySparkling: false,
    onlyOpen: false,
    maxDistanceKm: 10,
    searchQuery: '',
    sortBy: 'distance',
  });

  // Refill Celebration Banner
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  // Check URL query parameters for bottle QR scan
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const bottleParam = searchParams.get('bottle');
    if (bottleParam) {
      setBottle((prev) => ({
        ...prev,
        id: bottleParam,
        name: `Sip n Go (${bottleParam})`,
      }));
      setJustScannedNotice(`QR Tag Scanned! Bottle #${bottleParam} connected. Finding closest water...`);
      setTimeout(() => {
        setJustScannedNotice(null);
      }, 5000);
    }
  }, []);

  // IP Geolocation Fallback if GPS is blocked or unavailable
  const tryIpGeolocation = useCallback(async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const cityName = data.city ? `${data.city}, ${data.country_name || ''}` : 'Your Approximate Area';
          setUserLocation({
            lat: data.latitude,
            lng: data.longitude,
            city: cityName,
            isSimulated: false,
          });
          setSelectedCityName('My Current GPS');
          setCelebrationMessage(`📍 Located near ${cityName}! Nearest refilling stations mapped.`);
          setTimeout(() => setCelebrationMessage(null), 4000);
          return true;
        }
      }
    } catch (e) {
      console.warn('IP fallback failed:', e);
    }
    return false;
  }, []);

  // Request browser Geolocation with multi-stage fallbacks
  const requestUserLocation = useCallback(() => {
    setIsLocating(true);
    setLocationErrorNotice(null);

    if (!navigator.geolocation) {
      tryIpGeolocation();
      setIsLocating(false);
      return;
    }

    // Stage 1: Try High-Accuracy GPS
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
          city: 'Your Current GPS',
          isSimulated: false,
        });
        setSelectedCityName('My Current GPS');
        setIsLocating(false);
        setLocationErrorNotice(null);
        setCelebrationMessage('📍 Centered on your exact GPS location!');
        setTimeout(() => setCelebrationMessage(null), 3500);
      },
      (error) => {
        console.warn('High accuracy GPS error:', error.code, error.message);

        // If permission was explicitly denied (code 1)
        if (error.code === 1) {
          setIsLocating(false);
          setLocationErrorNotice(
            'Location access was blocked. Tap the 🔒 icon next to your browser address bar to allow location, then tap "Retry GPS".'
          );
          // Try IP fallback so user still gets realistic local stations
          tryIpGeolocation();
          return;
        }

        // Stage 2: Retry with low accuracy (WiFi / cell / IP)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            setUserLocation({
              lat: latitude,
              lng: longitude,
              accuracy,
              city: 'Your Current Area',
              isSimulated: false,
            });
            setSelectedCityName('My Current GPS');
            setIsLocating(false);
            setLocationErrorNotice(null);
          },
          async () => {
            // Stage 3: Automatic IP Geolocation fallback
            const ipSuccess = await tryIpGeolocation();
            if (!ipSuccess) {
              setLocationErrorNotice('Unable to retrieve GPS signal. You can pick an explore city from the top bar.');
            }
            setIsLocating(false);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  }, [tryIpGeolocation]);

  // Request location on initial mount
  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // Re-generate stations whenever coordinates change (merging community stations from localStorage)
  useEffect(() => {
    const nearby = generateStationsNear(userLocation.lat, userLocation.lng);
    let customList: RefillStation[] = [];
    try {
      const stored = localStorage.getItem('sip_n_go_custom_stations');
      if (stored) customList = JSON.parse(stored);
    } catch (e) {
      console.warn('localStorage error:', e);
    }
    const merged = [...customList, ...nearby];
    setStations(merged);
    if (merged.length > 0 && !selectedStation) {
      setSelectedStation(merged[0]);
    }
  }, [userLocation.lat, userLocation.lng]);

  const handleSelectCity = (city: (typeof PRESET_CITIES)[0]) => {
    setSelectedCityName(city.name);
    // If active navigation, exit navigation
    setNavigatingStation(null);
    setActiveRoute(null);

    if (city.isCurrentGps) {
      requestUserLocation();
    } else {
      setUserLocation({
        lat: city.lat,
        lng: city.lng,
        city: city.name,
        isSimulated: true,
      });
      setLocationErrorNotice(null);
    }
  };

  // In-App Turn-by-Turn Navigation Trigger (No Google Maps Redirect!)
  const handleStartNavigation = async (targetStation: RefillStation) => {
    setSelectedStation(targetStation);
    setInspectingStation(null);
    setIsCalculatingRoute(true);

    try {
      const route = await getWalkingRoute(
        userLocation.lat,
        userLocation.lng,
        targetStation.lat,
        targetStation.lng,
        targetStation.name
      );
      setActiveRoute(route);
      setNavigatingStation(targetStation);
      setCelebrationMessage(`🧭 Navigating to ${targetStation.name}`);
      setTimeout(() => setCelebrationMessage(null), 3000);
    } catch (err) {
      console.warn('Navigation error:', err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleExitNavigation = () => {
    setNavigatingStation(null);
    setActiveRoute(null);
  };

  // Filtered & Sorted stations
  const filteredStations = useMemo(() => {
    return stations
      .filter((s) => {
        if (filters.onlyFree && !s.isFree) return false;
        if (filters.onlyChilled && !s.waterTypes.includes('Chilled')) return false;
        if (filters.onlySparkling && !s.waterTypes.includes('Sparkling')) return false;
        if (filters.onlyOpen && !s.isOpen) return false;
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchAddr = s.address.toLowerCase().includes(q);
          const matchTypes = s.waterTypes.some((t) => t.toLowerCase().includes(q));
          const matchTags = s.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchAddr && !matchTypes && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'rating') {
          return b.rating - a.rating;
        }
        return (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0);
      });
  }, [stations, filters]);

  // Handle Refilling
  const handleRefillAtStation = (station: RefillStation) => {
    const refillAmount = 500;
    setBottle((prev) => ({
      ...prev,
      currentIntakeMl: Math.min(prev.dailyGoalMl + 500, prev.currentIntakeMl + refillAmount),
      plasticBottlesSaved: prev.plasticBottlesSaved + 1,
      co2SavedKg: parseFloat((prev.co2SavedKg + 0.08).toFixed(2)),
      refillsToday: prev.refillsToday + 1,
      lastRefillTime: 'Just now',
    }));

    setCelebrationMessage(
      `🎉 Refilled 500 mL at ${station.name}! +1 Bottle Saved.`
    );
    setTimeout(() => {
      setCelebrationMessage(null);
    }, 4000);
  };

  const handleUnlockBottle = (unlockedId: string) => {
    const cleanId = unlockedId.toUpperCase();
    try {
      localStorage.setItem('sip_n_go_unlocked_bottle', cleanId);
    } catch (e) {
      console.warn('localStorage write error:', e);
    }

    setBottle(() => {
      try {
        const saved = localStorage.getItem(`sip_n_go_bottle_${cleanId}`);
        if (saved) return JSON.parse(saved);
      } catch {}
      return {
        ...INITIAL_BOTTLE,
        id: cleanId,
        name: `Sip n Go (${cleanId})`,
      };
    });

    setIsBottleUnlocked(true);
    setJustScannedNotice(`🎉 Bottle #${cleanId} verified! Finding closest water stations...`);
    requestUserLocation();
    setTimeout(() => {
      setJustScannedNotice(null);
    }, 5000);
  };

  const handleLockBottle = () => {
    try {
      localStorage.removeItem('sip_n_go_unlocked_bottle');
    } catch {}
    setIsBottleUnlocked(false);
  };

  const handleSimulateScan = (bottleId: string) => {
    handleUnlockBottle(bottleId);
  };

  const handleAddStation = (newStation: RefillStation) => {
    setStations((prev) => [newStation, ...prev]);
    setSelectedStation(newStation);
    try {
      const stored = localStorage.getItem('sip_n_go_custom_stations');
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem('sip_n_go_custom_stations', JSON.stringify([newStation, ...list]));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
    setCelebrationMessage(`Water station "${newStation.name}" added!`);
    setTimeout(() => setCelebrationMessage(null), 3500);
  };

  const handleTabChange = (tab: MobileTab) => {
    if (tab === 'bottle') {
      setIsBottleModalOpen(true);
    } else if (tab === 'qr') {
      setIsQRModalOpen(true);
    } else if (tab === 'quickRefill') {
      if (filteredStations.length > 0) {
        handleRefillAtStation(selectedStation || filteredStations[0]);
      }
    } else {
      setActiveTab('explore');
    }
  };

  const intakePercent = Math.min(
    100,
    Math.round((bottle.currentIntakeMl / bottle.dailyGoalMl) * 100)
  );

  const isNavigating = Boolean(navigatingStation && activeRoute);

  // Require Bottle QR scan before unlocking website
  if (!isBottleUnlocked) {
    return (
      <BottleScanGate
        onUnlockBottle={handleUnlockBottle}
        defaultBottleId={bottle.id || 'SIP-8821'}
      />
    );
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none">
      {/* Floating Mobile Header (hidden during active turn-by-turn navigation for clean HUD) */}
      {!isNavigating && (
        <MobileHeader
          bottle={bottle}
          userLocation={userLocation}
          selectedCityName={selectedCityName}
          onSelectCity={handleSelectCity}
          onOpenBottleModal={() => setIsBottleModalOpen(true)}
          onOpenQR={() => setIsQRModalOpen(true)}
          onLocateUser={requestUserLocation}
        />
      )}

      {/* Location Permission / Error Alert Banner */}
      {locationErrorNotice && !isNavigating && (
        <div className="fixed top-14 left-3 right-3 z-40 bg-amber-500/95 text-slate-950 px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center justify-between text-xs animate-fade-in border border-amber-300 font-medium">
          <div className="flex items-center gap-2 flex-1 mr-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="leading-snug">{locationErrorNotice}</span>
          </div>
          <button
            onClick={requestUserLocation}
            className="px-2.5 py-1 bg-slate-950 text-white rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <RefreshCw size={12} className={isLocating ? 'animate-spin' : ''} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Calculating Route Toast */}
      {isCalculatingRoute && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-cyan-600 text-white shadow-2xl font-bold text-xs flex items-center gap-2 animate-pulse border border-cyan-400">
          <RefreshCw size={14} className="animate-spin" />
          <span>Calculating walking route...</span>
        </div>
      )}

      {/* Top Scanned QR Notification Banner */}
      {justScannedNotice && !isNavigating && (
        <div className="fixed top-14 left-3 right-3 z-40 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white px-3.5 py-2 rounded-2xl shadow-xl flex items-center justify-between text-xs animate-fade-in border border-cyan-400/30">
          <div className="flex items-center gap-2 font-medium truncate">
            <Sparkles size={15} className="text-cyan-200 shrink-0" />
            <span className="truncate">{justScannedNotice}</span>
          </div>
          <button
            onClick={() => setJustScannedNotice(null)}
            className="text-white/80 hover:text-white ml-2 text-sm font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Refill Success Celebration Toast */}
      {celebrationMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce border border-emerald-400/30 whitespace-nowrap">
          <Check size={16} />
          <span>{celebrationMessage}</span>
        </div>
      )}

      {/* Full Viewport Map Background with walking route overlay */}
      <div className="relative flex-1 w-full h-full min-h-0">
        <MapView
          userLocation={userLocation}
          stations={filteredStations}
          selectedStation={selectedStation}
          onSelectStation={(st) => {
            setSelectedStation(st);
            setInspectingStation(st);
          }}
          onLocateUser={requestUserLocation}
          isLocating={isLocating}
          navRouteCoordinates={activeRoute?.coordinates}
          isNavigating={isNavigating}
        />
      </div>

      {/* IN-APP TURN-BY-TURN NAVIGATION HUD */}
      {isNavigating && navigatingStation && activeRoute && (
        <NavigationHUD
          station={navigatingStation}
          route={activeRoute}
          onExitNavigation={handleExitNavigation}
          onRefillAtStation={handleRefillAtStation}
          onRecenterRoute={() => {
            // Recenter triggered
          }}
        />
      )}

      {/* Mobile Interactive Bottom Sheet (Hidden when in navigation mode) */}
      {!isNavigating && (
        <MobileBottomSheet
          stations={filteredStations}
          selectedStation={selectedStation}
          onSelectStation={(st) => {
            setSelectedStation(st);
            setInspectingStation(st);
          }}
          onQuickRefill={handleRefillAtStation}
          onStartNavigation={handleStartNavigation}
          filters={filters}
          onChangeFilters={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
          onOpenAddStation={() => setIsAddStationModalOpen(true)}
        />
      )}

      {/* Fixed Mobile Bottom Navigation (Hidden when in navigation mode for immersion) */}
      {!isNavigating && (
        <MobileBottomNav
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          intakePercent={intakePercent}
        />
      )}

      {/* Modal Dialogs / Drawers */}
      <StationDetailModal
        station={inspectingStation}
        onClose={() => setInspectingStation(null)}
        onRefillAtStation={handleRefillAtStation}
        onStartNavigation={handleStartNavigation}
      />

      <BottleQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        bottle={bottle}
        onSimulateScan={handleSimulateScan}
      />

      <BottleCompanionModal
        isOpen={isBottleModalOpen}
        onClose={() => setIsBottleModalOpen(false)}
        bottle={bottle}
        onScanNewBottle={handleLockBottle}
        onLogRefill={(amount) => {
          setBottle((prev) => ({
            ...prev,
            currentIntakeMl: Math.min(prev.dailyGoalMl + 1000, prev.currentIntakeMl + amount),
            plasticBottlesSaved: prev.plasticBottlesSaved + 1,
            refillsToday: prev.refillsToday + 1,
            lastRefillTime: 'Just now',
          }));
        }}
        onResetHydration={() => {
          setBottle((prev) => ({
            ...prev,
            currentIntakeMl: 0,
            refillsToday: 0,
          }));
        }}
        onOpenQR={() => {
          setIsBottleModalOpen(false);
          setIsQRModalOpen(true);
        }}
      />

      <AddStationModal
        isOpen={isAddStationModalOpen}
        onClose={() => setIsAddStationModalOpen(false)}
        userLocation={userLocation}
        onAddStation={handleAddStation}
      />
    </div>
  );
};

export default App;
