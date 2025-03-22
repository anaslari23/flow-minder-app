
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';

const IntroScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isOnboarded } = useUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, isOnboarded]);

  return (
    <Layout className="bg-black">
      <motion.div
        className="flex flex-col items-center justify-center space-y-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-[#F8D7DA] rounded-full p-10 mb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="2" width="16" height="20" rx="2" stroke="#E63946" strokeWidth="2" />
              <path d="M8 10H16" stroke="#E63946" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 14H16" stroke="#E63946" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="10" r="2" fill="#E63946" />
            </svg>
          </motion.div>
        </div>
        <motion.h1
          className="text-xl font-semibold text-white mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Menstruation
        </motion.h1>
        <motion.p
          className="text-lg font-medium text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          Cycle Tracker
        </motion.p>
      </motion.div>
    </Layout>
  );
};

export default IntroScreen;
