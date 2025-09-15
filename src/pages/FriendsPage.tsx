import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Users, Trophy, Star, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
  status: 'online' | 'offline';
  last_active?: string;
  stats: {
    total_words: number;
    streak_days: number;
    achievements_count: number;
  };
}

interface FriendRequest {
  id: string;
  from_user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          friend:profiles!friendships_friend_id_fkey(
            id, username, avatar_url, last_active,
            user_stats(total_words, streak_days, achievements_count)
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'accepted');

      if (error) throw error;

      const friendsList = data?.map(f => ({
        id: f.friend.id,
        username: f.friend.username,
        avatar_url: f.friend.avatar_url,
        status: f.friend.last_active ? 'online' : 'offline',
        last_active: f.friend.last_active,
        stats: f.friend.user_stats || { total_words: 0, streak_days: 0, achievements_count: 0 }
      })) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id, status, created_at,
          from_user:profiles!friend_requests_from_user_id_fkey(id, username, avatar_url)
        `)
        .eq('to_user_id', user?.id)
        .eq('status', 'pending');

      if (error) throw error;
      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const searchUsers = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${term}%`)
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      });
    }
  };


  const sendFriendRequest = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: user?.id,
          to_user_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent!",
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive"
      });
    }
  };

  const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      if (status === 'accepted') {
        // Create friendship record
        const request = friendRequests.find(r => r.id === requestId);
        if (request) {
          await supabase
            .from('friendships')
            .insert([
              { user_id: user?.id, friend_id: request.from_user.id, status: 'accepted' },
              { user_id: request.from_user.id, friend_id: user?.id, status: 'accepted' }
            ]);
        }

        toast({
          title: "Friend Added!",
          description: "You are now friends!",
        });
      }

      fetchFriendRequests();
      fetchFriends();
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Friends</h1>
          <p className="text-muted-foreground">Connect with fellow WordSmiths and compete together!</p>
        </div>

        {/* Search for Friends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Friends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
              
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.username}</span>
                      </div>
                      <Button size="sm" onClick={() => sendFriendRequest(user.id)}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Friend
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Friend Requests ({friendRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={request.from_user.avatar_url} />
                        <AvatarFallback>{request.from_user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{request.from_user.username}</span>
                        <p className="text-sm text-muted-foreground">
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => respondToFriendRequest(request.id, 'accepted')}
                      >
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => respondToFriendRequest(request.id, 'declined')}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Friends List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Friends ({friends.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading friends...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by searching for friends above!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.avatar_url} />
                        <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                        friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{friend.username}</span>
                        <Badge variant="outline" className="text-xs">
                          {friend.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {friend.stats.total_words} words
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {friend.stats.streak_days} day streak
                        </div>
                      </div>
                    </div>
                    
                    <Button size="sm" variant="outline">
                      Challenge
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
