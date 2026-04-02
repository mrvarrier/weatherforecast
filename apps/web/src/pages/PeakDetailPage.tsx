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
  calculateElevationBands,
  getWeatherAtElevation,
  getElevationEmoji,
} from '../../../../packages/core/src/index';
import type { ForecastData, SafetyScore, ElevationBand } from '../../../../packages/core/src/index';

export default function PeakDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedElevationIndex, setSelectedElevationIndex] = useState(2); // Default to Summit

  const peak = FEATURED_PEAKS.find((p) => p.id === id);
  const elevationBands: ElevationBand[] = peak ? calculateElevationBands(peak.elevation) : [];
  const selectedBand: ElevationBand | undefined = elevationBands[selectedElevationIndex] ?? elevationBands[2];

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

  // Get current conditions at selected elevation
  const getCurrentConditions = () => {
    if (!forecast?.hourly || !selectedBand) return null;

    const now = new Date();
    const currentHourIndex = forecast.hourly.time.findIndex((time) => {
      const forecastTime = new Date(time);
      return forecastTime >= now;
    });

    if (currentHourIndex === -1) return null;

    // Get temperature and wind at elevation from pressure level data
    const tempAtElevation = getWeatherAtElevation(
      forecast.pressure_levels.data.temperature,
      selectedBand.pressureLevel,
      currentHourIndex,
      forecast.hourly.temperature_2m[currentHourIndex]
    );

    const windAtElevation = getWeatherAtElevation(
      forecast.pressure_levels.data.windspeed,
      selectedBand.pressureLevel,
      currentHourIndex,
      forecast.hourly.windspeed_10m[currentHourIndex]
    );

    // Surface data (doesn't vary by elevation)
    const surfaceTemp = forecast.hourly.temperature_2m[currentHourIndex] ?? 0;
    const surfaceWind = forecast.hourly.windspeed_10m[currentHourIndex] ?? 0;

    return {
      time: forecast.hourly.time[currentHourIndex] ?? '',
      temperature: tempAtElevation ?? surfaceTemp,
      apparentTemperature: tempAtElevation
        ? tempAtElevation - (selectedBand.elevation / 1000) * 6.5 // Lapse rate adjustment
        : forecast.hourly.apparent_temperature[currentHourIndex] ?? 0,
      windSpeed: windAtElevation ?? surfaceWind,
      windGusts: (windAtElevation ?? surfaceWind) * 1.3, // Estimate gusts at ~30% higher
      windDirection: forecast.hourly.winddirection_10m[currentHourIndex] ?? 0,
      precipitation: forecast.hourly.precipitation[currentHourIndex] ?? 0,
      precipitationProbability: forecast.hourly.precipitation_probability[currentHourIndex] ?? 0,
      weatherCode: forecast.hourly.weathercode[currentHourIndex] ?? 0,
      cloudCover: forecast.hourly.cloudcover[currentHourIndex] ?? 0,
      visibility: forecast.hourly.visibility[currentHourIndex] ?? 10000,
      surfacePressure: selectedBand.pressureLevel,
      freezingLevel: forecast.hourly.freezinglevel_height[currentHourIndex] ?? 0,
      cape: forecast.hourly.cape[currentHourIndex] ?? 0,
    };
  };

  const currentConditions = getCurrentConditions();
  const currentSafety: SafetyScore | null =
    currentConditions && selectedBand
      ? computeSafetyScore({
          windSpeed: currentConditions.windSpeed,
          precipProbability: currentConditions.precipitationProbability,
          visibility: currentConditions.visibility,
          feelsLike: currentConditions.apparentTemperature,
          cape: currentConditions.cape,
          freezingLevel: currentConditions.freezingLevel,
          elevation: selectedBand.elevation,
          timestamp: currentConditions.time,
        })
      : null;

  // Get daily forecasts at selected elevation
  const getDailyForecasts = () => {
    if (!forecast?.hourly || !selectedBand) return [];

    const dailyData: Array<{
      date: string;
      dayName: string;
      maxTemp: number;
      minTemp: number;
      avgWind: number;
      maxPrecipProb: number;
      totalPrecip: number;
      avgSafetyScore: number;
      weatherCode: number;
    }> = [];

    // Group hourly data by day
    const dayGroups = new Map<string, number[]>();

    forecast.hourly.time.forEach((time, index) => {
      const date = new Date(time);
      const dateKey = date.toISOString().split('T')[0] ?? '';

      if (!dayGroups.has(dateKey)) {
        dayGroups.set(dateKey, []);
      }
      dayGroups.get(dateKey)?.push(index);
    });

    // Process each day
    dayGroups.forEach((hourIndices, dateKey) => {
      const temps: number[] = [];
      const winds: number[] = [];
      const precipProbs: number[] = [];
      const precips: number[] = [];
      const safetyScores: number[] = [];
      let mostCommonWeatherCode = 0;

      hourIndices.forEach((hourIndex) => {
        // Get temperature at elevation
        const temp =
          getWeatherAtElevation(
            forecast.pressure_levels.data.temperature,
            selectedBand.pressureLevel,
            hourIndex,
            forecast.hourly.temperature_2m[hourIndex]
          ) ?? forecast.hourly.temperature_2m[hourIndex] ?? 0;

        // Get wind at elevation
        const wind =
          getWeatherAtElevation(
            forecast.pressure_levels.data.windspeed,
            selectedBand.pressureLevel,
            hourIndex,
            forecast.hourly.windspeed_10m[hourIndex]
          ) ?? forecast.hourly.windspeed_10m[hourIndex] ?? 0;

        temps.push(temp);
        winds.push(wind);
        precipProbs.push(forecast.hourly.precipitation_probability[hourIndex] ?? 0);
        precips.push(forecast.hourly.precipitation[hourIndex] ?? 0);

        // Calculate safety score for this hour
        const safety = computeSafetyScore({
          windSpeed: wind,
          precipProbability: forecast.hourly.precipitation_probability[hourIndex] ?? 0,
          visibility: forecast.hourly.visibility[hourIndex] ?? 10000,
          feelsLike: temp - (selectedBand.elevation / 1000) * 6.5,
          cape: forecast.hourly.cape[hourIndex] ?? 0,
          freezingLevel: forecast.hourly.freezinglevel_height[hourIndex] ?? 0,
          elevation: selectedBand.elevation,
          timestamp: forecast.hourly.time[hourIndex] ?? '',
        });
        safetyScores.push(safety.score);

        mostCommonWeatherCode = forecast.hourly.weathercode[hourIndex] ?? 0;
      });

      const date = new Date(dateKey);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      dailyData.push({
        date: dateKey,
        dayName,
        maxTemp: Math.max(...temps),
        minTemp: Math.min(...temps),
        avgWind: winds.reduce((a, b) => a + b, 0) / winds.length,
        maxPrecipProb: Math.max(...precipProbs),
        totalPrecip: precips.reduce((a, b) => a + b, 0),
        avgSafetyScore: Math.round(safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length),
        weatherCode: mostCommonWeatherCode,
      });
    });

    return dailyData;
  };

  const dailyForecasts = getDailyForecasts();

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

        {/* Elevation Band Selector */}
        <div className="mb-6">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Forecast Elevation
              </h3>
              <p className="text-xs text-slate-500">
                {selectedBand && `${selectedBand.pressureLevel} hPa`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {elevationBands.map((band, index) => (
                <button
                  key={band.name}
                  onClick={() => setSelectedElevationIndex(index)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedElevationIndex === index
                      ? 'bg-primary-600 text-white shadow-md scale-105'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div className="text-2xl mb-1">{getElevationEmoji(band.name)}</div>
                  <div className="text-sm font-bold">{band.name}</div>
                  <div className="text-xs opacity-90">{band.elevation.toLocaleString()}m</div>
                </button>
              ))}
            </div>
            <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>⚠️ Critical:</strong> Weather varies significantly by elevation. Summit conditions can be
                drastically different from base camp.
              </p>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Current Conditions</h3>
                  {selectedBand && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
                      <span className="text-lg">{getElevationEmoji(selectedBand.name)}</span>
                      <span className="text-sm font-semibold text-primary-700">
                        {selectedBand.name} ({selectedBand.elevation.toLocaleString()}m)
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🌡️</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Temperature</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatTemp(currentConditions.temperature, 'celsius')}
                      </p>
                      <p className="text-xs text-slate-500">
                        Feels like {formatTemp(currentConditions.apparentTemperature, 'celsius')}
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
                        {formatWind(currentConditions.windSpeed, 'kmh')}
                      </p>
                      <p className="text-xs text-slate-500">
                        Gusts {formatWind(currentConditions.windGusts, 'kmh')}
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
                        {formatPrecip(currentConditions.precipitation, 'mm')}
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
                        {formatVisibility(currentConditions.visibility, 'km')}
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
                        {formatPressure(currentConditions.surfacePressure, 'hpa')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Score */}
              <div className="card p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Safety Score</h3>
                  {selectedBand && (
                    <p className="text-xs text-slate-500">
                      {selectedBand.name} Elevation ({selectedBand.elevation.toLocaleString()}m)
                    </p>
                  )}
                </div>
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
                    {currentSafety.factors.temperaturePenalty > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Temperature Penalty</span>
                        <span className="font-semibold text-red-600">
                          -{currentSafety.factors.temperaturePenalty}
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">16-Day Forecast</h3>
                {selectedBand && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
                    <span className="text-sm">{getElevationEmoji(selectedBand.name)}</span>
                    <span className="text-xs font-semibold text-primary-700">
                      {selectedBand.name} Elevation
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {dailyForecasts.slice(0, 16).map((day) => {
                  const safetyRating =
                    day.avgSafetyScore >= 86
                      ? 'OPTIMAL'
                      : day.avgSafetyScore >= 61
                      ? 'GOOD'
                      : day.avgSafetyScore >= 31
                      ? 'CAUTION'
                      : 'AVOID';

                  const safetyColor =
                    safetyRating === 'OPTIMAL'
                      ? 'bg-green-500'
                      : safetyRating === 'GOOD'
                      ? 'bg-blue-500'
                      : safetyRating === 'CAUTION'
                      ? 'bg-yellow-500'
                      : 'bg-red-500';

                  return (
                    <div key={day.date} className="bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-colors">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-600 mb-1">{day.dayName}</p>
                        <p className="text-xs text-slate-500 mb-2">
                          {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                        </p>

                        {/* Temperature Range */}
                        <div className="mb-2">
                          <p className="text-lg font-bold text-slate-900">
                            {Math.round(day.maxTemp)}°
                          </p>
                          <p className="text-xs text-slate-500">{Math.round(day.minTemp)}°</p>
                        </div>

                        {/* Wind */}
                        <div className="flex items-center justify-center gap-1 text-xs text-slate-600 mb-2">
                          <span>💨</span>
                          <span>{Math.round(day.avgWind)} km/h</span>
                        </div>

                        {/* Precipitation */}
                        <div className="flex items-center justify-center gap-1 text-xs text-slate-600 mb-2">
                          <span>💧</span>
                          <span>{day.maxPrecipProb}%</span>
                        </div>

                        {/* Safety Indicator */}
                        <div className="flex items-center justify-center mt-2">
                          <div
                            className={`w-full h-1.5 rounded-full ${safetyColor}`}
                            title={`Safety: ${safetyRating} (${day.avgSafetyScore})`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">Safety Scale:</p>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-slate-600">Optimal (86+)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-slate-600">Good (61-85)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-slate-600">Caution (31-60)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-slate-600">Avoid (0-30)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
