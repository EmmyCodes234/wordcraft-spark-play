import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

type SRSCard = {
  id: string;
  word: string;
  due: string;
  state: 0 | 1 | 2 | 3;
  interval: number;
  ease_factor: number;
  lapses: number;
};

export default function StudyPage() {
  const { user } = useAuth();
  const { deckId } = useParams();
  const [queue, setQueue] = useState<SRSCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ again: 0, good: 0, easy: 0 });

  useEffect(() => {
    const fetchDueCards = async () => {
      if (!user || !deckId) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_words')
        .select('*')
        .eq('user_id', user.id)
        .lte('due', new Date().toISOString())
        .limit(50);

      if (error) {
        console.error('Error fetching cards:', error);
      } else if (data) {
        setQueue(data.sort(() => Math.random() - 0.5));
      }
      setIsLoading(false);
    };

    fetchDueCards();
  }, [user, deckId]);

  const currentCard = queue[currentIndex];
  const isSessionComplete = currentIndex >= queue.length;

  const handleFlipCard = () => setIsFlipped(true);

  const goToNextCard = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  }, []);

  const handleReview = async (rating: 1 | 2 | 3 | 4) => {
    if (!currentCard) return;

    let { state, interval, ease_factor, lapses } = currentCard;
    let newInterval: number;
    let newEaseFactor = ease_factor;
    let newLapses = lapses;
    let newState: SRSCard['state'] = 2;

    if (rating === 1) {
      newLapses += (state === 2 ? 1 : 0);
      newEaseFactor = Math.max(1.3, ease_factor - 0.2);
      newInterval = 1;
      newState = 1;
      setSessionStats(s => ({ ...s, again: s.again + 1 }));
    } else {
      if (state === 1 || state === 3) {
        newInterval = rating === 4 ? 4 : 1;
      } else {
        if (rating === 2) {
          newInterval = Math.round(interval * 1.2);
          newEaseFactor = Math.max(1.3, ease_factor - 0.15);
        } else if (rating === 3) {
          newInterval = Math.round(interval * ease_factor);
        } else {
          newInterval = Math.round(interval * ease_factor * 1.3);
          newEaseFactor = ease_factor + 0.15;
        }
      }
      setSessionStats(s => ({ ...s, good: s.good + 1 }));
    }

    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + newInterval);

    const { error } = await supabase
      .from('user_words')
      .update({
        due: newDueDate.toISOString(),
        interval: newInterval,
        ease_factor: newEaseFactor,
        state: newState,
        lapses: newLapses,
      })
      .eq('id', currentCard.id);

    if (error) console.error('Failed to update card:', error);

    goToNextCard();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isSessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h1 className="text-3xl font-bold">Session Complete!</h1>
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Total cards reviewed: {queue.length}</p>
            <p className="text-red-500">Again: {sessionStats.again}</p>
            <p className="text-green-500">Good/Easy: {sessionStats.good + sessionStats.easy}</p>
          </CardContent>
        </Card>
        <Button onClick={() => window.location.reload()}>Study Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center space-y-6">
      <div className="w-full max-w-2xl">
        <p className="text-center text-muted-foreground">
          Card {currentIndex + 1} of {queue.length}
        </p>
        <Progress value={((currentIndex + 1) / queue.length) * 100} className="h-2 mt-2" />
      </div>

      <Card className="w-full max-w-2xl min-h-[300px] flex items-center justify-center text-center p-6">
        <h2 className="text-4xl font-bold tracking-widest">
          {isFlipped ? currentCard.word : getAlphagram(currentCard.word)}
        </h2>
      </Card>

      {isFlipped ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-2xl">
          <Button variant="destructive" className="h-16 text-lg" onClick={() => handleReview(1)}>Again</Button>
          <Button variant="outline" className="h-16 text-lg" onClick={() => handleReview(2)}>Hard</Button>
          <Button variant="default" className="h-16 text-lg" onClick={() => handleReview(3)}>Good</Button>
          <Button variant="secondary" className="h-16 text-lg bg-primary text-primary-foreground" onClick={() => handleReview(4)}>Easy</Button>
        </div>
      ) : (
        <Button className="h-16 text-xl px-20" onClick={handleFlipCard}>Show Answer</Button>
      )}
    </div>
  );
}

function getAlphagram(word: string) {
  return word.toUpperCase().split("").sort().join("");
}
