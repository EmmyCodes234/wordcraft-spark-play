import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressCircleProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function ProgressCircle({ 
  progress, 
  size = 'md', 
  className, 
  children 
}: ProgressCircleProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const strokeWidths = {
    sm: 4,
    md: 6,
    lg: 8
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox="0 0 100 100"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidths[size]}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidths[size]}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}