import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  Clock, 
  Play, 
  Heart, 
  BookOpen, 
  Brain,
  MoreVertical,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WordCardProps {
  word: string;
  definition: string;
  score: number;
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
  difficulty?: 'easy' | 'medium' | 'hard';
  successRate?: number;
  nextReview?: Date;
  attempts?: number;
  onStudy?: () => void;
  onAddToFavorites?: () => void;
  onQuickQuiz?: () => void;
  className?: string;
  showProgress?: boolean;
  compact?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'new':
      return {
        color: 'bg-new text-white',
        label: 'New',
        icon: BookOpen,
        gradient: 'from-new/10 to-new/5'
      };
    case 'learning':
      return {
        color: 'bg-learning text-white',
        label: 'Learning',
        icon: Brain,
        gradient: 'from-learning/10 to-learning/5'
      };
    case 'reviewing':
      return {
        color: 'bg-info text-white',
        label: 'Reviewing',
        icon: Clock,
        gradient: 'from-info/10 to-info/5'
      };
    case 'mastered':
      return {
        color: 'bg-mastered text-white',
        label: 'Mastered',
        icon: Star,
        gradient: 'from-mastered/10 to-mastered/5'
      };
    default:
      return {
        color: 'bg-muted text-muted-foreground',
        label: 'Unknown',
        icon: BookOpen,
        gradient: 'from-muted/10 to-muted/5'
      };
  }
};

const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty) {
    case 'easy': return 'text-success';
    case 'medium': return 'text-warning';
    case 'hard': return 'text-error';
    default: return 'text-muted-foreground';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 20) return 'text-letter-premium';
  if (score >= 15) return 'text-letter-rare';
  if (score >= 10) return 'text-letter-uncommon';
  return 'text-letter-common';
};

export function WordCard({
  word,
  definition,
  score,
  status,
  difficulty,
  successRate,
  nextReview,
  attempts = 0,
  onStudy,
  onAddToFavorites,
  onQuickQuiz,
  className,
  showProgress = true,
  compact = false
}: WordCardProps) {
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  if (compact) {
    return (
      <Card className={cn(
        "group hover:shadow-word-card hover:scale-[1.02] transition-all duration-300 border border-border/50 bg-gradient-word-card",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-bold text-lg font-mono truncate">{word}</h3>
                <Badge variant="outline" className={cn("text-xs", getScoreColor(score))}>
                  {score}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{definition}</p>
            </div>
            <div className="flex items-center space-x-2 ml-3">
              <Badge className={cn("text-xs", statusConfig.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onStudy}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "group hover:shadow-word-card hover:scale-[1.02] transition-all duration-300 overflow-hidden border border-border/50",
      `bg-gradient-to-br ${statusConfig.gradient}`,
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-bold text-xl font-mono truncate group-hover:text-primary transition-colors">
                {word}
              </h3>
              <Badge variant="outline" className={cn("text-sm font-semibold", getScoreColor(score))}>
                {score} pts
              </Badge>
            </div>
            <Badge className={cn("text-xs", statusConfig.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {definition}
        </p>

        {/* Progress Section */}
        {showProgress && status !== 'new' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Success Rate</span>
              <span className="font-medium">{successRate}%</span>
            </div>
            <Progress 
              value={successRate} 
              className="h-2"
            />
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            {difficulty && (
              <div className="flex items-center space-x-1">
                <Star className={cn("h-3 w-3", getDifficultyColor(difficulty))} />
                <span className="capitalize">{difficulty}</span>
              </div>
            )}
            {attempts > 0 && (
              <span>{attempts} attempts</span>
            )}
          </div>
          {nextReview && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Due {nextReview.toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1 group/btn" 
            onClick={onStudy}
          >
            <Play className="h-3 w-3 mr-2 group-hover/btn:translate-x-0.5 transition-transform" />
            Study
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onAddToFavorites}
            className="group/heart"
          >
            <Heart className="h-3 w-3 group-hover/heart:fill-current group-hover/heart:text-error transition-all" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onQuickQuiz}
            className="group/quiz"
          >
            <Zap className="h-3 w-3 group-hover/quiz:text-warning transition-colors" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}