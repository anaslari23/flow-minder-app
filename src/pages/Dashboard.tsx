
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, addDays, differenceInDays } from 'date-fns';
import { CalendarIcon, ChevronDownIcon, BarChart3Icon, PlusCircleIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { usePeriods } from '@/contexts/PeriodContext';
import { Button } from '@/components/ui/button';
import { DatePickerInput } from '@/components/FormComponents';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const { periods, latestPeriod, predictNextPeriod } = usePeriods();
  const [mood, setMood] = useState<string>('');
  
  const moodOptions = [
    { label: 'Happy', value: 'happy' },
    { label: 'Normal', value: 'normal' },
    { label: 'Tired', value: 'tired' },
    { label: 'Stressed', value: 'stressed' },
    { label: 'Energetic', value: 'energetic' },
  ];

  const prediction = predictNextPeriod();
  
  // Calculate days until next period
  const daysUntilNext = prediction ? 
    differenceInDays(new Date(prediction.startDate), new Date()) : 
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
            <h1 className="text-2xl font-medium">Hello, {userData.name}</h1>
            <p className="text-muted-foreground">Track your cycle today</p>
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
                {mood ? moodOptions.find(option => option.value === mood)?.label : "Select your mood"}
                <ChevronDownIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="max-h-[200px] overflow-auto">
                {moodOptions.map((option) => (
                  <div
                    key={option.value}
                    className="px-4 py-2 cursor-pointer hover:bg-muted"
                    onClick={() => setMood(option.value)}
                  >
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
            {latestPeriod ? (
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
        {prediction && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <h2 className="text-lg font-medium mb-4">Next Period Prediction</h2>
            <div className="bg-secondary p-6 rounded-2xl">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Expected Start</span>
                  <span className="font-medium">{format(new Date(prediction.startDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Days Until</span>
                  <span className="font-medium text-period">{daysUntilNext} days</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
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
