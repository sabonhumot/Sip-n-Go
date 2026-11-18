import type { FC, MouseEvent } from 'react';
import {
  Droplet,
  MapPin,
  Clock,
  Navigation,
  Star,
} from './Icons';
import type { RefillStation, WaterType } from '../types';
import { formatDistance, estimateWalkingTime } from '../utils/geo';

interface StationCardProps {
  station: RefillStation;
  isSelected?: boolean;
  onSelect: (station: RefillStation) => void;
  onQuickRefill: (station: RefillStation) => void;
  onStartNavigation?: (station: RefillStation) => void;
}

export const StationCard: FC<StationCardProps> = ({
  station,
  isSelected = false,
  onSelect,
  onQuickRefill,
  onStartNavigation,
}) => {
  const getBadgeClass = (type: WaterType) => {
    switch (type) {
      case 'Chilled':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800';
      case 'Sparkling':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800';
      case 'Alkaline':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800';
      default:
        return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800';
    }
  };

  const handleDirections = (e: MouseEvent) => {
    e.stopPropagation();
    if (onStartNavigation) {
      onStartNavigation(station);
    }
  };

  const handleRefillClick = (e: MouseEvent) => {
    e.stopPropagation();
    onQuickRefill(station);
  };

  return (
    <div
      onClick={() => onSelect(station)}
      className={`group relative rounded-2xl p-4 transition-all duration-200 text-left cursor-pointer border ${
        isSelected
          ? 'bg-cyan-50/70 dark:bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-400/30 shadow-lg'
          : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-cyan-300 dark:hover:border-slate-700 hover:shadow-md'
      }`}
    >
      <div className="flex gap-4 items-start">
        {/* Thumbnail Image */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
          <img
            src={station.image}
            alt={station.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Free Badge */}
          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white">
            {station.priceTag}
          </span>
        </div>

        {/* Content details */}
        <div className="flex-1 min-w-0">
          {/* Top meta: Distance & Status */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              <MapPin size={13} />
              <span>
                {station.distanceMeters !== undefined ? formatDistance(station.distanceMeters) : ''}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                {station.distanceMeters !== undefined ? estimateWalkingTime(station.distanceMeters) : ''}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50">
              <Star size={11} />
              <span>{station.rating}</span>
            </div>
          </div>

          {/* Station Name */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors m-0">
            {station.name}
          </h3>

          {/* Address */}
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {station.address}
          </p>

          {/* Water Types tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {station.waterTypes.slice(0, 3).map((type) => (
              <span
                key={type}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getBadgeClass(
                  type
                )}`}
              >
                {type}
              </span>
            ))}
            {station.waterTypes.length > 3 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                +{station.waterTypes.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons row */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Clock size={12} />
          <span>{station.openingHours}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDirections}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            title="Directions"
          >
            <Navigation size={12} />
            <span>Go</span>
          </button>

          <button
            onClick={handleRefillClick}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm shadow-cyan-600/30 transition-all active:scale-95 cursor-pointer"
            title="Log Refill to your Sip n Go Bottle"
          >
            <Droplet size={12} />
            <span>Refill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
