import {
  computeSafetyScore,
  getBestSummitWindow,
  computeSafetyTimeline,
  getSafetyRatingColor,
  getSafetyRatingLabel,
} from '../utils/safetyScore';

describe('computeSafetyScore', () => {
  const baseConditions = {
    windSpeed: 0,
    precipProbability: 0,
    visibility: 10000,
    feelsLike: 0,
    cape: 0,
    freezingLevel: 3000,
    elevation: 4000,
    timestamp: '2024-01-01T12:00:00Z',
  };

  it('should return perfect score for ideal conditions', () => {
    const result = computeSafetyScore(baseConditions);
    expect(result.score).toBe(100);
    expect(result.rating).toBe('OPTIMAL');
  });

  it('should apply maximum wind penalty for windSpeed > 80 km/h', () => {
    const result = computeSafetyScore({ ...baseConditions, windSpeed: 85 });
    expect(result.score).toBe(60);
    expect(result.factors.windPenalty).toBe(40);
    expect(result.rating).toBe('CAUTION');
  });

  it('should apply moderate wind penalty for windSpeed > 60 km/h', () => {
    const result = computeSafetyScore({ ...baseConditions, windSpeed: 65 });
    expect(result.score).toBe(75);
    expect(result.factors.windPenalty).toBe(25);
    expect(result.rating).toBe('GOOD');
  });

  it('should apply minor wind penalty for windSpeed > 40 km/h', () => {
    const result = computeSafetyScore({ ...baseConditions, windSpeed: 45 });
    expect(result.score).toBe(90);
    expect(result.factors.windPenalty).toBe(10);
    expect(result.rating).toBe('OPTIMAL');
  });

  it('should apply maximum precipitation penalty for > 70%', () => {
    const result = computeSafetyScore({ ...baseConditions, precipProbability: 75 });
    expect(result.score).toBe(75);
    expect(result.factors.precipPenalty).toBe(25);
  });

  it('should apply moderate precipitation penalty for > 40%', () => {
    const result = computeSafetyScore({ ...baseConditions, precipProbability: 50 });
    expect(result.score).toBe(90);
    expect(result.factors.precipPenalty).toBe(10);
  });

  it('should apply maximum visibility penalty for < 1000m', () => {
    const result = computeSafetyScore({ ...baseConditions, visibility: 800 });
    expect(result.score).toBe(80);
    expect(result.factors.visibilityPenalty).toBe(20);
  });

  it('should apply moderate visibility penalty for < 5000m', () => {
    const result = computeSafetyScore({ ...baseConditions, visibility: 3000 });
    expect(result.score).toBe(92);
    expect(result.factors.visibilityPenalty).toBe(8);
  });

  it('should apply maximum temperature penalty for feelsLike < -30°C', () => {
    const result = computeSafetyScore({ ...baseConditions, feelsLike: -35 });
    expect(result.score).toBe(85);
    expect(result.factors.temperaturePenalty).toBe(15);
  });

  it('should apply moderate temperature penalty for feelsLike < -20°C', () => {
    const result = computeSafetyScore({ ...baseConditions, feelsLike: -25 });
    expect(result.score).toBe(92);
    expect(result.factors.temperaturePenalty).toBe(8);
  });

  it('should apply maximum CAPE penalty for > 500', () => {
    const result = computeSafetyScore({ ...baseConditions, cape: 600 });
    expect(result.score).toBe(80);
    expect(result.factors.capePenalty).toBe(20);
  });

  it('should apply moderate CAPE penalty for > 200', () => {
    const result = computeSafetyScore({ ...baseConditions, cape: 300 });
    expect(result.score).toBe(90);
    expect(result.factors.capePenalty).toBe(10);
  });

  it('should apply freezing level bonus when above elevation', () => {
    const result = computeSafetyScore({ ...baseConditions, freezingLevel: 4500, elevation: 4000 });
    expect(result.score).toBe(105); // 100 + 5 bonus, will be clamped to 100
    expect(result.factors.freezingLevelBonus).toBe(5);
  });

  it('should combine multiple penalties correctly', () => {
    const result = computeSafetyScore({
      ...baseConditions,
      windSpeed: 85, // -40
      precipProbability: 75, // -25
      visibility: 800, // -20
    });
    expect(result.score).toBe(15);
    expect(result.rating).toBe('AVOID');
  });

  it('should clamp score to minimum of 0', () => {
    const result = computeSafetyScore({
      ...baseConditions,
      windSpeed: 85, // -40
      precipProbability: 75, // -25
      visibility: 800, // -20
      feelsLike: -35, // -15
      cape: 600, // -20
    });
    expect(result.score).toBe(0);
    expect(result.rating).toBe('AVOID');
  });

  it('should clamp score to maximum of 100', () => {
    const result = computeSafetyScore({
      ...baseConditions,
      freezingLevel: 5000, // +5
      elevation: 3000,
    });
    expect(result.score).toBe(100);
  });

  it('should categorize AVOID rating correctly (0-30)', () => {
    const result = computeSafetyScore({
      ...baseConditions,
      windSpeed: 85,
      precipProbability: 75,
    });
    expect(result.score).toBe(35); // Actually 35, CAUTION
    expect(result.rating).toBe('CAUTION');

    const result2 = computeSafetyScore({
      ...baseConditions,
      windSpeed: 85,
      precipProbability: 75,
      visibility: 800,
    });
    expect(result2.score).toBe(15);
    expect(result2.rating).toBe('AVOID');
  });

  it('should categorize CAUTION rating correctly (31-60)', () => {
    const result = computeSafetyScore({
      ...baseConditions,
      windSpeed: 85,
    });
    expect(result.score).toBe(60);
    expect(result.rating).toBe('CAUTION');
  });

  it('should categorize GOOD rating correctly (61-85)', () => {
    const result = computeSafetyScore({
      ...baseConditions,
      windSpeed: 65,
    });
    expect(result.score).toBe(75);
    expect(result.rating).toBe('GOOD');
  });

  it('should categorize OPTIMAL rating correctly (86-100)', () => {
    const result = computeSafetyScore({
      ...baseConditions,
      windSpeed: 45,
    });
    expect(result.score).toBe(90);
    expect(result.rating).toBe('OPTIMAL');
  });
});

