import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import generateAlphagrams from '@/lib/generateAlphagrams';

type PlayerResult = {
  username: string;
  user_id: string;
  word_count: number;
  words: string[];
};

export default function RaceResults() {
  const { raceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const { data: raceWords } = await supabase
        .from('race_words')
        .select('user_id, word, round_index')
        .eq('race_id', raceId);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username');

      const grouped: Record<string, string[]> = {};
      raceWords?.forEach(({ user_id, word }) => {
        if (!grouped[user_id]) grouped[user_id] = [];
        grouped[user_id].push(word);
      });

      const compiled: PlayerResult[] = Object.entries(grouped).map(([uid, words]) => {
        const player = profiles?.find((p) => p.id === uid);
        return {
          username: player?.username || 'Unknown',
          user_id: uid,
          word_count: words.length,
          words,
        };
      });

      setResults(compiled.sort((a, b) => b.word_count - a.word_count));
      setLoading(false);
    };

    fetchResults();
  }, [raceId]);

  const handleRematch = async () => {
    const previousRace = await supabase
      .from('races')
      .select('*')
      .eq('id', raceId)
      .single();

    const raceType = previousRace.data?.race_type || 'fours';
    const opponentId = results.find((r) => r.user_id !== user?.id)?.user_id || null;
    if (!opponentId) return alert('Opponent not found.');

    const alphagrams = await generateAlphagrams(raceType, 20);
    const { data, error } = await supabase
      .from('races')
      .insert({
        race_type: raceType,
        alphagrams,
        status: 'waiting',
        duration_seconds: 180,
        created_by: user?.id,
        invited_user_id: opponentId,
        is_private: true,
      })
      .select()
      .single();

    if (data?.id) {
      navigate(`/race/${data.id}`);
    } else {
      alert('Failed to create rematch.');
    }
  };

  if (loading) return <p>Loading results...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Race Results</h2>

      {results.map((res, i) => (
        <Card key={res.user_id}>
          <CardHeader>
            <CardTitle>
              {i === 0 ? '🏆 ' : ''}
              {res.username} — {res.word_count} word{res.word_count !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-5 text-sm text-gray-600">
              {res.words.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-4">
        <Button variant="secondary" onClick={() => navigate('/race-lobby')}>
          Back to Race Lobby
        </Button>
        {results.length === 2 && (
          <Button onClick={handleRematch}>🔁 Rematch</Button>
        )}
      </div>
    </div>
  );
}
