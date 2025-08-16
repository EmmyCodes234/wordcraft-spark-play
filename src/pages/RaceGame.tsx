import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRace } from '@/context/RaceContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Timer, 
  Trophy, 
  Users, 
  Target, 
  Zap, 
  Star, 
  Crown, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Award,
  Clock,
  Gamepad2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GameStats {
  totalScore: number;
  wordsFound: number;
  currentStreak: number;
  averageScore: number;
  rareWordsFound: number;
  timeRemaining: number;
}

export default function RaceGame() {
  const { raceId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    currentRace, 
    myParticipant, 
    submitWord, 
    nextRound, 
    finishRace,
    mySubmissions,
    calculateWordScore
  } = useRace();

  const [input, setInput] = useState('');
  const [currentRound, setCurrentRound] = useState(0);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalScore: 0,
    wordsFound: 0,
    currentStreak: 0,
    averageScore: 0,
    rareWordsFound: 0,
    timeRemaining: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintWords, setHintWords] = useState<string[]>([]);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'active' | 'finished'>('waiting');

  // Initialize game
  useEffect(() => {
    if (currentRace && myParticipant) {
      setGameStats({
        totalScore: myParticipant.score,
        wordsFound: myParticipant.wordsFound,
        currentStreak: myParticipant.streak,
        averageScore: myParticipant.averageWordScore,
        rareWordsFound: myParticipant.rareWordsFound,
        timeRemaining: currentRace.duration
      });
      setGameStatus(currentRace.status);
    }
  }, [currentRace, myParticipant]);

  // Timer countdown
  useEffect(() => {
    if (gameStatus !== 'active' || gameStats.timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setGameStats(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          handleGameEnd();
          return prev;
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, gameStats.timeRemaining]);

  const handleGameEnd = async () => {
    setGameStatus('finished');
    const result = await finishRace();
    if (result) {
      navigate(`/race/${raceId}/results`);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const submission = await submitWord(input.trim(), currentRound);
    
    if (submission) {
      setLastSubmission(submission);
      setInput('');
      
      // Update local stats
      setGameStats(prev => ({
        ...prev,
        totalScore: prev.totalScore + submission.totalScore,
        wordsFound: prev.wordsFound + 1,
        currentStreak: prev.currentStreak + 1,
        averageScore: Math.round((prev.totalScore + submission.totalScore) / (prev.wordsFound + 1)),
        rareWordsFound: submission.frequency.frequency < 30 ? prev.rareWordsFound + 1 : prev.rareWordsFound
      }));

      // Show success animation
      setTimeout(() => setLastSubmission(null), 2000);
    }
    
    setIsSubmitting(false);
  };

  const handleNextRound = async () => {
    if (currentRound < (currentRace?.rounds || 0) - 1) {
      const success = await nextRound();
      if (success) {
        setCurrentRound(prev => prev + 1);
        setGameStats(prev => ({ ...prev, currentStreak: 0 }));
        setShowHint(false);
        setHintWords([]);
      }
    } else {
      handleGameEnd();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const getHint = async () => {
    if (!currentRace || showHint) return;
    
    // Generate some hint words based on current alphagram
    const currentAlphagram = currentRace.alphagrams[currentRound];
    const sampleWords = ['STAR', 'RATS', 'ARTS', 'TARS']; // Simplified for demo
    setHintWords(sampleWords);
    setShowHint(true);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentAlphagram = () => {
    return currentRace?.alphagrams[currentRound] || '';
  };

  const getProgressPercentage = () => {
    if (!currentRace) return 0;
    return ((currentRound + 1) / currentRace.rounds) * 100;
  };

  if (!currentRace || !myParticipant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading race...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{currentRace.name}</h1>
                <p className="text-muted-foreground">Round {currentRound + 1} of {currentRace.rounds}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {currentRace.currentPlayers}/{currentRace.maxPlayers}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {currentRace.difficulty}
              </Badge>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Timer and Progress */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-primary" />
                      <span className="text-lg font-semibold">Time Remaining</span>
                    </div>
                    <div className={`text-2xl font-bold ${gameStats.timeRemaining < 30 ? 'text-red-500' : 'text-primary'}`}>
                      {formatTime(gameStats.timeRemaining)}
                    </div>
                  </div>
                  
                  <Progress 
                    value={(gameStats.timeRemaining / currentRace.duration) * 100} 
                    className="h-2"
                  />
                  
                  <div className="mt-4">
                    <Progress 
                      value={getProgressPercentage()} 
                      className="h-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Round Progress: {currentRound + 1} / {currentRace.rounds}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Current Alphagram */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="text-center text-lg">Current Letters</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-6xl font-bold text-primary mb-4 tracking-wider">
                    {getCurrentAlphagram()}
                  </div>
                  <p className="text-muted-foreground">
                    Find as many anagrams as you can!
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Word Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter your anagram..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="text-lg"
                      disabled={gameStatus !== 'active'}
                    />
                    <Button 
                      onClick={handleSubmit}
                      disabled={!input.trim() || isSubmitting || gameStatus !== 'active'}
                      className="px-6"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={getHint}
                      disabled={showHint || gameStatus !== 'active'}
                    >
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Hint
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleNextRound}
                      disabled={gameStatus !== 'active'}
                    >
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Next Round
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Hint Section */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        Hint Words
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {hintWords.map((word, index) => (
                          <Badge key={index} variant="secondary">
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent Submissions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Words</CardTitle>
                </CardHeader>
                <CardContent>
                  {mySubmissions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No words submitted yet. Start finding anagrams!
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {mySubmissions.map((submission, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <span className="font-medium">{submission.word}</span>
                          <Badge variant="outline" className="text-xs">
                            +{submission.totalScore}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Stats and Leaderboard */}
          <div className="space-y-6">
            
            {/* Player Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{gameStats.totalScore}</div>
                      <div className="text-xs text-muted-foreground">Total Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{gameStats.wordsFound}</div>
                      <div className="text-xs text-muted-foreground">Words Found</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current Streak</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {gameStats.currentStreak}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Score</span>
                      <span className="text-sm font-medium">{gameStats.averageScore}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rare Words</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {gameStats.rareWordsFound}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Last Submission */}
            <AnimatePresence>
              {lastSubmission && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Word Submitted!
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {lastSubmission.word}
                        </div>
                        <div className="text-lg font-semibold text-primary">
                          +{lastSubmission.totalScore} points
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span>Base Score:</span>
                          <span>+{lastSubmission.score}</span>
                        </div>
                        {lastSubmission.rarityBonus > 0 && (
                          <div className="flex items-center justify-between">
                            <span>Rarity Bonus:</span>
                            <span className="text-green-600">+{lastSubmission.rarityBonus}</span>
                          </div>
                        )}
                        {lastSubmission.streakBonus > 0 && (
                          <div className="flex items-center justify-between">
                            <span>Streak Bonus:</span>
                            <span className="text-blue-600">+{lastSubmission.streakBonus}</span>
                          </div>
                        )}
                        {lastSubmission.timeBonus > 0 && (
                          <div className="flex items-center justify-between">
                            <span>Time Bonus:</span>
                            <span className="text-yellow-600">+{lastSubmission.timeBonus}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Race Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Race Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Type</span>
                    <Badge variant="outline">{currentRace.type}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Duration</span>
                    <span className="text-sm">{Math.floor(currentRace.duration / 60)}m</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rounds</span>
                    <span className="text-sm">{currentRace.rounds}</span>
                  </div>
                  
                  {currentRace.probabilityMode && (
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
          </div>
        </div>
      </div>
    </div>
  );
}
