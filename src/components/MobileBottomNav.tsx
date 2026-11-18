import type { FC } from 'react';
import { MapPin, Droplet, QrCode, Sparkles } from './Icons';

export type MobileTab = 'explore' | 'bottle' | 'quickRefill' | 'qr';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  intakePercent: number;
}

export const MobileBottomNav: FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  intakePercent,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shadow-2xl pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {/* Tab 1: Explore Map */}
        <button
          onClick={() => onChangeTab('explore')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all cursor-pointer ${
            activeTab === 'explore'
              ? 'text-cyan-600 dark:text-cyan-400 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <MapPin size={22} className={activeTab === 'explore' ? 'stroke-[2.5]' : 'stroke-2'} />
            {activeTab === 'explore' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Explore</span>
        </button>

        {/* Tab 2: My Bottle */}
        <button
          onClick={() => onChangeTab('bottle')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all cursor-pointer ${
            activeTab === 'bottle'
              ? 'text-cyan-600 dark:text-cyan-400 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative flex items-center justify-center">
            {/* Miniature animated bottle icon */}
            <div className="w-4 h-6 rounded border border-current flex flex-col justify-end p-0.5 overflow-hidden">
              <div
                className="w-full bg-cyan-500 rounded-xs transition-all"
                style={{ height: `${Math.min(100, intakePercent)}%` }}
              ></div>
            </div>
            {activeTab === 'bottle' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">My Bottle</span>
        </button>

        {/* Center Action: Quick Refill Floating Action Button */}
        <div className="relative -top-4 flex items-center justify-center px-1">
          <button
            onClick={() => onChangeTab('quickRefill')}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/35 flex items-center justify-center transition-all transform active:scale-95 cursor-pointer ring-4 ring-white dark:ring-slate-900"
            title="Instant 1-Tap Refill"
          >
            <Droplet size={24} className="fill-white" />
          </button>
        </div>

        {/* Tab 3: Bottle QR */}
        <button
          onClick={() => onChangeTab('qr')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all cursor-pointer ${
            activeTab === 'qr'
              ? 'text-cyan-600 dark:text-cyan-400 scale-105 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <QrCode size={22} className={activeTab === 'qr' ? 'stroke-[2.5]' : 'stroke-2'} />
            {activeTab === 'qr' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Bottle QR</span>
        </button>

        {/* Tab 4: Perks / Eco */}
        <button
          onClick={() => onChangeTab('bottle')}
          className="flex flex-col items-center justify-center flex-1 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
        >
          <div className="relative">
            <Sparkles size={22} />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Eco Stats</span>
        </button>
      </div>
    </nav>
  );
};
