import { useMemo } from 'react';
import type { ForecastData } from '../../../../packages/core/src/index';
import {
  elevationToPressure,
  getNearestPressureLevel,
  getWeatherAtElevation,
  getTempColor,
} from '../../../../packages/core/src/index';

interface ElevationProfileChartProps {
  forecast: ForecastData;
  peakElevation: number;
}

interface ElevationLevel {
  elevation: number;
  label: string;
  pressureLevel: number;
}

export default function ElevationProfileChart({ forecast, peakElevation }: ElevationProfileChartProps) {
  // Define elevation levels based on peak height
  const elevationLevels = useMemo((): ElevationLevel[] => {
    const levels: ElevationLevel[] = [];

    // Calculate appropriate elevation bands
    const maxElev = Math.ceil(peakElevation / 1000) * 1000;
    const step = maxElev > 4000 ? 1000 : 500;

    for (let elev = step; elev <= maxElev; elev += step) {
      const pressure = elevationToPressure(elev);
      const nearestPressure = getNearestPressureLevel(pressure);

      levels.push({
        elevation: elev,
        label: `${elev}m`,
        pressureLevel: nearestPressure,
      });
    }

    return levels.reverse(); // Highest elevation first (top of chart)
  }, [peakElevation]);

  // Get daily temperature data at each elevation
  const dailyElevationData = useMemo(() => {
    const days: Array<{
      date: string;
      dayName: string;
      dateNum: number;
      elevationTemps: Array<{ elevation: number; temp: number }>;
    }> = [];

    const dayMap = new Map<string, number[]>();

    // Group hourly indices by day
    forecast.hourly.time.forEach((time, idx) => {
      const date = new Date(time);
      const dateKey = date.toISOString().split('T')[0] ?? '';

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, []);
      }
      dayMap.get(dateKey)?.push(idx);
    });

    // Process each day
    dayMap.forEach((hourIndices, dateKey) => {
      const date = new Date(dateKey);

      // Get midday hour (around noon) for representative conditions
      const middayIdx = hourIndices.find((idx) => {
        const hour = new Date(forecast.hourly.time[idx] ?? '').getHours();
        return hour >= 11 && hour <= 13;
      }) ?? hourIndices[Math.floor(hourIndices.length / 2)];

      if (!middayIdx) return;

      const elevationTemps = elevationLevels.map((level) => {
        const temp = getWeatherAtElevation(
          forecast.pressure_levels.data.temperature,
          level.pressureLevel,
          middayIdx,
          forecast.hourly.temperature_2m[middayIdx]
        ) ?? forecast.hourly.temperature_2m[middayIdx] ?? 0;

        return {
          elevation: level.elevation,
          temp: Math.round(temp),
        };
      });

      days.push({
        date: dateKey,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: date.getDate(),
        elevationTemps,
      });
    });

    return days.slice(0, 6); // Show 6 days like the main table
  }, [forecast, elevationLevels]);

  // Calculate SVG path for temperature line
  const getTemperaturePath = (dayIndex: number) => {
    const day = dailyElevationData[dayIndex];
    if (!day) return '';

    const cellWidth = 100 / dailyElevationData.length; // Percentage
    const cellLeft = cellWidth * dayIndex;
    const cellCenter = cellLeft + cellWidth / 2;

    const points = day.elevationTemps.map((_, elevIdx) => {
      const y = (elevIdx / (elevationLevels.length - 1)) * 100;
      return `${cellCenter},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-slate-700">Temperature by Elevation</h4>
        <p className="text-xs text-slate-500">Midday temperatures at different altitudes</p>
      </div>

      <div className="relative overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white z-10 p-2 text-left text-xs font-semibold text-slate-600 border-r border-slate-200 w-20">
                {/* Elevation labels */}
              </th>
              {dailyElevationData.map((day) => (
                <th
                  key={day.date}
                  className="border border-slate-200 bg-slate-50 p-2 text-center min-w-[100px]"
                >
                  <div className="font-semibold text-slate-900">
                    {day.dayName} {day.dateNum}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {elevationLevels.map((level, elevIdx) => (
              <tr key={level.elevation} className="border-t border-slate-200">
                <td className="sticky left-0 bg-white z-10 p-2 text-xs font-semibold text-slate-700 border-r border-slate-200">
                  {level.label}
                </td>
                {dailyElevationData.map((day) => {
                  const data = day.elevationTemps[elevIdx];
                  if (!data) return <td key={day.date} className="border border-slate-200"></td>;

                  return (
                    <td
                      key={day.date}
                      className={`border border-slate-200 p-2 text-center font-bold relative ${getTempColor(data.temp)}`}
                    >
                      {data.temp}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Temperature Line Graph Overlay */}
        <div className="relative mt-4 h-48 bg-gradient-to-b from-blue-50 to-slate-50 rounded-lg border border-slate-200 overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {dailyElevationData.map((_, dayIdx) => (
              <path
                key={dayIdx}
                d={getTemperaturePath(dayIdx)}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="0.5"
                opacity="0.6"
              />
            ))}
          </svg>

          {/* Elevation labels on left */}
          <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-2">
            {elevationLevels.map((level) => (
              <div key={level.elevation} className="text-xs font-semibold text-slate-700">
                {level.label}
              </div>
            ))}
          </div>

          {/* Day labels on bottom */}
          <div className="absolute bottom-2 left-20 right-2 flex justify-between">
            {dailyElevationData.map((day) => (
              <div key={day.date} className="text-xs font-semibold text-slate-600">
                {day.dayName}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
