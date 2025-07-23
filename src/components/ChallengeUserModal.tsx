import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export function ChallengeUserModal() {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [raceType, setRaceType] = useState('fours');
  const [loading, setLoading] = useState(false);

  const sendChallenge = async () => {
    setLoading(true);
    const { data: targetUser, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();  // ✅ Final fix using maybeSingle()

    if (!targetUser) {
      toast.error('User not found');
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('races')
      .insert({
        race_type: raceType,
        status: 'waiting',
        created_by: user?.id,
        invited_user_id: targetUser.id,
        is_private: true,
        duration_seconds: 180,
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      toast.error('Error creating challenge');
    } else {
      toast.success('Challenge sent successfully!');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Challenge a User by Username</Button>
      </DialogTrigger>
      <DialogContent aria-describedby="challenge-desc">
        <DialogHeader>
          <DialogTitle>Challenge Someone</DialogTitle>
        </DialogHeader>
        <p id="challenge-desc" className="sr-only">
          Enter a username and race type to challenge your friend.
        </p>
        <div className="space-y-4">
          <Input
            placeholder="Enter opponent's username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <select
            className="w-full border rounded px-3 py-2"
            value={raceType}
            onChange={(e) => setRaceType(e.target.value)}
          >
            {['threes', 'fours', 'fives', 'sixes', 'sevens', 'eights', 'nines'].map((type) => (
              <option key={type} value={type}>
                {type.toUpperCase()} Race
              </option>
            ))}
          </select>
          <Button onClick={sendChallenge} disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Challenge'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
