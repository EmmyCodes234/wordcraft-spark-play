import React, { useEffect, useState } from "react";
import { useRealtime } from "@/context/RealtimeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Users, MessageSquare } from "lucide-react";

export const RealtimeTest: React.FC = () => {
  const {
    liveRaceState,
    isConnected,
    connectionStatus,
    joinRaceChannel,
    leaveRaceChannel,
    broadcastWordSubmission,
    getSpectatorCount
  } = useRealtime();

  const [testRaceId] = useState("test-race-123");
  const [isJoining, setIsJoining] = useState(false);

  const handleConnect = async () => {
    setIsJoining(true);
    try {
      await joinRaceChannel(testRaceId, true);
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleDisconnect = () => {
    leaveRaceChannel();
  };

  const handleTestBroadcast = () => {
    const testWords = ["REACT", "TYPESCRIPT", "SUPABASE", "REALTIME"];
    const randomWord = testWords[Math.floor(Math.random() * testWords.length)];
    const randomScore = Math.floor(Math.random() * 20) + 5;
    
    broadcastWordSubmission(randomWord, randomScore, 0);
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "connecting":
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Realtime Test
          <Badge variant={isConnected ? "default" : "secondary"}>
            {connectionStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect} 
              disabled={isJoining}
              className="flex-1"
            >
              {isJoining ? "Connecting..." : "Connect"}
            </Button>
          ) : (
            <Button 
              onClick={handleDisconnect} 
              variant="outline"
              className="flex-1"
            >
              Disconnect
            </Button>
          )}
          
          {isConnected && (
            <Button 
              onClick={handleTestBroadcast}
              variant="secondary"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Test
            </Button>
          )}
        </div>

        {liveRaceState && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">
                  {liveRaceState.players.length}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="h-3 w-3" />
                  Players
                </div>
              </div>
              
              <div>
                <div className="text-lg font-bold text-green-600">
                  {getSpectatorCount()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Spectators
                </div>
              </div>
            </div>

            {liveRaceState.recentWords.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Recent Words:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {liveRaceState.recentWords.slice(0, 5).map((word, index) => (
                    <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                      <span className="font-mono">{word.word}</span>
                      <span className="text-muted-foreground">
                        {word.username} (+{word.score})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Race ID: {testRaceId}
        </div>
      </CardContent>
    </Card>
  );
};