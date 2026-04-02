import type {
  TemperatureUnit,
  WindSpeedUnit,
  PrecipitationUnit,
  ElevationUnit,
  VisibilityUnit,
  PressureUnit,
} from '../types';

/**
 * Convert temperature between Celsius and Fahrenheit
 */
export function convertTemp(
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit
): number {
  if (from === to) return value;

  if (from === 'celsius' && to === 'fahrenheit') {
    return (value * 9) / 5 + 32;
  }

  if (from === 'fahrenheit' && to === 'celsius') {
    return ((value - 32) * 5) / 9;
  }

  return value;
}

/**
 * Convert wind speed between km/h, mph, and m/s
 */
export function convertWind(value: number, from: WindSpeedUnit, to: WindSpeedUnit): number {
  if (from === to) return value;

  // Convert to km/h first (base unit)
  let kmh: number;
  if (from === 'kmh') {
    kmh = value;
  } else if (from === 'mph') {
    kmh = value * 1.60934;
  } else if (from === 'ms') {
    kmh = value * 3.6;
  } else {
    return value;
  }

  // Convert from km/h to target unit
  if (to === 'kmh') {
    return kmh;
  } else if (to === 'mph') {
    return kmh / 1.60934;
  } else if (to === 'ms') {
    return kmh / 3.6;
  }

  return value;
}

/**
 * Convert precipitation between mm and inches
 */
export function convertPrecip(
  value: number,
  from: PrecipitationUnit,
  to: PrecipitationUnit
): number {
  if (from === to) return value;

  if (from === 'mm' && to === 'inches') {
    return value / 25.4;
  }

  if (from === 'inches' && to === 'mm') {
    return value * 25.4;
  }

  return value;
}

/**
 * Convert elevation between meters and feet
 */
export function convertElev(value: number, from: ElevationUnit, to: ElevationUnit): number {
  if (from === to) return value;

  if (from === 'meters' && to === 'feet') {
    return value * 3.28084;
  }

  if (from === 'feet' && to === 'meters') {
    return value / 3.28084;
  }

  return value;
}

/**
 * Convert visibility between km and miles
 */
export function convertVisibility(
  value: number,
  from: VisibilityUnit,
  to: VisibilityUnit
): number {
  if (from === to) return value;

  if (from === 'km' && to === 'miles') {
    return value / 1.60934;
  }

  if (from === 'miles' && to === 'km') {
    return value * 1.60934;
  }

  return value;
}

/**
 * Convert pressure between hPa and inHg
 */
export function convertPressure(value: number, from: PressureUnit, to: PressureUnit): number {
  if (from === to) return value;

  if (from === 'hpa' && to === 'inhg') {
    return value / 33.8639;
  }

  if (from === 'inhg' && to === 'hpa') {
    return value * 33.8639;
  }

  return value;
}

/**
 * Format temperature with unit label
 */
export function formatTemp(value: number, unit: TemperatureUnit, decimals = 1): string {
  const formatted = value.toFixed(decimals);
  return unit === 'celsius' ? `${formatted}°C` : `${formatted}°F`;
}

/**
 * Format wind speed with unit label
 */
export function formatWind(value: number, unit: WindSpeedUnit, decimals = 1): string {
  const formatted = value.toFixed(decimals);
  if (unit === 'kmh') return `${formatted} km/h`;
  if (unit === 'mph') return `${formatted} mph`;
  if (unit === 'ms') return `${formatted} m/s`;
  return formatted;
}

/**
 * Format precipitation with unit label
 */
export function formatPrecip(value: number, unit: PrecipitationUnit, decimals = 1): string {
  const formatted = value.toFixed(decimals);
  return unit === 'mm' ? `${formatted} mm` : `${formatted} in`;
}

/**
 * Format elevation with unit label
 */
export function formatElev(value: number, unit: ElevationUnit, decimals = 0): string {
  const formatted = value.toFixed(decimals);
  return unit === 'meters' ? `${formatted} m` : `${formatted} ft`;
}

/**
 * Format visibility with unit label
 */
export function formatVisibility(value: number, unit: VisibilityUnit, decimals = 1): string {
  const formatted = value.toFixed(decimals);
  return unit === 'km' ? `${formatted} km` : `${formatted} mi`;
}

/**
 * Format pressure with unit label
 */
export function formatPressure(value: number, unit: PressureUnit, decimals = 1): string {
  const formatted = value.toFixed(decimals);
  return unit === 'hpa' ? `${formatted} hPa` : `${formatted} inHg`;
}
