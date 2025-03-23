
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import { usePeriods } from '@/contexts/PeriodContext';
import { Button } from '@/components/ui/button';
import { DatePickerInput, UnderlineInput } from '@/components/FormComponents';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDownIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const AddPeriod: React.FC = () => {
  const navigate = useNavigate();
  const { addPeriod } = usePeriods();
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const symptomOptions = [
    { label: 'Cramps', value: 'cramps' },
    { label: 'Headache', value: 'headache' },
    { label: 'Fatigue', value: 'fatigue' },
    { label: 'Bloating', value: 'bloating' },
    { label: 'Nausea', value: 'nausea' },
    { label: 'Backache', value: 'backache' },
    { label: 'Breast tenderness', value: 'breast-tenderness' },
  ];
  
  const moodOptions = [
    { label: 'Happy', value: 'happy', icon: '😊' },
    { label: 'Normal', value: 'normal', icon: '😐' },
    { label: 'Tired', value: 'tired', icon: '😴' },
    { label: 'Stressed', value: 'stressed', icon: '😰' },
    { label: 'Energetic', value: 'energetic', icon: '⚡' },
    { label: 'Irritable', value: 'irritable', icon: '😠' },
    { label: 'Sad', value: 'sad', icon: '😢' },
  ];

  const toggleSymptom = (value: string) => {
    setSymptoms(prev => 
      prev.includes(value)
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    setIsSubmitting(true);
    
    try {
      await addPeriod({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        description,
        symptoms,
        mood,
      });
      
      toast({
        title: "Period added",
        description: "Your period information has been saved",
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding period:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your period data",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          
          <div className="mt-4">
            <label className="text-sm text-muted-foreground block mb-2">Symptoms (optional)</label>
            <div className="grid grid-cols-2 gap-2">
              {symptomOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={option.value} 
                    checked={symptoms.includes(option.value)}
                    onCheckedChange={() => toggleSymptom(option.value)}
                  />
                  <label 
                    htmlFor={option.value}
                    className="text-sm cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="text-sm text-muted-foreground block mb-2">Mood (optional)</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full justify-between"
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
                      onClick={() => setMood(option.value)}
                    >
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="mt-6">
            <label className="text-sm text-muted-foreground mb-1 block">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this period..."
              className="h-20"
            />
          </div>
          
          <div className="mt-8">
            <Button 
              type="submit"
              className="w-full bg-period hover:bg-period-dark text-white py-6 rounded-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Period"}
            </Button>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
};

export default AddPeriod;
