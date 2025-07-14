import React from 'react';
import { LetterTile } from '@/components/ui/letter-tile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DifficultyHeatmapProps {
  letters: Array<{
    letter: string;
    value: number;
    difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  }>;
  totalScore: number;
  showLegend?: boolean;
  animated?: boolean;
  className?: string;
}

const difficultyColors = {
  easy: 'bg-success/20 text-success',
  medium: 'bg-warning/20 text-warning',
  hard: 'bg-error/20 text-error',
  extreme: 'bg-level/20 text-level'
};

export function DifficultyHeatmap({
  letters,
  totalScore,
  showLegend = true,
  animated = false,
  className
}: DifficultyHeatmapProps) {
  const getLetterDifficulty = (value: number) => {
    if (value >= 8) return 'extreme';
    if (value >= 4) return 'hard';
    if (value >= 2) return 'medium';
    return 'easy';
  };

  return (
    <Card className={cn("border border-border/50", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Letter Breakdown</CardTitle>
          <Badge variant="outline" className="text-base font-bold">
            {totalScore} points
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Letter Grid */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {letters.map((letter, index) => {
            const difficulty = letter.difficulty || getLetterDifficulty(letter.value);
            return (
              <div
                key={index}
                style={animated ? { animationDelay: `${index * 0.1}s` } : {}}
              >
                <LetterTile
                  letter={letter.letter}
                  value={letter.value}
                  variant={difficulty === 'extreme' ? 'premium' : difficulty === 'hard' ? 'difficult' : difficulty === 'medium' ? 'highlighted' : 'default'}
                  animated={animated}
                  className={animated ? `animate-bounce-in` : ''}
                />
              </div>
            );
          })}
        </div>

        {/* Calculation */}
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="text-sm text-muted-foreground">
            <strong>Calculation:</strong> {letters.map(l => `${l.letter}(${l.value})`).join(' + ')} = <span className="font-bold text-primary">{totalScore} points</span>
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-success"></div>
              <span className="text-xs text-muted-foreground">1 pt (Easy)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-warning"></div>
              <span className="text-xs text-muted-foreground">2-3 pts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-error"></div>
              <span className="text-xs text-muted-foreground">4-7 pts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-level"></div>
              <span className="text-xs text-muted-foreground">8+ pts (Rare)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}