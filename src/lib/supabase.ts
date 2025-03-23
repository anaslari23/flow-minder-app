
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseKey = 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

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

// ML prediction utility
export const predictNextPeriodML = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('predict_next_period', { user_id: userId });
  
  if (error) {
    console.error('Error predicting next period:', error);
    return null;
  }
  
  return data;
};

// Calculate average cycle with ML enhancement
export const calculateCycleWithML = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('calculate_cycle_ml', { user_id: userId });
  
  if (error) {
    console.error('Error calculating cycle with ML:', error);
    return null;
  }
  
  return data;
};
