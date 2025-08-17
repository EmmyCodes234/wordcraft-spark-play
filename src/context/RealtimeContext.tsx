import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface RealTimeRaceUpdate {
  type: 'player_joined' | 'player_left' | 'word_submitted' | 'round_completed' | 'race_started' | 'race_finished' | 'player_progress';
  raceId: string;
  userId: string;
  username: string;
  data?: any;
  timestamp: string;
}

export interface LivePlayer {
  userId: string;
  username: string;
  currentScore: number;
  wordsFound: number;
  currentRound: number;
  isActive: boolean;
  lastActivity: string;
  position: number;
  streak: number;
  status: 'waiting' | 'playing' | 'finished';
}

export interface LiveRaceState {
  raceId: string;
  status: 'waiting' | 'active' | 'finished';
  currentRound: number;
  timeRemaining: number;
  players: LivePlayer[];
  recentWords: Array<{
    userId: string;
    username: string;
    word: string;
    score: number;
    timestamp: string;
  }>;
  spectators: Array<{
    userId: string;
    username: string;
    joinedAt: string;
  }>;
}

interface RealtimeContextType {
  // Current race state
  liveRaceState: LiveRaceState | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Race management
  joinRaceChannel: (raceId: string, asSpectator?: boolean) => Promise<boolean>;
  leaveRaceChannel: () => void;
  
  // Live updates
  broadcastUpdate: (update: Omit<RealTimeRaceUpdate, 'timestamp'>) => void;
  broadcastWordSubmission: (word: string, score: number, roundIndex: number) => void;
  broadcastPlayerProgress: (progress: Partial<LivePlayer>) => void;
  
  // Spectator mode
  joinAsSpectator: (raceId: string) => Promise<boolean>;
  getSpectatorCount: () => number;
  
