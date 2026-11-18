import { useState } from 'react';
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

  const closestStation = selectedStation || stations[0];

  const toggleSheet = () => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('peek');
  };

  const getHeightClass = () => {
    switch (sheetState) {
      case 'full':
        return 'h-[86vh]';
      case 'half':
        return 'h-[52vh]';
      case 'peek':
      default:
        return 'h-[200px]';
    }
  };

  return (
    <div
      className={`fixed left-0 right-0 bottom-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-t-3xl border-t border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col bottom-sheet-snap ${getHeightClass()}`}
    >
      {/* Draggable Handle Bar */}
      <div
        onClick={toggleSheet}
        className="w-full pt-2.5 pb-2 flex flex-col items-center justify-center cursor-pointer select-none shrink-0"
      >
        <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
        <div className="flex items-center justify-between w-full px-5 mt-1.5 text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
            <MapPin size={12} />
            <span>{stations.length} stations found nearby</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            {sheetState === 'peek' ? 'Pull up for list ↑' : sheetState === 'half' ? 'Full view ↑' : 'Collapse ↓'}
          </span>
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
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => onStartNavigation(closestStation)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Navigation size={14} className="text-cyan-600 dark:text-cyan-400" />
                  <span>Navigate</span>
                </button>

                <button
                  onClick={() => onQuickRefill(closestStation)}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-md shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Droplet size={14} />
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
