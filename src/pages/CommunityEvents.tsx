import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, Trophy, Clock, Star, Zap, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  start_date: string;
  end_date: string;
  target: number;
  current_progress: number;
  participants: number;
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
  };
  status: 'upcoming' | 'active' | 'completed';
  user_participation?: {
    progress: number;
    completed: boolean;
    rank?: number;
  };
}

export default function CommunityEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityEvents();
  }, []);

  const fetchCommunityEvents = async () => {
    try {
      // Fetch community events with specific columns
      const { data: eventsData, error: eventsError } = await supabase
        .from('community_events')
        .select(`
          id,
          title,
          description,
          type,
          start_date,
          end_date,
          target,
          rewards,
          created_at,
          event_participants!left(user_id, progress, completed, rank)
        `)
        .order('start_date', { ascending: true });

      if (eventsError) throw eventsError;

      // Process events to include user participation
      const processedEvents = eventsData?.map(event => {
        const userParticipation = event.event_participants?.find(p => p.user_id === user?.id);
        return {
          ...event,
          user_participation: userParticipation || null,
          participants: event.event_participants?.length || 0,
          current_progress: event.event_participants?.reduce((sum, p) => sum + p.progress, 0) || 0
        };
      }) || [];

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching community events:', error);
      toast({
        title: "Error",
        description: "Failed to load community events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const joinEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: user.id,
          progress: 0,
          completed: false
        });

      if (error) throw error;

      toast({
        title: "Joined Event!",
        description: "You're now participating in this community event",
      });

      fetchCommunityEvents();
    } catch (error) {
      console.error('Error joining event:', error);
      toast({
        title: "Error",
        description: "Failed to join event",
        variant: "destructive"
      });
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Calendar className="h-5 w-5 text-primary" />;
      case 'weekly': return <Star className="h-5 w-5 text-purple-500" />;
      case 'monthly': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'special': return <Zap className="h-5 w-5 text-red-500" />;
      default: return <Trophy className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEventStatus = (event: CommunityEvent) => {
    const now = new Date();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'active';
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Community Events</h1>
          <p className="text-muted-foreground">Join community-wide challenges and compete with fellow WordSmiths!</p>
        </div>

        <AnimatePresence>
          {events.map((event, index) => {
            const status = getEventStatus(event);
            const progressPercentage = event.target > 0 ? (event.current_progress / event.target) * 100 : 0;
            const userProgressPercentage = event.user_participation ? (event.user_participation.progress / event.target) * 100 : 0;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border shadow-sm hover:shadow-md transition-shadow ${
                  status === 'active' ? 'ring-2 ring-primary/20' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getEventIcon(event.type)}
                        <div>
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <p className="text-muted-foreground mt-1">{event.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={
                            status === 'active' ? 'default' : 
                            status === 'upcoming' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {status}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeRemaining(event.end_date)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Community Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Community Progress
                        </span>
                        <span className="font-medium">
                          {event.current_progress.toLocaleString()} / {event.target.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{event.participants} participants</span>
                        <span>{Math.round(progressPercentage)}% complete</span>
                      </div>
                    </div>

                    {/* User Progress */}
                    {event.user_participation && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            Your Progress
                          </span>
                          <span className="font-medium">
                            {event.user_participation.progress} / {event.target}
                          </span>
                        </div>
                        <Progress value={userProgressPercentage} className="h-2" />
                        {event.user_participation.rank && (
                          <div className="text-xs text-muted-foreground">
                            Rank: #{event.user_participation.rank}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rewards */}
                    <div className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{event.rewards.xp} XP</span>
                      </div>
                      {event.rewards.badge && (
                        <Badge variant="outline" className="text-xs">
                          {event.rewards.badge}
                        </Badge>
                      )}
                      {event.rewards.title && (
                        <Badge variant="outline" className="text-xs">
                          {event.rewards.title}
                        </Badge>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                      {status === 'upcoming' && (
                        <Button variant="outline" disabled>
                          Starting Soon
                        </Button>
                      )}
                      {status === 'active' && !event.user_participation && (
                        <Button onClick={() => joinEvent(event.id)}>
                          Join Event
                        </Button>
                      )}
                      {status === 'active' && event.user_participation && (
                        <Button variant="outline">
                          View Details
                        </Button>
                      )}
                      {status === 'completed' && (
                        <Button variant="outline" disabled>
                          Event Ended
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading community events...</p>
          </div>
        )}

        {!loading && events.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-4">
                Community events will appear here when they're created!
              </p>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Start Learning
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
