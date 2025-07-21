import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

// Define the structure of a card to match our database
type SRSCard = {
  id: string;
  word: string;
  // --- SRS Fields ---
  due: string;
  state: 0 | 1 | 2 | 3; // 0=New, 1=Learning, 2=Review, 3=Lapsed
  interval: number;
  ease_factor: number;
  lapses: number;
};

export default function StudyPage() {
  const { user } = useAuth();
  const { deckId } = useParams(); // Assuming you use routing like /study/:deckId

  const [queue, setQueue] = useState<SRSCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ again: 0, good: 0, easy: 0 });

  // Fetch due cards for the session
  useEffect(() => {
    const fetchDueCards = async () => {
      if (!user || !deckId) return;
      setIsLoading(true);

      // Query for all new cards and all review cards that are due today
      // In a full implementation, you would add limits and settings from the deck
      const { data, error } = await supabase
        .from('user_words')
        .select('*')
        .eq('user_id', user.id)
        // .eq('deck_id', deckId) // Uncomment if you add deck_id to user_words
        .lte('due', new Date().toISOString())
        .limit(50); // Limit session size

      if (error) {
        console.error('Error fetching cards:', error);
      } else if (data) {
        // Simple shuffle for the queue. A real Anki implementation has more complex sorting.
        setQueue(data.sort(() => Math.random() - 0.5));
      }
      setIsLoading(false);
    };

    fetchDueCards();
  }, [user, deckId]);

  const currentCard = queue[currentIndex];
  const isSessionComplete = currentIndex >= queue.length;

  const handleFlipCard = () => {
    setIsFlipped(true);
  };

  const goToNextCard = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  }, []);

  // The SRS "Brain": Handles scheduling logic when a feedback button is pressed
  const handleReview = async (rating: 1 | 2 | 3 | 4) => { // 1:Again, 2:Hard, 3:Good, 4:Easy
    if (!currentCard) return;

    let { state, interval, ease_factor, lapses } = currentCard;
    let newInterval: number;
    let newEaseFactor = ease_factor;
    let newLapses = lapses;
    let newState: SRSCard['state'] = 2; // Assume it will become a review card

    if (rating === 1) { // --- AGAIN ---
      newLapses += (state === 2 ? 1 : 0); // Increment lapses if it was a review card
      newEaseFactor = Math.max(1.3, ease_factor - 0.2); // Decrease ease
      newInterval = 1; // Start relearning
      newState = 1; // Put into learning state
      setSessionStats(s => ({ ...s, again: s.again + 1 }));
    } else { // --- HARD, GOOD, or EASY ---
      if (state === 1 || state === 3) { // If learning/lapsed
        newInterval = rating === 4 ? 4 : 1; // "Easy" graduates to 4 days, "Good" to 1 day
      } else { // If it was a review card
        if (rating === 2) { // Hard
          newInterval = Math.round(interval * 1.2);
          newEaseFactor = Math.max(1.3, ease_factor - 0.15);
        } else if (rating === 3) { // Good
          newInterval = Math.round(interval * ease_factor);
        } else { // Easy
          newInterval = Math.round(interval * ease_factor * 1.3);
          newEaseFactor = ease_factor + 0.15;
        }
      }
      setSessionStats(s => ({ ...s, good: s.good + 1 }));
    }

    // Calculate the new due date by adding the interval (in days)
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + newInterval);
    
    // Update the card in the database
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
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (isSessionComplete) {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <h1 className="text-3xl font-bold">Session Complete!</h1>
            <Card className="w-80">
                <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
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
            <p className="text-center text-muted-foreground">Card {currentIndex + 1} of {queue.length}</p>
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
                <Button variant="secondary" className="h-16 text-lg bg-blue-500 text-white" onClick={() => handleReview(4)}>Easy</Button>
            </div>
        ) : (
            <Button className="h-16 text-xl px-20" onClick={handleFlipCard}>Show Answer</Button>
        )}
    </div>
  );
}

// Helper to get alphagram - assuming it's available or defined here
function getAlphagram(word: string) {
  return word.toUpperCase().split("").sort().join("");
}