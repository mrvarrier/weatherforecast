import { useMemo } from 'react';
import type { ForecastData, ElevationBand } from '../../../../packages/core/src/index';
import {
  getWeatherAtElevation,
  getWeatherCondition,
  getTempColor,
  getWindDirectionArrow,
  calculateWindChill,
  getTimePeriodName,
} from '../../../../packages/core/src/index';

interface DetailedForecastTableProps {
  forecast: ForecastData;
  selectedBand: ElevationBand;
  peakName: string;
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
  const dailyData = useMemo(() => {
    const days: DayForecast[] = [];
    const dayMap = new Map<string, DayForecast>();

    forecast.hourly.time.forEach((timeStr, idx) => {
      const date = new Date(timeStr);
      const dateKey = date.toISOString().split('T')[0] ?? '';
      const hour = date.getHours();
      const period = getTimePeriodName(hour);

      // Get weather at elevation
      const temp =
        getWeatherAtElevation(
          forecast.pressure_levels.data.temperature,
          selectedBand.pressureLevel,
          idx,
          forecast.hourly.temperature_2m[idx]
        ) ?? forecast.hourly.temperature_2m[idx] ?? 0;

      const windSpeed =
        getWeatherAtElevation(
          forecast.pressure_levels.data.windspeed,
          selectedBand.pressureLevel,
          idx,
          forecast.hourly.windspeed_10m[idx]
        ) ?? forecast.hourly.windspeed_10m[idx] ?? 0;

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
    return days.slice(0, 6); // Show 6 days like the reference
  }, [forecast, selectedBand]);

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
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-900">Detailed Forecast</h3>
        <p className="text-sm text-slate-600">
          {selectedBand.name} Elevation ({selectedBand.elevation.toLocaleString()}m)
        </p>
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
                    className="border-x border-slate-200 bg-white p-1 text-center text-xs font-semibold text-slate-600"
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
                  <td key={`${day.date}-night-icon`} className="border border-slate-200 p-2 text-center text-3xl bg-slate-800/5">
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
                  <td key={`${day.date}-night-desc`} className="border border-slate-200 p-2 text-center text-xs bg-slate-800/5">
                    {getRepresentative(day.night) && getWeatherCondition(getRepresentative(day.night)!.weatherCode).shortDesc}
                  </td>
                </>
              ))}
            </tr>

            {/* Wind Row */}
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                km/h
              </td>
              {dailyData.map((day) => (
                <>
                  <td key={`${day.date}-am-wind`} className="border border-slate-200 p-2 text-center">
                    {getRepresentative(day.AM) && (
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm">
                        {Math.round(getRepresentative(day.AM)!.windSpeed)}
                        <span className="text-xs ml-0.5">{getWindDirectionArrow(getRepresentative(day.AM)!.windDirection)}</span>
                      </div>
                    )}
                  </td>
                  <td key={`${day.date}-pm-wind`} className="border border-slate-200 p-2 text-center">
                    {getRepresentative(day.PM) && (
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm">
                        {Math.round(getRepresentative(day.PM)!.windSpeed)}
                        <span className="text-xs ml-0.5">{getWindDirectionArrow(getRepresentative(day.PM)!.windDirection)}</span>
                      </div>
                    )}
                  </td>
                  <td key={`${day.date}-night-wind`} className="border border-slate-200 p-2 text-center bg-slate-800/5">
                    {getRepresentative(day.night) && (
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm">
                        {Math.round(getRepresentative(day.night)!.windSpeed)}
                        <span className="text-xs ml-0.5">{getWindDirectionArrow(getRepresentative(day.night)!.windDirection)}</span>
                      </div>
                    )}
                  </td>
                </>
              ))}
            </tr>

            {/* Snow (cm) Row */}
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                ❄️ cm
              </td>
              {dailyData.map((day) => {
                const amSnow = getTotalPrecip(day.AM);
                const pmSnow = getTotalPrecip(day.PM);
                const nightSnow = getTotalPrecip(day.night);
                const avgTemp = (getMaxTemp(day.AM) + getMinTemp(day.AM)) / 2;

                return (
                  <>
                    <td key={`${day.date}-am-snow`} className="border border-slate-200 p-2 text-center text-sm font-semibold">
                      {avgTemp < 2 && amSnow > 0 ? Math.round(amSnow * 10) : '—'}
                    </td>
                    <td key={`${day.date}-pm-snow`} className="border border-slate-200 p-2 text-center text-sm font-semibold">
                      {avgTemp < 2 && pmSnow > 0 ? Math.round(pmSnow * 10) : '—'}
                    </td>
                    <td key={`${day.date}-night-snow`} className="border border-slate-200 p-2 text-center text-sm font-semibold bg-slate-800/5">
                      {avgTemp < 2 && nightSnow > 0 ? Math.round(nightSnow * 10) : '—'}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Rain (mm) Row */}
            <tr>
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                💧 mm
              </td>
              {dailyData.map((day) => {
                const amRain = getTotalPrecip(day.AM);
                const pmRain = getTotalPrecip(day.PM);
                const nightRain = getTotalPrecip(day.night);
                const avgTemp = (getMaxTemp(day.AM) + getMinTemp(day.AM)) / 2;

                return (
                  <>
                    <td key={`${day.date}-am-rain`} className="border border-slate-200 p-2 text-center text-sm font-semibold">
                      {avgTemp >= 2 && amRain > 0 ? Math.round(amRain) : '—'}
                    </td>
                    <td key={`${day.date}-pm-rain`} className="border border-slate-200 p-2 text-center text-sm font-semibold">
                      {avgTemp >= 2 && pmRain > 0 ? Math.round(pmRain) : '—'}
                    </td>
                    <td key={`${day.date}-night-rain`} className="border border-slate-200 p-2 text-center text-sm font-semibold bg-slate-800/5">
                      {avgTemp >= 2 && nightRain > 0 ? Math.round(nightRain) : '—'}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Max Temperature Row */}
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                max °C
              </td>
              {dailyData.map((day) => (
                <>
                  <td key={`${day.date}-am-maxtemp`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${getTempColor(getMaxTemp(day.AM))}`}>
                    {Math.round(getMaxTemp(day.AM))}
                  </td>
                  <td key={`${day.date}-pm-maxtemp`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${getTempColor(getMaxTemp(day.PM))}`}>
                    {Math.round(getMaxTemp(day.PM))}
                  </td>
                  <td key={`${day.date}-night-maxtemp`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${getTempColor(getMaxTemp(day.night))} bg-slate-800/5`}>
                    {Math.round(getMaxTemp(day.night))}
                  </td>
                </>
              ))}
            </tr>

            {/* Min Temperature Row */}
            <tr>
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                min °C
              </td>
              {dailyData.map((day) => (
                <>
                  <td key={`${day.date}-am-mintemp`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${getTempColor(getMinTemp(day.AM))}`}>
                    {Math.round(getMinTemp(day.AM))}
                  </td>
                  <td key={`${day.date}-pm-mintemp`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${getTempColor(getMinTemp(day.PM))}`}>
                    {Math.round(getMinTemp(day.PM))}
                  </td>
                  <td key={`${day.date}-night-mintemp`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${getTempColor(getMinTemp(day.night))} bg-slate-800/5`}>
                    {Math.round(getMinTemp(day.night))}
                  </td>
                </>
              ))}
            </tr>

            {/* Wind Chill Row */}
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                🥶 chill °C
              </td>
              {dailyData.map((day) => {
                const amData = getRepresentative(day.AM);
                const pmData = getRepresentative(day.PM);
                const nightData = getRepresentative(day.night);

                return (
                  <>
                    <td key={`${day.date}-am-chill`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${amData ? getTempColor(calculateWindChill(amData.temp, amData.windSpeed)) : ''}`}>
                      {amData && Math.round(calculateWindChill(amData.temp, amData.windSpeed))}
                    </td>
                    <td key={`${day.date}-pm-chill`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${pmData ? getTempColor(calculateWindChill(pmData.temp, pmData.windSpeed)) : ''}`}>
                      {pmData && Math.round(calculateWindChill(pmData.temp, pmData.windSpeed))}
                    </td>
                    <td key={`${day.date}-night-chill`} className={`border border-slate-200 p-2 text-center text-sm font-bold ${nightData ? getTempColor(calculateWindChill(nightData.temp, nightData.windSpeed)) : ''} bg-slate-800/5`}>
                      {nightData && Math.round(calculateWindChill(nightData.temp, nightData.windSpeed))}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Freezing Level Row */}
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                Freezing level m
              </td>
              {dailyData.map((day) => {
                const amData = getRepresentative(day.AM);
                const pmData = getRepresentative(day.PM);
                const nightData = getRepresentative(day.night);

                return (
                  <>
                    <td key={`${day.date}-am-freeze`} className="border border-slate-200 p-2 text-center text-xs">
                      {amData && amData.freezingLevel.toLocaleString()}
                    </td>
                    <td key={`${day.date}-pm-freeze`} className="border border-slate-200 p-2 text-center text-xs">
                      {pmData && pmData.freezingLevel.toLocaleString()}
                    </td>
                    <td key={`${day.date}-night-freeze`} className="border border-slate-200 p-2 text-center text-xs bg-slate-800/5">
                      {nightData && nightData.freezingLevel.toLocaleString()}
                    </td>
                  </>
                );
              })}
            </tr>

            {/* Cloud Base Row - Estimated from cloud cover */}
            <tr>
              <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                Cloud base (m)
              </td>
              {dailyData.map((day) => {
                const amData = getRepresentative(day.AM);
                const pmData = getRepresentative(day.PM);
                const nightData = getRepresentative(day.night);

                // Estimate cloud base from cloud cover (simplified)
                const estimateCloudBase = (cloudCover: number) => {
                  if (cloudCover < 20) return '—';
                  if (cloudCover < 50) return '2000';
                  return '1500';
                };

                return (
                  <>
                    <td key={`${day.date}-am-cloud`} className="border border-slate-200 p-2 text-center text-xs">
                      {amData && estimateCloudBase(amData.cloudCover)}
                    </td>
                    <td key={`${day.date}-pm-cloud`} className="border border-slate-200 p-2 text-center text-xs">
                      {pmData && estimateCloudBase(pmData.cloudCover)}
                    </td>
                    <td key={`${day.date}-night-cloud`} className="border border-slate-200 p-2 text-center text-xs bg-slate-800/5">
                      {nightData && estimateCloudBase(nightData.cloudCover)}
                    </td>
                  </>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
