import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  isVisible: boolean;
  typingUsers?: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible, typingUsers = [] }) => {
  if (!isVisible || typingUsers.length === 0) return null;

  const getMessage = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} est en train d'écrire...`;
    } else if (typingUsers.length <= 3) {
      return `${typingUsers.join(', ')} sont en train d'écrire...`;
    } else {
      return `Plusieurs personnes écrivent...`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 p-2 rounded-lg bg-gray-100/50 backdrop-blur-sm border border-gray-200/30 text-gray-700 text-sm w-fit mb-1"
    >
      <div className="flex items-center gap-1 ml-1">
        {[0, 1, 2].map((dot) => (
          <motion.div
            key={dot}
            className="w-1.5 h-1.5 bg-violet-500 rounded-full"
            animate={{
              y: [0, -3, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: "loop",
              delay: dot * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      <span className="font-normal">
        {getMessage()}
      </span>
    </motion.div>
  );
};
