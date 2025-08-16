import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRace, RaceResult } from '@/context/RaceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Medal, 
  Star, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Crown,
  ArrowLeft,
  Share2,
  Gamepad2,
  Zap,
  Target as TargetIcon,
  Timer
} from 'lucide-react';

interface ExtendedRaceResult extends RaceResult {
  username: string;
  rank: number;
  achievements: string[];
}

export default function RaceResults() {
  const { raceId } = useParams();
  const navigate = useNavigate();
  const { currentRace, getRaceResults } = useRace();
  
  const [results, setResults] = useState<ExtendedRaceResult[]>([]);
  const [myResult, setMyResult] = useState<ExtendedRaceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!raceId) return;
      
      setIsLoading(true);
      try {
        const raceResults = await getRaceResults(raceId);
        
        // Sort by score and add rank
        const sortedResults = raceResults
          .sort((a, b) => b.finalScore - a.finalScore)
          .map((result, index) => ({
            ...result,
            rank: index + 1,
            username: `Player ${index + 1}`, // In a real app, this would come from user data
            achievements: generateAchievements(result)
          }));

        setResults(sortedResults);
        
        // Find current user's result (assuming first result is current user for demo)
        if (sortedResults.length > 0) {
          setMyResult(sortedResults[0]);
        }
      } catch (error) {
        console.error('Error fetching race results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [raceId, getRaceResults]);

  const generateAchievements = (result: RaceResult): string[] => {
    const achievements: string[] = [];
    
    if (result.finalScore > 500) achievements.push('High Scorer');
    if (result.wordsFound > 20) achievements.push('Word Master');
    if (result.streak > 5) achievements.push('Streak Master');
    if (result.rareWordsFound > 3) achievements.push('Rare Word Hunter');
    if (result.averageWordScore > 25) achievements.push('Efficiency Expert');
    
    return achievements;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <Trophy className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
      default: return 'bg-muted';
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Race Results
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {currentRace?.name || 'Anagram Race'} has finished!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Podium */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
                    <Trophy className="w-6 h-6 text-primary" />
                    Final Standings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {results.slice(0, 3).map((result, index) => (
                      <motion.div
                        key={result.userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className={`relative ${index === 1 ? 'order-first md:order-none' : ''}`}
                      >
                        <Card className={`${getRankColor(result.rank)} border-2`}>
                          <CardContent className="p-6 text-center space-y-4">
                            <div className="flex justify-center">
                              {getRankIcon(result.rank)}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold">{result.username}</h3>
                              <p className="text-sm opacity-90">#{result.rank}</p>
                            </div>
                            <div className="space-y-2">
                              <div className="text-2xl font-bold">{result.finalScore}</div>
                              <div className="text-sm opacity-90">points</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <div className="font-semibold">{result.wordsFound}</div>
                                <div className="opacity-75">words</div>
                              </div>
                              <div>
                                <div className="font-semibold">{result.averageWordScore}</div>
                                <div className="opacity-75">avg</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Full Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Complete Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <motion.div
                        key={result.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          result.rank <= 3 ? 'bg-muted/50' : 'bg-muted/20'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getRankIcon(result.rank)}
                            <span className="font-semibold">#{result.rank}</span>
                          </div>
                          <div>
                            <div className="font-medium">{result.username}</div>
                            <div className="text-sm text-muted-foreground">
                              {result.wordsFound} words • {result.averageWordScore} avg
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{result.finalScore}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - My Results & Stats */}
          <div className="space-y-6">
            
            {/* My Results */}
            {myResult && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Your Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{myResult.finalScore}</div>
                      <div className="text-sm text-muted-foreground">Total Score</div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-semibold text-green-600">{myResult.wordsFound}</div>
                        <div className="text-xs text-muted-foreground">Words Found</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-blue-600">{myResult.averageWordScore}</div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-semibold text-purple-600">{myResult.streak}</div>
                        <div className="text-xs text-muted-foreground">Best Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-orange-600">{myResult.rareWordsFound}</div>
                        <div className="text-xs text-muted-foreground">Rare Words</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="text-center">
                      <div className="text-lg font-semibold">Rank #{myResult.rank}</div>
                      <div className="text-sm text-muted-foreground">out of {results.length} players</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Achievements */}
            {myResult && myResult.achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {myResult.achievements.map((achievement, index) => (
                        <motion.div
                          key={achievement}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50/50 border border-yellow-200"
                        >
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">{achievement}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Race Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Race Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Participants</span>
                    <Badge variant="outline">{results.length}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Highest Score</span>
                    <span className="text-sm font-medium">{Math.max(...results.map(r => r.finalScore))}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Score</span>
                    <span className="text-sm font-medium">
                      {Math.round(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Words Found</span>
                    <span className="text-sm font-medium">
                      {results.reduce((sum, r) => sum + r.wordsFound, 0)}
                    </span>
                  </div>
                  
                  {currentRace?.probabilityMode && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Probability Mode</span>
                      <Badge variant="outline" className="text-green-600">
                        <Star className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Button 
                onClick={() => navigate('/race-lobby')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lobby
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
