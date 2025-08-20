import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WordTileProps {
  word: string;
  onClick?: () => void;
  variant?: 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const WordTile: React.FC<WordTileProps> = ({
  word,
  onClick,
  variant = 'default',
  size = 'md',
  className,
  disabled = false
}) => {
  const baseClasses = cn(
    'word-tile',
    'font-mono font-bold uppercase tracking-wider',
    'border-2 transition-all duration-200',
    'touch-manipulation select-none',
    'flex items-center justify-center',
    'cursor-pointer',
    {
      // Size variants
      'text-sm px-3 py-2 min-h-[48px] min-w-[48px]': size === 'sm',
      'text-base px-4 py-3 min-h-[56px] min-w-[56px]': size === 'md',
      'text-lg px-6 py-4 min-h-[64px] min-w-[64px]': size === 'lg',
      
      // Variant styles
      'bg-card border-border text-card-foreground hover:bg-accent hover:border-accent-foreground': variant === 'default',
      'bg-primary border-primary text-primary-foreground shadow-lg scale-105': variant === 'selected',
      'bg-success border-success text-success-foreground shadow-lg': variant === 'correct',
      'bg-destructive border-destructive text-destructive-foreground shadow-lg': variant === 'incorrect',
      'bg-muted border-muted text-muted-foreground cursor-not-allowed opacity-50': variant === 'disabled',
      
      // Disabled state
      'opacity-50 cursor-not-allowed': disabled,
    },
    className
  );

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      className={baseClasses}
      onClick={handleClick}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      {word}
    </motion.div>
  );
};

export default WordTile;
