
-- Create the user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  date_of_birth DATE,
  occupation TEXT,
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the periods table
CREATE TABLE IF NOT EXISTS periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  symptoms TEXT[],
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to calculate average cycle length
CREATE OR REPLACE FUNCTION calculate_average_cycle(user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  avg_cycle NUMERIC;
BEGIN
  SELECT AVG(next_start - start_date)
  INTO avg_cycle
  FROM (
    SELECT 
      start_date,
      LEAD(start_date) OVER (ORDER BY start_date) as next_start
    FROM periods
    WHERE periods.user_id = calculate_average_cycle.user_id
    ORDER BY start_date
  ) as cycle_data
  WHERE next_start IS NOT NULL;
  
  RETURN avg_cycle;
END;
$$ LANGUAGE plpgsql;

-- Create function to predict next period with ML and enhanced statistics
CREATE OR REPLACE FUNCTION predict_next_period(user_id UUID)
RETURNS JSON AS $$
DECLARE
  latest_period RECORD;
  avg_cycle NUMERIC;
  avg_duration NUMERIC;
  shortest_cycle NUMERIC;
  longest_cycle NUMERIC;
  predicted_start DATE;
  predicted_end DATE;
  cycle_regularity NUMERIC;
  confidence NUMERIC;
  total_periods INTEGER;
  ovulation_date DATE;
  fertility_window_start DATE;
  fertility_window_end DATE;
  result JSON;
BEGIN
  -- Get the latest period
  SELECT * FROM periods
  WHERE periods.user_id = predict_next_period.user_id
  ORDER BY start_date DESC
  LIMIT 1
  INTO latest_period;
  
  IF latest_period IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate average cycle length
  avg_cycle := calculate_average_cycle(user_id);
  
  -- Count total periods
  SELECT COUNT(*) FROM periods
  WHERE periods.user_id = predict_next_period.user_id
  INTO total_periods;
  
  -- Calculate average duration
  SELECT AVG(end_date - start_date + 1)
  FROM periods
  WHERE periods.user_id = predict_next_period.user_id
  INTO avg_duration;
  
  -- Calculate shortest and longest cycles
  SELECT MIN(next_start - start_date), MAX(next_start - start_date)
  FROM (
    SELECT 
      start_date,
      LEAD(start_date) OVER (ORDER BY start_date) as next_start
    FROM periods
    WHERE periods.user_id = predict_next_period.user_id
  ) as cycle_data
  WHERE next_start IS NOT NULL AND (next_start - start_date) BETWEEN 20 AND 45
  INTO shortest_cycle, longest_cycle;
  
  -- Calculate cycle regularity (standard deviation / mean)
  SELECT STDDEV(next_start - start_date) / AVG(next_start - start_date)
  FROM (
    SELECT 
      start_date,
      LEAD(start_date) OVER (ORDER BY start_date) as next_start
    FROM periods
    WHERE periods.user_id = predict_next_period.user_id
  ) as cycle_data
  WHERE next_start IS NOT NULL
  INTO cycle_regularity;
  
  -- Calculate prediction confidence (based on regularity and amount of data)
  -- More regular cycles and more data = higher confidence
  IF cycle_regularity IS NULL OR cycle_regularity = 0 THEN
    confidence := 0.5; -- Default confidence
  ELSE
    -- Scale from 0 to 1, where lower regularity = higher confidence
    -- Normalized to 0-1 range where 0.3 is a very regular cycle
    confidence := GREATEST(0.4, LEAST(1.0, 1.0 - (cycle_regularity / 0.3)));
  END IF;
  
  -- Adjust confidence based on total periods
  IF total_periods <= 2 THEN
    confidence := confidence * 0.5;
  ELSIF total_periods <= 4 THEN
    confidence := confidence * 0.7;
  ELSIF total_periods <= 6 THEN
    confidence := confidence * 0.85;
  END IF;
  
  -- Calculate predicted dates
  predicted_start := latest_period.start_date + (avg_cycle::INTEGER)::INTEGER;
  predicted_end := predicted_start + (avg_duration::INTEGER - 1)::INTEGER;
  
  -- Calculate ovulation date (typically 14 days before next period)
  ovulation_date := predicted_start - 14;
  
  -- Calculate fertility window (5 days before ovulation and day of ovulation + 1 day after)
  fertility_window_start := ovulation_date - 5;
  fertility_window_end := ovulation_date + 1;
  
  -- Return JSON result
  result := json_build_object(
    'next_start_date', predicted_start,
    'next_end_date', predicted_end,
    'average_cycle', ROUND(avg_cycle::NUMERIC, 1),
    'average_duration', ROUND(avg_duration::NUMERIC, 1),
    'shortest_cycle', shortest_cycle,
    'longest_cycle', longest_cycle,
    'ovulation_date', ovulation_date,
    'fertility_window', json_build_object(
      'start', fertility_window_start,
      'end', fertility_window_end
    ),
    'confidence', confidence,
    'total_periods', total_periods
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function for ML-enhanced cycle calculation
CREATE OR REPLACE FUNCTION calculate_cycle_ml(user_id UUID)
RETURNS JSON AS $$
DECLARE
  periods_data RECORD;
  cycle_prediction NUMERIC;
  fertility_window JSON;
  ovulation_date DATE;
  result JSON;
BEGIN
  -- Get prediction data
  SELECT * FROM predict_next_period(user_id) INTO periods_data;
  
  IF periods_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- For a real ML model, you'd use more sophisticated calculation
  -- but for this example we'll simulate ML enhancement
  cycle_prediction := (periods_data->>'average_cycle')::NUMERIC;
  
  -- Calculate ovulation date (typically 14 days before next period)
  ovulation_date := (periods_data->>'next_start_date')::DATE - 14;
  
  -- Calculate fertility window (5 days before, day of, and 1 day after ovulation)
  fertility_window := json_build_object(
    'start', ovulation_date - 5,
    'end', ovulation_date + 1
  );
  
  -- Return result
  result := json_build_object(
    'average_cycle', cycle_prediction,
    'ovulation_date', ovulation_date,
    'fertility_window', fertility_window,
    'confidence', (periods_data->>'confidence')::NUMERIC
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY user_profile_policy ON user_profiles
  FOR ALL USING (auth.uid() = id);
  
CREATE POLICY periods_policy ON periods
  FOR ALL USING (auth.uid() = user_id);
