// Export all types
export * from './types';

// Export WeatherService
export { WeatherService, weatherService } from './services/WeatherService';

// Export unit conversion utilities
export {
  convertTemp,
  convertWind,
  convertPrecip,
  convertElev,
  convertVisibility,
  convertPressure,
  formatTemp,
  formatWind,
  formatPrecip,
  formatElev,
  formatVisibility,
  formatPressure,
} from './utils/units';

// Export safety score utilities
export {
  computeSafetyScore,
  getBestSummitWindow,
  computeSafetyTimeline,
  getSafetyRatingColor,
  getSafetyRatingLabel,
} from './utils/safetyScore';

// Export elevation utilities
export {
  calculateElevationBands,
  elevationToPressure,
  getNearestPressureLevel,
  getPressureLevelIndex,
  pressureToElevation,
  formatElevationBandLabel,
  isElevationCritical,
  getElevationEmoji,
  getWeatherAtElevation,
} from './utils/elevation';

export type { ElevationBand } from './utils/elevation';

// Export weather utilities
export {
  getWeatherCondition,
  calculateWindChill,
  getTempColor,
  getWindDirectionArrow,
  getTimePeriodName,
  calculateSunTimes,
  WEATHER_CODES,
} from './utils/weather';

export type { WeatherCondition } from './utils/weather';

// Export featured peaks data
import FEATURED_PEAKS_DATA from './data/featuredPeaks.json';
import type { FeaturedPeak } from './types';

export const FEATURED_PEAKS: FeaturedPeak[] = FEATURED_PEAKS_DATA as FeaturedPeak[];
