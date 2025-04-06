import React from 'react';
import { X, Circle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TicTacToeProps {
  gameState: {
    board: (string | null)[];
    currentPlayer: string;
    winner: string | null;
    waitingForPlayer?: boolean;
  };
  onPlayMove: (index: number) => void;
  onClose?: () => void; // Propriété optionnelle pour fermer le jeu
}

export const TicTacToe: React.FC<TicTacToeProps> = ({ gameState, onPlayMove, onClose }) => {
  const { board, currentPlayer, winner, waitingForPlayer } = gameState;

  // Animation variants for cells
  const cellVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
  };

  // Animation variants for the winner announcement
  const winnerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-purple-200 dark:border-gray-700"
    >
      <div className="flex justify-between w-full mb-4">
        <h2 className="text-xl font-bold text-purple-700 dark:text-purple-400">Tic-Tac-Toe</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            &times;
          </button>
        )}
      </div>
      
      {waitingForPlayer ? (
        <div className="flex flex-col items-center justify-center p-4 mb-4">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
          <p className="text-gray-600 dark:text-gray-300 text-center">
            En attente d'un autre joueur...<br/>
            <span className="text-xs text-gray-500">Le jeu se fermera si personne ne rejoint dans 60 secondes</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {board.map((cell, index) => (
            <motion.button
              key={index}
              onClick={() => onPlayMove(index)}
              disabled={!!cell || !!winner}
              className={`w-16 h-16 flex items-center justify-center rounded-md text-2xl font-bold transition-colors
                ${!cell && !winner ? 'hover:bg-purple-100 dark:hover:bg-gray-700' : ''}
                ${cell ? 'bg-purple-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}
                border-2 ${currentPlayer === 'X' ? 'border-blue-400' : 'border-pink-400'} 
                ${cell ? 'border-transparent' : ''}
                ${!!winner ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              variants={cellVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.7, ease: "easeInOut" }} // Updated to 0.7s with smooth easing
            >
              {cell === 'X' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }} // Updated for smooth animation
                >
                  <X className="w-8 h-8 text-blue-500" strokeWidth={3} />
                </motion.div>
              )}
              {cell === 'O' && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Circle className="w-7 h-7 text-pink-500" strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      )}
      
      <AnimatePresence mode="wait">
        {winner ? (
          <motion.div 
            key="winner"
            className={`py-2 px-4 rounded-full font-bold text-white ${
              winner === 'X' ? 'bg-blue-500' : 
              winner === 'O' ? 'bg-pink-500' : 
              'bg-purple-500'
            }`}
            variants={winnerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {winner === 'Draw' ? 'Match nul !' : `${winner} a gagné !`}
          </motion.div>
        ) : waitingForPlayer ? (
          <div></div> // Pas d'affichage du tour pendant l'attente
        ) : (
          <motion.div 
            key="turn"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
            variants={winnerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <span>Au tour de</span>
            <div className={`w-6 h-6 flex items-center justify-center rounded-full ${
              currentPlayer === 'X' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'
            }`}>
              {currentPlayer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
