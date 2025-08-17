import React, { useEffect, useState } from "react";
import { useRealtime } from "@/context/RealtimeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Clock, 
  Trophy, 
  Eye, 
  Play, 
  Target,
  Timer,
  Star,
  Crown,
  Wifi,
  WifiOff
} from "lucide-react";
import { Race } from "@/context/RaceContext";

interface LiveRaceCardProps {
  race: Race;
  onJoin: () => void;
  onSpectate: () => void;
  onViewDetails: () => void;
}

export const LiveRaceCard: React.FC<LiveRaceCardProps> = ({
  race,
  onJoin,
  onSpectate,
  onViewDetails,
}) => {
  const { 
    liveRaceState, 
    joinRaceChannel, 
    leaveRaceChannel, 
    isConnected,
    getSpectatorCount 
  } = useRealtime();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);

  // Connect to race channel to get live data
  useEffect(() => {
    const connectToRace = async () => {
      if (!hasConnected && race.id) {
        setIsConnecting(true);
        try {
          await joinRaceChannel(race.id, true); // Join as spectator for live data
          setHasConnected(true);
        } catch (error) {
          console.error('Error connecting to race:', error);
        } finally {
          setIsConnecting(false);
        }
      }
    };

    connectToRace();

    // Cleanup on unmount
    return () => {
      if (hasConnected) {
        leaveRaceChannel();
        setHasConnected(false);
      }
    };
  }, [race.id, hasConnected, joinRaceChannel, leaveRaceChannel]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expert': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'finished': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const livePlayerCount = liveRaceState?.players.length || race.currentPlayers;
  const liveSpectatorCount = getSpectatorCount();
  const topPlayers = liveRaceState?.players.slice(0, 3) || [];

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {race.name}
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : isConnecting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusColor(race.status)} variant="outline">
                {race.status}
              </Badge>
              <Badge className={getDifficultyColor(race.difficulty)} variant="outline">
                <Target className="h-3 w-3 mr-1" />
                {race.difficulty}
              </Badge>
              <Badge variant="outline">
                {race.type}
              </Badge>
              {race.probabilityMode && (
                <Badge variant="outline" className="text-green-600">
                  <Star className="h-3 w-3 mr-1" />
                  Probability
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Live Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-primary">
              {livePlayerCount}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              / {race.maxPlayers}
            </div>
          </div>
          
          <div>
            <div className="text-lg font-bold text-green-600">
              {liveSpectatorCount}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Eye className="h-3 w-3" />
              Watching
            </div>
          </div>
          
          <div>
            <div className="text-lg font-bold">
              {formatDuration(race.duration)}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Timer className="h-3 w-3" />
              Duration
            </div>
          </div>
        </div>

        {/* Top Players (Live) */}
        {topPlayers.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-1">
              <Trophy className="h-4 w-4 text-primary" />
              Top Players
            </div>
            <div className="space-y-1">
              {topPlayers.map((player, index) => (
                <div
                  key={player.userId}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="flex items-center gap-1">
                    {index === 0 && (
                      <Crown className="h-3 w-3 text-yellow-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-xs">
                      {player.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">{player.username}</span>
                  <span className="text-xs font-mono">
                    {player.currentScore.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Race Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Rounds:</span>
            <span>{race.rounds}</span>
          </div>
          {race.wordLength && (
            <div className="flex justify-between">
              <span>Word Length:</span>
              <span>{race.wordLength} letters</span>
            </div>
          )}
          {race.probabilityMode && (
            <div className="flex justify-between">
              <span>Probability Range:</span>
              <span>{race.minProbability}% - {race.maxProbability}%</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {race.status === 'waiting' && race.currentPlayers < race.maxPlayers && (
            <Button onClick={onJoin} className="flex-1" size="sm">
              <Play className="h-4 w-4 mr-1" />
              Join
            </Button>
          )}
          
          {race.status === 'active' && (
            <Button onClick={onSpectate} variant="outline" className="flex-1" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Spectate
            </Button>
          )}

          {race.status === 'finished' && (
            <Button onClick={onViewDetails} variant="outline" className="flex-1" size="sm">
              <Trophy className="h-4 w-4 mr-1" />
              Results
            </Button>
          )}

          <Button onClick={onViewDetails} variant="ghost" size="sm">
            Details
          </Button>
        </div>

        {/* Status Messages */}
        {race.status === 'waiting' && (
          <div className="text-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mx-auto mb-1" />
            Waiting for players...
          </div>
        )}

        {race.status === 'active' && liveRaceState && (
          <div className="text-center text-xs text-green-600">
            <div className="flex items-center justify-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Race in progress
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};