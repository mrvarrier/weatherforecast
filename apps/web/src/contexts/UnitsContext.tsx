import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UnitPreferences } from '@summitscope/core';

interface UnitsContextType {
  units: UnitPreferences;
  updateUnits: (updates: Partial<UnitPreferences>) => void;
}

const defaultUnits: UnitPreferences = {
  temperature: 'celsius',
  windSpeed: 'kmh',
  precipitation: 'mm',
  elevation: 'meters',
  visibility: 'km',
  pressure: 'hpa',
};

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<UnitPreferences>(() => {
    const stored = localStorage.getItem('summitscope-units');
    if (stored) {
      try {
        return JSON.parse(stored) as UnitPreferences;
      } catch {
        return defaultUnits;
      }
    }
    return defaultUnits;
  });

  useEffect(() => {
    localStorage.setItem('summitscope-units', JSON.stringify(units));
  }, [units]);

  const updateUnits = (updates: Partial<UnitPreferences>) => {
    setUnits((prev) => ({ ...prev, ...updates }));
  };

  return <UnitsContext.Provider value={{ units, updateUnits }}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  const context = useContext(UnitsContext);
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
}
