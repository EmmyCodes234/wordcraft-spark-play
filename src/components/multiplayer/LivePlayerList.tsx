import React from "react";
import { useRealtime } from "@/context/RealtimeContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Eye, Zap, Trophy } from "lucide-react";

export const LivePlayerList: React.FC = () => {
  const { liveRaceState, isSpectating, getSpectatorCount } = useRealtime();
  const { user } = useAuth();

  if (!liveRaceState) return null;

  const { players, spectators } = liveRaceState;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5" />
          Live Rankings
          {getSpectatorCount() > 0 && (
            <Badge variant="secondary" className="ml-auto">
              <Eye className="h-3 w-3 mr-1" />
              {getSpectatorCount()} watching
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Waiting for players to join...
          </p>
        ) : (
          players.map((player, index) => (
            <div
              key={player.userId}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                player.userId === user?.id
                  ? "bg-primary/10 border-primary/20"
                  : "bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="relative">
                  {index === 0 && (
                    <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                  )}
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {player.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {player.username}
                      {player.userId === user?.id && " (You)"}
                    </span>
                    {player.streak > 2 && (
                      <Badge variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {player.streak}x
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {player.wordsFound} words • Round {player.currentRound + 1}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-lg">
                  {player.currentScore.toLocaleString()}
                </div>
                <Badge
                  variant={index === 0 ? "default" : "secondary"}
                  className="text-xs"
                >
                  #{player.position}
                </Badge>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div
                  className={`h-2 w-2 rounded-full ${
                    player.isActive ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
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
            </div>
          ))
        )}

        {spectators.length > 0 && (
          <div className="pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Spectators ({spectators.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {spectators.map((spectator) => (
                <Badge key={spectator.userId} variant="outline" className="text-xs">
                  {spectator.username}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};