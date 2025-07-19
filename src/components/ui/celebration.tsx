import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XPBadge } from '@/components/ui/xp-badge';
import { Trophy, Star, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CelebrationProps {
  type: 'correct' | 'streak' | 'level-up' | 'mastered';
  title: string;
  message: string;
  xpGained?: number;
  streakCount?: number;
  onContinue: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const celebrationConfig = {
  correct: {
    emoji: '🎉',
    bgGradient: 'bg-gradient-success',
    icon: Star,
    color: 'text-success'
  },
  streak: {
    emoji: '🔥',
    bgGradient: 'bg-gradient-streak',
    icon: Zap,
    color: 'text-warning'
  },
  'level-up': {
    emoji: '⭐',
    bgGradient: 'bg-gradient-level',
    icon: Trophy,
    color: 'text-level'
  },
  mastered: {
    emoji: '🏆',
    bgGradient: 'bg-gradient-celebration',
    icon: Trophy,
    color: 'text-mastered'
  }
};

export function Celebration({
  type,
  title,
  message,
  xpGained,
  streakCount,
  onContinue,
  autoClose = false,
  autoCloseDelay = 3000
}: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = celebrationConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onContinue, 300);
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onContinue]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className={cn(
        "max-w-md w-full border-2 shadow-float animate-bounce-in",
        config.bgGradient,
        "border-white/20"
      )}>
        <CardContent className="p-8 text-center text-white">
          {/* Main Icon */}
          <div className="h-20 w-20 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-6 animate-celebration">
            <div className="text-4xl">{config.emoji}</div>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold mb-3 animate-slide-up">
            {title}
          </h2>
          
          {/* Message */}
          <p className="text-white/90 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {message}
          </p>

          {/* Rewards */}
          <div className="flex items-center justify-center space-x-4 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {xpGained && (
              <XPBadge 
                type="xp" 
                value={`+${xpGained}`}
                size="lg"
                animated
                glowing
              />
            )}
            {streakCount && (
              <XPBadge 
                type="streak" 
                value={streakCount}
                label="streak!"
                size="lg"
                animated
                glowing
              />
            )}
          </div>

          {/* Continue Button */}
          {!autoClose && (
            <Button 
              onClick={onContinue}
              size="lg"
              className="bg-white text-gray-900 hover:bg-white/90 animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}