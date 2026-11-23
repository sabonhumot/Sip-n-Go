import type { FC } from 'react';
import { MapPin, QrCode } from './Icons';
import type { BottleData, UserLocation } from '../types';
import { PRESET_CITIES } from '../utils/geo';
import sipLogo from '../assets/SIP_N_GO_LOGO.png';

interface MobileHeaderProps {
  bottle: BottleData;
  userLocation: UserLocation;
  selectedCityName: string;
  onSelectCity: (city: (typeof PRESET_CITIES)[0]) => void;
  onOpenBottleModal: () => void;
  onOpenQR: () => void;
  onLocateUser: () => void;
}

export const MobileHeader: FC<MobileHeaderProps> = ({
  bottle,
  selectedCityName,
  onSelectCity,
  onOpenBottleModal,
  onOpenQR,
}) => {
  return (
    <header className="app-header fixed top-0 left-0 right-0 z-30 pt-safe px-3 pb-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm border border-cyan-100 dark:border-slate-700/80 flex items-center justify-center p-0.5">
            <img
              src={sipLogo}
              alt="Sip n Go Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
              Sip <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">n</span> Go
            </div>
            <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest leading-none">
              Refill companion
            </span>
          </div>
        </div>

        {/* Center: City Explorer Selector */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-semibold text-slate-700 dark:text-slate-200 max-w-[120px] sm:max-w-[150px] truncate">
          <MapPin size={11} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
          <select
            value={selectedCityName}
            onChange={(e) => {
              const city = PRESET_CITIES.find((c) => c.name === e.target.value);
              if (city) onSelectCity(city);
            }}
            className="bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer truncate w-full"
          >
            {PRESET_CITIES.map((c) => (
              <option key={c.name} value={c.name} className="dark:bg-slate-800 text-xs">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right actions: Bottle Capacity Pill & QR button */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenBottleModal}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
            title="Open Bottle Companion"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{bottle.capacityMl}ml</span>
          </button>

          <button
            onClick={onOpenQR}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Show Bottle QR"
          >
            <QrCode size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
