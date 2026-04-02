import type {
  LocationResult,
  ForecastData,
  ForecastApiOptions,
  GeocodingApiResponse,
  ElevationApiResponse,
  AvalancheBulletin,
} from '../types';

/**
 * WeatherService handles all API calls to Open-Meteo and related services
 * Includes in-memory caching to prevent duplicate requests within 60 seconds
 */
export class WeatherService {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 1000; // 60 seconds

  /**
   * Search for locations by name using Open-Meteo Geocoding API
   */
  async searchLocation(query: string): Promise<LocationResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cacheKey = `geocoding:${query}`;
    const cached = this.getFromCache<LocationResult[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query
      )}&count=10&language=en&format=json`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.statusText}`);
      }

      const data = (await response.json()) as GeocodingApiResponse;
      const results = data.results || [];

      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Error searching location:', error);
      throw error;
    }
  }

  /**
   * Get precise elevation for a coordinate using Open-Meteo Elevation API
   */
  async fetchElevation(latitude: number, longitude: number): Promise<number> {
    const cacheKey = `elevation:${latitude},${longitude}`;
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const url = `https://api.open-meteo.com/v1/elevation?latitude=${latitude}&longitude=${longitude}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Elevation API error: ${response.statusText}`);
      }

      const data = (await response.json()) as ElevationApiResponse;
      const elevation = data.elevation[0] ?? 0;

      this.setCache(cacheKey, elevation);
      return elevation;
    } catch (error) {
      console.error('Error fetching elevation:', error);
      throw error;
    }
  }

  /**
   * Fetch comprehensive weather forecast from Open-Meteo
   */
  async fetchForecast(
    latitude: number,
    longitude: number,
    options: ForecastApiOptions = {}
  ): Promise<ForecastData> {
    const { model = 'best_match', forecastDays = 16 } = options;

    const cacheKey = `forecast:${latitude},${longitude}:${model}:${forecastDays}`;
    const cached = this.getFromCache<ForecastData>(cacheKey);
    if (cached) return cached;

    try {
      const baseUrl =
        model === 'ecmwf_ifs04'
          ? 'https://api.open-meteo.com/v1/ecmwf'
          : 'https://api.open-meteo.com/v1/forecast';

      const hourlyParams = [
        'temperature_2m',
        'relativehumidity_2m',
        'dewpoint_2m',
        'apparent_temperature',
        'precipitation',
        'snowfall',
        'snow_depth',
        'weathercode',
        'pressure_msl',
        'surface_pressure',
        'cloudcover',
        'cloudcover_low',
        'cloudcover_mid',
        'cloudcover_high',
        'visibility',
        'windspeed_10m',
        'windspeed_80m',
        'windspeed_120m',
        'windspeed_180m',
        'winddirection_10m',
        'windgusts_10m',
        'uv_index',
        'freezinglevel_height',
        'cape',
        'lifted_index',
        'precipitation_probability',
        'showers',
        'snowfall_water_equivalent',
      ].join(',');

      const pressureLevels = '200,300,400,500,600,700,800,850,925,1000';
      const pressureLevelParams =
        'temperature,windspeed,winddirection,geopotential_height,relativehumidity,cloudcover';

      const url = `${baseUrl}?latitude=${latitude}&longitude=${longitude}&hourly=${hourlyParams}&models=${model}&forecast_days=${forecastDays}&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.statusText}`);
      }

      const data = await response.json();

      const forecastData: ForecastData = {
        latitude: data.latitude,
        longitude: data.longitude,
        elevation: data.elevation,
        timezone: data.timezone,
        hourly: data.hourly,
        pressure_levels: {
          levels: pressureLevels.split(',').map(Number),
          data: {
            temperature: [],
            windspeed: [],
            winddirection: [],
            geopotential_height: [],
            relativehumidity: [],
            cloudcover: [],
          },
        },
      };

      this.setCache(cacheKey, forecastData);
      return forecastData;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  /**
   * Fetch avalanche risk data from EAWS API (European Avalanche Warning Services)
   * Note: Only available in certain regions (Alps, Scandinavia, parts of North America)
   */
  async fetchAvalancheRisk(
    latitude: number,
    longitude: number
  ): Promise<AvalancheBulletin | null> {
    const cacheKey = `avalanche:${latitude},${longitude}`;
    const cached = this.getFromCache<AvalancheBulletin | null>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      // First, we need to determine the region ID based on coordinates
      // This is a simplified implementation - in production, you'd have a lookup table
      const regionId = this.getAvalancheRegionId(latitude, longitude);

      if (!regionId) {
        this.setCache(cacheKey, null);
        return null;
      }

      const url = `https://api.avalanche.report/v1/public/bulletins?lang=en&region=${regionId}`;

      const response = await fetch(url);
      if (!response.ok) {
        this.setCache(cacheKey, null);
        return null;
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        this.setCache(cacheKey, null);
        return null;
      }

      const bulletin = data[0];
      const result: AvalancheBulletin = {
        regionId: bulletin.regionId || regionId,
        regionName: bulletin.regionName || 'Unknown Region',
        dangerLevel: bulletin.dangerRating?.main || 1,
        validFrom: bulletin.validTime?.startTime,
        validUntil: bulletin.validTime?.endTime,
        problems: bulletin.avalancheProblems || [],
        highlights: bulletin.highlights,
        bulletinUrl: `https://avalanche.report/bulletin/${bulletin.bulletinID}`,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching avalanche risk:', error);
      this.setCache(cacheKey, null);
      return null;
    }
  }

  /**
   * Helper: Determine avalanche region ID from coordinates
   * This is a simplified implementation - expand based on actual EAWS region coverage
   */
  private getAvalancheRegionId(latitude: number, longitude: number): string | null {
    // Alps region (simplified)
    if (latitude >= 43 && latitude <= 48 && longitude >= 5 && longitude <= 17) {
      return 'AT-07'; // Example: Tyrol region
    }

    // Add more regions as needed
    // Scandinavia, North America, etc.

    return null;
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache<T>(key: string): T | undefined {
    const cached = this.cache.get(key);
    if (!cached) return undefined;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.data as T;
  }

  /**
   * Set data in cache with current timestamp
   */
  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries (useful for long-running applications)
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Export a singleton instance
export const weatherService = new WeatherService();
