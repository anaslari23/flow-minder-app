
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { supabase, predictNextPeriodML, calculateCycleWithML, PeriodPrediction } from '@/lib/supabase';
import { toast } from 'sonner';

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
  addPeriod: (period: Omit<PeriodData, 'id'>) => Promise<void>;
  updatePeriod: (id: string, period: Partial<PeriodData>) => Promise<void>;
  deletePeriod: (id: string) => Promise<void>;
  latestPeriod: PeriodData | null;
  predictNextPeriod: () => Promise<{ startDate: string; endDate: string } | null>;
  isLoading: boolean;
  mlPrediction: PeriodPrediction;
};

const defaultPrediction: PeriodPrediction = {
  nextPeriod: null,
  averageCycle: null,
  shortestCycle: null,
  longestCycle: null,
  ovulationDate: null,
  fertilityWindow: null,
  confidence: null,
};

const PeriodContext = createContext<PeriodContextType>({
  periods: [],
  addPeriod: async () => {},
  updatePeriod: async () => {},
  deletePeriod: async () => {},
  latestPeriod: null,
  predictNextPeriod: async () => null,
  isLoading: true,
  mlPrediction: defaultPrediction,
});

export const PeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId, isLoading: userLoading } = useUser();
  const [periods, setPeriods] = useState<PeriodData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mlPrediction, setMlPrediction] = useState<PeriodPrediction>(defaultPrediction);

  useEffect(() => {
    const savedPeriods = localStorage.getItem('periodData');
    if (savedPeriods) {
      setPeriods(JSON.parse(savedPeriods));
    }
  }, []);

  useEffect(() => {
    const fetchPeriods = async () => {
      if (!userId || userLoading) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('periods')
          .select('*')
          .eq('user_id', userId)
          .order('start_date', { ascending: false });
        
        if (error) {
          console.error('Error fetching periods:', error);
          throw error;
        }
        
        const transformedData = data.map(period => ({
          id: period.id,
          startDate: period.start_date,
          endDate: period.end_date,
          description: period.description,
          symptoms: period.symptoms,
          mood: period.mood,
        }));
        
        setPeriods(transformedData);
        localStorage.setItem('periodData', JSON.stringify(transformedData));
        
        if (data.length >= 3) {
          try {
            const mlData = await predictNextPeriodML(userId);
            if (mlData) {
              setMlPrediction(mlData);
            }
          } catch (mlError) {
            console.error('Error getting ML prediction:', mlError);
          }
        } else if (data.length >= 2) {
          // Calculate basic statistics without ML for limited data
          const sortedPeriods = [...data].sort(
            (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          );
          
          // Calculate cycle lengths
          const cycleLengths: number[] = [];
          for (let i = 1; i < sortedPeriods.length; i++) {
            const current = new Date(sortedPeriods[i].start_date);
            const previous = new Date(sortedPeriods[i-1].start_date);
            const difference = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
            
            if (difference > 0 && difference < 60) { // Ignore outliers
              cycleLengths.push(difference);
            }
          }
          
          if (cycleLengths.length > 0) {
            const averageCycle = Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
            const shortestCycle = Math.min(...cycleLengths);
            const longestCycle = Math.max(...cycleLengths);
            
            const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
            const lastStartDate = new Date(lastPeriod.start_date);
            
            const nextStartDate = new Date(lastStartDate);
            nextStartDate.setDate(lastStartDate.getDate() + averageCycle);
            
            const averageDuration = Math.round(
              sortedPeriods.reduce((sum, period) => {
                const start = new Date(period.start_date);
                const end = new Date(period.end_date);
                return sum + (Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
              }, 0) / sortedPeriods.length
            );
            
            const nextEndDate = new Date(nextStartDate);
            nextEndDate.setDate(nextStartDate.getDate() + averageDuration - 1);
            
            // Calculate ovulation (typically 14 days before next period)
            const ovulationDate = new Date(nextStartDate);
            ovulationDate.setDate(nextStartDate.getDate() - 14);
            
            // Calculate fertility window
            const fertileStart = new Date(ovulationDate);
            fertileStart.setDate(ovulationDate.getDate() - 5);
            
            const fertileEnd = new Date(ovulationDate);
            fertileEnd.setDate(ovulationDate.getDate() + 1);
            
            setMlPrediction({
              nextPeriod: {
                startDate: nextStartDate.toISOString().split('T')[0],
                endDate: nextEndDate.toISOString().split('T')[0],
              },
              averageCycle,
              shortestCycle,
              longestCycle,
              ovulationDate: ovulationDate.toISOString().split('T')[0],
              fertilityWindow: {
                start: fertileStart.toISOString().split('T')[0],
                end: fertileEnd.toISOString().split('T')[0],
              },
              confidence: sortedPeriods.length >= 3 ? 0.6 : 0.4,
            });
          }
        }
        
      } catch (error) {
        console.error('Error fetching periods:', error);
        // We'll keep using localStorage data in this case (already set in the earlier useEffect)
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPeriods();
  }, [userId, userLoading]);

  const addPeriod = async (period: Omit<PeriodData, 'id'>) => {
    try {
      if (!userId) {
        const newPeriod = {
          id: Date.now().toString(),
          ...period,
        };
        
        const updatedPeriods = [newPeriod, ...periods];
        setPeriods(updatedPeriods);
        localStorage.setItem('periodData', JSON.stringify(updatedPeriods));
        
        if (updatedPeriods.length < 3) {
          toast.info('Add more periods for better predictions', {
            description: 'We need at least 3 periods for accurate predictions',
            duration: 5000,
          });
        }
        
        return;
      }
      
      const { data, error } = await supabase
        .from('periods')
        .insert({
          user_id: userId,
          start_date: period.startDate,
          end_date: period.endDate,
          description: period.description,
          symptoms: period.symptoms,
          mood: period.mood,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newPeriod = {
        id: data.id,
        startDate: data.start_date,
        endDate: data.end_date,
        description: data.description,
        symptoms: data.symptoms,
        mood: data.mood,
      };
      
      const updatedPeriods = [newPeriod, ...periods];
      setPeriods(updatedPeriods);
      localStorage.setItem('periodData', JSON.stringify(updatedPeriods));
      
      if (updatedPeriods.length < 3) {
        toast.info('Add more periods for better predictions', {
          description: 'We need at least 3 periods for accurate predictions',
          duration: 5000,
        });
      } else {
        try {
          const mlData = await predictNextPeriodML(userId);
          if (mlData) {
            setMlPrediction(mlData);
          }
        } catch (mlError) {
          console.error('Error getting ML prediction:', mlError);
        }
      }
      
    } catch (error) {
      console.error('Error adding period:', error);
      
      const newPeriod = {
        id: Date.now().toString(),
        ...period,
      };
      
      const updatedPeriods = [newPeriod, ...periods];
      setPeriods(updatedPeriods);
      localStorage.setItem('periodData', JSON.stringify(updatedPeriods));
      
      if (updatedPeriods.length < 3) {
        toast.info('Add more periods for better predictions', {
          description: 'We need at least 3 periods for accurate predictions',
          duration: 5000,
        });
      }
    }
  };

  const updatePeriod = async (id: string, periodUpdate: Partial<PeriodData>) => {
    try {
      if (!userId) return;
      
      const { error } = await supabase
        .from('periods')
        .update({
          start_date: periodUpdate.startDate,
          end_date: periodUpdate.endDate,
          description: periodUpdate.description,
          symptoms: periodUpdate.symptoms,
          mood: periodUpdate.mood,
        })
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setPeriods(prev => 
        prev.map(period => 
          period.id === id ? { ...period, ...periodUpdate } : period
        )
      );
      
      if (periods.length >= 2) {
        const mlData = await predictNextPeriodML(userId);
        if (mlData) {
          setMlPrediction({
            nextPeriod: {
              startDate: mlData.next_start_date,
              endDate: mlData.next_end_date,
            },
            averageCycle: mlData.average_cycle,
            confidence: mlData.confidence,
          });
        }
      }
      
    } catch (error) {
      console.error('Error updating period:', error);
      setPeriods(prev => 
        prev.map(period => 
          period.id === id ? { ...period, ...periodUpdate } : period
        )
      );
    }
  };

  const deletePeriod = async (id: string) => {
    try {
      if (!userId) return;
      
      const { error } = await supabase
        .from('periods')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setPeriods(prev => prev.filter(period => period.id !== id));
      
      if (periods.length > 3) {
        const mlData = await predictNextPeriodML(userId);
        if (mlData) {
          setMlPrediction({
            nextPeriod: {
              startDate: mlData.next_start_date,
              endDate: mlData.next_end_date,
            },
            averageCycle: mlData.average_cycle,
            confidence: mlData.confidence,
          });
        }
      }
      
    } catch (error) {
      console.error('Error deleting period:', error);
      setPeriods(prev => prev.filter(period => period.id !== id));
    }
  };

  const latestPeriod = periods.length > 0 ? periods[0] : null;

  const predictNextPeriod = async () => {
    if (mlPrediction.nextPeriod && mlPrediction.confidence && mlPrediction.confidence > 0.7) {
      return mlPrediction.nextPeriod;
    }
    
    if (periods.length < 2) {
      return null;
    }
    
    const sortedPeriods = [...periods].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    let totalDays = 0;
    let count = 0;
    
    for (let i = 1; i < sortedPeriods.length; i++) {
      const current = new Date(sortedPeriods[i].startDate);
      const previous = new Date(sortedPeriods[i-1].startDate);
      const difference = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
      
      if (difference > 0 && difference < 60) {
        totalDays += difference;
        count++;
      }
    }
    
    if (count === 0) return null;
    
    const averageCycle = Math.round(totalDays / count);
    
    if (!latestPeriod) return null;
    
    const lastStartDate = new Date(latestPeriod.startDate);
    const nextStartDate = new Date(lastStartDate);
    nextStartDate.setDate(lastStartDate.getDate() + averageCycle);
    
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
      predictNextPeriod,
      isLoading,
      mlPrediction,
    }}>
      {children}
    </PeriodContext.Provider>
  );
};

export const usePeriods = () => useContext(PeriodContext);
