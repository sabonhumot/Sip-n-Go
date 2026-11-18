export type WaterType = 'Chilled' | 'Filtered' | 'Ambient' | 'Sparkling' | 'Alkaline' | 'UV-C Purified';

export interface StationMetrics {
  tds: number; // Total Dissolved Solids in ppm
  ph: number;  // pH level
  tempC: number; // Water temperature in Celsius at station
}

export interface RefillStation {
  id: string;
  name: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  distanceMeters?: number;
  waterTypes: WaterType[];
  isFree: boolean;
  priceTag: string;
  rating: number;
  reviewCount: number;
  openingHours: string;
  isOpen: boolean;
  indoorOutdoor: 'Indoor' | 'Outdoor';
  accessibility: boolean;
  hasBottleRinse: boolean;
  status: 'Operational' | 'Low Pressure' | 'Maintenance';
  lastCleaned: string;
  metrics: StationMetrics;
  image: string;
  verified: boolean;
  tags: string[];
}

export interface BottleData {
  id: string;
  name: string;
  ownerName: string;
  model: string;
  material: string;
  colorName: string;
  capacityMl: number;
  lastRefillTime: string;
  refillsToday: number;
  dailyGoalMl: number;
  currentIntakeMl: number;
  plasticBottlesSaved: number;
  co2SavedKg: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  city?: string;
  isSimulated: boolean;
}

export interface FilterOptions {
  onlyFree: boolean;
  onlyChilled: boolean;
  onlySparkling: boolean;
  onlyOpen: boolean;
  maxDistanceKm: number;
  searchQuery: string;
  sortBy: 'distance' | 'rating';
}
