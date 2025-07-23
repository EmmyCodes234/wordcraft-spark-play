import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import generateAlphagrams from '@/lib/generateAlphagrams';

export function ChallengeModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [opponentCode, setOpponentCode] = useState('');
  const [raceType, setRaceType] = useState('fours');
  const [loading, setLoading] = useState(false);

  const handleChallenge = async () => {
    if (!user || !opponentCode) return;
    setLoading(true);

    // Lookup opponent by code
    const { data: opponentProfile, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('user_code', opponentCode.trim().toUpperCase())
      .single();

    if (lookupError || !opponentProfile) {
      alert('User not found.');
      setLoading(false);
      return;
    }

    // Generate 20 alphagrams based on raceType
    const alphagrams = await generateAlphagrams(raceType, 20);

    const { error: createError } = await supabase.from('races').insert({
      race_type: raceType,
      alphagrams,
      status: 'waiting',
      duration_seconds: 180,
      created_by: user.id,
      invited_user_id: opponentProfile.id,
      is_private: true,
    });

    if (createError) {
      alert('Failed to create race.');
    } else {
      alert('Challenge sent!');
      setIsOpen(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Challenge a Player</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a Challenge</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Enter opponent's code (e.g. WS-3FJ9)"
            value={opponentCode}
            onChange={(e) => setOpponentCode(e.target.value)}
          />
          <Select value={raceType} onValueChange={setRaceType}>
            <SelectTrigger>
              <SelectValue placeholder="Choose Race Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="threes">Threes</SelectItem>
              <SelectItem value="fours">Fours</SelectItem>
              <SelectItem value="fives">Fives</SelectItem>
              <SelectItem value="sixes">Sixes</SelectItem>
              <SelectItem value="sevens">Sevens</SelectItem>
              <SelectItem value="eights">Eights</SelectItem>
              <SelectItem value="nines">Nines</SelectItem>
            </SelectContent>
          </Select>
          <Button disabled={loading} onClick={handleChallenge}>
            {loading ? 'Sending...' : 'Send Challenge'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
