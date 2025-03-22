
import React, { createContext, useContext, useState, useEffect } from 'react';

export type PeriodData = {
  id: string;
  startDate: string;
  endDate: string;
  description?: string;
  symptoms?: string[];
  mood?: string;
};

type PeriodContextType = {
  periods: PeriodData[];
  addPeriod: (period: Omit<PeriodData, 'id'>) => void;
  updatePeriod: (id: string, period: Partial<PeriodData>) => void;
  deletePeriod: (id: string) => void;
  latestPeriod: PeriodData | null;
  predictNextPeriod: () => { startDate: string; endDate: string } | null;
};

const PeriodContext = createContext<PeriodContextType>({
  periods: [],
  addPeriod: () => {},
  updatePeriod: () => {},
  deletePeriod: () => {},
  latestPeriod: null,
  predictNextPeriod: () => null,
});

export const PeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [periods, setPeriods] = useState<PeriodData[]>(() => {
    const savedPeriods = localStorage.getItem('periodData');
    return savedPeriods ? JSON.parse(savedPeriods) : [];
  });

  useEffect(() => {
    localStorage.setItem('periodData', JSON.stringify(periods));
  }, [periods]);

  const addPeriod = (period: Omit<PeriodData, 'id'>) => {
    const newPeriod = {
      id: Date.now().toString(),
      ...period,
    };
    setPeriods(prev => [...prev, newPeriod]);
  };

  const updatePeriod = (id: string, periodUpdate: Partial<PeriodData>) => {
    setPeriods(prev => 
      prev.map(period => 
        period.id === id ? { ...period, ...periodUpdate } : period
      )
    );
  };

  const deletePeriod = (id: string) => {
    setPeriods(prev => prev.filter(period => period.id !== id));
  };

  const latestPeriod = periods.length > 0 
    ? periods.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]
    : null;

  const predictNextPeriod = () => {
    if (periods.length < 2) return null;
    
    // Sort periods by start date
    const sortedPeriods = [...periods].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    // Calculate average cycle length
    let totalDays = 0;
    let count = 0;
    
    for (let i = 1; i < sortedPeriods.length; i++) {
      const current = new Date(sortedPeriods[i].startDate);
      const previous = new Date(sortedPeriods[i-1].startDate);
      const difference = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
      
      if (difference > 0 && difference < 60) { // Ignore outliers
        totalDays += difference;
        count++;
      }
    }
    
    if (count === 0) return null;
    
    const averageCycle = Math.round(totalDays / count);
    const lastPeriod = latestPeriod;
    
    if (!lastPeriod) return null;
    
    const lastStartDate = new Date(lastPeriod.startDate);
    const nextStartDate = new Date(lastStartDate);
    nextStartDate.setDate(lastStartDate.getDate() + averageCycle);
    
    // Calculate average period duration
    let totalDuration = 0;
    sortedPeriods.forEach(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      totalDuration += duration;
    });
    
    const averageDuration = Math.round(totalDuration / sortedPeriods.length);
    
    const nextEndDate = new Date(nextStartDate);
    nextEndDate.setDate(nextStartDate.getDate() + averageDuration - 1);
    
    return {
      startDate: nextStartDate.toISOString().split('T')[0],
      endDate: nextEndDate.toISOString().split('T')[0]
    };
  };

  return (
    <PeriodContext.Provider value={{ 
      periods, 
      addPeriod, 
      updatePeriod, 
      deletePeriod, 
      latestPeriod,
      predictNextPeriod
    }}>
      {children}
    </PeriodContext.Provider>
  );
};

export const usePeriods = () => useContext(PeriodContext);
