import {
  convertTemp,
  convertWind,
  convertPrecip,
  convertElev,
  convertVisibility,
  convertPressure,
  formatTemp,
  formatWind,
  formatPrecip,
  formatElev,
  formatVisibility,
  formatPressure,
} from '../utils/units';

describe('convertTemp', () => {
  it('should convert Celsius to Fahrenheit correctly', () => {
    expect(convertTemp(0, 'celsius', 'fahrenheit')).toBeCloseTo(32, 1);
    expect(convertTemp(100, 'celsius', 'fahrenheit')).toBeCloseTo(212, 1);
    expect(convertTemp(-40, 'celsius', 'fahrenheit')).toBeCloseTo(-40, 1);
    expect(convertTemp(20, 'celsius', 'fahrenheit')).toBeCloseTo(68, 1);
  });

  it('should convert Fahrenheit to Celsius correctly', () => {
    expect(convertTemp(32, 'fahrenheit', 'celsius')).toBeCloseTo(0, 1);
    expect(convertTemp(212, 'fahrenheit', 'celsius')).toBeCloseTo(100, 1);
    expect(convertTemp(-40, 'fahrenheit', 'celsius')).toBeCloseTo(-40, 1);
    expect(convertTemp(68, 'fahrenheit', 'celsius')).toBeCloseTo(20, 1);
  });

  it('should return same value when converting to same unit', () => {
    expect(convertTemp(25, 'celsius', 'celsius')).toBe(25);
    expect(convertTemp(77, 'fahrenheit', 'fahrenheit')).toBe(77);
  });
});

describe('convertWind', () => {
  it('should convert km/h to mph correctly', () => {
    expect(convertWind(100, 'kmh', 'mph')).toBeCloseTo(62.137, 2);
    expect(convertWind(50, 'kmh', 'mph')).toBeCloseTo(31.068, 2);
  });

  it('should convert km/h to m/s correctly', () => {
    expect(convertWind(36, 'kmh', 'ms')).toBeCloseTo(10, 1);
    expect(convertWind(100, 'kmh', 'ms')).toBeCloseTo(27.778, 2);
  });

  it('should convert mph to km/h correctly', () => {
    expect(convertWind(62.137, 'mph', 'kmh')).toBeCloseTo(100, 1);
    expect(convertWind(30, 'mph', 'kmh')).toBeCloseTo(48.28, 1);
  });

  it('should convert mph to m/s correctly', () => {
    expect(convertWind(22.369, 'mph', 'ms')).toBeCloseTo(10, 1);
  });

  it('should convert m/s to km/h correctly', () => {
    expect(convertWind(10, 'ms', 'kmh')).toBeCloseTo(36, 1);
    expect(convertWind(27.778, 'ms', 'kmh')).toBeCloseTo(100, 1);
  });

  it('should convert m/s to mph correctly', () => {
    expect(convertWind(10, 'ms', 'mph')).toBeCloseTo(22.369, 2);
  });

  it('should return same value when converting to same unit', () => {
    expect(convertWind(50, 'kmh', 'kmh')).toBe(50);
    expect(convertWind(30, 'mph', 'mph')).toBe(30);
    expect(convertWind(15, 'ms', 'ms')).toBe(15);
  });
});

describe('convertPrecip', () => {
  it('should convert mm to inches correctly', () => {
    expect(convertPrecip(25.4, 'mm', 'inches')).toBeCloseTo(1, 2);
    expect(convertPrecip(50.8, 'mm', 'inches')).toBeCloseTo(2, 2);
    expect(convertPrecip(10, 'mm', 'inches')).toBeCloseTo(0.394, 2);
  });

  it('should convert inches to mm correctly', () => {
    expect(convertPrecip(1, 'inches', 'mm')).toBeCloseTo(25.4, 1);
    expect(convertPrecip(2, 'inches', 'mm')).toBeCloseTo(50.8, 1);
    expect(convertPrecip(0.5, 'inches', 'mm')).toBeCloseTo(12.7, 1);
  });

  it('should return same value when converting to same unit', () => {
    expect(convertPrecip(25.4, 'mm', 'mm')).toBe(25.4);
    expect(convertPrecip(1, 'inches', 'inches')).toBe(1);
  });
});

describe('convertElev', () => {
  it('should convert meters to feet correctly', () => {
    expect(convertElev(1000, 'meters', 'feet')).toBeCloseTo(3280.84, 1);
    expect(convertElev(8849, 'meters', 'feet')).toBeCloseTo(29032, 0); // Everest
    expect(convertElev(100, 'meters', 'feet')).toBeCloseTo(328.084, 1);
  });

  it('should convert feet to meters correctly', () => {
    expect(convertElev(3280.84, 'feet', 'meters')).toBeCloseTo(1000, 1);
    expect(convertElev(29032, 'feet', 'meters')).toBeCloseTo(8849, 0); // Everest
    expect(convertElev(1000, 'feet', 'meters')).toBeCloseTo(304.8, 1);
  });

  it('should return same value when converting to same unit', () => {
    expect(convertElev(1000, 'meters', 'meters')).toBe(1000);
    expect(convertElev(5000, 'feet', 'feet')).toBe(5000);
  });
});

