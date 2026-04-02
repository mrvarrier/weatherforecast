import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FEATURED_PEAKS,
  weatherService,
  computeSafetyScore,
  getSafetyRatingColor,
  getSafetyRatingLabel,
  formatTemp,
  formatWind,
  formatPrecip,
  formatPressure,
  formatVisibility,
} from '../../../../packages/core/src/index';
import type { ForecastData, HourlyConditions, SafetyScore } from '../../../../packages/core/src/index';

export default function PeakDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const peak = FEATURED_PEAKS.find((p) => p.id === id);

  useEffect(() => {
    if (!peak) return;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await weatherService.fetchForecast(peak.latitude, peak.longitude, {
          forecastDays: 16,
        });
        setForecast(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [peak]);

  if (!peak) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Peak Not Found</h1>
          <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get current conditions from first hourly data point
  const getCurrentConditions = (): HourlyConditions | null => {
    if (!forecast?.hourly) return null;

    const now = new Date();
    const currentHourIndex = forecast.hourly.time.findIndex((time) => {
      const forecastTime = new Date(time);
      return forecastTime >= now;
    });

    if (currentHourIndex === -1) return null;

    return {
      time: forecast.hourly.time[currentHourIndex] ?? '',
      temperature: forecast.hourly.temperature_2m[currentHourIndex] ?? 0,
      apparentTemperature: forecast.hourly.apparent_temperature[currentHourIndex] ?? 0,
      windSpeed: forecast.hourly.wind_speed_10m[currentHourIndex] ?? 0,
      windGusts: forecast.hourly.wind_gusts_10m[currentHourIndex] ?? 0,
      windDirection: forecast.hourly.wind_direction_10m[currentHourIndex] ?? 0,
      precipitation: forecast.hourly.precipitation[currentHourIndex] ?? 0,
      precipitationProbability: forecast.hourly.precipitation_probability[currentHourIndex] ?? 0,
      weatherCode: forecast.hourly.weather_code[currentHourIndex] ?? 0,
      cloudCover: forecast.hourly.cloud_cover[currentHourIndex] ?? 0,
      visibility: forecast.hourly.visibility[currentHourIndex] ?? 10000,
      surfacePressure: forecast.hourly.surface_pressure[currentHourIndex] ?? 1013,
      freezingLevel: forecast.hourly.freezing_level_height[currentHourIndex] ?? 0,
      cape: forecast.hourly.cape[currentHourIndex] ?? 0,
    };
  };

  const currentConditions = getCurrentConditions();
  const currentSafety: SafetyScore | null = currentConditions
    ? computeSafetyScore(currentConditions, peak.elevation)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-xl">⛰️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">SummitScope</h1>
                <p className="text-xs text-slate-500">Mountain Weather Intelligence</p>
              </div>
            </div>
            <Link
              to="/"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              ← Back to Peaks
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Mountain Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-2">{peak.name}</h2>
              <p className="text-lg text-slate-600">{peak.country}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-xl">
                <svg
                  className="w-5 h-5 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <span className="font-bold text-primary-700 text-xl">
                  {peak.elevation.toLocaleString()} m
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">{peak.range}</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading weather data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card p-6 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Failed to Load Weather Data</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Weather Content */}
        {!loading && !error && forecast && currentConditions && currentSafety && (
          <div className="space-y-6">
            {/* Current Conditions & Safety Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Conditions */}
              <div className="lg:col-span-2 card p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Current Conditions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🌡️</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Temperature</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatTemp(currentConditions.temperature, 'metric')}
                      </p>
                      <p className="text-xs text-slate-500">
                        Feels like {formatTemp(currentConditions.apparentTemperature, 'metric')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">💨</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Wind Speed</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatWind(currentConditions.windSpeed, 'metric')}
                      </p>
                      <p className="text-xs text-slate-500">
                        Gusts {formatWind(currentConditions.windGusts, 'metric')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">💧</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Precipitation</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {currentConditions.precipitationProbability}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatPrecip(currentConditions.precipitation, 'metric')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">☁️</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Cloud Cover</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {currentConditions.cloudCover}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">👁️</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Visibility</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatVisibility(currentConditions.visibility, 'metric')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📊</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Pressure</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatPressure(currentConditions.surfacePressure, 'metric')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Score */}
              <div className="card p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Summit Safety</h3>
                <div className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-4 ${getSafetyRatingColor(
                      currentSafety.rating
                    )}`}
                  >
                    <div>
                      <div className="text-4xl font-bold text-white mb-1">{currentSafety.score}</div>
                      <div className="text-sm font-medium text-white/90">/ 100</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span
                      className={`inline-block px-4 py-2 rounded-lg font-bold text-lg ${getSafetyRatingColor(
                        currentSafety.rating
                      )} text-white`}
                    >
                      {getSafetyRatingLabel(currentSafety.rating)}
                    </span>
                  </div>

                  <div className="text-left space-y-2">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                      Safety Factors
                    </p>
                    {currentSafety.factors.windPenalty > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Wind Penalty</span>
                        <span className="font-semibold text-red-600">
                          -{currentSafety.factors.windPenalty}
                        </span>
                      </div>
                    )}
                    {currentSafety.factors.precipPenalty > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Precip Penalty</span>
                        <span className="font-semibold text-red-600">
                          -{currentSafety.factors.precipPenalty}
                        </span>
                      </div>
                    )}
                    {currentSafety.factors.visibilityPenalty > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Visibility Penalty</span>
                        <span className="font-semibold text-red-600">
                          -{currentSafety.factors.visibilityPenalty}
                        </span>
                      </div>
                    )}
                    {currentSafety.factors.coldPenalty > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Cold Penalty</span>
                        <span className="font-semibold text-red-600">
                          -{currentSafety.factors.coldPenalty}
                        </span>
                      </div>
                    )}
                    {currentSafety.factors.capePenalty > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Storm Risk</span>
                        <span className="font-semibold text-red-600">
                          -{currentSafety.factors.capePenalty}
                        </span>
                      </div>
                    )}
                    {currentSafety.factors.freezingLevelBonus > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Freezing Level</span>
                        <span className="font-semibold text-green-600">
                          +{currentSafety.factors.freezingLevelBonus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 16-Day Forecast Timeline */}
            <div className="card p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">16-Day Forecast</h3>
              <div className="text-center text-slate-500 py-8">
                <p>Daily forecast cards coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
