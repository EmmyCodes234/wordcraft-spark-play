import React from "react";
import { useRealtime } from "@/context/RealtimeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Users, Clock, Trophy } from "lucide-react";
import { LivePlayerList } from "./LivePlayerList";
import { RecentWordsFeed } from "./RecentWordsFeed";
import { ConnectionStatus } from "./ConnectionStatus";

interface SpectatorModeProps {
  onLeaveSpectator: () => void;
}

export const SpectatorMode: React.FC<SpectatorModeProps> = ({
  onLeaveSpectator,
}) => {
  const { liveRaceState, getSpectatorCount } = useRealtime();

  if (!liveRaceState) return null;

  const { status, currentRound, timeRemaining, players } = liveRaceState;

  return (
    <div className="space-y-6">
      {/* Spectator Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Spectating Race
              <ConnectionStatus />
            </CardTitle>
            <Button variant="outline" onClick={onLeaveSpectator}>
              Leave
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{players.length}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                Players
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{getSpectatorCount()}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" />
                Spectators
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{currentRound + 1}</div>
              <div className="text-sm text-muted-foreground">
                Current Round
              </div>
            </div>
            
            <div className="text-center">
              <Badge
                variant={
                  status === "active"
                    ? "default"
                    : status === "finished"
                    ? "secondary"
                    : "outline"
                }
                className="text-sm px-3 py-1"
              >
                {status === "active" && timeRemaining > 0 && (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                {status === "finished" && (
                  <Trophy className="h-3 w-3 mr-1" />
                )}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
          </div>

          {status === "active" && timeRemaining > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Time Remaining</span>
                <span className="font-mono">
                  {Math.floor(timeRemaining / 60)}:
                  {(timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, (timeRemaining / 180) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LivePlayerList />
        <RecentWordsFeed />
      </div>

      {/* Race Status Messages */}
      {status === "waiting" && (
        <Card className="border-dashed">
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Waiting for Race to Start</h3>
            <p className="text-muted-foreground">
              The race hasn't started yet. Players are still joining.
            </p>
          </CardContent>
        </Card>
      )}

      {status === "finished" && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">Race Completed!</h3>
            <p className="text-muted-foreground">
              The race has finished. Check the final rankings above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};