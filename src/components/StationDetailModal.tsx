import { useState, useRef } from 'react';
import type { FC } from 'react';
import {
  X,
  Droplet,
  MapPin,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  Sparkles,
  Star,
  Check,
} from './Icons';
import type { RefillStation, WaterType } from '../types';
import { formatDistance, estimateWalkingTime } from '../utils/geo';

interface StationDetailModalProps {
  station: RefillStation | null;
  onClose: () => void;
  onRefillAtStation: (station: RefillStation) => void;
  onStartNavigation: (station: RefillStation) => void;
}

export const StationDetailModal: FC<StationDetailModalProps> = ({
  station,
  onClose,
  onRefillAtStation,
  onStartNavigation,
}) => {
  const [refillSuccess, setRefillSuccess] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef<number | null>(null);

  if (!station) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      setDragOffsetY(deltaY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    setIsDragging(false);
    touchStartY.current = null;

    if (deltaY > 60) {
      setDragOffsetY(350);
      setTimeout(() => {
        onClose();
        setDragOffsetY(0);
      }, 160);
    } else {
      setDragOffsetY(0);
    }
  };

  const handleRefill = () => {
    onRefillAtStation(station);
    setRefillSuccess(true);
    setTimeout(() => {
      setRefillSuccess(false);
    }, 2500);
  };

  const handleStartNav = () => {
    onStartNavigation(station);
    onClose();
  };

  const getWaterBadgeColor = (type: WaterType) => {
    switch (type) {
      case 'Chilled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200';
      case 'Sparkling':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border-purple-200';
      case 'Alkaline':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200';
      case 'UV-C Purified':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200';
      default:
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300 border-cyan-200';
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        style={{
          transform: `translateY(${dragOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[90dvh] flex flex-col text-left"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle with swipe down to collapse */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={onClose}
          className="sm:hidden absolute top-0 left-0 right-0 z-30 pt-2.5 pb-4 flex items-center justify-center cursor-pointer select-none touch-none bg-gradient-to-b from-black/50 via-black/20 to-transparent"
          title="Swipe down or tap to collapse"
        >
          <div className="w-12 h-1.5 rounded-full bg-white/85 shadow-sm active:scale-95 transition-transform"></div>
        </div>

        {/* Hero image with status overlay */}
        <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-slate-900">
          <img
            src={station.image}
            alt={station.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all cursor-pointer z-30 shadow-md"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Floating badges on photo */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1 shadow-md">
              <CheckCircle2 size={13} />
              {station.status}
            </span>
            {station.verified && (
              <span className="px-3 py-1 rounded-full bg-cyan-500/90 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1 shadow-md">
                <ShieldCheck size={13} />
                Certified Clean
              </span>
            )}
          </div>

          {/* Bottom title banner */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 mb-1">
              <MapPin size={14} />
              <span>
                {station.distanceMeters !== undefined ? formatDistance(station.distanceMeters) : ''} •{' '}
                {station.distanceMeters !== undefined ? estimateWalkingTime(station.distanceMeters) : ''}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white m-0 tracking-tight drop-shadow-sm">
              {station.name}
            </h2>
            <p className="text-slate-300 text-xs mt-1 truncate">{station.address}</p>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Metrics & Price */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/50">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                Dispenser Access
              </span>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {station.priceTag}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-amber-400/20 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-xl text-xs font-bold border border-amber-300/40">
                <Star size={14} />
                <span>{station.rating}</span>
                <span className="text-[10px] text-slate-400 font-normal">({station.reviewCount})</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Hours</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {station.openingHours}
                </span>
              </div>
            </div>
          </div>

          {/* Water Types Available */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Available Water Types
            </h4>
            <div className="flex flex-wrap gap-2">
              {station.waterTypes.map((type) => (
                <span
                  key={type}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${getWaterBadgeColor(
                    type
                  )} flex items-center gap-1.5`}
                >
                  <Droplet size={13} />
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* Real-time Water Quality Lab Metrics */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Sparkles size={14} className="text-cyan-500" />
                <span>Water Purity & Lab Metrics</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Sanitized: {station.lastCleaned}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-base font-extrabold text-cyan-600 dark:text-cyan-400">
                  {station.metrics.tds}{' '}
                  <span className="text-[10px] text-slate-400 font-medium">ppm</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  TDS (Pure)
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {station.metrics.ph}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  pH Balance
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                  {station.metrics.tempC}°C
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Temp (Chilled)
                </div>
              </div>
            </div>
          </div>

          {/* Description & Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Station Overview
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {station.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {station.indoorOutdoor} Location
              </span>
              {station.hasBottleRinse && (
                <span className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  ✓ Bottle Rinse Sink
                </span>
              )}
              {station.accessibility && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  ✓ Wheelchair Accessible
                </span>
              )}
            </div>
          </div>

          {/* Refill Success Toast Animation */}
          {refillSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500 text-white flex items-center justify-between animate-slide-down shadow-lg">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Check size={18} />
                <span>Refill Logged to your Sip n Go Bottle! (+500 mL)</span>
              </div>
              <span className="text-xs font-medium bg-emerald-600 px-2 py-0.5 rounded-full">
                +1 Bottle Saved
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 modal-pb-safe">
            <button
              onClick={handleRefill}
              className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <Droplet size={18} />
              <span>Refill Sip n Go Bottle Here</span>
            </button>

            <button
              onClick={handleStartNav}
              className="py-3.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Navigation size={16} className="text-cyan-600 dark:text-cyan-400" />
              <span>Start Navigation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
