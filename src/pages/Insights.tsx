
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import { usePeriods } from '@/contexts/PeriodContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Insights: React.FC = () => {
  const navigate = useNavigate();
  const { periods, predictNextPeriod, isLoading, mlPrediction } = usePeriods();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [predictionData, setPredictionData] = useState<{ startDate: string; endDate: string } | null>(null);
  
  // Fetch prediction data when component mounts or periods change
  useEffect(() => {
    const fetchPrediction = async () => {
      const prediction = await predictNextPeriod();
      setPredictionData(prediction);
    };
    
    fetchPrediction();
  }, [periods, predictNextPeriod]);
  
  // Calculate average cycle length
  const calculateAverageCycle = () => {
    // If we have ML prediction with good confidence, use it
    if (mlPrediction.averageCycle && mlPrediction.confidence && mlPrediction.confidence > 0.6) {
      return mlPrediction.averageCycle;
    }
    
    if (periods.length < 2) return null;
    
    // Sort periods by start date
    const sortedPeriods = [...periods].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    
    // Calculate differences
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
    
    return count > 0 ? Math.round(totalDays / count) : null;
  };
  
  // Calculate average period duration
  const calculateAverageDuration = () => {
    if (periods.length === 0) return null;
    
    let totalDuration = 0;
    
    periods.forEach(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      totalDuration += duration;
    });
    
    return Math.round(totalDuration / periods.length);
  };
  
  const averageCycle = calculateAverageCycle();
  const averageDuration = calculateAverageDuration();
  
  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };
  
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }
    
    // Create date objects for all days in the current month
    const currentMonthDates = Array.from(
      { length: daysInMonth },
      (_, i) => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1)
    );
    
    // Check if each day falls within a period
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const isPeriodDay = periods.some(period => {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        return date >= start && date <= end;
      });
      
      const isPredictedPeriodDay = predictionData && (
        date >= new Date(predictionData.startDate) && 
        date <= new Date(predictionData.endDate)
      );
      
      const isMLPredictedDay = mlPrediction.nextPeriod && (
        date >= new Date(mlPrediction.nextPeriod.startDate) && 
        date <= new Date(mlPrediction.nextPeriod.endDate)
      );
      
      days.push(
        <div 
          key={i}
          className={`h-8 w-8 flex items-center justify-center rounded-full text-sm ${
            isPeriodDay 
              ? 'bg-period text-white' 
              : isMLPredictedDay 
                ? 'bg-purple-500/20 text-purple-500 border border-purple-500'
                : isPredictedPeriodDay 
                  ? 'bg-period-light text-period border border-period'
                  : ''
          }`}
        >
          {i}
        </div>
      );
    }
    
    return days;
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Calculate days until next period
  const daysUntilNext = predictionData ? 
    differenceInDays(new Date(predictionData.startDate), new Date()) : 
    null;

  return (
    <Layout>
      <motion.div
        className="flex flex-col w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-2" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-medium">Insights</h1>
        </div>
        
        <div className="bg-secondary rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Calendar</h2>
            <div className="text-sm font-medium">
              {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <div className="font-medium">
              This Month
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="h-8 w-8 flex items-center justify-center text-xs text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array(35).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          )}
          
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-period rounded-full mr-1"></div>
              <span>Period</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-period-light border border-period rounded-full mr-1"></div>
              <span>Predicted</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-purple-500/20 border border-purple-500 rounded-full mr-1"></div>
              <span>ML Prediction</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-secondary rounded-2xl p-4">
              <h3 className="text-sm text-muted-foreground mb-1">Next Period Prediction</h3>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-lg font-medium flex items-center">
                  {mlPrediction.nextPeriod ? (
                    <>
                      <span>{format(new Date(mlPrediction.nextPeriod.startDate), 'MMM d')}</span>
                      {mlPrediction.confidence && mlPrediction.confidence > 0.8 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="ml-2 text-green-500">
                                <AlertCircleIcon className="h-4 w-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>High confidence prediction ({Math.round(mlPrediction.confidence * 100)}%)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </>
                  ) : predictionData ? format(new Date(predictionData.startDate), 'MMM d') : 'N/A'}
                </div>
              )}
            </div>
            
            <div className="bg-secondary rounded-2xl p-4">
              <h3 className="text-sm text-muted-foreground mb-1">Days Until Next</h3>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-lg font-medium">
                  {daysUntilNext !== null ? `${daysUntilNext} days` : 'N/A'}
                </div>
              )}
            </div>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-secondary rounded-2xl p-4">
              <h3 className="text-sm text-muted-foreground mb-1">Average Cycle</h3>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-lg font-medium flex items-center">
                  {averageCycle ? (
                    <>
                      <span>{averageCycle} days</span>
                      {mlPrediction.confidence && mlPrediction.confidence > 0.7 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="ml-2 text-green-500">
                                <AlertCircleIcon className="h-4 w-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>ML enhanced prediction</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </>
                  ) : 'N/A'}
                </div>
              )}
            </div>
            
            <div className="bg-secondary rounded-2xl p-4">
              <h3 className="text-sm text-muted-foreground mb-1">Average Duration</h3>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-lg font-medium">
                  {averageDuration ? `${averageDuration} days` : 'N/A'}
                </div>
              )}
            </div>
          </motion.div>
          
          <motion.div
            className="bg-secondary rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-sm text-muted-foreground mb-1">Prediction Accuracy</h3>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="mt-2">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-green-500" 
                    style={{ 
                      width: `${mlPrediction.confidence ? mlPrediction.confidence * 100 : periods.length > 3 ? 70 : 40}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Low</span>
                  <span>
                    {mlPrediction.confidence 
                      ? `${Math.round(mlPrediction.confidence * 100)}% accuracy` 
                      : periods.length > 3 ? 'Good accuracy' : 'Needs more data'}
                  </span>
                  <span>High</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Insights;
