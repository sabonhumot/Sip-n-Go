import type { FC } from 'react';
import { X, Droplet, Leaf, Plus, Sparkles, QrCode } from './Icons';
import type { BottleData } from '../types';

interface BottleCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bottle: BottleData;
  onLogRefill: (amountMl: number) => void;
  onResetHydration: () => void;
  onOpenQR: () => void;
  onScanNewBottle?: () => void;
}

export const BottleCompanionModal: FC<BottleCompanionModalProps> = ({
  isOpen,
  onClose,
  bottle,
  onLogRefill,
  onResetHydration,
  onOpenQR,
  onScanNewBottle,
}) => {
  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round((bottle.currentIntakeMl / bottle.dailyGoalMl) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[88vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-20 w-12 h-1.5 rounded-full bg-white/70"></div>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 p-6 text-white text-left">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              Sip n Go Reusable Bottle
            </span>
            <span className="flex items-center gap-1 text-xs text-cyan-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              QR Paired
            </span>
          </div>

          <h2 className="text-2xl font-black text-white m-0">
            {bottle.name}
          </h2>
          <p className="text-blue-100 text-sm mt-0.5">
            Model: {bottle.model} • Tag ID: {bottle.id}
          </p>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-left">
          {/* Main Hydration Status Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50/80 to-blue-50/50 dark:from-slate-800/80 dark:to-slate-800/30 border border-cyan-100 dark:border-cyan-900/50 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            {/* Visual Bottle Representation */}
            <div className="relative w-24 h-44 rounded-3xl border-4 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden shadow-md flex flex-col justify-end p-1">
              {/* Cap */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3 bg-slate-700 dark:bg-slate-500 rounded-t-md"></div>
              {/* Water Liquid Wave */}
              <div
                className="w-full bg-gradient-to-t from-cyan-500 to-blue-400 rounded-2xl transition-all duration-700 ease-out relative"
                style={{ height: `${progressPercent}%` }}
              >
                <div className="absolute top-1 left-0 right-0 h-2 bg-white/30 rounded-full animate-pulse"></div>
              </div>
              {/* Level label */}
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs pointer-events-none drop-shadow">
                <span className={progressPercent > 50 ? 'text-white' : 'text-slate-700 dark:text-slate-200'}>
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Hydration Stats and Actions */}
            <div className="flex-1 w-full space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Today's Hydration
                </span>
                <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">
                  Goal: {bottle.dailyGoalMl} mL
                </span>
              </div>

              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {bottle.currentIntakeMl}{' '}
                  <span className="text-lg font-medium text-slate-400 dark:text-slate-500">mL</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Quick Log Buttons */}
              <div className="pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1.5">
                  Quick Drink / Refill Log:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onLogRefill(250)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 text-xs font-bold border border-cyan-200 dark:border-cyan-800 shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} /> +250 mL
                  </button>
                  <button
                    onClick={() => onLogRefill(500)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm shadow-cyan-600/30 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} /> +500 mL
                  </button>
                  <button
                    onClick={() => onLogRefill(bottle.capacityMl)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} /> +{bottle.capacityMl} mL (Full)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottle Profile & Specs Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Bottle Specifications & Info
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 mb-1">
                  <Droplet size={16} />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Capacity</span>
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-white">
                  {bottle.capacityMl} mL
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Standard Refill Size
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                  <Droplet size={16} />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Material</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                  18/8 Stainless
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  BPA-Free • Food Grade
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                  <Droplet size={16} />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Refills Today</span>
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-white">
                  {bottle.refillsToday}x
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Last: {bottle.lastRefillTime}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-indigo-500 mb-1">
                  <QrCode size={16} />
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">QR Bottle ID</span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-800 dark:text-white">
                  {bottle.id}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Laser Etched Tag
                </div>
              </div>
            </div>
          </div>

          {/* Eco Impact */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <Leaf size={18} className="text-emerald-600" />
                <span>Your Environmental Impact</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold">
                Eco Hero
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center pt-2">
              <div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {bottle.plasticBottlesSaved}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Plastic bottles diverted
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {bottle.co2SavedKg} kg
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  CO₂ avoided
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  ${Math.round(bottle.plasticBottlesSaved * 1.5)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Money saved
                </div>
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onOpenQR}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode size={16} />
              <span>Show Bottle's QR Code</span>
            </button>
            {onScanNewBottle && (
              <button
                onClick={() => {
                  onClose();
                  onScanNewBottle();
                }}
                className="py-3 px-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Scan New Bottle</span>
              </button>
            )}
            <button
              onClick={onResetHydration}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Reset Daily Hydration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
