/**
 * Weather utilities for interpreting WMO weather codes and conditions
 */

export interface WeatherCondition {
  description: string;
  shortDesc: string;
  icon: string;
  category: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm';
}

/**
 * WMO Weather interpretation codes (WW)
 * Source: https://open-meteo.com/en/docs
 */
export const WEATHER_CODES: Record<number, WeatherCondition> = {
  0: { description: 'Clear sky', shortDesc: 'clear', icon: '☀️', category: 'clear' },
  1: { description: 'Mainly clear', shortDesc: 'clear', icon: '🌤️', category: 'clear' },
  2: { description: 'Partly cloudy', shortDesc: 'some clouds', icon: '⛅', category: 'cloudy' },
  3: { description: 'Overcast', shortDesc: 'cloudy', icon: '☁️', category: 'cloudy' },
  45: { description: 'Fog', shortDesc: 'fog', icon: '🌫️', category: 'cloudy' },
  48: { description: 'Depositing rime fog', shortDesc: 'rime fog', icon: '🌫️', category: 'cloudy' },
  51: { description: 'Light drizzle', shortDesc: 'drizzle', icon: '🌦️', category: 'rain' },
  53: { description: 'Moderate drizzle', shortDesc: 'drizzle', icon: '🌦️', category: 'rain' },
  55: { description: 'Dense drizzle', shortDesc: 'drizzle', icon: '🌧️', category: 'rain' },
  56: { description: 'Light freezing drizzle', shortDesc: 'frz drizzle', icon: '🌧️', category: 'rain' },
  57: { description: 'Dense freezing drizzle', shortDesc: 'frz drizzle', icon: '🌧️', category: 'rain' },
  61: { description: 'Slight rain', shortDesc: 'light rain', icon: '🌧️', category: 'rain' },
  63: { description: 'Moderate rain', shortDesc: 'rain', icon: '🌧️', category: 'rain' },
  65: { description: 'Heavy rain', shortDesc: 'heavy rain', icon: '🌧️', category: 'rain' },
  66: { description: 'Light freezing rain', shortDesc: 'frz rain', icon: '🌧️', category: 'rain' },
  67: { description: 'Heavy freezing rain', shortDesc: 'frz rain', icon: '🌧️', category: 'rain' },
  71: { description: 'Slight snow fall', shortDesc: 'snow shwrs', icon: '🌨️', category: 'snow' },
  73: { description: 'Moderate snow fall', shortDesc: 'snow', icon: '🌨️', category: 'snow' },
  75: { description: 'Heavy snow fall', shortDesc: 'heavy snow', icon: '❄️', category: 'snow' },
  77: { description: 'Snow grains', shortDesc: 'snow grains', icon: '🌨️', category: 'snow' },
  80: { description: 'Slight rain showers', shortDesc: 'rain shwrs', icon: '🌦️', category: 'rain' },
  81: { description: 'Moderate rain showers', shortDesc: 'rain shwrs', icon: '🌧️', category: 'rain' },
  82: { description: 'Violent rain showers', shortDesc: 'rain shwrs', icon: '⛈️', category: 'storm' },
  85: { description: 'Slight snow showers', shortDesc: 'snow shwrs', icon: '🌨️', category: 'snow' },
  86: { description: 'Heavy snow showers', shortDesc: 'snow shwrs', icon: '❄️', category: 'snow' },
  95: { description: 'Thunderstorm', shortDesc: 'storm', icon: '⛈️', category: 'storm' },
  96: { description: 'Thunderstorm with slight hail', shortDesc: 'storm', icon: '⛈️', category: 'storm' },
  99: { description: 'Thunderstorm with heavy hail', shortDesc: 'storm', icon: '⛈️', category: 'storm' },
};

/**
 * Get weather condition from WMO code
 */
export function getWeatherCondition(code: number): WeatherCondition {
  return (
    WEATHER_CODES[code] || {
      description: 'Unknown',
      shortDesc: 'unknown',
      icon: '❓',
      category: 'cloudy',
    }
  );
}

/**
 * Calculate wind chill temperature (feels like with wind)
 * Formula: Wind Chill (°C) = 13.12 + 0.6215T - 11.37V^0.16 + 0.3965TV^0.16
 * Where T = air temp in °C, V = wind speed in km/h
 */
export function calculateWindChill(tempCelsius: number, windSpeedKmh: number): number {
  if (windSpeedKmh < 5) {
    return tempCelsius; // No wind chill at low speeds
  }

  const windChill =
    13.12 +
    0.6215 * tempCelsius -
    11.37 * Math.pow(windSpeedKmh, 0.16) +
    0.3965 * tempCelsius * Math.pow(windSpeedKmh, 0.16);

  return Math.round(windChill);
}

/**
 * Get temperature color for visual coding
 */
export function getTempColor(tempCelsius: number): string {
  if (tempCelsius <= -30) return 'bg-purple-700 text-white';
  if (tempCelsius <= -20) return 'bg-purple-600 text-white';
  if (tempCelsius <= -15) return 'bg-purple-500 text-white';
  if (tempCelsius <= -10) return 'bg-blue-700 text-white';
  if (tempCelsius <= -5) return 'bg-blue-600 text-white';
  if (tempCelsius <= 0) return 'bg-blue-500 text-white';
  if (tempCelsius <= 5) return 'bg-cyan-400 text-slate-900';
  if (tempCelsius <= 10) return 'bg-cyan-300 text-slate-900';
  if (tempCelsius <= 15) return 'bg-yellow-200 text-slate-900';
  if (tempCelsius <= 20) return 'bg-yellow-300 text-slate-900';
  if (tempCelsius <= 25) return 'bg-orange-300 text-slate-900';
  return 'bg-orange-400 text-slate-900';
}

/**
 * Get wind direction arrow
 */
export function getWindDirectionArrow(degrees: number): string {
  const directions = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index] ?? '→';
}

/**
 * Get time period name
 */
export function getTimePeriodName(hour: number): 'AM' | 'PM' | 'night' {
  if (hour >= 6 && hour < 12) return 'AM';
  if (hour >= 12 && hour < 18) return 'PM';
  return 'night';
}

/**
 * Calculate sunrise and sunset times
 * Simplified calculation - for production use a library like suncalc
 */
export function calculateSunTimes(
  latitude: number,
  longitude: number,
  date: Date
): { sunrise: string; sunset: string } {
  // This is a placeholder - in production, use proper astronomical calculations
  // For now, return approximate times based on latitude
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );

  // Simplified calculation
  const sunriseHour = 6 + Math.sin((dayOfYear / 365) * 2 * Math.PI) * 2;
  const sunsetHour = 18 - Math.sin((dayOfYear / 365) * 2 * Math.PI) * 2;

  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  return {
    sunrise: formatTime(sunriseHour),
    sunset: formatTime(sunsetHour),
  };
}
