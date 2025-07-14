import React from 'react';
import { cn } from '@/lib/utils';

interface LetterTileProps {
  letter: string;
  value: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'highlighted' | 'difficult' | 'premium';
  animated?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-xl'
};

const variantConfig = {
  default: 'bg-muted border-border text-foreground',
  highlighted: 'bg-warning/20 border-warning text-warning-foreground shadow-glow-streak',
  difficult: 'bg-error/20 border-error text-error-foreground',
  premium: 'bg-gradient-xp border-level text-white shadow-glow-xp'
};

const getLetterVariant = (value: number): keyof typeof variantConfig => {
  if (value >= 8) return 'premium';
  if (value >= 4) return 'difficult';
  if (value >= 2) return 'highlighted';
  return 'default';
};

export function LetterTile({
  letter,
  value,
  size = 'md',
  variant,
  animated = false,
  className
}: LetterTileProps) {
  const actualVariant = variant || getLetterVariant(value);
  
  return (
    <div className="text-center">
      <div 
        className={cn(
          'rounded-lg border-2 flex items-center justify-center font-mono font-bold transition-all duration-200 hover:scale-105',
          sizeConfig[size],
          variantConfig[actualVariant],
          animated && 'animate-bounce-in',
          className
        )}
      >
        {letter}
      </div>
      <div className="text-xs mt-1 text-muted-foreground font-medium">
        {value} pt{value !== 1 ? 's' : ''}
      </div>
    </div>
  );
}