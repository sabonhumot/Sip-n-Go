import { useState, useRef } from 'react';
import type { FC } from 'react';
import type { RefillStation, FilterOptions } from '../types';
import { StationCard } from './StationCard';
import { FilterBar } from './FilterBar';
import { MapPin, Navigation, Droplet, Star } from './Icons';
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
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const closestStation = selectedStation || stations[0];

  // Tap handler to toggle sheet state
  const toggleSheet = () => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('peek');
  };

  // Full Bidirectional Touch Swipe Gestures (Swipe UP to expand, Swipe DOWN to collapse)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Fluid drag physics depending on current state
    if (sheetState === 'peek') {
      // Swiping UP pulls sheet upward in real-time; slight resistance downwards
      if (deltaY < 0) {
        setDragOffsetY(deltaY);
      } else {
        setDragOffsetY(deltaY * 0.25);
      }
    } else if (sheetState === 'half') {
      // Swiping UP pulls toward full; swiping DOWN pulls toward peek
      setDragOffsetY(deltaY);
    } else {
      // Swiping DOWN pulls toward half/peek; slight resistance upwards
      if (deltaY > 0) {
        setDragOffsetY(deltaY);
      } else {
        setDragOffsetY(deltaY * 0.25);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    setIsDragging(false);
    touchStartY.current = null;
    setDragOffsetY(0);

    // If it was just a quick tap (<8px movement), toggle sheet
    if (Math.abs(deltaY) < 8) {
      toggleSheet();
      return;
    }

    // Swipe UP threshold (< -40px)
    if (deltaY < -40) {
      if (sheetState === 'peek') {
        setSheetState(deltaY < -130 ? 'full' : 'half');
      } else if (sheetState === 'half') {
        setSheetState('full');
      }
    }
    // Swipe DOWN threshold (> 40px)
    else if (deltaY > 40) {
      if (sheetState === 'full') {
        setSheetState(deltaY > 130 ? 'peek' : 'half');
      } else if (sheetState === 'half') {
        setSheetState('peek');
      }
    }
  };

  const getHeightClass = () => {
    switch (sheetState) {
      case 'full':
        return 'h-[86dvh] max-h-[calc(100dvh-5.5rem)]';
      case 'half':
        return 'h-[54dvh]';
      case 'peek':
      default:
        return 'h-[235px]';
    }
  };

  return (
    <div
      style={{
        transform: `translateY(${dragOffsetY}px)`,
        transition: isDragging ? 'none' : undefined,
      }}
      className={`fixed left-0 right-0 bottom-sheet-base z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-t-3xl border-t border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col bottom-sheet-snap ${getHeightClass()}`}
    >
      {/* Draggable Handle Bar with Full Touch Swipe Gestures */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full pt-3 pb-2.5 flex flex-col items-center justify-center cursor-pointer select-none shrink-0 active:opacity-75 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors touch-none"
        title={sheetState === 'peek' ? 'Swipe up to expand' : 'Swipe down to collapse'}
      >
        <div className="w-14 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors"></div>
        <div className="flex items-center justify-between w-full px-5 mt-1.5 text-[11px] font-bold text-slate-400">
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
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              {sheetState === 'peek' ? 'Swipe up for list ↑' : 'Swipe down to collapse ↓'}
            </span>
          </div>
        </div>
      </div>

      {/* Content depending on sheet state */}
      <div className="flex-1 overflow-hidden flex flex-col px-4 pb-2">
        {sheetState === 'peek' ? (
          /* Peek Mode: Spotlights the closest water refilling station right at thumb's reach */
          closestStation ? (
            <div className="flex-1 flex flex-col justify-between py-1">
              <div
                onClick={() => onSelectStation(closestStation)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={closestStation.image}
                    alt={closestStation.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/70 text-[9px] font-bold text-white">
                    {closestStation.priceTag}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      {closestStation.distanceMeters !== undefined
                        ? `${formatDistance(closestStation.distanceMeters)} • ${estimateWalkingTime(closestStation.distanceMeters)}`
                        : 'Nearest station'}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1 py-0.5 rounded">
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
                    {closestStation.waterTypes.slice(0, 2).map((t) => (
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

              {/* Two large thumb-friendly buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 pb-1">
                <button
                  onClick={() => onStartNavigation(closestStation)}
                  className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <Navigation size={15} className="text-cyan-600 dark:text-cyan-400" />
                  <span>Navigate</span>
                </button>

                <button
                  onClick={() => onQuickRefill(closestStation)}
                  className="py-3 px-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Droplet size={15} />
                  <span>Refill Here (+500ml)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-400">
              No stations match filter. Tap handle to view all.
            </div>
          )
        ) : (
          /* Half / Full Mode: Search, Filters, and Scrollable Station List */
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Filter and Search Bar */}
            <div className="shrink-0">
              <FilterBar
                filters={filters}
                onChangeFilters={onChangeFilters}
                stationCount={stations.length}
                activeView="list"
                onToggleView={() => {}}
              />
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto touch-scroll space-y-2.5 pr-0.5">
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

              {/* Add Station Callout at bottom */}
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/50 text-center space-y-1.5">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Know a refilling station that's not listed here?
                </p>
                <button
                  onClick={onOpenAddStation}
                  className="text-xs font-bold text-cyan-600 dark:text-cyan-400 underline hover:no-underline cursor-pointer"
                >
                  + Add Station to Sip n Go
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
