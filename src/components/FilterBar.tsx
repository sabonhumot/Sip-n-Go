import type { FC } from 'react';
import { Search, Check } from './Icons';
import type { FilterOptions } from '../types';

interface FilterBarProps {
  filters: FilterOptions;
  onChangeFilters: (newFilters: Partial<FilterOptions>) => void;
  stationCount: number;
  activeView: 'both' | 'map' | 'list';
  onToggleView: (view: 'both' | 'map' | 'list') => void;
}

export const FilterBar: FC<FilterBarProps> = ({
  filters,
  onChangeFilters,
  stationCount,
  activeView,
  onToggleView,
}) => {
  return (
    <div className="w-full space-y-3">
      {/* Search Bar & View switcher */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChangeFilters({ searchQuery: e.target.value })}
            placeholder="Search stations by name, street, or feature..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-sm"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChangeFilters({ searchQuery: '' })}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* View toggles for tablet/mobile */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <button
            onClick={() => onToggleView('both')}
            className={`hidden md:block px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'both'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => onToggleView('map')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'map'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => onToggleView('list')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'list'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            List ({stationCount})
          </button>
        </div>
      </div>

      {/* Filter Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        {/* Free Only Toggle */}
        <button
          onClick={() => onChangeFilters({ onlyFree: !filters.onlyFree })}
          className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            filters.onlyFree
              ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm shadow-cyan-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          {filters.onlyFree && <Check size={12} />}
          <span>Free Stations Only</span>
        </button>

        {/* Chilled Toggle */}
        <button
          onClick={() => onChangeFilters({ onlyChilled: !filters.onlyChilled })}
          className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            filters.onlyChilled
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          {filters.onlyChilled && <Check size={12} />}
          <span>❄️ Chilled Water</span>
        </button>

        {/* Sparkling Toggle */}
        <button
          onClick={() => onChangeFilters({ onlySparkling: !filters.onlySparkling })}
          className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            filters.onlySparkling
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          {filters.onlySparkling && <Check size={12} />}
          <span>✨ Sparkling</span>
        </button>

        {/* Open Now Toggle */}
        <button
          onClick={() => onChangeFilters({ onlyOpen: !filters.onlyOpen })}
          className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            filters.onlyOpen
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          {filters.onlyOpen && <Check size={12} />}
          <span>🟢 Open Now</span>
        </button>

        {/* Sort Selection */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <span>Sort:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onChangeFilters({ sortBy: e.target.value as any })}
            className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="distance" className="dark:bg-slate-800">Nearest First</option>
            <option value="rating" className="dark:bg-slate-800">Highest Rated</option>
          </select>
        </div>
      </div>
    </div>
  );
};
