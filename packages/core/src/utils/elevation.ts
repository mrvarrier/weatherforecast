/**
 * Elevation utilities for mapping mountain elevations to atmospheric pressure levels
 * Critical for accurate summit weather forecasting
 */

export interface ElevationBand {
  name: string;
  elevation: number;
  pressureLevel: number;
  description: string;
}

/**
 * Calculate elevation bands for a peak (Base, Mid, Summit)
 * Base = 30% up from sea level
 * Mid = 65% up from sea level
 * Summit = peak elevation
 */
export function calculateElevationBands(summitElevation: number): ElevationBand[] {
  const baseElevation = Math.round(summitElevation * 0.3);
  const midElevation = Math.round(summitElevation * 0.65);

  return [
    {
      name: 'Base',
      elevation: baseElevation,
      pressureLevel: elevationToPressure(baseElevation),
      description: `Base Camp Area (${baseElevation}m)`,
    },
    {
      name: 'Mid',
      elevation: midElevation,
      pressureLevel: elevationToPressure(midElevation),
      description: `Mid-Mountain (${midElevation}m)`,
    },
    {
      name: 'Summit',
      elevation: summitElevation,
      pressureLevel: elevationToPressure(summitElevation),
      description: `Summit (${summitElevation}m)`,
    },
  ];
}

/**
 * Convert elevation to atmospheric pressure using barometric formula
 * P = P₀ × (1 - L×h/T₀)^(g×M/(R×L))
 * Where:
 * - P₀ = 1013.25 hPa (sea level pressure)
 * - L = 0.0065 K/m (temperature lapse rate)
 * - T₀ = 288.15 K (sea level standard temperature)
 * - g = 9.80665 m/s² (gravitational acceleration)
 * - M = 0.0289644 kg/mol (molar mass of air)
 * - R = 8.31447 J/(mol·K) (universal gas constant)
 */
export function elevationToPressure(elevationMeters: number): number {
  const P0 = 1013.25; // hPa
  const L = 0.0065; // K/m
  const T0 = 288.15; // K
  const g = 9.80665; // m/s²
  const M = 0.0289644; // kg/mol
  const R = 8.31447; // J/(mol·K)

  const exponent = (g * M) / (R * L);
  const pressure = P0 * Math.pow(1 - (L * elevationMeters) / T0, exponent);

  return Math.round(pressure);
}

/**
 * Find the nearest available pressure level from Open-Meteo API
 * Available levels: 1000, 925, 850, 800, 700, 600, 500, 400, 300, 200 hPa
 */
export function getNearestPressureLevel(targetPressure: number): number {
  const availableLevels = [1000, 925, 850, 800, 700, 600, 500, 400, 300, 200];

  let nearest = availableLevels[0] ?? 1000;
  let minDiff = Math.abs(targetPressure - nearest);

  for (const level of availableLevels) {
    const diff = Math.abs(targetPressure - level);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = level;
    }
  }

  return nearest;
}

/**
 * Get pressure level index in the API's levels array
 */
export function getPressureLevelIndex(pressureLevel: number): number {
  const levels = [200, 300, 400, 500, 600, 700, 800, 850, 925, 1000];
  return levels.indexOf(pressureLevel);
}

/**
 * Calculate approximate elevation for a given pressure level (inverse of elevationToPressure)
 * Useful for displaying altitude labels
 */
export function pressureToElevation(pressureHpa: number): number {
  const P0 = 1013.25; // hPa
  const L = 0.0065; // K/m
  const T0 = 288.15; // K
  const g = 9.80665; // m/s²
  const M = 0.0289644; // kg/mol
  const R = 8.31447; // J/(mol·K)

  const exponent = (R * L) / (g * M);
  const elevation = (T0 / L) * (1 - Math.pow(pressureHpa / P0, exponent));

  return Math.round(elevation);
}

/**
 * Format elevation band label with context
 */
export function formatElevationBandLabel(band: ElevationBand, showPressure = false): string {
  if (showPressure) {
    return `${band.name} (${band.elevation}m / ${band.pressureLevel}hPa)`;
  }
  return `${band.name} (${band.elevation}m)`;
}

/**
 * Determine if elevation data is critical based on peak height
 * Peaks > 2000m should always show elevation-specific forecasts
 */
export function isElevationCritical(summitElevation: number): boolean {
  return summitElevation > 2000;
}

/**
 * Get emoji indicator for elevation band
 */
export function getElevationEmoji(bandName: string): string {
  switch (bandName) {
    case 'Base':
      return '🏕️';
    case 'Mid':
      return '⛰️';
    case 'Summit':
      return '🗻';
    default:
      return '📍';
  }
}

/**
 * Extract weather data at a specific elevation from pressure level data
 * Falls back to surface data if pressure levels not available
 */
export function getWeatherAtElevation(
  pressureLevelData: number[][],
  pressureLevel: number,
  timeIndex: number,
  fallbackValue?: number
): number | undefined {
  if (!pressureLevelData || pressureLevelData.length === 0) {
    return fallbackValue;
  }

  const levelIndex = getPressureLevelIndex(pressureLevel);
  if (levelIndex === -1) {
    return fallbackValue;
  }

  const levelData = pressureLevelData[levelIndex];
  if (!levelData) {
    return fallbackValue;
  }

  return levelData[timeIndex] ?? fallbackValue;
}
