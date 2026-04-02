import type { SafetyScore, SafetyFactors, BestSummitWindow } from '../types';

interface HourlyConditions {
  windSpeed: number; // km/h
  precipProbability: number; // percentage
  visibility: number; // meters
  feelsLike: number; // celsius
  cape: number;
  freezingLevel: number; // meters
  elevation: number; // meters
  timestamp: string;
}

/**
 * Compute safety score for summit conditions (0-100)
 * Based on the algorithm specified in requirements
 */
export function computeSafetyScore(conditions: HourlyConditions): SafetyScore {
  let score = 100;
  const factors: SafetyFactors = {
    windPenalty: 0,
    precipPenalty: 0,
    visibilityPenalty: 0,
    temperaturePenalty: 0,
    capePenalty: 0,
    freezingLevelBonus: 0,
  };

  // Wind penalty
  if (conditions.windSpeed > 80) {
    factors.windPenalty = 40;
    score -= 40;
  } else if (conditions.windSpeed > 60) {
    factors.windPenalty = 25;
    score -= 25;
  } else if (conditions.windSpeed > 40) {
    factors.windPenalty = 10;
    score -= 10;
  }

  // Precipitation penalty
  if (conditions.precipProbability > 70) {
    factors.precipPenalty = 25;
    score -= 25;
  } else if (conditions.precipProbability > 40) {
    factors.precipPenalty = 10;
    score -= 10;
  }

  // Visibility penalty
  if (conditions.visibility < 1000) {
    factors.visibilityPenalty = 20;
    score -= 20;
  } else if (conditions.visibility < 5000) {
    factors.visibilityPenalty = 8;
    score -= 8;
  }

  // Temperature penalty (extreme cold)
  if (conditions.feelsLike < -30) {
    factors.temperaturePenalty = 15;
    score -= 15;
  } else if (conditions.feelsLike < -20) {
    factors.temperaturePenalty = 8;
    score -= 8;
  }

  // CAPE / thunderstorm instability penalty
  if (conditions.cape > 500) {
    factors.capePenalty = 20;
    score -= 20;
  } else if (conditions.cape > 200) {
    factors.capePenalty = 10;
    score -= 10;
  }

  // Freezing level bonus (if above summit = no icing risk)
  if (conditions.freezingLevel > conditions.elevation) {
    factors.freezingLevelBonus = 5;
    score += 5;
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine rating
  let rating: SafetyScore['rating'];
  if (score <= 30) {
    rating = 'AVOID';
  } else if (score <= 60) {
    rating = 'CAUTION';
  } else if (score <= 85) {
    rating = 'GOOD';
  } else {
    rating = 'OPTIMAL';
  }

  return {
    score,
    rating,
    factors,
    timestamp: conditions.timestamp,
  };
}

/**
 * Find the best summit window across a forecast period
 * Returns the time period with the highest safety score
 */
export function getBestSummitWindow(
  hourlyConditions: HourlyConditions[]
): BestSummitWindow | null {
  if (hourlyConditions.length === 0) {
    return null;
  }

  let bestScore: SafetyScore | null = null;
  let bestIndex = 0;

  // Find the hour with the highest safety score
  for (let i = 0; i < hourlyConditions.length; i++) {
    const score = computeSafetyScore(hourlyConditions[i]);

    if (!bestScore || score.score > bestScore.score) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (!bestScore) {
    return null;
  }

  // Define a window (e.g., 3 hours around the best time)
  const windowSize = 3;
  const startIndex = Math.max(0, bestIndex - Math.floor(windowSize / 2));
  const endIndex = Math.min(hourlyConditions.length - 1, startIndex + windowSize - 1);

  return {
    score: bestScore,
    startTime: hourlyConditions[startIndex]?.timestamp ?? '',
    endTime: hourlyConditions[endIndex]?.timestamp ?? '',
  };
}

/**
 * Compute safety scores for an entire forecast period
 * Returns an array of scores for each hour
 */
export function computeSafetyTimeline(
  hourlyConditions: HourlyConditions[]
): SafetyScore[] {
  return hourlyConditions.map((conditions) => computeSafetyScore(conditions));
}

/**
 * Get rating color for UI display
 */
export function getSafetyRatingColor(rating: SafetyScore['rating']): string {
  switch (rating) {
    case 'AVOID':
      return '#EF4444'; // red
    case 'CAUTION':
      return '#F59E0B'; // amber
    case 'GOOD':
      return '#10B981'; // green
    case 'OPTIMAL':
      return '#3B82F6'; // blue
    default:
      return '#6B7280'; // gray
  }
}

/**
 * Get rating label for UI display
 */
export function getSafetyRatingLabel(rating: SafetyScore['rating']): string {
  switch (rating) {
    case 'AVOID':
      return 'Dangerous - Avoid Summit';
    case 'CAUTION':
      return 'Caution Required';
    case 'GOOD':
      return 'Good Conditions';
    case 'OPTIMAL':
      return 'Optimal Conditions';
    default:
      return 'Unknown';
  }
}
