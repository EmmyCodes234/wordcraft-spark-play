import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Medal, 
  Star, 
  Crown, 
  Target, 
  TrendingUp, 
  Clock, 
  Zap,
  Users,
  ArrowLeft,
  Share2,
  RotateCcw
} from 'lucide-react';
import { useRace } from '@/context/RaceContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RaceResultData {
  userId: string;
  username: string;
  finalScore: number;
  wordsFound: number;
  averageWordScore: number;
  rareWordsFound: number;
  streak: number;
  rank: number;
  completedAt: string;
}

export default function RaceResults() {
  const { raceId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { currentRace, getRaceResults, mySubmissions } = useRace();
  
  const [results, setResults] = useState<RaceResultData[]>([]);
  const [myResult, setMyResult] = useState<RaceResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!raceId) return;
      
      setIsLoading(true);
      try {
        const raceResults = await getRaceResults(raceId);
        
        // Transform and sort results
        const transformedResults: RaceResultData[] = raceResults
          .map((result, index) => ({
            userId: result.userId,
            username: `Player ${index + 1}`, // In real app, fetch from profiles
            finalScore: result.finalScore,
            wordsFound: result.wordsFound,
            averageWordScore: result.averageWordScore || 0,
            rareWordsFound: result.rareWordsFound || 0,
            streak: result.streak || 0,
            rank: index + 1,
            completedAt: result.completedAt
          }))
          .sort((a, b) => b.finalScore - a.finalScore)
          .map((result, index) => ({ ...result, rank: index + 1 }));

        setResults(transformedResults);
        
        // Find current user's result
        const userResult = transformedResults.find(r => r.userId === user?.id);
        setMyResult(userResult || null);
        
      } catch (error) {
        console.error('Error fetching results:', error);
        toast({
          title: "Error",
          description: "Failed to load race results.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [raceId, user?.id, getRaceResults, toast]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default: return 'bg-muted';
    }
  };

  const shareResults = async () => {
    if (!myResult || !currentRace) return;
    
    const shareText = `I just completed a ${currentRace.type} race on WordSmith! 🏆\n\nRank: #${myResult.rank}\nScore: ${myResult.finalScore} points\nWords Found: ${myResult.wordsFound}\n\nJoin me for the next race!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WordSmith Race Results',
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        toast({
          title: "Results Copied!",
          description: "Race results copied to clipboard.",
          variant: "default",
        });
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Results Copied!",
        description: "Race results copied to clipboard.",
        variant: "default",
      });
    }
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Race Results</h1>
          </div>
          {currentRace && (
            <div className="flex items-center justify-center gap-4 text-muted-foreground">
              <span>{currentRace.name}</span>
              <Badge variant="outline">{currentRace.type}</Badge>
              <Badge variant="outline">{currentRace.difficulty}</Badge>
            </div>
          )}
        </motion.div>

        {/* My Result Highlight */}
        {myResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className={`border-2 ${myResult.rank <= 3 ? 'border-primary/50 bg-primary/5' : 'border-muted'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getRankIcon(myResult.rank)}
                    Your Result
                  </span>
                  <Badge className={getRankColor(myResult.rank)}>
                    Rank #{myResult.rank}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{myResult.finalScore}</div>
                    <div className="text-sm text-muted-foreground">Total Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{myResult.wordsFound}</div>
                    <div className="text-sm text-muted-foreground">Words Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{myResult.averageWordScore}</div>
                    <div className="text-sm text-muted-foreground">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{myResult.rareWordsFound}</div>
                    <div className="text-sm text-muted-foreground">Rare Words</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Best Streak: {myResult.streak}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Rare Words: {myResult.rareWordsFound}</span>
                    </div>
                  </div>
                  
                  <Button onClick={shareResults} variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Final Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No results available yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        result.userId === user?.id 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-muted/30 border-muted'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border">
                          {getRankIcon(result.rank)}
                        </div>
                        
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {result.username}
                            {result.userId === user?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.wordsFound} words • Avg {result.averageWordScore} pts
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {result.finalScore}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          points
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* My Words */}
        {mySubmissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Your Words ({mySubmissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                  {mySubmissions.map((submission, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                    >
                      <span className="font-mono font-medium">{submission.word}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {submission.totalScore}
                        </Badge>
                        {submission.frequency.frequency < 30 && (
                          <Star className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mt-8 justify-center"
        >
          <Button onClick={() => navigate('/race-lobby')} variant="outline" size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>
          
          <Button onClick={() => navigate('/race-lobby')} size="lg">
            <RotateCcw className="w-4 h-4 mr-2" />
            Race Again
          </Button>
        </motion.div>

        {/* Performance Summary */}
        {myResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-center">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {myResult.rank <= 3 ? '🏆' : '👏'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {myResult.rank === 1 ? 'Champion!' : 
                       myResult.rank <= 3 ? 'Podium Finish!' : 
                       'Great Effort!'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((myResult.wordsFound / (currentRace?.rounds || 10)) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Round Completion
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {myResult.rareWordsFound > 0 ? '⭐' : '📚'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {myResult.rareWordsFound > 0 ? 'Rare Word Master!' : 'Word Explorer'}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {myResult.rank === 1 
                    ? "Incredible performance! You dominated this race!" 
                    : myResult.rank <= 3 
                    ? "Excellent work! You're among the top performers!" 
                    : "Keep practicing and you'll climb the leaderboard!"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}