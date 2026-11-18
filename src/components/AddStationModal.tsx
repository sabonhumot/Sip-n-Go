import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, Check } from './Icons';
import type { RefillStation, WaterType, UserLocation } from '../types';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation;
  onAddStation: (station: RefillStation) => void;
}

export const AddStationModal: React.FC<AddStationModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  onAddStation,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [useCurrentLocation] = useState(true);
  const [isFree, setIsFree] = useState(true);
  const [waterTypes, setWaterTypes] = useState<WaterType[]>(['Filtered', 'Chilled']);
  const [indoorOutdoor, setIndoorOutdoor] = useState<'Indoor' | 'Outdoor'>('Outdoor');

  if (!isOpen) return null;

  const toggleWaterType = (type: WaterType) => {
    if (waterTypes.includes(type)) {
      if (waterTypes.length > 1) {
        setWaterTypes(waterTypes.filter((t) => t !== type));
      }
    } else {
      setWaterTypes([...waterTypes, type]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const lat = useCurrentLocation ? userLocation.lat + 0.0003 : userLocation.lat;
    const lng = useCurrentLocation ? userLocation.lng + 0.0003 : userLocation.lng;

    const newStation: RefillStation = {
      id: `station-user-${Date.now()}`,
      name: name.trim(),
      description: 'Community-verified water station recently added by a Sip n Go user.',
      address: address.trim() || 'Nearby Street Walkway',
      lat,
      lng,
      distanceMeters: 45,
      waterTypes,
      isFree,
      priceTag: isFree ? 'Free' : '$0.25',
      rating: 5.0,
      reviewCount: 1,
      openingHours: '24/7',
      isOpen: true,
      indoorOutdoor,
      accessibility: true,
      hasBottleRinse: true,
      status: 'Operational',
      lastCleaned: 'Just now',
      metrics: { tds: 40, ph: 7.4, tempC: 6 },
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
      verified: true,
      tags: ['Community Added', 'Newly Reported'],
    };

    onAddStation(newStation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-100 dark:border-slate-800 overflow-hidden text-left max-h-[88vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-20 w-12 h-1.5 rounded-full bg-white/70"></div>
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
          >
            <X size={18} />
          </button>
          <h2 className="text-xl font-bold text-white m-0">Add a Water Station</h2>
          <p className="text-cyan-100 text-xs mt-1">
            Help the Sip n Go community find hydration by sharing a refilling spot.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Station Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunny Park South Water Tower"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Address / Location Note
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Next to running track bench #3"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Available Water Types
            </label>
            <div className="flex flex-wrap gap-2">
              {(['Filtered', 'Chilled', 'Ambient', 'Sparkling', 'Alkaline', 'UV-C Purified'] as WaterType[]).map(
                (type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => toggleWaterType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                      waterTypes.includes(type)
                        ? 'bg-cyan-500 text-white border-cyan-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {waterTypes.includes(type) && <Check size={12} />}
                    {type}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Environment
              </label>
              <select
                value={indoorOutdoor}
                onChange={(e) => setIndoorOutdoor(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="Outdoor">Outdoor</option>
                <option value="Indoor">Indoor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Access
              </label>
              <select
                value={isFree ? 'Free' : 'Paid'}
                onChange={(e) => setIsFree(e.target.value === 'Free')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="Free">100% Free</option>
                <option value="Paid">Nominal Fee / Paid</option>
              </select>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-md shadow-cyan-500/25 hover:from-cyan-600 hover:to-blue-700 transition-all cursor-pointer"
            >
              Submit & Add Station
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
