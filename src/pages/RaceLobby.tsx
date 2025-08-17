import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRace, Race } from '@/context/RaceContext';
import { useAuth } from '@/context/AuthContext';
import { useRealtime } from '@/context/RealtimeContext';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Clock, 
  Zap, 
  Target, 
  Plus, 
  Search,
  Filter,
  Crown,
  Timer,
  Gamepad2
} from 'lucide-react';
import { CreateRaceModal } from '@/components/CreateRaceModal';
import { MultiplayerLobby } from '@/components/multiplayer/MultiplayerLobby';

const RACE_TYPES = [
  {
    type: 'sprint' as const,
    name: 'Sprint',
    description: 'Quick 3-minute races',
    duration: 180,
    rounds: 8,
    icon: Zap,
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500'
  },
  {
    type: 'marathon' as const,
    name: 'Marathon',
    description: 'Extended 10-minute challenges',
    duration: 600,
    rounds: 20,
    icon: Target,
    color: 'bg-gradient-to-r from-blue-400 to-purple-500'
  },
  {
    type: 'blitz' as const,
    name: 'Blitz',
    description: 'Lightning fast 1-minute rounds',
    duration: 60,
    rounds: 5,
    icon: Timer,
    color: 'bg-gradient-to-r from-red-400 to-pink-500'
  }
];

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hard: 'bg-orange-100 text-orange-800 border-orange-200',
  expert: 'bg-red-100 text-red-800 border-red-200'
};

export default function RaceLobby() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    availableRaces, 
    fetchAvailableRaces, 
    joinRace, 
    createRace,
    isLoading 
  } = useRace();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableRaces();
    const interval = setInterval(fetchAvailableRaces, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredRaces = availableRaces.filter(race => {
    const matchesSearch = race.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || race.difficulty === filterDifficulty;
    const matchesType = filterType === 'all' || race.type === filterType;
    return matchesSearch && matchesDifficulty && matchesType;
  });

  const handleJoinRace = async (raceId: string) => {
    try {
      console.log('Attempting to join race:', raceId);
      const success = await joinRace(raceId);
      
      if (success) {
        console.log('Successfully joined race, navigating to game');
        // Add a small delay to ensure state is updated
        setTimeout(() => {
          navigate(`/race/${raceId}`);
        }, 100);
      } else {
        console.log('Failed to join race');
        // Don't navigate if join failed
      }
    } catch (error) {
      console.error('Error joining race:', error);
      // Don't navigate if there's an error
    }
  };

  const handleCreateRace = async (options: any) => {
    const race = await createRace({
      name: options.name,
      type: options.type,
      difficulty: options.difficulty,
      duration: options.duration,
      rounds: options.rounds,
      maxPlayers: options.maxParticipants,
      isPublic: options.isPublic,
      wordLength: options.wordLength === 'any' ? undefined : parseInt(options.wordLength),
      probabilityMode: options.probabilityMode,
      minProbability: options.minProbability,
      maxProbability: options.maxProbability,
      settings: options.settings
    });
    if (race) {
      setShowCreateModal(false);
      navigate(`/race/${race.id}`);
    }
  };

  const getRaceTypeInfo = (type: string) => {
    return RACE_TYPES.find(rt => rt.type === type) || RACE_TYPES[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-7xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 sm:space-y-4"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
              Word Race Arena
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2">
            Challenge players worldwide in real-time anagram battles. Test your speed, accuracy, and word knowledge!
          </p>
        </motion.div>

        {/* Quick Start Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {RACE_TYPES.map((raceType, index) => {
                  const Icon = raceType.icon;
                  return (
                    <motion.div
                      key={raceType.type}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30">
                        <CardContent className="p-6 text-center space-y-4">
                          <div className={`w-16 h-16 rounded-full ${raceType.color} flex items-center justify-center mx-auto`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{raceType.name}</h3>
                            <p className="text-sm text-muted-foreground">{raceType.description}</p>
                          </div>
                          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.floor(raceType.duration / 60)}m
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {raceType.rounds} rounds
                            </span>
                          </div>
                          <Button 
                            className="w-full"
                            onClick={() => setShowCreateModal(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create {raceType.name}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search races..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Types</option>
              <option value="sprint">Sprint</option>
              <option value="marathon">Marathon</option>
              <option value="blitz">Blitz</option>
            </select>
          </div>
        </motion.div>

        {/* Available Races */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Available Races ({filteredRaces.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading races...</p>
                </div>
              ) : filteredRaces.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-4xl">🏁</div>
                  <h3 className="text-lg font-semibold">No races found</h3>
                  <p className="text-muted-foreground">Be the first to create a race!</p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Race
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredRaces.map((race, index) => {
                    const raceTypeInfo = getRaceTypeInfo(race.type);
                    const Icon = raceTypeInfo.icon;
                    
                    return (
                      <motion.div
                        key={race.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                          <CardContent className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold truncate">{race.name}</h3>
                              </div>
                              <Badge className={DIFFICULTY_COLORS[race.difficulty]}>
                                {race.difficulty}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  Players
                                </span>
                                <span>{race.currentPlayers}/{race.maxPlayers}</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Duration
                                </span>
                                <span>{Math.floor(race.duration / 60)}m</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Rounds
                                </span>
                                <span>{race.rounds}</span>
                              </div>
                            </div>
                            
                            <Button 
                              className="w-full"
                              onClick={() => handleJoinRace(race.id)}
                              disabled={race.currentPlayers >= race.maxPlayers}
                            >
                              {race.currentPlayers >= race.maxPlayers ? 'Full' : 'Join Race'}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <CreateRaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateRace}
        isCreating={isLoading}
      />
    </div>
  );
}