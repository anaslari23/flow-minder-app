
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables or use defaults for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-actual-project-url.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-actual-anon-key';

// Provide helpful error message if keys are missing
if (supabaseUrl === 'https://your-actual-project-url.supabase.co') {
  console.warn('⚠️ Using placeholder Supabase URL. Set VITE_SUPABASE_URL in your environment to connect to your Supabase project.');
}

if (supabaseKey === 'your-actual-anon-key') {
  console.warn('⚠️ Using placeholder Supabase anon key. Set VITE_SUPABASE_ANON_KEY in your environment to connect to your Supabase project.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'period-tracker-auth',
    debug: false
  }
});

// Check if using local-only mode (when Supabase is not properly configured)
export const isLocalMode = () => {
  return supabaseUrl === 'https://your-actual-project-url.supabase.co' || 
         supabaseKey === 'your-actual-anon-key';
};

// Types for database tables
export type UserProfile = {
  id: string;
  name: string;
  date_of_birth: string;
  occupation: string;
  onboarded: boolean;
  created_at: string;
}

export type PeriodRecord = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  description?: string;
  symptoms?: string[];
  mood?: string;
  created_at: string;
}

// Extended prediction type
export type PeriodPrediction = {
  nextPeriod: { startDate: string; endDate: string } | null;
  averageCycle: number | null;
  shortestCycle: number | null;
  longestCycle: number | null;
  ovulationDate: string | null;
  fertilityWindow: { start: string; end: string } | null;
  confidence: number | null;
};

// ML prediction utility with enhanced error handling
export const predictNextPeriodML = async (userId: string): Promise<PeriodPrediction | null> => {
  try {
    const { data, error } = await supabase
      .rpc('predict_next_period', { user_id: userId });
    
    if (error) {
      console.error('Error predicting next period:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      nextPeriod: {
        startDate: data.next_start_date,
        endDate: data.next_end_date
      },
      averageCycle: data.average_cycle,
      shortestCycle: data.shortest_cycle || null,
      longestCycle: data.longest_cycle || null,
      ovulationDate: data.ovulation_date || null,
      fertilityWindow: data.fertility_window ? {
        start: data.fertility_window.start,
        end: data.fertility_window.end
      } : null,
      confidence: data.confidence
    };
  } catch (e) {
    console.error('Failed to execute ML prediction:', e);
    return null;
  }
};

// Calculate average cycle with ML enhancement with enhanced error handling
export const calculateCycleWithML = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('calculate_cycle_ml', { user_id: userId });
    
    if (error) {
      console.error('Error calculating cycle with ML:', error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('Failed to execute ML cycle calculation:', e);
    return null;
  }
};

// Helper function to calculate cycle statistics from period data
export const calculateCycleStats = (periods: PeriodRecord[]): Partial<PeriodPrediction> => {
  if (periods.length < 2) return {};
  
  // Sort periods by start date
  const sortedPeriods = [...periods].sort(
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
  
  if (cycleLengths.length === 0) return {};
  
  // Calculate statistics
  const averageCycle = Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
  const shortestCycle = Math.min(...cycleLengths);
  const longestCycle = Math.max(...cycleLengths);
  
  // Calculate ovulation (typically 14 days before next period)
  const lastStartDate = new Date(sortedPeriods[sortedPeriods.length - 1].start_date);
  const nextStartDate = new Date(lastStartDate);
  nextStartDate.setDate(lastStartDate.getDate() + averageCycle);
  
  const ovulationDate = new Date(nextStartDate);
  ovulationDate.setDate(nextStartDate.getDate() - 14);
  
  // Calculate fertility window (5 days before ovulation and day of ovulation)
  const fertilityStart = new Date(ovulationDate);
  fertilityStart.setDate(ovulationDate.getDate() - 5);
  
  const fertilityEnd = new Date(ovulationDate);
  fertilityEnd.setDate(ovulationDate.getDate() + 1);
  
  return {
    averageCycle,
    shortestCycle,
    longestCycle,
    ovulationDate: ovulationDate.toISOString().split('T')[0],
    fertilityWindow: {
      start: fertilityStart.toISOString().split('T')[0],
      end: fertilityEnd.toISOString().split('T')[0]
    }
  };
};
