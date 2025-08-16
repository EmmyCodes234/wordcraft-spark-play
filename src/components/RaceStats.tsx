import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Target, 
  Clock, 
  Zap, 
  Award,
  Brain,
  BarChart3,
  Activity
} from 'lucide-react';
import { getEnhancedWordFrequency } from '@/data/wordFrequency';

interface RaceStatsProps {
  submissions: any[];
  totalScore: number;
  wordsFound: number;
  currentStreak: number;
  averageScore: number;
  rareWordsFound: number;
  timeRemaining: number;
  totalTime: number;
  probabilityMode: boolean;
}

export function RaceStats({
  submissions,
  totalScore,
  wordsFound,
  currentStreak,
  averageScore,
  rareWordsFound,
  timeRemaining,
  totalTime,
  probabilityMode
}: RaceStatsProps) {
  
  const calculateStats = () => {
    if (submissions.length === 0) return null;
    
    const wordFrequencies = submissions.map(sub => sub.frequency.frequency);
    const avgFrequency = wordFrequencies.reduce((sum, freq) => sum + freq, 0) / wordFrequencies.length;
    
    const rareWords = submissions.filter(sub => sub.frequency.frequency < 30).length;
    const uncommonWords = submissions.filter(sub => sub.frequency.frequency >= 30 && sub.frequency.frequency < 50).length;
    const commonWords = submissions.filter(sub => sub.frequency.frequency >= 50 && sub.frequency.frequency < 70).length;
    const veryCommonWords = submissions.filter(sub => sub.frequency.frequency >= 70).length;
    
    const timeUsed = totalTime - timeRemaining;
    const efficiency = wordsFound > 0 ? wordsFound / (timeUsed / 60) : 0; // words per minute
    
    return {
      avgFrequency,
      rareWords,
      uncommonWords,
      commonWords,
      veryCommonWords,
      efficiency,
      timeUsed
    };
  };

  const stats = calculateStats();

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 10) return 'text-green-600';
    if (efficiency >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyLabel = (efficiency: number) => {
    if (efficiency >= 10) return 'Excellent';
    if (efficiency >= 5) return 'Good';
    return 'Slow';
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalScore}</div>
            <div className="text-xs text-muted-foreground">Total Score</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{wordsFound}</div>
            <div className="text-xs text-muted-foreground">Words Found</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{averageScore}</div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Word Frequency Distribution */}
        {probabilityMode && stats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Word Frequency Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rare Words</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.rareWords / wordsFound) * 100} className="w-20 h-2" />
                    <Badge variant="outline" className="text-red-600">
                      {stats.rareWords}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uncommon Words</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.uncommonWords / wordsFound) * 100} className="w-20 h-2" />
                    <Badge variant="outline" className="text-orange-600">
                      {stats.uncommonWords}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Common Words</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.commonWords / wordsFound) * 100} className="w-20 h-2" />
                    <Badge variant="outline" className="text-yellow-600">
                      {stats.commonWords}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Very Common Words</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.veryCommonWords / wordsFound) * 100} className="w-20 h-2" />
                    <Badge variant="outline" className="text-green-600">
                      {stats.veryCommonWords}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Frequency</span>
                  <Badge variant="outline">
                    {Math.round(stats.avgFrequency)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Efficiency</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getEfficiencyColor(stats?.efficiency || 0)}`}>
                    {stats?.efficiency.toFixed(1)} wpm
                  </span>
                  <Badge variant="outline" className={getEfficiencyColor(stats?.efficiency || 0)}>
                    {getEfficiencyLabel(stats?.efficiency || 0)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Time Used</span>
                <span className="text-sm font-medium">
                  {Math.floor((stats?.timeUsed || 0) / 60)}:{(stats?.timeUsed || 0) % 60 < 10 ? '0' : ''}{(stats?.timeUsed || 0) % 60}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Rare Words Found</span>
                <Badge variant="outline" className="text-orange-600">
                  <Star className="w-3 h-3 mr-1" />
                  {rareWordsFound}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Current Streak</span>
                <Badge variant="outline" className="text-blue-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {currentStreak}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      {submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Recent Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {submissions.slice(-8).map((submission, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border"
                >
                  <span className="font-medium text-sm">{submission.word}</span>
                  <Badge variant="outline" className="text-xs">
                    +{submission.totalScore}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {totalScore > 500 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Trophy className="w-3 h-3 mr-1" />
                High Scorer
              </Badge>
            )}
            {wordsFound > 20 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Target className="w-3 h-3 mr-1" />
                Word Master
              </Badge>
            )}
            {currentStreak > 5 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                Streak Master
              </Badge>
            )}
            {rareWordsFound > 3 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Star className="w-3 h-3 mr-1" />
                Rare Word Hunter
              </Badge>
            )}
            {averageScore > 25 && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                <Zap className="w-3 h-3 mr-1" />
                Efficiency Expert
              </Badge>
            )}
            {probabilityMode && (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                <Brain className="w-3 h-3 mr-1" />
                Probability Pro
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 