import { useMemo, useState } from 'react';
import type { ForecastData, ElevationBand } from '../../../../packages/core/src/index';
import {
  getWeatherAtElevation,
  getWeatherCondition,
  getTempColor,
  getWindDirectionArrow,
  calculateWindChill,
  getTimePeriodName,
  calculateSunTimes,
  estimateTempAtElevation,
  estimateWindAtElevation,
} from '../../../../packages/core/src/index';
import ElevationProfileChart from './ElevationProfileChart';

type UnitSystem = 'metric' | 'imperial';

interface DetailedForecastTableProps {
  forecast: ForecastData;
  selectedBand: ElevationBand;
}

interface TimePeriodData {
  hour: number;
  time: string;
  temp: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  precipitation: number;
  precipProb: number;
  visibility: number;
  freezingLevel: number;
  cloudCover: number;
}

interface DayForecast {
  date: string;
  dayName: string;
  dateNum: number;
  AM: TimePeriodData[];
  PM: TimePeriodData[];
  night: TimePeriodData[];
}

export default function DetailedForecastTable({
  forecast,
  selectedBand,
}: DetailedForecastTableProps) {
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [daysToShow, setDaysToShow] = useState<6 | 10 | 16>(6);

  // Unit conversion functions
  const convertTemp = (celsius: number) => {
    if (units === 'imperial') {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  };

  const convertWind = (kmh: number) => {
    if (units === 'imperial') {
      return Math.round(kmh * 0.621371); // km/h to mph
    }
    return Math.round(kmh);
  };

  const convertPrecip = (mm: number) => {
    if (units === 'imperial') {
      return (mm * 0.0393701).toFixed(1); // mm to inches
    }
    return Math.round(mm);
  };

  const convertElevation = (meters: number) => {
    if (units === 'imperial') {
      return Math.round(meters * 3.28084); // meters to feet
    }
    return meters;
  };

  const tempUnit = units === 'imperial' ? '°F' : '°C';
  const windUnit = units === 'imperial' ? 'mph' : 'km/h';
  const precipUnit = units === 'imperial' ? 'in' : 'mm';
  const elevUnit = units === 'imperial' ? 'ft' : 'm';

  // Get temperature color - always uses Celsius internally
  const getTempColorForDisplay = (celsius: number) => getTempColor(celsius);

  const dailyData = useMemo(() => {
    const days: DayForecast[] = [];
    const dayMap = new Map<string, DayForecast>();

    forecast.hourly.time.forEach((timeStr, idx) => {
      const date = new Date(timeStr);
      const dateKey = date.toISOString().split('T')[0] ?? '';
      const hour = date.getHours();
      const period = getTimePeriodName(hour);

      // Get weather at elevation - use estimation if pressure data unavailable
      const surfaceTemp = forecast.hourly.temperature_2m[idx] ?? 0;
      const surfaceWind = forecast.hourly.windspeed_10m[idx] ?? 0;

      // Try to get pressure level data first, fall back to estimation
      const tempFromPressure = getWeatherAtElevation(
        forecast.pressure_levels.data.temperature,
        selectedBand.pressureLevel,
        idx,
        undefined
      );

      const windFromPressure = getWeatherAtElevation(
        forecast.pressure_levels.data.windspeed,
        selectedBand.pressureLevel,
        idx,
        undefined
      );

      // Use pressure data if available, otherwise estimate based on elevation
      const temp =
        tempFromPressure !== undefined
          ? tempFromPressure
          : estimateTempAtElevation(surfaceTemp, forecast.elevation, selectedBand.elevation);

      const windSpeed =
        windFromPressure !== undefined
          ? windFromPressure
          : estimateWindAtElevation(surfaceWind, forecast.elevation, selectedBand.elevation);

      const periodData: TimePeriodData = {
        hour,
        time: timeStr,
        temp,
        windSpeed,
        windDirection: forecast.hourly.winddirection_10m[idx] ?? 0,
        weatherCode: forecast.hourly.weathercode[idx] ?? 0,
        precipitation: forecast.hourly.precipitation[idx] ?? 0,
        precipProb: forecast.hourly.precipitation_probability[idx] ?? 0,
        visibility: forecast.hourly.visibility[idx] ?? 10000,
        freezingLevel: forecast.hourly.freezinglevel_height[idx] ?? 0,
        cloudCover: forecast.hourly.cloudcover[idx] ?? 0,
      };

      if (!dayMap.has(dateKey)) {
        const dayDate = new Date(dateKey);
        dayMap.set(dateKey, {
          date: dateKey,
          dayName: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
          dateNum: dayDate.getDate(),
          AM: [],
          PM: [],
          night: [],
        });
      }

      dayMap.get(dateKey)?.[period].push(periodData);
    });

    dayMap.forEach((day) => days.push(day));

    return days.slice(0, daysToShow);
  }, [forecast, selectedBand, daysToShow]);

  // Get representative data for each period (midpoint)
  const getRepresentative = (periods: TimePeriodData[]) => {
    if (periods.length === 0) return null;
    const midIdx = Math.floor(periods.length / 2);
    return periods[midIdx];
  };

  // Get max/min for period
  const getMaxTemp = (periods: TimePeriodData[]) =>
    periods.length > 0 ? Math.max(...periods.map((p) => p.temp)) : 0;
  const getMinTemp = (periods: TimePeriodData[]) =>
    periods.length > 0 ? Math.min(...periods.map((p) => p.temp)) : 0;
  const getTotalPrecip = (periods: TimePeriodData[]) =>
    periods.reduce((sum, p) => sum + p.precipitation, 0);

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Detailed Forecast</h3>
          <p className="text-sm text-slate-600">
            {selectedBand.name} Elevation ({convertElevation(selectedBand.elevation).toLocaleString()}
            {elevUnit})
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md overflow-hidden border border-slate-300">
            <button
              onClick={() => setDaysToShow(6)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                daysToShow === 6 ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              6d
            </button>
            <button
              onClick={() => setDaysToShow(10)}
              className={`px-3 py-1 text-xs font-medium transition-colors border-x border-slate-300 ${
                daysToShow === 10 ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              10d
            </button>
            <button
              onClick={() => setDaysToShow(16)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                daysToShow === 16 ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              16d
            </button>
          </div>
          <button
            onClick={() => setUnits(units === 'metric' ? 'imperial' : 'metric')}
            className="px-3 py-1 text-sm font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {units === 'metric' ? '°C | km/h' : '°F | mph'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="min-w-full border-collapse text-sm">
          {/* Header Row */}
          <thead>
            <tr>
              <th className="sticky left-0 bg-white z-10 p-2 text-left text-xs font-semibold text-slate-600 border-r border-slate-200">
                {/* Change units button */}
              </th>
              {dailyData.map((day) => (
                <th
                  key={day.date}
                  colSpan={3}
                  className="border-x border-slate-200 bg-slate-50 p-2 text-center"
                >
                  <div className="font-bold text-slate-900">
                    {day.dayName} {day.dateNum}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 bg-white z-10 p-2 text-xs text-slate-500 border-r border-slate-200"></th>
              {dailyData.map((day) => (
                <>
                  <th
                    key={`${day.date}-am`}
                    className="border-x border-slate-200 bg-white p-1 text-center text-xs font-semibold text-slate-600"
                  >
                    AM
                  </th>
                  <th
                    key={`${day.date}-pm`}
                    className="border-x border-slate-200 bg-white p-1 text-center text-xs font-semibold text-slate-600"
                  >
                    PM
                  </th>
                  <th
                    key={`${day.date}-night`}
                    className="border-l-2 border-l-slate-400 border-x border-slate-200 bg-white p-1 text-center text-xs font-semibold text-slate-600"
                  >
                    night
                  </th>
                </>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Weather Icon Row */}
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200"></td>
              {dailyData.map((day) => (
                <>
                  <td key={`${day.date}-am-icon`} className="border border-slate-200 p-2 text-center text-3xl">
                    {getRepresentative(day.AM) && getWeatherCondition(getRepresentative(day.AM)!.weatherCode).icon}
                  </td>
                  <td key={`${day.date}-pm-icon`} className="border border-slate-200 p-2 text-center text-3xl">
                    {getRepresentative(day.PM) && getWeatherCondition(getRepresentative(day.PM)!.weatherCode).icon}
                  </td>
                  <td key={`${day.date}-night-icon`} className="border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-3xl">
                    {getRepresentative(day.night) && getWeatherCondition(getRepresentative(day.night)!.weatherCode).icon}
                  </td>
                </>
              ))}
            </tr>

            {/* Weather Description Row */}
            <tr>
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200"></td>
              {dailyData.map((day) => (
                <>
                  <td key={`${day.date}-am-desc`} className="border border-slate-200 p-2 text-center text-xs">
                    {getRepresentative(day.AM) && getWeatherCondition(getRepresentative(day.AM)!.weatherCode).shortDesc}
                  </td>
                  <td key={`${day.date}-pm-desc`} className="border border-slate-200 p-2 text-center text-xs">
                    {getRepresentative(day.PM) && getWeatherCondition(getRepresentative(day.PM)!.weatherCode).shortDesc}
                  </td>
                  <td key={`${day.date}-night-desc`} className="border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-xs">
                    {getRepresentative(day.night) && getWeatherCondition(getRepresentative(day.night)!.weatherCode).shortDesc}
                  </td>
                </>
              ))}
            </tr>

            {/* Wind Row */}
            <tr className="border-t border-slate-300">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                Wind {windUnit}
              </td>
              {dailyData.map((day) => (
                <>
                  <td key={`${day.date}-am-wind`} className="border border-slate-200 p-2 text-center">
                    {getRepresentative(day.AM) && (
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm">
                        {convertWind(getRepresentative(day.AM)!.windSpeed)}
                        <span className="text-xs ml-0.5">{getWindDirectionArrow(getRepresentative(day.AM)!.windDirection)}</span>
                      </div>
                    )}
                  </td>
                  <td key={`${day.date}-pm-wind`} className="border border-slate-200 p-2 text-center">
                    {getRepresentative(day.PM) && (
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm">
                        {convertWind(getRepresentative(day.PM)!.windSpeed)}
                        <span className="text-xs ml-0.5">{getWindDirectionArrow(getRepresentative(day.PM)!.windDirection)}</span>
                      </div>
                    )}
                  </td>
                  <td key={`${day.date}-night-wind`} className="border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center">
                    {getRepresentative(day.night) && (
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm">
                        {convertWind(getRepresentative(day.night)!.windSpeed)}
                        <span className="text-xs ml-0.5">{getWindDirectionArrow(getRepresentative(day.night)!.windDirection)}</span>
                      </div>
                    )}
                  </td>
                </>
              ))}
            </tr>

            {/* Wind Gusts Row */}
            <tr>
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                Gusts {windUnit}
              </td>
              {dailyData.map((day) => {
                const amData = getRepresentative(day.AM);
                const pmData = getRepresentative(day.PM);
                const nightData = getRepresentative(day.night);

                return (
                  <>
                    <td key={`${day.date}-am-gust`} className="border border-slate-200 p-2 text-center text-xs text-red-700 font-semibold">
                      {amData && convertWind(forecast.hourly.windgusts_10m[forecast.hourly.time.indexOf(amData.time)] ?? 0)}
                    </td>
                    <td key={`${day.date}-pm-gust`} className="border border-slate-200 p-2 text-center text-xs text-red-700 font-semibold">
                      {pmData && convertWind(forecast.hourly.windgusts_10m[forecast.hourly.time.indexOf(pmData.time)] ?? 0)}
                    </td>
                    <td key={`${day.date}-night-gust`} className="border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-xs text-red-700 font-semibold">
                      {nightData && convertWind(forecast.hourly.windgusts_10m[forecast.hourly.time.indexOf(nightData.time)] ?? 0)}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Snow Row */}
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                ❄️ {units === 'imperial' ? 'in' : 'cm'}
              </td>
              {dailyData.map((day) => {
                const amSnow = getTotalPrecip(day.AM);
                const pmSnow = getTotalPrecip(day.PM);
                const nightSnow = getTotalPrecip(day.night);
                const avgTemp = (getMaxTemp(day.AM) + getMinTemp(day.AM)) / 2;

                // Convert to cm or inches
                const formatSnow = (mm: number) => {
                  if (units === 'imperial') {
                    return (mm * 10 * 0.393701).toFixed(1); // mm to cm to inches
                  }
                  return Math.round(mm * 10); // mm to cm
                };

                return (
                  <>
                    <td key={`${day.date}-am-snow`} className="border border-slate-200 p-2 text-center text-sm font-semibold">
                      {avgTemp < 2 && amSnow > 0 ? formatSnow(amSnow) : '—'}
                    </td>
                    <td key={`${day.date}-pm-snow`} className="border border-slate-200 p-2 text-center text-sm font-semibold">
                      {avgTemp < 2 && pmSnow > 0 ? formatSnow(pmSnow) : '—'}
                    </td>
                    <td key={`${day.date}-night-snow`} className="border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-sm font-semibold">
                      {avgTemp < 2 && nightSnow > 0 ? formatSnow(nightSnow) : '—'}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Precipitation Probability Row */}
            <tr>
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                Precip %
              </td>
              {dailyData.map((day) => {
                const amData = getRepresentative(day.AM);
                const pmData = getRepresentative(day.PM);
                const nightData = getRepresentative(day.night);

                return (
                  <>
                    <td key={`${day.date}-am-prob`} className="border border-slate-200 p-2 text-center text-sm font-semibold text-blue-700">
                      {amData && (amData.precipProb > 0 ? `${amData.precipProb}%` : '—')}
                    </td>
                    <td key={`${day.date}-pm-prob`} className="border border-slate-200 p-2 text-center text-sm font-semibold text-blue-700">
                      {pmData && (pmData.precipProb > 0 ? `${pmData.precipProb}%` : '—')}
                    </td>
                    <td key={`${day.date}-night-prob`} className="border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-sm font-semibold text-blue-700">
                      {nightData && (nightData.precipProb > 0 ? `${nightData.precipProb}%` : '—')}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Rain Row */}
            <tr>
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                💧 {precipUnit}
              </td>
              {dailyData.map((day) => {
                const amRain = getTotalPrecip(day.AM);
                const pmRain = getTotalPrecip(day.PM);
                const nightRain = getTotalPrecip(day.night);
                const avgTemp = (getMaxTemp(day.AM) + getMinTemp(day.AM)) / 2;

                return (
                  <>
                    <td key={`${day.date}-am-rain`} className="border border-slate-200 p-2 text-center text-sm font-semibold">
                      {avgTemp >= 2 && amRain > 0 ? convertPrecip(amRain) : '—'}
                    </td>
                    <td key={`${day.date}-pm-rain`} className="border border-slate-200 p-2 text-center text-sm font-semibold">
                      {avgTemp >= 2 && pmRain > 0 ? convertPrecip(pmRain) : '—'}
                    </td>
                    <td key={`${day.date}-night-rain`} className="border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-sm font-semibold">
                      {avgTemp >= 2 && nightRain > 0 ? convertPrecip(nightRain) : '—'}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Humidity Row */}
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                Humidity %
              </td>
              {dailyData.map((day) => {
                const amData = getRepresentative(day.AM);
                const pmData = getRepresentative(day.PM);
                const nightData = getRepresentative(day.night);

                const getHumidity = (data: TimePeriodData | null | undefined) => {
                  if (!data) return null;
                  const idx = forecast.hourly.time.indexOf(data.time);
                  return forecast.hourly.relativehumidity_2m[idx] ?? null;
                };

                return (
                  <>
                    <td key={`${day.date}-am-humid`} className="border border-slate-200 p-2 text-center text-xs text-slate-600">
                      {getHumidity(amData) !== null ? `${getHumidity(amData)}%` : '—'}
                    </td>
                    <td key={`${day.date}-pm-humid`} className="border border-slate-200 p-2 text-center text-xs text-slate-600">
                      {getHumidity(pmData) !== null ? `${getHumidity(pmData)}%` : '—'}
                    </td>
                    <td key={`${day.date}-night-humid`} className="border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-xs text-slate-600">
                      {getHumidity(nightData) !== null ? `${getHumidity(nightData)}%` : '—'}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* UV Index Row */}
            <tr>
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                UV Index
              </td>
              {dailyData.map((day) => {
                const amData = getRepresentative(day.AM);
                const pmData = getRepresentative(day.PM);
                const nightData = getRepresentative(day.night);

                const getUV = (data: TimePeriodData | null | undefined) => {
                  if (!data) return null;
                  const idx = forecast.hourly.time.indexOf(data.time);
                  return forecast.hourly.uv_index[idx] ?? null;
                };

                const getUVColor = (uv: number | null) => {
                  if (uv === null) return '';
                  if (uv <= 2) return 'text-green-600';
                  if (uv <= 5) return 'text-yellow-600';
                  if (uv <= 7) return 'text-orange-600';
                  if (uv <= 10) return 'text-red-600';
                  return 'text-purple-600';
                };

                const amUV = getUV(amData);
                const pmUV = getUV(pmData);
                const nightUV = getUV(nightData);

                return (
                  <>
                    <td key={`${day.date}-am-uv`} className={`border border-slate-200 p-2 text-center text-sm font-semibold ${getUVColor(amUV)}`}>
                      {amUV !== null ? Math.round(amUV) : '—'}
                    </td>
                    <td key={`${day.date}-pm-uv`} className={`border border-slate-200 p-2 text-center text-sm font-semibold ${getUVColor(pmUV)}`}>
                      {pmUV !== null ? Math.round(pmUV) : '—'}
                    </td>
                    <td key={`${day.date}-night-uv`} className={`border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-sm font-semibold ${getUVColor(nightUV)}`}>
                      {nightUV !== null ? Math.round(nightUV) : '—'}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Max Temperature Row */}
            <tr className="border-t border-slate-300">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                max {tempUnit}
              </td>
              {dailyData.map((day) => (
                <>
                  <td key={`${day.date}-am-maxtemp`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${getTempColorForDisplay(getMaxTemp(day.AM))}`}>
                    {convertTemp(getMaxTemp(day.AM))}
                  </td>
                  <td key={`${day.date}-pm-maxtemp`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${getTempColorForDisplay(getMaxTemp(day.PM))}`}>
                    {convertTemp(getMaxTemp(day.PM))}
                  </td>
                  <td key={`${day.date}-night-maxtemp`} className={`border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-sm font-bold ${getTempColorForDisplay(getMaxTemp(day.night))}`}>
                    {convertTemp(getMaxTemp(day.night))}
                  </td>
                </>
              ))}
            </tr>

            {/* Min Temperature Row */}
            <tr>
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                min {tempUnit}
              </td>
              {dailyData.map((day) => (
                <>
                  <td key={`${day.date}-am-mintemp`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${getTempColorForDisplay(getMinTemp(day.AM))}`}>
                    {convertTemp(getMinTemp(day.AM))}
                  </td>
                  <td key={`${day.date}-pm-mintemp`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${getTempColorForDisplay(getMinTemp(day.PM))}`}>
                    {convertTemp(getMinTemp(day.PM))}
                  </td>
                  <td key={`${day.date}-night-mintemp`} className={`border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-sm font-bold ${getTempColorForDisplay(getMinTemp(day.night))}`}>
                    {convertTemp(getMinTemp(day.night))}
                  </td>
                </>
              ))}
            </tr>

            {/* Wind Chill Row */}
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                🥶 chill {tempUnit}
              </td>
              {dailyData.map((day) => {
                const amData = getRepresentative(day.AM);
                const pmData = getRepresentative(day.PM);
                const nightData = getRepresentative(day.night);

                return (
                  <>
                    <td key={`${day.date}-am-chill`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${amData ? getTempColorForDisplay(calculateWindChill(amData.temp, amData.windSpeed)) : ''}`}>
                      {amData && convertTemp(calculateWindChill(amData.temp, amData.windSpeed))}
                    </td>
                    <td key={`${day.date}-pm-chill`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${pmData ? getTempColorForDisplay(calculateWindChill(pmData.temp, pmData.windSpeed)) : ''}`}>
                      {pmData && convertTemp(calculateWindChill(pmData.temp, pmData.windSpeed))}
                    </td>
                    <td key={`${day.date}-night-chill`} className={`border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-sm font-bold ${nightData ? getTempColorForDisplay(calculateWindChill(nightData.temp, nightData.windSpeed)) : ''}`}>
                      {nightData && convertTemp(calculateWindChill(nightData.temp, nightData.windSpeed))}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Freezing Level Row */}
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                Freezing level {elevUnit}
              </td>
              {dailyData.map((day) => {
                const amData = getRepresentative(day.AM);
                const pmData = getRepresentative(day.PM);
                const nightData = getRepresentative(day.night);

                return (
                  <>
                    <td key={`${day.date}-am-freeze`} className="border border-slate-200 p-2 text-center text-xs">
                      {amData && convertElevation(amData.freezingLevel).toLocaleString()}
                    </td>
                    <td key={`${day.date}-pm-freeze`} className="border border-slate-200 p-2 text-center text-xs">
                      {pmData && convertElevation(pmData.freezingLevel).toLocaleString()}
                    </td>
                    <td key={`${day.date}-night-freeze`} className="border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-xs">
                      {nightData && convertElevation(nightData.freezingLevel).toLocaleString()}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Cloud Base Row - Estimated from cloud cover */}
            <tr>
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                Cloud base ({elevUnit})
              </td>
              {dailyData.map((day) => {
                const amData = getRepresentative(day.AM);
                const pmData = getRepresentative(day.PM);
                const nightData = getRepresentative(day.night);

                // Estimate cloud base from cloud cover (simplified)
                const estimateCloudBase = (cloudCover: number) => {
                  if (cloudCover < 20) return '—';
                  const baseMeters = cloudCover < 50 ? 2000 : 1500;
                  return convertElevation(baseMeters).toLocaleString();
                };

                return (
                  <>
                    <td key={`${day.date}-am-cloud`} className="border border-slate-200 p-2 text-center text-xs">
                      {amData && estimateCloudBase(amData.cloudCover)}
                    </td>
                    <td key={`${day.date}-pm-cloud`} className="border border-slate-200 p-2 text-center text-xs">
                      {pmData && estimateCloudBase(pmData.cloudCover)}
                    </td>
                    <td key={`${day.date}-night-cloud`} className="border-l-2 border-l-slate-400 border border-slate-200 p-2 text-center text-xs">
                      {nightData && estimateCloudBase(nightData.cloudCover)}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Sunrise/Sunset Row */}
            <tr className="border-t-2 border-slate-300">
              <td className="sticky left-0 bg-yellow-50 z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                <div className="flex items-center gap-1">
                  <span>☀️</span>
                  <span>Sun</span>
                </div>
              </td>
              {dailyData.map((day) => {
                const date = new Date(day.date);
                const sunTimes = calculateSunTimes(forecast.latitude, forecast.longitude, date);

                return (
                  <>
                    <td
                      key={`${day.date}-am-sun`}
                      className="border border-slate-200 p-1 text-center text-xs bg-yellow-50"
                      colSpan={3}
                    >
                      <div className="flex items-center justify-around">
                        <div className="flex items-center gap-1">
                          <span className="text-orange-600">↑</span>
                          <span className="font-semibold">{sunTimes.sunrise}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-orange-600">↓</span>
                          <span className="font-semibold">{sunTimes.sunset}</span>
                        </div>
                      </div>
                    </td>
                  </>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Elevation Profile Chart */}
      <ElevationProfileChart
        forecast={forecast}
        peakElevation={selectedBand.elevation}
        daysToShow={daysToShow}
      />
    </div>
  );
}