  // Utilities
  getPlayerRankings: () => LivePlayer[];
  getMyPosition: () => number;
  isSpectating: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [liveRaceState, setLiveRaceState] = useState<LiveRaceState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isSpectating, setIsSpectating] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRaceChannel();
    };
  }, []);

  const joinRaceChannel = async (raceId: string, asSpectator = false): Promise<boolean> => {
    if (!user) return false;

    try {
      // Prevent duplicate connections
      if (channelRef.current && isConnected) {
        console.log('Already connected to race channel:', raceId);
        return true;
      }

      console.log('Joining race channel:', raceId, 'asSpectator:', asSpectator);
      setConnectionStatus('connecting');
      setIsSpectating(asSpectator);
      
      // Leave existing channel if any
      if (channelRef.current) {
        console.log('Leaving existing channel');
        await channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      // Create new channel
      const channel = supabase.channel(`race:${raceId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: user.id }
        }
      });

      // Set up presence tracking with debounced notifications
      let joinNotificationTimeout: NodeJS.Timeout | null = null;
      let leaveNotificationTimeout: NodeJS.Timeout | null = null;

      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          updatePlayersFromPresence(presenceState);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          const newPlayer = newPresences[0];
          if (newPlayer && !asSpectator && newPlayer.userId !== user.id) {
            // Debounce join notifications to prevent spam
            if (joinNotificationTimeout) {
              clearTimeout(joinNotificationTimeout);
            }
            joinNotificationTimeout = setTimeout(() => {
              toast({
                title: "Player Joined",
                description: `${newPlayer.username || 'Anonymous'} joined the race`,
                variant: "default",
              });
            }, 500);
          }
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          const leftPlayer = leftPresences[0];
          if (leftPlayer && !asSpectator && leftPlayer.userId !== user.id) {
            // Debounce leave notifications to prevent spam
            if (leaveNotificationTimeout) {
              clearTimeout(leaveNotificationTimeout);
            }
            leaveNotificationTimeout = setTimeout(() => {
              toast({
                title: "Player Left",
                description: `${leftPlayer.username || 'Anonymous'} left the race`,
                variant: "default",
              });
            }, 500);
          }
        })
        .on('broadcast', { event: 'race_update' }, ({ payload }) => {
          handleRaceUpdate(payload as RealTimeRaceUpdate);
        })
        .on('broadcast', { event: 'word_submitted' }, ({ payload }) => {
          handleWordSubmission(payload);
        })
        .on('broadcast', { event: 'player_progress' }, ({ payload }) => {
          handlePlayerProgress(payload);
        });

      // Subscribe and track presence
      const subscriptionResult = await channel.subscribe(async (status) => {
        console.log('Channel subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          setIsConnected(true);
          channelRef.current = channel;
          
          // Track presence
          await channel.track({
            userId: user.id,
            username: user.user_metadata?.username || 'Anonymous',
            isSpectator: asSpectator,
            joinedAt: new Date().toISOString(),
            currentScore: 0,
            wordsFound: 0,
            currentRound: 0,
            status: 'waiting'
          });

          // Initialize race state
          setLiveRaceState({
            raceId,
            status: 'waiting',
            currentRound: 0,
            timeRemaining: 0,
            players: [],
            recentWords: [],
            spectators: []
          });

          console.log('Successfully joined race channel:', raceId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel subscription error');
          setConnectionStatus('error');
          setIsConnected(false);
          channelRef.current = null;
        } else if (status === 'TIMED_OUT') {
          console.error('Channel subscription timed out');
          setConnectionStatus('error');
          setIsConnected(false);
          channelRef.current = null;
        }
      });

      return subscriptionResult === 'SUBSCRIBED';
    } catch (error) {
      console.error('Error joining race channel:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      channelRef.current = null;
      return false;
    }
  };

  const leaveRaceChannel = () => {
    console.log('Leaving race channel');
    
    if (channelRef.current) {
      console.log('Unsubscribing from channel');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    if (heartbeatRef.current) {
      console.log('Clearing heartbeat');
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    
    // Reset all state
    setLiveRaceState(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setIsSpectating(false);
    
    console.log('Successfully left race channel');
  };

  const startHeartbeat = (channel: RealtimeChannel) => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    
    heartbeatRef.current = setInterval(() => {
      if (user && liveRaceState) {
        channel.track({
          userId: user.id,
          username: user.user_metadata?.username || 'Anonymous',
          isSpectator: isSpectating,
          lastActivity: new Date().toISOString(),
          isActive: true
        });
      }
    }, 10000); // Update every 10 seconds
  };

  const updatePlayersFromPresence = (presenceState: any) => {
    if (!liveRaceState) return;

    const players: LivePlayer[] = [];
    const spectators: Array<{ userId: string; username: string; joinedAt: string }> = [];

    Object.values(presenceState).forEach((presences: any) => {
      presences.forEach((presence: any) => {
        if (presence.isSpectator) {
          spectators.push({
            userId: presence.userId,
            username: presence.username,
            joinedAt: presence.joinedAt
          });
        } else {
          players.push({
            userId: presence.userId,
            username: presence.username,
            currentScore: presence.currentScore || 0,
            wordsFound: presence.wordsFound || 0,
            currentRound: presence.currentRound || 0,
            isActive: presence.isActive || false,
            lastActivity: presence.lastActivity || presence.joinedAt,
            position: 0, // Will be calculated
            streak: presence.streak || 0,
            status: presence.status || 'waiting'
          });
        }
      });
    });

    // Sort players by score and assign positions
    players.sort((a, b) => b.currentScore - a.currentScore);
    players.forEach((player, index) => {
      player.position = index + 1;
    });

    setLiveRaceState(prev => prev ? {
      ...prev,
      players,
      spectators
    } : null);
  };

  const handleRaceUpdate = (update: RealTimeRaceUpdate) => {
    if (!liveRaceState) return;

    switch (update.type) {
      case 'race_started':
        setLiveRaceState(prev => prev ? { ...prev, status: 'active' } : null);
        if (!isSpectating) {
          toast({
            title: "🏁 Race Started!",
            description: "The race has begun. Good luck!",
            variant: "default",
          });
        }
        break;
        
      case 'race_finished':
        setLiveRaceState(prev => prev ? { ...prev, status: 'finished' } : null);
        if (!isSpectating) {
          toast({
            title: "🏆 Race Finished!",
            description: "Check the results to see how you did.",
            variant: "default",
          });
        }
        break;
        
      case 'round_completed':
        setLiveRaceState(prev => prev ? {
          ...prev,
          currentRound: update.data?.roundIndex || prev.currentRound + 1
        } : null);
        break;
    }
  };

  const handleWordSubmission = (payload: any) => {
    if (!liveRaceState) return;

    const newWord = {
      userId: payload.userId,
      username: payload.username,
      word: payload.word,
      score: payload.score,
      timestamp: payload.timestamp
    };

    setLiveRaceState(prev => prev ? {
      ...prev,
      recentWords: [newWord, ...prev.recentWords].slice(0, 10) // Keep last 10 words
    } : null);

    // Show notification for spectators
    if (isSpectating && payload.userId !== user?.id) {
      toast({
        title: "Word Found!",
        description: `${payload.username} found "${payload.word}" (+${payload.score} pts)`,
        variant: "default",
      });
    }
  };

  const handlePlayerProgress = (payload: any) => {
    if (!liveRaceState) return;

    setLiveRaceState(prev => {
      if (!prev) return null;
      
      const updatedPlayers = prev.players.map(player => 
        player.userId === payload.userId 
          ? { ...player, ...payload }
          : player
      );
      
      // Re-sort and update positions
      updatedPlayers.sort((a, b) => b.currentScore - a.currentScore);
      updatedPlayers.forEach((player, index) => {
        player.position = index + 1;
      });
      
      return {
        ...prev,
        players: updatedPlayers
      };
    });
  };

  const broadcastUpdate = (update: Omit<RealTimeRaceUpdate, 'timestamp'>) => {
    if (!channelRef.current || !user) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'race_update',
      payload: {
        ...update,
        timestamp: new Date().toISOString()
      }
    });
  };

  const broadcastWordSubmission = (word: string, score: number, roundIndex: number) => {
    if (!channelRef.current || !user) return;

    const payload = {
      userId: user.id,
      username: user.user_metadata?.username || 'Anonymous',
      word,
      score,
      roundIndex,
      timestamp: new Date().toISOString()
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'word_submitted',
      payload
    });
  };

  const broadcastPlayerProgress = (progress: Partial<LivePlayer>) => {
    if (!channelRef.current || !user) return;

    const payload = {
      userId: user.id,
      username: user.user_metadata?.username || 'Anonymous',
      ...progress,
      timestamp: new Date().toISOString()
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'player_progress',
      payload
    });

    // Also update presence
    channelRef.current.track({
      userId: user.id,
      username: user.user_metadata?.username || 'Anonymous',
      isSpectator: isSpectating,
      lastActivity: new Date().toISOString(),
      ...progress
    });
  };

  const joinAsSpectator = async (raceId: string): Promise<boolean> => {
    return await joinRaceChannel(raceId, true);
  };

  const getSpectatorCount = (): number => {
    return liveRaceState?.spectators.length || 0;
  };

  const getPlayerRankings = (): LivePlayer[] => {
    if (!liveRaceState) return [];
    return [...liveRaceState.players].sort((a, b) => b.currentScore - a.currentScore);
  };

  const getMyPosition = (): number => {
    if (!liveRaceState || !user) return 0;
    const myPlayer = liveRaceState.players.find(p => p.userId === user.id);
    return myPlayer?.position || 0;
  };

  return (
    <RealtimeContext.Provider value={{
      liveRaceState,
      isConnected,
      connectionStatus,
      joinRaceChannel,
      leaveRaceChannel,
      broadcastUpdate,
      broadcastWordSubmission,
      broadcastPlayerProgress,
      joinAsSpectator,
      getSpectatorCount,
      getPlayerRankings,
      getMyPosition,
      isSpectating
    }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};