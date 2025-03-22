
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, differenceInDays, addDays } from 'date-fns';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import { usePeriods, PeriodData } from '@/contexts/PeriodContext';
import { Button } from '@/components/ui/button';

const Insights: React.FC = () => {
  const navigate = useNavigate();
  const { periods, predictNextPeriod } = usePeriods();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const prediction = predictNextPeriod();
  
  // Calculate average cycle length
  const calculateAverageCycle = () => {
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
      
      const isPredictedPeriodDay = prediction && (
        date >= new Date(prediction.startDate) && 
        date <= new Date(prediction.endDate)
      );
      
      days.push(
        <div 
          key={i}
          className={`h-8 w-8 flex items-center justify-center rounded-full text-sm ${
            isPeriodDay 
              ? 'bg-period text-white' 
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
          
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
          
          <div className="mt-4 flex space-x-4 text-xs">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-period rounded-full mr-1"></div>
              <span>Period</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-period-light border border-period rounded-full mr-1"></div>
              <span>Predicted</span>
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
              <div className="text-lg font-medium">
                {prediction ? format(new Date(prediction.startDate), 'MMM d') : 'N/A'}
              </div>
            </div>
            
            <div className="bg-secondary rounded-2xl p-4">
              <h3 className="text-sm text-muted-foreground mb-1">Ovulating Days</h3>
              <div className="text-lg font-medium">
                {averageCycle ? `~${Math.floor(averageCycle / 2)} days` : 'N/A'}
              </div>
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
              <div className="text-lg font-medium">
                {averageCycle ? `${averageCycle} days` : 'N/A'}
              </div>
            </div>
            
            <div className="bg-secondary rounded-2xl p-4">
              <h3 className="text-sm text-muted-foreground mb-1">Average Duration</h3>
              <div className="text-lg font-medium">
                {averageDuration ? `${averageDuration} days` : 'N/A'}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Insights;
