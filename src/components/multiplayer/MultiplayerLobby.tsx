import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRace } from "@/context/RaceContext";
import { useRealtime } from "@/context/RealtimeContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Clock, 
  Trophy, 
  Eye, 
  Play, 
  Gamepad2,
  Target,
  Timer,
  Star,
  Crown
} from "lucide-react";
import { ConnectionStatus } from "./ConnectionStatus";
import { formatDistanceToNow } from "date-fns";

interface MultiplayerLobbyProps {
  raceId: string;
  onJoinRace: () => void;
  onSpectateRace: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  raceId,
  onJoinRace,
  onSpectateRace,
}) => {
  const { currentRace, participants } = useRace();
  const { 
    liveRaceState, 
    joinRaceChannel, 
    leaveRaceChannel, 
    isConnected,
    getSpectatorCount 
  } = useRealtime();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isJoining, setIsJoining] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);

  // Connect to race channel when component mounts
  useEffect(() => {
    if (raceId && !isConnected) {
      joinRaceChannel(raceId, true); // Join as spectator initially
    }
    
    return () => {
      leaveRaceChannel();
    };
  }, [raceId, isConnected, joinRaceChannel, leaveRaceChannel]);

  const handleJoinRace = async () => {
    setIsJoining(true);
    try {
      await onJoinRace();
      navigate(`/race/${raceId}`);
    } catch (error) {
      console.error('Error joining race:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleSpectateRace = async () => {
    setIsSpectating(true);
    try {
      await onSpectateRace();
      navigate(`/race/${raceId}`);
    } catch (error) {
      console.error('Error spectating race:', error);
    } finally {
      setIsSpectating(false);
    }
  };

  if (!currentRace) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Race Not Found</h3>
          <p className="text-muted-foreground">
            This race may have ended or been removed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isUserInRace = participants.some(p => p.userId === user?.id);
  const canJoinRace = currentRace.status === 'waiting' && 
                     currentRace.currentPlayers < currentRace.maxPlayers && 
                     !isUserInRace;

  return (
    <div className="space-y-6">
      {/* Race Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6" />
              {currentRace.name}
              <ConnectionStatus />
            </CardTitle>
            <Badge 
              variant={currentRace.status === 'active' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {currentRace.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Race Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentRace.currentPlayers}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                / {currentRace.maxPlayers} Players
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getSpectatorCount()}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" />
                Spectators
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.floor(currentRace.duration / 60)}m
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Timer className="h-3 w-3" />
                Duration
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {currentRace.rounds}
              </div>
              <div className="text-sm text-muted-foreground">
                Rounds
              </div>
            </div>
          </div>

          {/* Race Details */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {currentRace.difficulty}
            </Badge>
            <Badge variant="outline">
              {currentRace.type}
            </Badge>
            {currentRace.probabilityMode && (
              <Badge variant="outline" className="text-green-600">
                <Star className="h-3 w-3 mr-1" />
                Probability Mode
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canJoinRace && (
              <Button 
                onClick={handleJoinRace}
                disabled={isJoining}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                {isJoining ? 'Joining...' : 'Join Race'}
              </Button>
            )}
            
            {currentRace.status === 'active' && (
              <Button 
                variant="outline"
                onClick={handleSpectateRace}
                disabled={isSpectating}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isSpectating ? 'Joining...' : 'Spectate'}
              </Button>
            )}

            {isUserInRace && (
              <Button 
                onClick={() => navigate(`/race/${raceId}`)}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Continue Race
              </Button>
            )}
          </div>

          {/* Status Messages */}
          {currentRace.status === 'waiting' && (
            <div className="text-center text-muted-foreground">
              <Clock className="h-4 w-4 mx-auto mb-1" />
              <p className="text-sm">Waiting for more players to join...</p>
            </div>
          )}

          {currentRace.status === 'finished' && (
            <div className="text-center text-muted-foreground">
              <Trophy className="h-4 w-4 mx-auto mb-1" />
              <p className="text-sm">This race has finished.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => navigate(`/race/${raceId}/results`)}
              >
                View Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Players List */}
      {liveRaceState && liveRaceState.players.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Players ({liveRaceState.players.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveRaceState.players.map((player, index) => (
                <div
                  key={player.userId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="relative">
                    {index === 0 && liveRaceState.status === 'active' && (
                      <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                    )}
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {player.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {player.username}
                        {player.userId === user?.id && " (You)"}
                      </span>
                      <Badge
                        variant={
                          player.status === "playing"
                            ? "default"
                            : player.status === "finished"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {player.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.wordsFound} words • {player.currentScore.toLocaleString()} pts
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      #{player.position}
                    </Badge>
                  </div>

                  <div
                    className={`h-2 w-2 rounded-full ${
                      player.isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {liveRaceState && liveRaceState.recentWords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recent Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {liveRaceState.recentWords.slice(0, 5).map((wordEntry, index) => (
                <div
                  key={`${wordEntry.userId}-${wordEntry.timestamp}-${index}`}
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {wordEntry.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{wordEntry.username}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{wordEntry.word}</span>
                    <Badge variant="outline" className="text-xs">
                      +{wordEntry.score}
                    </Badge>
                  </div>
                  
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(wordEntry.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spectators */}
      {liveRaceState && liveRaceState.spectators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Spectators ({liveRaceState.spectators.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {liveRaceState.spectators.map((spectator) => (
                <Badge key={spectator.userId} variant="outline" className="text-xs">
                  {spectator.username}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};