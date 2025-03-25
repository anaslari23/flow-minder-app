import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, differenceInDays, isBefore, isAfter, isEqual } from 'date-fns';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon, PlusIcon, CalendarIcon, BarChart4Icon } from 'lucide-react';
import Layout from '@/components/Layout';
import { usePeriods } from '@/contexts/PeriodContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
const Insights: React.FC = () => {
  const navigate = useNavigate();
  const {
    periods,
    predictNextPeriod,
    isLoading,
    mlPrediction
  } = usePeriods();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [predictionData, setPredictionData] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  const [showNoDataMessage, setShowNoDataMessage] = useState(false);

  // Fetch prediction data when component mounts or periods change
  useEffect(() => {
    const fetchPrediction = async () => {
      const prediction = await predictNextPeriod();
      setPredictionData(prediction);

      // Show message if not enough data
      if (periods.length < 2 && !isLoading) {
        setShowNoDataMessage(true);
      } else {
        setShowNoDataMessage(false);
      }
    };
    fetchPrediction();
  }, [periods, predictNextPeriod, isLoading]);

  // Calculate average cycle length
  const calculateAverageCycle = () => {
    // If we have ML prediction with good confidence, use it
    if (mlPrediction.averageCycle && mlPrediction.confidence && mlPrediction.confidence > 0.6) {
      return mlPrediction.averageCycle;
    }
    if (periods.length < 2) return null;

    // Sort periods by start date
    const sortedPeriods = [...periods].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // Calculate differences
    let totalDays = 0;
    let count = 0;
    for (let i = 1; i < sortedPeriods.length; i++) {
      const current = new Date(sortedPeriods[i].startDate);
      const previous = new Date(sortedPeriods[i - 1].startDate);
      const difference = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
      if (difference > 0 && difference < 60) {
        // Ignore outliers
        totalDays += difference;
        count++;
      }
    }
    return count > 0 ? Math.round(totalDays / count) : null;
  };

  // Calculate shortest and longest cycles
  const calculateCycleExtremes = () => {
    if (periods.length < 2) return {
      shortest: null,
      longest: null
    };

    // Sort periods by start date
    const sortedPeriods = [...periods].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // Calculate cycle lengths
    const cycleLengths: number[] = [];
    for (let i = 1; i < sortedPeriods.length; i++) {
      const current = new Date(sortedPeriods[i].startDate);
      const previous = new Date(sortedPeriods[i - 1].startDate);
      const difference = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
      if (difference > 0 && difference < 60) {
        // Ignore outliers
        cycleLengths.push(difference);
      }
    }
    if (cycleLengths.length === 0) return {
      shortest: null,
      longest: null
    };
    return {
      shortest: Math.min(...cycleLengths),
      longest: Math.max(...cycleLengths)
    };
  };

  // Calculate average period duration
  const calculateAverageDuration = () => {
    if (periods.length === 0) return null;
    let totalDuration = 0;
    let periodCount = 0;
    periods.forEach(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (duration > 0 && duration < 15) {
        // Ignore outliers
        totalDuration += duration;
        periodCount++;
      }
    });
    return periodCount > 0 ? Math.round(totalDuration / periodCount) : 5; // Default to 5 days if no valid data
  };

  // Calculate ovulation date and fertile window
  const calculateOvulation = () => {
    // If we have ML prediction, use it
    if (mlPrediction.nextPeriod && mlPrediction.confidence && mlPrediction.confidence > 0.6) {
      const nextStart = new Date(mlPrediction.nextPeriod.startDate);

      // Ovulation typically 14 days before next period
      const ovulationDate = new Date(nextStart);
      ovulationDate.setDate(nextStart.getDate() - 14);

      // Fertile window is ~5 days before ovulation and day of ovulation
      const fertileStart = new Date(ovulationDate);
      fertileStart.setDate(ovulationDate.getDate() - 5);
      const fertileEnd = new Date(ovulationDate);
      fertileEnd.setDate(ovulationDate.getDate() + 1);
      return {
        ovulationDate,
        fertileWindow: {
          start: fertileStart,
          end: fertileEnd
        }
      };
    }
    if (!predictionData) return null;
    const nextStart = new Date(predictionData.startDate);

    // Ovulation typically 14 days before next period
    const ovulationDate = new Date(nextStart);
    ovulationDate.setDate(nextStart.getDate() - 14);

    // Fertile window is ~5 days before ovulation and day of ovulation
    const fertileStart = new Date(ovulationDate);
    fertileStart.setDate(ovulationDate.getDate() - 5);
    const fertileEnd = new Date(ovulationDate);
    fertileEnd.setDate(ovulationDate.getDate() + 1);
    return {
      ovulationDate,
      fertileWindow: {
        start: fertileStart,
        end: fertileEnd
      }
    };
  };
  const averageCycle = calculateAverageCycle();
  const {
    shortest: shortestCycle,
    longest: longestCycle
  } = calculateCycleExtremes();
  const averageDuration = calculateAverageDuration();
  const ovulationInfo = calculateOvulation();

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
    const currentMonthDates = Array.from({
      length: daysInMonth
    }, (_, i) => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1));

    // Check if each day falls within a period
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const isPeriodDay = periods.some(period => {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        return (isEqual(date, start) || isAfter(date, start)) && (isEqual(date, end) || isBefore(date, end));
      });
      const isPredictedPeriodDay = predictionData && (isEqual(date, new Date(predictionData.startDate)) || isAfter(date, new Date(predictionData.startDate))) && (isEqual(date, new Date(predictionData.endDate)) || isBefore(date, new Date(predictionData.endDate)));
      const isMLPredictedDay = mlPrediction.nextPeriod && (isEqual(date, new Date(mlPrediction.nextPeriod.startDate)) || isAfter(date, new Date(mlPrediction.nextPeriod.startDate))) && (isEqual(date, new Date(mlPrediction.nextPeriod.endDate)) || isBefore(date, new Date(mlPrediction.nextPeriod.endDate)));
      const isOvulationDay = ovulationInfo && isEqual(date.setHours(0, 0, 0, 0), ovulationInfo.ovulationDate.setHours(0, 0, 0, 0));
      const isFertileDay = ovulationInfo && (isEqual(date, ovulationInfo.fertileWindow.start) || isAfter(date, ovulationInfo.fertileWindow.start)) && (isEqual(date, ovulationInfo.fertileWindow.end) || isBefore(date, ovulationInfo.fertileWindow.end));
      days.push(<div key={i} className={`h-8 w-8 flex items-center justify-center rounded-full text-sm ${isPeriodDay ? 'bg-period text-white' : isMLPredictedDay ? 'bg-purple-500/20 text-purple-500 border border-purple-500' : isPredictedPeriodDay ? 'bg-period-light text-period border border-period' : isOvulationDay ? 'bg-emerald-500 text-white' : isFertileDay ? 'bg-emerald-100 text-emerald-700 border border-emerald-500' : ''}`}>
          {i}
        </div>);
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
  const daysUntilNext = predictionData ? differenceInDays(new Date(predictionData.startDate), new Date()) : null;
  const handleAddPeriod = () => {
    navigate('/add-period');
    toast.info('Add at least 2-3 periods for accurate predictions');
  };

  // Format the prediction date nicely
  const formatPredictionDate = () => {
    if (mlPrediction.nextPeriod) {
      return format(new Date(mlPrediction.nextPeriod.startDate), 'MMM d, yyyy');
    } else if (predictionData) {
      return format(new Date(predictionData.startDate), 'MMM d, yyyy');
    }
    return 'Add more periods';
  };
  return <Layout>
      <motion.div className="flex flex-col w-full mb-6" initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5
    }}>
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate('/dashboard')}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-medium">Insights</h1>
        </div>
        
        {showNoDataMessage && <Alert className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircleIcon className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-800">
              Add at least 2-3 periods for accurate predictions and insights.
              <Button variant="outline" size="sm" className="ml-2 border-amber-500 text-amber-700 hover:bg-amber-100" onClick={handleAddPeriod}>
                <PlusIcon className="h-3.5 w-3.5 mr-1" /> Add Period
              </Button>
            </AlertDescription>
          </Alert>}
        
        {/* Main data cards grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Next Period Prediction Card */}
          <Card className="col-span-2 sm:col-span-1 row-span-2 bg-white shadow-md">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full">
              <h2 className="text-xl font-bold mb-4 text-zinc-950">Next Period Prediction</h2>
              <div className="mb-4">
                <CalendarIcon className="h-16 w-16 text-period" />
              </div>
              {isLoading ? <Skeleton className="h-6 w-32 mb-2" /> : <div className="text-xl font-semibold text-period">
                  {formatPredictionDate()}
                </div>}
              {!isLoading && daysUntilNext !== null && <div className="text-sm text-muted-foreground mt-2">
                  {daysUntilNext <= 0 ? 'Expected today' : `In ${daysUntilNext} days`}
                </div>}
            </CardContent>
          </Card>
          
          {/* Average Cycle Days Card */}
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-slate-950">Avg. Cycle Days</h3>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold flex items-center bg-zinc-950">
                  {averageCycle ? <>
                      <span>{averageCycle} days</span>
                      {mlPrediction.confidence && mlPrediction.confidence > 0.7 && <TooltipProvider>
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
                        </TooltipProvider>}
                    </> : 'N/A'}
                </div>}
            </CardContent>
          </Card>
          
          {/* Shortest Cycle Card */}
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-zinc-950">Shortest Cycle</h3>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold bg-zinc-950">
                  {shortestCycle ? `${shortestCycle} days` : 'N/A'}
                </div>}
            </CardContent>
          </Card>
          
          {/* Longest Cycle Card */}
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-zinc-950">Longest Cycle</h3>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold bg-zinc-950">
                  {longestCycle ? `${longestCycle} days` : 'N/A'}
                </div>}
            </CardContent>
          </Card>
          
          {/* Ovulating Days Card */}
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-zinc-950">Ovulating Days</h3>
              {isLoading ? <Skeleton className="h-8 w-full" /> : <div>
                  {ovulationInfo ? <>
                      <div className="text-xl font-bold mb-1 text-emerald-600">
                        {format(ovulationInfo.ovulationDate, 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Fertility window: {format(ovulationInfo.fertileWindow.start, 'MMM d')} - {format(ovulationInfo.fertileWindow.end, 'MMM d')}
                      </div>
                    </> : 'Add more periods'}
                </div>}
            </CardContent>
          </Card>
          
          {/* Best Time to Conceive Card */}
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-zinc-950">Best time to conceive</h3>
              {isLoading ? <Skeleton className="h-8 w-full" /> : <div>
                  {ovulationInfo ? <div className="text-xl font-bold mb-1 text-emerald-600">
                      {format(ovulationInfo.fertileWindow.start, 'MMM d')} - {format(ovulationInfo.fertileWindow.end, 'MMM d')}
                    </div> : 'Add more periods'}
                </div>}
            </CardContent>
          </Card>
        </div>
        
        {/* Calendar */}
        <div className="bg-secondary rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Calendar</h2>
            <div className="text-sm font-medium">
              {currentMonth.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric'
            })}
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
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <div key={i} className="h-8 w-8 flex items-center justify-center text-xs text-muted-foreground">
                {day}
              </div>)}
          </div>
          
          {isLoading ? <div className="grid grid-cols-7 gap-1">
              {Array(35).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-8 rounded-full" />)}
            </div> : <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>}
          
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
            <div className="flex items-center">
              <div className="h-3 w-3 bg-emerald-500 rounded-full mr-1"></div>
              <span>Ovulation</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-emerald-100 border border-emerald-500 rounded-full mr-1"></div>
              <span>Fertile</span>
            </div>
          </div>
        </div>
        
        <div className="bg-secondary rounded-2xl p-4">
          <h3 className="text-sm text-muted-foreground mb-1">Prediction Accuracy</h3>
          {isLoading ? <Skeleton className="h-8 w-full" /> : <div className="mt-2">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-green-500" style={{
              width: `${mlPrediction.confidence ? mlPrediction.confidence * 100 : periods.length > 3 ? 70 : periods.length > 1 ? 40 : 20}%`
            }} />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Low</span>
                <span>
                  {mlPrediction.confidence ? `${Math.round(mlPrediction.confidence * 100)}% accuracy` : periods.length > 3 ? 'Good accuracy' : periods.length > 1 ? 'Limited accuracy' : 'Add more periods'}
                </span>
                <span>High</span>
              </div>
            </div>}
        </div>
      </motion.div>
    </Layout>;
};
export default Insights;