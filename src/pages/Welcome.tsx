
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarIcon } from 'lucide-react';
import Layout from '@/components/Layout';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { userData, setIsOnboarded, isLoading } = useUser();

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

  // Default name to use if user data isn't available
  const displayName = userData?.name || 'Friend';

  return (
    <Layout>
      <motion.div
        className="flex flex-col items-center justify-center text-center h-full"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div 
          className="mb-8"
          variants={item}
        >
          <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
            <CalendarIcon className="h-12 w-12 text-period" />
          </div>
        </motion.div>
        
        <motion.h1 
          className="text-4xl font-bold mb-2"
          variants={item}
        >
          Welcome
        </motion.h1>
        
        {isLoading ? (
          <motion.div variants={item}>
            <Skeleton className="h-12 w-40 mb-10 mx-auto" />
          </motion.div>
        ) : (
          <motion.h2 
            className="text-4xl font-medium mb-10 text-period"
            variants={item}
          >
            {displayName}
          </motion.h2>
        )}
        
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
