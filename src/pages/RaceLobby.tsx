import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChallengeUserModal } from '@/components/ChallengeUserModal';

export default function RaceLobby() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ username: string } | null>(null);

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from('races')
      .select('*')
      .eq('invited_user_id', user?.id)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    setChallenges(data || []);
    setLoading(false);
  };

  const fetchUserProfile = async () => {
    if (user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      setProfile(data);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChallenges();
      fetchUserProfile();
    }
  }, [user]);

  const acceptRace = async (raceId: string) => {
    await supabase
      .from('races')
      .update({ status: 'active' })
      .eq('id', raceId);

    window.location.href = `/race/${raceId}`;
  };

  const startRace = async (raceType: string) => {
    const { data } = await supabase
      .from('races')
      .insert({
        race_type: raceType,
        status: 'waiting',
        created_by: user?.id,
        is_private: true,
        duration_seconds: 180,
      })
      .select()
      .single();

    if (data?.id) {
      alert('Share your race code: ' + data.id);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-10 items-start mt-6 px-2 md:px-6">
      {/* Incoming Challenges */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Incoming Challenges</h2>
        {loading ? (
          <p>Loading...</p>
        ) : challenges.length > 0 ? (
          challenges.map((challenge) => (
            <Card key={challenge.id}>
              <CardHeader>
                <CardTitle>
                  You’ve been challenged to a <strong>{challenge.race_type}</strong> race!
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between">
                <Button onClick={() => acceptRace(challenge.id)}>Accept</Button>
                <Button variant="ghost">Ignore</Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="italic text-muted-foreground">
            No incoming challenges yet. Share your code to get started.
          </p>
        )}
      </div>

      {/* Start a New Race */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Start a New Race</h2>
        <div className="grid grid-cols-1 gap-3">
          {['threes', 'fours', 'fives', 'sixes', 'sevens', 'eights', 'nines'].map((type) => (
            <Button key={type} className="w-full" onClick={() => startRace(type)}>
              Challenge a friend to a {type.toUpperCase()} race
            </Button>
          ))}
        </div>
        <div className="mt-4">
          <ChallengeUserModal />
        </div>
        <p className="text-sm mt-4 text-muted-foreground">
          Your unique code:
          <span className="ml-1 font-bold text-green-700 bg-muted px-2 py-1 rounded">
            {profile?.username ? `@${profile.username}` : 'Unnamed — set your username in Profile'}
          </span>
        </p>
      </div>
    </div>
  );
}