describe('convertVisibility', () => {
  it('should convert km to miles correctly', () => {
    expect(convertVisibility(10, 'km', 'miles')).toBeCloseTo(6.214, 2);
    expect(convertVisibility(5, 'km', 'miles')).toBeCloseTo(3.107, 2);
  });

  it('should convert miles to km correctly', () => {
    expect(convertVisibility(6.214, 'miles', 'km')).toBeCloseTo(10, 1);
    expect(convertVisibility(10, 'miles', 'km')).toBeCloseTo(16.093, 1);
  });

  it('should return same value when converting to same unit', () => {
    expect(convertVisibility(10, 'km', 'km')).toBe(10);
    expect(convertVisibility(5, 'miles', 'miles')).toBe(5);
  });
});

describe('convertPressure', () => {
  it('should convert hPa to inHg correctly', () => {
    expect(convertPressure(1013.25, 'hpa', 'inhg')).toBeCloseTo(29.92, 2);
    expect(convertPressure(1000, 'hpa', 'inhg')).toBeCloseTo(29.53, 2);
  });

  it('should convert inHg to hPa correctly', () => {
    expect(convertPressure(29.92, 'inhg', 'hpa')).toBeCloseTo(1013.25, 1);
    expect(convertPressure(30, 'inhg', 'hpa')).toBeCloseTo(1015.92, 1);
  });

  it('should return same value when converting to same unit', () => {
    expect(convertPressure(1013, 'hpa', 'hpa')).toBe(1013);
    expect(convertPressure(29.92, 'inhg', 'inhg')).toBe(29.92);
  });
});

describe('formatTemp', () => {
  it('should format Celsius with correct unit', () => {
    expect(formatTemp(20, 'celsius')).toBe('20.0°C');
    expect(formatTemp(-5.5, 'celsius')).toBe('-5.5°C');
  });

  it('should format Fahrenheit with correct unit', () => {
    expect(formatTemp(68, 'fahrenheit')).toBe('68.0°F');
    expect(formatTemp(-40, 'fahrenheit')).toBe('-40.0°F');
  });

  it('should respect decimal places parameter', () => {
    expect(formatTemp(20.456, 'celsius', 2)).toBe('20.46°C');
    expect(formatTemp(68.111, 'fahrenheit', 0)).toBe('68°F');
  });
});

describe('formatWind', () => {
  it('should format km/h with correct unit', () => {
    expect(formatWind(50, 'kmh')).toBe('50.0 km/h');
  });

  it('should format mph with correct unit', () => {
    expect(formatWind(30, 'mph')).toBe('30.0 mph');
  });

  it('should format m/s with correct unit', () => {
    expect(formatWind(15, 'ms')).toBe('15.0 m/s');
  });

  it('should respect decimal places parameter', () => {
    expect(formatWind(50.567, 'kmh', 2)).toBe('50.57 km/h');
    expect(formatWind(30.123, 'mph', 0)).toBe('30 mph');
  });
});

describe('formatPrecip', () => {
  it('should format mm with correct unit', () => {
    expect(formatPrecip(25.4, 'mm')).toBe('25.4 mm');
  });

  it('should format inches with correct unit', () => {
    expect(formatPrecip(1.5, 'inches')).toBe('1.5 in');
  });

  it('should respect decimal places parameter', () => {
    expect(formatPrecip(25.456, 'mm', 2)).toBe('25.46 mm');
    expect(formatPrecip(1.567, 'inches', 0)).toBe('2 in');
  });
});

describe('formatElev', () => {
  it('should format meters with correct unit', () => {
    expect(formatElev(8849, 'meters')).toBe('8849 m');
  });

  it('should format feet with correct unit', () => {
    expect(formatElev(29032, 'feet')).toBe('29032 ft');
  });

  it('should respect decimal places parameter', () => {
    expect(formatElev(1000.5, 'meters', 1)).toBe('1000.5 m');
    expect(formatElev(3280.84, 'feet', 2)).toBe('3280.84 ft');
  });
});

describe('formatVisibility', () => {
  it('should format km with correct unit', () => {
    expect(formatVisibility(10, 'km')).toBe('10.0 km');
  });

  it('should format miles with correct unit', () => {
    expect(formatVisibility(5, 'miles')).toBe('5.0 mi');
  });

  it('should respect decimal places parameter', () => {
    expect(formatVisibility(10.567, 'km', 2)).toBe('10.57 km');
    expect(formatVisibility(5.123, 'miles', 0)).toBe('5 mi');
  });
});

describe('formatPressure', () => {
  it('should format hPa with correct unit', () => {
    expect(formatPressure(1013.25, 'hpa')).toBe('1013.3 hPa');
  });

  it('should format inHg with correct unit', () => {
    expect(formatPressure(29.92, 'inhg')).toBe('29.9 inHg');
  });

  it('should respect decimal places parameter', () => {
    expect(formatPressure(1013.456, 'hpa', 2)).toBe('1013.46 hPa');
    expect(formatPressure(29.921, 'inhg', 0)).toBe('30 inHg');
  });
});
