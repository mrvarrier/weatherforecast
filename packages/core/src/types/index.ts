// Location and Geocoding Types
export interface LocationResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  addedAt: string;
  customLabel?: string;
}

// Weather Data Types
export interface HourlyWeatherData {
  time: string[];
  temperature_2m: number[];
  relativehumidity_2m: number[];
  dewpoint_2m: number[];
  apparent_temperature: number[];
  precipitation: number[];
  snowfall: number[];
  snow_depth: number[];
  weathercode: number[];
  pressure_msl: number[];
  surface_pressure: number[];
  cloudcover: number[];
  cloudcover_low: number[];
  cloudcover_mid: number[];
  cloudcover_high: number[];
  visibility: number[];
  windspeed_10m: number[];
  windspeed_80m: number[];
  windspeed_120m: number[];
  windspeed_180m: number[];
  winddirection_10m: number[];
  windgusts_10m: number[];
  uv_index: number[];
  freezinglevel_height: number[];
  cape: number[];
  lifted_index: number[];
  precipitation_probability: number[];
  showers: number[];
  snowfall_water_equivalent: number[];
}

export interface PressureLevelData {
  temperature: number[][];
  windspeed: number[][];
  winddirection: number[][];
  geopotential_height: number[][];
  relativehumidity: number[][];
  cloudcover: number[][];
}

export interface ForecastData {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  hourly: HourlyWeatherData;
  pressure_levels: {
    levels: number[]; // [200, 300, 400, 500, 600, 700, 800, 850, 925, 1000]
    data: PressureLevelData;
  };
}

export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipProbability: number;
  windSpeed: number;
  windDirection: number;
  snowAccumulation: number;
  weatherCode: number;
  uvIndex: number;
}

// Elevation Profile Types
export interface ElevationBand {
  elevation: number;
  label: string;
  pressureLevel: number; // nearest pressure level in hPa
}

// Safety Score Types
export interface SafetyFactors {
  windPenalty: number;
  precipPenalty: number;
  visibilityPenalty: number;
  temperaturePenalty: number;
  capePenalty: number;
  freezingLevelBonus: number;
}

export interface SafetyScore {
  score: number; // 0-100
  rating: 'AVOID' | 'CAUTION' | 'GOOD' | 'OPTIMAL';
  factors: SafetyFactors;
  timestamp: string;
}

export interface BestSummitWindow {
  score: SafetyScore;
  startTime: string;
  endTime: string;
}

// Avalanche Risk Types
export interface AvalancheProblem {
  type: string;
  elevationLow?: number;
  elevationHigh?: number;
  aspects?: string[];
}

export interface AvalancheBulletin {
  regionId: string;
  regionName: string;
  dangerLevel: 1 | 2 | 3 | 4 | 5;
  validFrom: string;
  validUntil: string;
  problems: AvalancheProblem[];
  highlights?: string;
  bulletinUrl?: string;
}

// Unit Types
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindSpeedUnit = 'kmh' | 'mph' | 'ms';
export type PrecipitationUnit = 'mm' | 'inches';
export type ElevationUnit = 'meters' | 'feet';
export type VisibilityUnit = 'km' | 'miles';
export type PressureUnit = 'hpa' | 'inhg';

export interface UnitPreferences {
  temperature: TemperatureUnit;
  windSpeed: WindSpeedUnit;
  precipitation: PrecipitationUnit;
  elevation: ElevationUnit;
  visibility: VisibilityUnit;
  pressure: PressureUnit;
}

// API Response Types
export interface GeocodingApiResponse {
  results?: LocationResult[];
}

export interface ElevationApiResponse {
  elevation: number[];
}

export interface ForecastApiOptions {
  model?: 'best_match' | 'ecmwf_ifs04';
  forecastDays?: number;
}

// Featured Peak Type
export interface FeaturedPeak {
  id: string;
  name: string;
  elevation: number;
  latitude: number;
  longitude: number;
  country: string;
  range: string;
  prominence?: number;
  firstAscent?: number;
  imageUrl?: string;
}

// Weather Model Comparison Types
export interface ModelComparison {
  timestamp: string;
  bestMatch: number;
  ecmwf: number;
  difference: number;
  variable: string;
}

export interface ModelAgreement {
  overall: number; // 0-100 percentage
  temperature: number;
  wind: number;
  precipitation: number;
}
