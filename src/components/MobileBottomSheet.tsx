import { useState, useRef, useCallback } from 'react';
import type { FC } from 'react';
import type { RefillStation, FilterOptions } from '../types';
import { StationCard } from './StationCard';
import { FilterBar } from './FilterBar';
import { MapPin, Navigation, Droplet, Star, ChevronUp, ChevronDown } from './Icons';
import { formatDistance, estimateWalkingTime } from '../utils/geo';

export type SheetState = 'peek' | 'half' | 'full';

interface MobileBottomSheetProps {
  stations: RefillStation[];
  selectedStation: RefillStation | null;
  onSelectStation: (station: RefillStation) => void;
  onQuickRefill: (station: RefillStation) => void;
  onStartNavigation: (station: RefillStation) => void;
  filters: FilterOptions;
  onChangeFilters: (newFilters: Partial<FilterOptions>) => void;
  onOpenAddStation: () => void;
}

// Resting height for peek state (fits handle + station spotlight + Navigate & Refill buttons)
const PEEK_HEIGHT = 176;

export const MobileBottomSheet: FC<MobileBottomSheetProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  onQuickRefill,
  onStartNavigation,
  filters,
  onChangeFilters,
  onOpenAddStation,
}) => {
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const [isDragging, setIsDragging] = useState(false);
  const [dragHeight, setDragHeight] = useState<number>(PEEK_HEIGHT);

  const touchStartY = useRef<number | null>(null);
  const startHeight = useRef<number | null>(null);

  const closestStation = selectedStation || stations[0];

  const getHalfHeight = useCallback(() => {
    if (typeof window === 'undefined') return 450;
    return Math.round(window.innerHeight * 0.56);
  }, []);

  const getFullHeight = useCallback(() => {
    if (typeof window === 'undefined') return 700;
    return Math.max(PEEK_HEIGHT + 150, window.innerHeight - 90);
  }, []);

  // Tap handler to toggle between states
  const toggleSheet = () => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('peek');
  };

  // Continuous Swipe Gestures: Dragging adjusts height in real time so details reveal immediately
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);

    let initialH = PEEK_HEIGHT;
    if (sheetState === 'half') initialH = getHalfHeight();
    else if (sheetState === 'full') initialH = getFullHeight();

    startHeight.current = initialH;
    setDragHeight(initialH);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || startHeight.current === null) return;
    const currentY = e.touches[0].clientY;
    // deltaY < 0 when dragging upwards, so subtracting deltaY increases the sheet's height
    const deltaY = currentY - touchStartY.current;

    const minH = PEEK_HEIGHT;
    const maxH = getFullHeight();
    let nextH = startHeight.current - deltaY;

    // Fluid rubber-band resistance when pulling past limits
    if (nextH < minH) {
      nextH = minH - (minH - nextH) * 0.2;
    } else if (nextH > maxH) {
      nextH = maxH + (nextH - maxH) * 0.2;
    }

    setDragHeight(Math.round(nextH));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || startHeight.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const currentDragH = dragHeight;

    setIsDragging(false);
    touchStartY.current = null;
    startHeight.current = null;

    // Quick tap (<8px movement): toggle between view states
    if (Math.abs(deltaY) < 8) {
      toggleSheet();
      return;
    }

    const halfH = getHalfHeight();
    const fullH = getFullHeight();

    // Snap to the closest resting state based on position and direction
    if (sheetState === 'peek') {
      if (currentDragH > halfH + 40 || deltaY < -160) {
        setSheetState('full');
      } else if (currentDragH > PEEK_HEIGHT + 40 || deltaY < -40) {
        setSheetState('half');
      } else {
        setSheetState('peek');
      }
    } else if (sheetState === 'half') {
      if (currentDragH > halfH + 50 || deltaY < -50) {
        setSheetState('full');
      } else if (currentDragH < halfH - 50 || deltaY > 50) {
        setSheetState('peek');
      } else {
        setSheetState('half');
      }
    } else {
      // sheetState === 'full'
      if (currentDragH < halfH - 40 || deltaY > 180) {
        setSheetState('peek');
      } else if (currentDragH < fullH - 50 || deltaY > 50) {
        setSheetState('half');
      } else {
        setSheetState('full');
      }
    }
  };

  // Return the resting CSS height when not actively dragging
  const getRestingHeightStyle = () => {
    switch (sheetState) {
      case 'full':
        return 'h-[88dvh] max-h-[calc(100dvh-5.5rem)]';
      case 'half':
        return 'h-[56dvh]';
      case 'peek':
      default:
        return 'h-[176px]';
    }
  };

  return (
    <div
      style={{
        height: isDragging ? `${dragHeight}px` : undefined,
        transition: isDragging ? 'none' : undefined,
      }}
      className={`fixed left-0 right-0 bottom-sheet-base z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-t-3xl border-t border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col bottom-sheet-snap ${
        !isDragging ? getRestingHeightStyle() : ''
      }`}
    >
      {/* Draggable Handle Bar (pinned at top with touch listeners) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full pt-2.5 pb-1 flex flex-col items-center justify-center cursor-pointer select-none shrink-0 active:opacity-75 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors touch-none"
        title={sheetState === 'peek' ? 'Swipe up to reveal stations' : 'Swipe down to collapse'}
      >
        <div className="w-14 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors"></div>
        <div className="flex items-center justify-between w-full px-5 mt-1 text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
            <MapPin size={12} />
            <span>{stations.length} stations nearby</span>
          </span>
          <div className="flex items-center gap-1.5">
            {sheetState !== 'peek' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSheetState((prev) => (prev === 'full' ? 'half' : 'full'));
                }}
                className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors cursor-pointer"
              >
                {sheetState === 'full' ? 'Half view' : 'Max view ↑'}
              </button>
            )}
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-0.5">
              {sheetState === 'peek' ? (
                <>
                  <span>Swipe up to explore</span>
                  <ChevronUp size={11} className="text-cyan-500 animate-bounce" />
                </>
              ) : (
                <>
                  <span>Swipe down to collapse</span>
                  <ChevronDown size={11} />
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Unified Continuous Content Container:
          - Both the Navigate and Refill buttons are PROMINENTLY visible in peek mode.
          - As the user pulls up and holds, the sheet's height grows in real time,
            smoothly revealing the Search & Filter bar and the entire station list beneath their finger! */}
      <div
        className={`flex-1 flex flex-col px-4 pb-3 min-h-0 ${
          sheetState === 'peek' && !isDragging ? 'overflow-hidden' : 'overflow-y-auto touch-scroll'
        }`}
      >
        {closestStation ? (
          <div className="space-y-2.5 pb-4">
            {/* Nearest / Selected Station Spotlight Area */}
            <div
              {...(sheetState === 'peek'
                ? {
                    onTouchStart: handleTouchStart,
                    onTouchMove: handleTouchMove,
                    onTouchEnd: handleTouchEnd,
                  }
                : {})}
              onClick={() => onSelectStation(closestStation)}
              className="flex items-center gap-3 cursor-pointer pt-0.5"
            >
              <div
                className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 shadow-xs"
                style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
              >
                <img
                  src={closestStation.image}
                  alt={closestStation.name}
                  className="w-full h-full object-cover block"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/75 text-[9px] font-bold text-white">
                  {closestStation.priceTag}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 truncate">
                    {closestStation.distanceMeters !== undefined
                      ? `${formatDistance(closestStation.distanceMeters)} • ${estimateWalkingTime(closestStation.distanceMeters)}`
                      : 'Nearest station'}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded shrink-0">
                    <Star size={10} />
                    {closestStation.rating}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate m-0">
                  {closestStation.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {closestStation.address}
                </p>

                <div className="flex gap-1 mt-1">
                  {closestStation.waterTypes.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* NAVIGATE AND REFILL BUTTONS:
                Always visible in peek state so user can immediately take action without opening the sheet! */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onStartNavigation(closestStation);
                }}
                className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Navigation size={14} className="text-cyan-600 dark:text-cyan-400" />
                <span>Navigate</span>
              </button>

              <button
                type="button"
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickRefill(closestStation);
                }}
                className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Droplet size={14} />
                <span>Refill (+500ml)</span>
              </button>
            </div>

            {/* SEARCH & FILTERS BAR:
                Revealed continuously in real time as the user drags the sheet upward */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <FilterBar
                filters={filters}
                onChangeFilters={onChangeFilters}
                stationCount={stations.length}
                activeView="list"
                onToggleView={() => {}}
              />
            </div>

            {/* COMPLETE NEARBY STATIONS LIST:
                Smooth continuous momentum scrolling through all refilling locations */}
            <div className="space-y-2.5 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                All Nearby Refill Stations
              </div>

              {stations.map((st) => (
                <StationCard
                  key={st.id}
                  station={st}
                  isSelected={selectedStation?.id === st.id}
                  onSelect={onSelectStation}
                  onQuickRefill={onQuickRefill}
                  onStartNavigation={onStartNavigation}
                />
              ))}

              {/* Add Station Community Callout */}
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/50 text-center space-y-1.5 mt-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Know a refilling station that's not listed here?
                </p>
                <button
                  type="button"
                  onClick={onOpenAddStation}
                  className="text-xs font-bold text-cyan-600 dark:text-cyan-400 underline hover:no-underline cursor-pointer"
                >
                  + Add Station to Sip n Go
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No refilling stations match your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
