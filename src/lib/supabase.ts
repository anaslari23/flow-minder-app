
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

// ML prediction utility with enhanced error handling
export const predictNextPeriodML = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('predict_next_period', { user_id: userId });
    
    if (error) {
      console.error('Error predicting next period:', error);
      return null;
    }
    
    return data;
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
