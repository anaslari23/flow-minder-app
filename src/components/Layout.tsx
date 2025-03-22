
import React from 'react';
import { motion } from 'framer-motion';

type LayoutProps = {
  children: React.ReactNode;
  className?: string;
};

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <motion.div 
      className={`min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-md w-full mx-auto">
        {children}
      </div>
    </motion.div>
  );
};

export default Layout;
