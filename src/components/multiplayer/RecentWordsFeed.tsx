import React, { useEffect, useRef } from "react";
import { useRealtime } from "@/context/RealtimeContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const RecentWordsFeed: React.FC = () => {
  const { liveRaceState } = useRealtime();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new words are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveRaceState?.recentWords]);

  if (!liveRaceState) return null;

  const { recentWords } = liveRaceState;

  return (
    <Card className="w-full h-80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Recent Words
          <Badge variant="secondary" className="ml-auto">
            {recentWords.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={scrollRef}
          className="h-64 overflow-y-auto px-4 pb-4 space-y-2"
        >
          {recentWords.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No words found yet</p>
                <p className="text-xs">Words will appear here as players find them</p>
              </div>
            </div>
          ) : (
            recentWords.map((wordEntry, index) => (
              <div
                key={`${wordEntry.userId}-${wordEntry.timestamp}-${index}`}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                  wordEntry.userId === user?.id
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted/50"
                } ${
                  index === 0 ? "animate-in slide-in-from-bottom-2" : ""
                }`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {wordEntry.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {wordEntry.username}
                      {wordEntry.userId === user?.id && " (You)"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(wordEntry.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm bg-background px-2 py-1 rounded border">
                      {wordEntry.word}
                    </span>
                    <Badge
                      variant={wordEntry.score >= 10 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {wordEntry.score >= 15 && (
                        <Star className="h-3 w-3 mr-1" />
                      )}
                      +{wordEntry.score}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};