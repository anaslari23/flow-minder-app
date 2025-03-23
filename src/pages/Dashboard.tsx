
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, ChevronDownIcon, BarChart3Icon, PlusCircleIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { usePeriods } from '@/contexts/PeriodContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userData, isLoading: userLoading } = useUser();
  const { periods, latestPeriod, predictNextPeriod, isLoading: periodsLoading, mlPrediction } = usePeriods();
  const [mood, setMood] = useState<string>('');
  const [prediction, setPrediction] = useState<{ startDate: string; endDate: string } | null>(null);
  
  const isLoading = userLoading || periodsLoading;
  
  // Fetch prediction when component mounts
  useEffect(() => {
    const fetchPrediction = async () => {
      const pred = await predictNextPeriod();
      setPrediction(pred);
    };
    
    fetchPrediction();
  }, [predictNextPeriod, periods]);
  
  const moodOptions = [
    { label: 'Happy', value: 'happy', icon: '😊' },
    { label: 'Normal', value: 'normal', icon: '😐' },
    { label: 'Tired', value: 'tired', icon: '😴' },
    { label: 'Stressed', value: 'stressed', icon: '😰' },
    { label: 'Energetic', value: 'energetic', icon: '⚡' },
  ];

  const saveMood = () => {
    if (!mood) return;
    
    // In a real app, you'd save this to the database
    toast({
      title: "Mood saved",
      description: `You're feeling ${moodOptions.find(m => m.value === mood)?.label.toLowerCase()} today`,
    });
  };
  
  // Calculate days until next period - prefer ML prediction if available
  const nextPrediction = mlPrediction.nextPeriod && mlPrediction.confidence && mlPrediction.confidence > 0.7 
    ? mlPrediction.nextPeriod 
    : prediction;
    
  const daysUntilNext = nextPrediction ? 
    differenceInDays(new Date(nextPrediction.startDate), new Date()) : 
    null;

  return (
    <Layout className="py-8">
      <motion.div
        className="flex flex-col w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-40" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-medium">Hello, {userData.name}</h1>
                <p className="text-muted-foreground">Track your cycle today</p>
              </>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => navigate('/insights')}
            >
              <BarChart3Icon className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="mb-8 bg-secondary p-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-lg font-medium mb-4">How are you feeling right now?</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between bg-muted border-0"
              >
                {mood ? (
                  <span className="flex items-center">
                    <span className="mr-2">
                      {moodOptions.find(option => option.value === mood)?.icon}
                    </span>
                    {moodOptions.find(option => option.value === mood)?.label}
                  </span>
                ) : "Select your mood"}
                <ChevronDownIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="max-h-[200px] overflow-auto">
                {moodOptions.map((option) => (
                  <div
                    key={option.value}
                    className="px-4 py-2 cursor-pointer hover:bg-muted flex items-center"
                    onClick={() => {
                      setMood(option.value);
                      saveMood();
                    }}
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>
        
        {/* Last period info */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-lg font-medium mb-4">Last Period</h2>
          <div className="bg-secondary p-6 rounded-2xl">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ) : latestPeriod ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Start Date</span>
                  <span className="font-medium">{format(new Date(latestPeriod.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span>End Date</span>
                  <span className="font-medium">{format(new Date(latestPeriod.endDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="font-medium">
                    {differenceInDays(
                      new Date(latestPeriod.endDate),
                      new Date(latestPeriod.startDate)
                    ) + 1} days
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No period data yet</p>
            )}
          </div>
        </motion.div>
        
        {/* Next predicted period */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className="text-lg font-medium mb-4">Next Period Prediction</h2>
          <div className="bg-secondary p-6 rounded-2xl">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ) : nextPrediction ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Expected Start</span>
                  <span className="font-medium">
                    {format(new Date(nextPrediction.startDate), 'MMM d, yyyy')}
                    {mlPrediction.confidence && mlPrediction.confidence > 0.8 && (
                      <span className="ml-2 text-xs text-green-500">(ML enhanced)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Days Until</span>
                  <span className="font-medium text-period">{daysUntilNext} days</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Add more period data to enable predictions
              </p>
            )}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-auto"
        >
          <Button 
            onClick={() => navigate('/add-period')}
            className="w-full bg-period hover:bg-period-dark text-white py-6 rounded-full flex items-center justify-center"
          >
            <PlusCircleIcon className="mr-2 h-5 w-5" />
            Add Period
          </Button>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
