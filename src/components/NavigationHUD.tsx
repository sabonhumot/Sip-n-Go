import { useState } from 'react';
import type { FC } from 'react';
import type { RefillStation } from '../types';
import type { NavigationRoute } from '../utils/routing';
import { X, Droplet, Navigation, Compass } from './Icons';
import { formatDistance } from '../utils/geo';

interface NavigationHUDProps {
  station: RefillStation;
  route: NavigationRoute;
  onExitNavigation: () => void;
  onRefillAtStation: (station: RefillStation) => void;
  onRecenterRoute: () => void;
}

export const NavigationHUD: FC<NavigationHUDProps> = ({
  station,
  route,
  onExitNavigation,
  onRefillAtStation,
  onRecenterRoute,
}) => {
  const [showAllSteps, setShowAllSteps] = useState(false);
  const currentStep = route.steps[0] || {
    instruction: `Walk toward ${station.name}`,
    distanceMeters: route.totalDistanceMeters,
    modifier: 'straight',
  };

  const getManeuverIcon = (modifier?: string) => {
    if (modifier?.includes('left')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 10 4 15 9 20" />
          <path d="M20 4v7a4 4 0 0 1-4 4H4" />
        </svg>
      );
    }
    if (modifier?.includes('right')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 10 20 15 15 20" />
          <path d="M4 4v7a4 4 0 0 0 4 4h12" />
        </svg>
      );
    }
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 pt-safe pb-safe animate-fade-in">
      {/* ========================================================
          TOP NAVIGATION BANNER (Turn Guidance)
         ======================================================== */}
      <div className="pointer-events-auto w-full max-w-md mx-auto space-y-2">
        <div className="bg-slate-900/95 text-white backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-cyan-500/40 flex items-center justify-between gap-3">
          {/* Turn Arrow Icon Box */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30">
            {getManeuverIcon(currentStep.modifier)}
          </div>

          {/* Turn Text & Distance */}
          <div className="flex-1 min-w-0 text-left">
            <div className="text-cyan-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>Next Turn in {formatDistance(currentStep.distanceMeters)}</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-white truncate leading-tight mt-0.5">
              {currentStep.instruction}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              Target: {station.name}
            </div>
          </div>

          {/* Exit Navigation Button */}
          <button
            onClick={onExitNavigation}
            className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
            title="Exit Navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps Expander Button */}
        <div className="flex justify-between items-center px-2">
          <button
            onClick={() => setShowAllSteps(!showAllSteps)}
            className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-cyan-300 text-[11px] font-bold border border-cyan-500/30 shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Compass size={12} />
            <span>{showAllSteps ? 'Hide Itinerary ▲' : `View ${route.steps.length} Route Steps ▼`}</span>
          </button>

          <button
            onClick={onRecenterRoute}
            className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 text-[11px] font-bold border border-slate-700 shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Navigation size={12} />
            <span>Recenter Path</span>
          </button>
        </div>

        {/* Full Turn-by-Turn Steps Dropdown */}
        {showAllSteps && (
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-2xl p-3 border border-slate-700 shadow-2xl max-h-48 overflow-y-auto space-y-2 text-left">
            {route.steps.map((st, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{st.instruction}</div>
                  <div className="text-[10px] text-slate-400">{formatDistance(st.distanceMeters)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          BOTTOM DESTINATION CARD & ONE-TOUCH REFILL
         ======================================================== */}
      <div className="pointer-events-auto w-full max-w-md mx-auto space-y-2">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-left">
          {/* Station preview header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
              <img
                src={station.image}
                alt={station.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded bg-black/70 text-[9px] font-bold text-white">
                {station.priceTag}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  ● In-App Navigation
                </span>
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  {route.totalDurationMinutes} min walk ({formatDistance(route.totalDistanceMeters)})
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5 m-0">
                {station.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {station.address}
              </p>
            </div>
          </div>

          {/* Primary Action: One-touch Refill Here */}
          <div className="flex gap-2">
            <button
              onClick={() => onRefillAtStation(station)}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Droplet size={18} className="fill-white" />
              <span>Refill Bottle Here (+500 mL)</span>
            </button>
            <button
              onClick={onExitNavigation}
              className="py-3 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
            >
              End
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
