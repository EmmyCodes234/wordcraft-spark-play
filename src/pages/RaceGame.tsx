import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RaceGame() {
  const { raceId } = useParams();
  const { user } = useAuth();
  const [race, setRace] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [submittedWords, setSubmittedWords] = useState<string[]>([]);
  const [validWords, setValidWords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRace = async () => {
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('id', raceId)
        .single();

      if (data) {
        setRace(data);
        setTimeLeft(data.duration_seconds || 180);
      }
      setLoading(false);
    };

    const fetchDictionary = async () => {
      const { data } = await supabase
        .from('words')
        .select('word');

      if (data) {
        const wordSet = new Set(data.map((d) => d.word.toUpperCase()));
        setValidWords(wordSet);
      }
    };

    if (user) {
      fetchRace();
      fetchDictionary();
    }
  }, [user, raceId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      navigate(`/race/${raceId}/results`);
    }
  }, [timeLeft, navigate, raceId]);

  const currentAlphagram = race?.alphagrams?.[currentIndex] || '';

  const handleSubmit = async () => {
    const cleaned = input.trim().toUpperCase();
    if (!cleaned || submittedWords.includes(cleaned)) return;
    if (!validWords.has(cleaned)) return alert('Invalid word');

    setSubmittedWords((prev) => [...prev, cleaned]);

    await supabase.from('race_words').insert({
      race_id: raceId,
      user_id: user.id,
      word: cleaned,
      round_index: currentIndex,
    });

    setInput('');
  };

  const handleNext = () => {
    if (currentIndex < 19) {
      setCurrentIndex(currentIndex + 1);
      setSubmittedWords([]);
      setInput('');
    } else {
      navigate(`/race/${raceId}/results`);
    }
  };

  if (loading || !race) return <p>Loading race...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Round {currentIndex + 1} of 20 — <span className="text-green-600">{currentAlphagram}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Time Left: <span className="font-bold text-red-600">{timeLeft}s</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter an anagram"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <Button onClick={handleSubmit}>Submit</Button>

          <div className="mt-4">
            <h4 className="font-semibold">Your Submissions:</h4>
            <ul className="list-disc ml-5 text-sm text-gray-600">
              {submittedWords.map((word, idx) => (
                <li key={idx}>{word}</li>
              ))}
            </ul>
          </div>

          <Button variant="secondary" onClick={handleNext}>
            {currentIndex === 19 ? 'Finish Race' : 'Next Round'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
