
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { usePeriods } from '@/contexts/PeriodContext';
import { Button } from '@/components/ui/button';
import { DatePickerInput, UnderlineInput } from '@/components/FormComponents';
import { toast } from '@/components/ui/use-toast';

const AddPeriod: React.FC = () => {
  const navigate = useNavigate();
  const { addPeriod } = usePeriods();
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }
    
    if (endDate < startDate) {
      toast({
        title: "Invalid date range",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
      return;
    }
    
    addPeriod({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      description,
    });
    
    toast({
      title: "Period added",
      description: "Your period information has been saved",
    });
    
    navigate('/dashboard');
  };

  return (
    <Layout>
      <motion.div
        className="flex flex-col w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-medium">Add Period</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <DatePickerInput
            value={startDate}
            onChange={setStartDate}
            label="Start date?"
          />
          
          <DatePickerInput
            value={endDate}
            onChange={setEndDate}
            label="End date?"
          />
          
          <div className="mt-6">
            <label className="text-sm text-muted-foreground mb-1 block">Description (optional)</label>
            <UnderlineInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this period..."
              className="h-20 align-top"
              as="textarea"
            />
          </div>
          
          <div className="mt-8">
            <Button 
              type="submit"
              className="w-full bg-period hover:bg-period-dark text-white py-6 rounded-full"
            >
              Save Period
            </Button>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
};

export default AddPeriod;