describe('getBestSummitWindow', () => {
  const createConditions = (hour: number, windSpeed: number) => ({
    windSpeed,
    precipProbability: 0,
    visibility: 10000,
    feelsLike: 0,
    cape: 0,
    freezingLevel: 4500,
    elevation: 4000,
    timestamp: `2024-01-01T${hour.toString().padStart(2, '0')}:00:00Z`,
  });

  it('should return null for empty conditions array', () => {
    const result = getBestSummitWindow([]);
    expect(result).toBeNull();
  });

  it('should find the best hour with highest safety score', () => {
    const conditions = [
      createConditions(0, 85), // score: 60
      createConditions(1, 45), // score: 90
      createConditions(2, 0), // score: 100
      createConditions(3, 65), // score: 75
    ];

    const result = getBestSummitWindow(conditions);
    expect(result).not.toBeNull();
    expect(result?.score.score).toBe(100);
    expect(result?.score.timestamp).toBe('2024-01-01T02:00:00Z');
  });

  it('should return a 3-hour window around the best time', () => {
    const conditions = Array.from({ length: 24 }, (_, i) =>
      createConditions(i, i === 12 ? 0 : 50)
    );

    const result = getBestSummitWindow(conditions);
    expect(result).not.toBeNull();
    // Best time is 12:00, window should be 11:00 to 13:00
    expect(result?.startTime).toBe('2024-01-01T11:00:00Z');
    expect(result?.endTime).toBe('2024-01-01T13:00:00Z');
  });

  it('should handle window at start of array', () => {
    const conditions = [
      createConditions(0, 0), // Best score
      createConditions(1, 50),
      createConditions(2, 50),
    ];

    const result = getBestSummitWindow(conditions);
    expect(result?.startTime).toBe('2024-01-01T00:00:00Z');
    expect(result?.endTime).toBe('2024-01-01T02:00:00Z');
  });

  it('should handle window at end of array', () => {
    const conditions = [
      createConditions(0, 50),
      createConditions(1, 50),
      createConditions(2, 0), // Best score
    ];

    const result = getBestSummitWindow(conditions);
    expect(result?.startTime).toBe('2024-01-01T01:00:00Z');
    expect(result?.endTime).toBe('2024-01-01T02:00:00Z');
  });
});

describe('computeSafetyTimeline', () => {
  it('should return safety scores for all hours', () => {
    const conditions = [
      {
        windSpeed: 0,
        precipProbability: 0,
        visibility: 10000,
        feelsLike: 0,
        cape: 0,
        freezingLevel: 4500,
        elevation: 4000,
        timestamp: '2024-01-01T00:00:00Z',
      },
      {
        windSpeed: 85,
        precipProbability: 0,
        visibility: 10000,
        feelsLike: 0,
        cape: 0,
        freezingLevel: 4500,
        elevation: 4000,
        timestamp: '2024-01-01T01:00:00Z',
      },
    ];

    const timeline = computeSafetyTimeline(conditions);
    expect(timeline).toHaveLength(2);
    expect(timeline[0]?.score).toBe(100);
    expect(timeline[1]?.score).toBe(60);
  });

  it('should return empty array for empty input', () => {
    const timeline = computeSafetyTimeline([]);
    expect(timeline).toHaveLength(0);
  });
});

describe('getSafetyRatingColor', () => {
  it('should return correct color for AVOID', () => {
    expect(getSafetyRatingColor('AVOID')).toBe('#EF4444');
  });

  it('should return correct color for CAUTION', () => {
    expect(getSafetyRatingColor('CAUTION')).toBe('#F59E0B');
  });

  it('should return correct color for GOOD', () => {
    expect(getSafetyRatingColor('GOOD')).toBe('#10B981');
  });

  it('should return correct color for OPTIMAL', () => {
    expect(getSafetyRatingColor('OPTIMAL')).toBe('#3B82F6');
  });
});

describe('getSafetyRatingLabel', () => {
  it('should return correct label for AVOID', () => {
    expect(getSafetyRatingLabel('AVOID')).toBe('Dangerous - Avoid Summit');
  });

  it('should return correct label for CAUTION', () => {
    expect(getSafetyRatingLabel('CAUTION')).toBe('Caution Required');
  });

  it('should return correct label for GOOD', () => {
    expect(getSafetyRatingLabel('GOOD')).toBe('Good Conditions');
  });

  it('should return correct label for OPTIMAL', () => {
    expect(getSafetyRatingLabel('OPTIMAL')).toBe('Optimal Conditions');
  });
});
