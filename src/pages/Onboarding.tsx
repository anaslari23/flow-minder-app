
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { UnderlineInput, DatePickerInput, SelectInput } from '@/components/FormComponents';
import { Button } from '@/components/ui/button';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserData } = useUser();
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [occupation, setOccupation] = useState('');

  const handleSubmit = () => {
    if (!name || !dateOfBirth) return;

    updateUserData({
      name,
      dateOfBirth: dateOfBirth.toISOString(),
      occupation,
      onboarded: true
    });

    navigate('/welcome');
  };

  const occupationOptions = [
    { label: 'Student', value: 'student' },
    { label: 'Employed', value: 'employed' },
    { label: 'Self-employed', value: 'self-employed' },
    { label: 'Homemaker', value: 'homemaker' },
    { label: 'Unemployed', value: 'unemployed' },
    { label: 'Retired', value: 'retired' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <Layout>
      <motion.div
        className="flex flex-col w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 flex items-center">
          <div className="mr-2 text-period">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 14H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="10" r="2" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium">
            Menstruation<br />Tracker
          </h1>
        </div>

        <form className="space-y-1" onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}>
          <UnderlineInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />

          <DatePickerInput
            value={dateOfBirth}
            onChange={setDateOfBirth}
            label="Date of Birth"
          />

          <SelectInput
            value={occupation}
            onChange={setOccupation}
            options={occupationOptions}
            label="Occupation"
            placeholder="Select occupation"
          />

          <div className="pt-6">
            <Button 
              type="submit"
              className="w-full bg-black border border-white/30 hover:border-white rounded-full py-6"
              disabled={!name || !dateOfBirth}
            >
              Continue
            </Button>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
};

export default Onboarding;
