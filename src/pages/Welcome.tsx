
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { userData, setIsOnboarded } = useUser();

  const handleGetStarted = () => {
    setIsOnboarded(true);
    navigate('/dashboard');
  };

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <Layout>
      <motion.div
        className="flex flex-col items-center justify-center text-center h-full"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1 
          className="text-4xl font-bold mb-2 text-white"
          variants={item}
        >
          Welcome
        </motion.h1>
        
        <motion.h2 
          className="text-4xl font-medium mb-10 text-period"
          variants={item}
        >
          {userData.name || 'User'}
        </motion.h2>
        
        <motion.div variants={item}>
          <Button 
            onClick={handleGetStarted}
            className="bg-white text-black hover:bg-white/90 font-medium px-8 py-6 rounded-full"
          >
            Let's Get Started
          </Button>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Welcome;
