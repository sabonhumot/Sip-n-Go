import type { FC } from 'react';
import {
  Droplet,
  QrCode,
  MapPin,
} from './Icons';
import type { BottleData, UserLocation } from '../types';
import { PRESET_CITIES } from '../utils/geo';

interface NavbarProps {
  bottle: BottleData;
  userLocation: UserLocation;
  onOpenQR: () => void;
  onOpenBottleModal: () => void;
  onSelectCity: (city: (typeof PRESET_CITIES)[0]) => void;
  selectedCityName: string;
}

export const Navbar: FC<NavbarProps> = ({
  bottle,
  onOpenQR,
  onOpenBottleModal,
  onSelectCity,
  selectedCityName,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25">
            <Droplet size={22} className="fill-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Sip <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">n</span> Go
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 text-[10px] font-extrabold uppercase tracking-wider">
                Smart Refill
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
              Scan Bottle QR • Find Pure Water
            </p>
          </div>
        </div>

        {/* Center: City / Location Switcher */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <MapPin size={14} className="text-cyan-600 dark:text-cyan-400" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Explore:</span>
          <select
            value={selectedCityName}
            onChange={(e) => {
              const city = PRESET_CITIES.find((c) => c.name === e.target.value);
              if (city) onSelectCity(city);
            }}
            className="bg-transparent text-slate-800 dark:text-slate-200 font-bold focus:outline-none cursor-pointer pr-1"
          >
            {PRESET_CITIES.map((city) => (
              <option key={city.name} value={city.name} className="dark:bg-slate-800">
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bottle Companion Pill */}
          <button
            onClick={onOpenBottleModal}
            className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer group text-left"
            title="Open Bottle Companion"
          >
            {/* Liquid level preview miniature */}
            <div className="w-5 h-7 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-end p-0.5 shrink-0">
              <div
                className="w-full bg-cyan-500 rounded-sm transition-all"
                style={{
                  height: `${Math.min(100, Math.round((bottle.currentIntakeMl / bottle.dailyGoalMl) * 100))}%`,
                }}
              ></div>
            </div>

            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                <span>{bottle.name}</span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
                  ({Math.round((bottle.currentIntakeMl / bottle.dailyGoalMl) * 100)}%)
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span>{bottle.capacityMl} mL</span>
                <span>•</span>
                <span>{bottle.plasticBottlesSaved} Bottles Saved 🌿</span>
              </div>
            </div>
          </button>

          {/* QR Code Action Button */}
          <button
            onClick={onOpenQR}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-500/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <QrCode size={16} />
            <span className="hidden sm:inline">Bottle QR Code</span>
            <span className="sm:hidden">QR</span>
          </button>
        </div>
      </div>
    </header>
  );
};
