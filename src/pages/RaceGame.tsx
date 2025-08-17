import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRace } from '@/context/RaceContext';
import { useAuth } from '@/context/AuthContext';
import { useRealtime } from '@/context/RealtimeContext';
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
  Gamepad2,
  Eye,
  Wifi
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LivePlayerList } from '@/components/multiplayer/LivePlayerList';
import { RecentWordsFeed } from '@/components/multiplayer/RecentWordsFeed';
import { ConnectionStatus } from '@/components/multiplayer/ConnectionStatus';
import { SpectatorMode } from '@/components/multiplayer/SpectatorMode';

interface GameStats {
  totalScore: number;
  wordsFound: number;
  currentStreak: number;
  averageScore: number;
  rareWordsFound: number;
  timeRemaining: number;
}

// Helper function to check if a word is a valid anagram
const isValidAnagram = (word: string, alphagram: string): boolean => {
  const wordLetters = word.toUpperCase().split('').sort().join('');
  const alphagramLetters = alphagram.split('').sort().join('');
  return wordLetters === alphagramLetters;
};

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
    calculateWordScore,
    joinRace,
    loadRace
  } = useRace();

  const {
    liveRaceState,
    isConnected,
    connectionStatus,
    joinRaceChannel,
    leaveRaceChannel,
    broadcastWordSubmission,
    broadcastPlayerProgress,
    joinAsSpectator,
    isSpectating,
    getMyPosition
  } = useRealtime();

  const [input, setInput] = useState('');
  const [currentRound, setCurrentRound] = useState(0);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalScore: 0,
    wordsFound: 0,
    currentStreak: 0,
    averageScore: 0,
    rareWordsFound: 0,
    timeRemaining: 180
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintWords, setHintWords] = useState<string[]>([]);
  const [lastSubmission, setLastSubmission] = useState<any>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'active' | 'finished'>('waiting');
  const [isLoading, setIsLoading] = useState(true);
  const [showSpectatorMode, setShowSpectatorMode] = useState(false);

  // Initialize race and join if needed
  useEffect(() => {
    const initializeRace = async () => {
      if (!raceId || !user) {
        console.log('Missing raceId or user:', { raceId, user: !!user });
        return;
      }
      
      setIsLoading(true);
      console.log('Initializing race:', raceId);
      
      try {
        // First try to load the race (if user is already a participant)
        let raceLoaded = false;
        if (!currentRace || currentRace.id !== raceId) {
          console.log('Attempting to load existing race data...');
          raceLoaded = await loadRace(raceId);
        } else {
          console.log('Already have race data for:', currentRace.id);
          raceLoaded = true;
        }

        // If loading failed, try to join the race
        if (!raceLoaded) {
          console.log('Not a participant, attempting to join race...');
          const joinSuccess = await joinRace(raceId);
          if (!joinSuccess) {
            console.log('Failed to join race, navigating to lobby');
            navigate('/race-lobby');
            return;
          }
        }

        // Join real-time channel if not already connected
        // Temporarily disabled to prevent glitching
        /*
        if (currentRace && !isConnected) {
          console.log('Joining real-time channel');
          try {
            await joinRaceChannel(raceId);
          } catch (error) {
            console.error('Failed to join real-time channel:', error);
            // Don't fail the entire initialization if real-time fails
          }
        }
        */
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing race:', error);
        setIsLoading(false);
        navigate('/race-lobby');
      }
    };

    initializeRace();
  }, [raceId, user, currentRace?.id, loadRace, joinRace, navigate, isConnected, joinRaceChannel]);

  // Cleanup real-time connection on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up real-time connection');
      leaveRaceChannel();
    };
  }, [leaveRaceChannel]);

  // Cleanup when race changes
  useEffect(() => {
    if (currentRace && currentRace.id !== raceId) {
      console.log('Race changed, cleaning up previous connection');
      leaveRaceChannel();
    }
  }, [currentRace?.id, raceId, leaveRaceChannel]);

  // Initialize game stats when race and participant are loaded
  useEffect(() => {
    if (currentRace && myParticipant) {
      setGameStats({
        totalScore: myParticipant.score || 0,
        wordsFound: myParticipant.wordsFound || 0,
        currentStreak: myParticipant.streak || 0,
        averageScore: myParticipant.averageWordScore || 0,
        rareWordsFound: myParticipant.rareWordsFound || 0,
        timeRemaining: currentRace.duration
      });
      setGameStatus(currentRace.status);
      setCurrentRound(myParticipant.currentRound || 0);
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
    if (!input.trim() || isSubmitting || !currentRace) return;

    const word = input.trim().toUpperCase();
    
    // Basic validation
    if (word.length < 2) {
      toast({
        title: "Word Too Short",
        description: "Words must be at least 2 letters long.",
        variant: "destructive",
      });
      return;
    }

    // Check if it's a valid anagram
    const currentAlphagram = getCurrentAlphagram();
    if (!isValidAnagram(word, currentAlphagram)) {
      toast({
        title: "Invalid Anagram",
        description: "This word cannot be made from the given letters.",
        variant: "destructive",
      });
      return;
    }

    // Check if already submitted
    const alreadySubmitted = mySubmissions.some(sub => sub.word === word);
    if (alreadySubmitted) {
      toast({
        title: "Already Submitted",
        description: "You've already found this word!",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submission = await submitWord(word, currentRound);
      
      if (submission) {
        setLastSubmission(submission);
        setInput('');
        
        // Update local stats
        const newStats = {
          totalScore: gameStats.totalScore + submission.totalScore,
          wordsFound: gameStats.wordsFound + 1,
          currentStreak: gameStats.currentStreak + 1,
          averageScore: Math.round((gameStats.totalScore + submission.totalScore) / (gameStats.wordsFound + 1)),
          rareWordsFound: submission.frequency.frequency < 30 ? gameStats.rareWordsFound + 1 : gameStats.rareWordsFound
        };
        
        setGameStats(prev => ({
          ...prev,
          ...newStats
        }));

        // Broadcast word submission to other players
        broadcastWordSubmission(word, submission.totalScore, currentRound);
        
        // Broadcast player progress update
        broadcastPlayerProgress({
          currentScore: newStats.totalScore,
          wordsFound: newStats.wordsFound,
          currentRound,
          streak: newStats.currentStreak,
          status: 'playing'
        });

        // Show success animation
        setTimeout(() => setLastSubmission(null), 3000);
        
        toast({
          title: "Word Accepted!",
          description: `+${submission.totalScore} points for "${word}"`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error submitting word:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextRound = async () => {
    if (!currentRace) return;
    
    if (currentRound < currentRace.rounds - 1) {
      const success = await nextRound();
      if (success) {
        setCurrentRound(prev => prev + 1);
        setGameStats(prev => ({ ...prev, currentStreak: 0 }));
        setShowHint(false);
        setHintWords([]);
        setInput('');
        
        toast({
          title: "Next Round",
          description: `Round ${currentRound + 2} of ${currentRace.rounds}`,
          variant: "default",
        });
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

  const getHint = () => {
    if (!currentRace || showHint) return;
    
    // Generate some hint words based on current alphagram
    const currentAlphagram = getCurrentAlphagram();
    
    // Simple hint generation - in a real app, this would use the dictionary
    const possibleWords = [
      currentAlphagram.slice(0, 3),
      currentAlphagram.slice(1, 4),
      currentAlphagram.slice(0, 4),
    ].filter(word => word.length >= 2);
    
    setHintWords(possibleWords);
    setShowHint(true);
    
    toast({
      title: "Hint Revealed",
      description: "Here are some possible word patterns.",
      variant: "default",
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentAlphagram = () => {
    return currentRace?.alphagrams[currentRound] || 'AERT';
  };

  const getProgressPercentage = () => {
    if (!currentRace) return 0;
    return ((currentRound + 1) / currentRace.rounds) * 100;
  };

  const startGame = async () => {
    if (!currentRace) return;
    
    setGameStatus('active');
    
    // Broadcast player progress as active
    broadcastPlayerProgress({
      currentScore: gameStats.totalScore,
      wordsFound: gameStats.wordsFound,
      currentRound,
      status: 'playing'
    });
    
    toast({
      title: "Race Started!",
      description: "Find as many anagrams as you can!",
      variant: "default",
    });
  };

  const handleSpectatorJoin = async () => {
    if (!raceId) return;
    
    const success = await joinAsSpectator(raceId);
    if (success) {
      setShowSpectatorMode(true);
      toast({
        title: "Joined as Spectator",
        description: "You're now watching this race live!",
        variant: "default",
      });
    }
  };

  const handleLeaveSpectator = () => {
    setShowSpectatorMode(false);
    leaveRaceChannel();
    navigate('/race-lobby');
  };

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold text-foreground">Joining Race...</h2>
          <p className="text-muted-foreground">Please wait while we connect you to the race.</p>
        </div>
      </div>
    );
  }

  // Show error state if no race data
  if (!currentRace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <Gamepad2 className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Race not found</h1>
            <p className="text-muted-foreground">This race may have ended or been removed.</p>
          </div>
          <Button 
            onClick={() => navigate('/race-lobby')}
            className="w-full"
          >
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  // Show error state if user is not a participant
  if (!myParticipant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Not a Participant</h1>
            <p className="text-muted-foreground">You are not a participant in this race.</p>
          </div>
          <Button 
            onClick={() => navigate('/race-lobby')}
            className="w-full"
          >
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  // Show spectator mode if user is spectating
  if (showSpectatorMode || isSpectating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <SpectatorMode onLeaveSpectator={handleLeaveSpectator} />
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
              <ConnectionStatus />
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {currentRace.currentPlayers}/{currentRace.maxPlayers}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {currentRace.difficulty}
              </Badge>
              {!myParticipant && (
                <Button variant="outline" size="sm" onClick={handleSpectatorJoin}>
                  <Eye className="w-4 h-4 mr-1" />
                  Spectate
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Waiting State */}
        {gameStatus === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 space-y-4">
                <Crown className="w-16 h-16 text-primary mx-auto" />
                <h2 className="text-2xl font-bold">Race Ready!</h2>
                <p className="text-muted-foreground">
                  You're in the race. Click start when you're ready to begin!
                </p>
                <Button onClick={startGame} size="lg" className="w-full">
                  Start Race
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Game */}
        {gameStatus === 'active' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Main Game Area */}
            <div className="xl:col-span-2 space-y-6">
              
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
                        onChange={(e) => setInput(e.target.value.toUpperCase())}
                        onKeyPress={handleKeyPress}
                        className="text-lg font-mono"
                        disabled={isSubmitting}
                      />
                      <Button 
                        onClick={handleSubmit}
                        disabled={!input.trim() || isSubmitting}
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
                        disabled={showHint}
                      >
                        <Lightbulb className="w-4 h-4 mr-1" />
                        {showHint ? 'Hint Used' : 'Get Hint'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleNextRound}
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        {currentRound === currentRace.rounds - 1 ? 'Finish' : 'Next Round'}
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
                          Hint Patterns
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {hintWords.map((word, index) => (
                            <Badge key={index} variant="secondary">
                              {word}...
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          These are possible word beginnings from the letters.
                        </p>
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
                    <CardTitle className="text-lg">Your Words ({mySubmissions.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mySubmissions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No words submitted yet. Start finding anagrams!
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {mySubmissions.map((submission, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                          >
                            <span className="font-medium font-mono">{submission.word}</span>
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

            {/* Sidebar - Stats */}
            <div className="space-y-6">
              
              {/* Live Multiplayer Panel */}
              {liveRaceState && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Wifi className="w-5 h-5 text-primary" />
                        Live Race
                        {getMyPosition() > 0 && (
                          <Badge variant="outline" className="ml-auto">
                            #{getMyPosition()}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-primary">
                            {liveRaceState.players.length}
                          </div>
                          <div className="text-xs text-muted-foreground">Active Players</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {liveRaceState.recentWords.length}
                          </div>
                          <div className="text-xs text-muted-foreground">Recent Words</div>
                        </div>
                      </div>
                      
                      {liveRaceState.recentWords.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Latest Words:</div>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {liveRaceState.recentWords.slice(0, 3).map((word, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="font-mono">{word.word}</span>
                                <span className="text-muted-foreground">
                                  {word.username} (+{word.score})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Right Sidebar - Live Multiplayer */}
            <div className="space-y-6">
              
              {/* Live Player Rankings */}
              {liveRaceState && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <LivePlayerList />
                </motion.div>
              )}

              {/* Recent Words Feed */}
              {liveRaceState && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <RecentWordsFeed />
                </motion.div>
              )}

              {/* Player Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
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
                          Word Accepted!
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 font-mono">
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
        )}

        {/* Finished State */}
        {gameStatus === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 space-y-4">
                <Trophy className="w-16 h-16 text-primary mx-auto" />
                <h2 className="text-2xl font-bold">Race Complete!</h2>
                <p className="text-muted-foreground">
                  Great job! Check out the results to see how you did.
                </p>
                <Button onClick={() => navigate(`/race/${raceId}/results`)} size="lg" className="w-full">
                  View Results
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}