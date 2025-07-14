import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Star, Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPBadgeProps {
  type: 'xp' | 'streak' | 'level' | 'achievement';
  value: number | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  glowing?: boolean;
  className?: string;
}

const typeConfig = {
  xp: {
    icon: Zap,
    gradient: 'bg-gradient-xp',
    color: 'text-white',
    shadow: 'shadow-glow-xp'
  },
  streak: {
    icon: Flame,
    gradient: 'bg-gradient-streak',
    color: 'text-white',
    shadow: 'shadow-glow-streak'
  },
  level: {
    icon: Star,
    gradient: 'bg-gradient-level',
    color: 'text-white',
    shadow: 'shadow-glow'
  },
  achievement: {
    icon: Trophy,
    gradient: 'bg-gradient-celebration',
    color: 'text-white',
    shadow: 'shadow-glow'
  }
};

const sizeConfig = {
  sm: {
    badge: 'px-2 py-1 text-xs',
    icon: 'h-3 w-3',
    text: 'text-xs'
  },
  md: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'h-4 w-4',
    text: 'text-sm'
  },
  lg: {
    badge: 'px-4 py-2 text-base',
    icon: 'h-5 w-5',
    text: 'text-base'
  }
};

export function XPBadge({
  type,
  value,
  label,
  size = 'md',
  animated = false,
  glowing = false,
  className
}: XPBadgeProps) {
  const config = typeConfig[type];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <Badge 
      className={cn(
        config.gradient,
        config.color,
        sizeStyles.badge,
        'font-semibold border-0 flex items-center space-x-1',
        glowing && config.shadow,
        animated && 'animate-pulse-glow',
        className
      )}
    >
      <Icon className={cn(sizeStyles.icon, animated && 'animate-bounce')} />
      <span className={sizeStyles.text}>
        {value}
        {label && ` ${label}`}
      </span>
    </Badge>
  );
}