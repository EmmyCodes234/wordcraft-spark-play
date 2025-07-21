import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Same card type from before ---
type SRSCard = {
  id: string;
  word: string;
  due: string;
  state: 0 | 1 | 2 | 3;
  interval: number;
  ease_factor: number;
  lapses: number;
};

// --- NEW state structure for the study queue ---
type QueueItem = {
  card: SRSCard; // The specific card that is due
  allAnagrams: string[]; // All sibling anagrams for this card
};

// Helper to get alphagram
function getAlphagram(word: string) {
  return word.toUpperCase().split("").sort().join("");
}

export default function Flashcards() {
  const { user } = useAuth();
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [queue, setQueue] = useState<QueueItem[]>([]); // Use the new QueueItem type
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ again: 0, good: 0, easy: 0 });

  // --- UPDATED to fetch all anagrams for each due card ---
  useEffect(() => {
    const fetchDueCards = async () => {
      if (!user || !deckId) return;
      setIsLoading(true);

      // 1. Fetch ALL words the user has saved to create a complete lookup map.
      const { data: allUserWords } = await supabase
        .from('user_words')
        .select('word')
        .eq('user_id', user.id);

      if (!allUserWords) {
        setIsLoading(false);
        return;
      }

      // 2. Group all words by their alphagram for quick lookup.
      const alphagramMap = new Map<string, string[]>();
      for (const item of allUserWords) {
        const alpha = getAlphagram(item.word);
        if (!alphagramMap.has(alpha)) {
          alphagramMap.set(alpha, []);
        }
        alphagramMap.get(alpha)!.push(item.word);
      }

      // 3. Fetch the actual due cards for the session (same logic as before).
      let options = { new_cards_per_day: 20, max_reviews_per_day: 200 };
      const { data: optionsData } = await supabase.from('deck_options').select('*').eq('deck_id', deckId).single();
      if (optionsData) options = optionsData;

      const { data: newCards } = await supabase.from('user_words').select('*').eq('user_id', user.id).eq('state', 0).limit(options.new_cards_per_day);
      const { data: reviewCards } = await supabase.from('user_words').select('*').eq('user_id', user.id).neq('state', 0).lte('due', new Date().toISOString()).limit(options.max_reviews_per_day);
      
      const dueCards = [...(newCards || []), ...(reviewCards || [])];

      // 4. Build the final queue, associating each due card with its full list of anagrams.
      const sessionQueue: QueueItem[] = dueCards.map(card => ({
        card: card as SRSCard,
        allAnagrams: alphagramMap.get(getAlphagram(card.word)) || [card.word],
      }));

      setQueue(sessionQueue.sort(() => Math.random() - 0.5));
      setIsLoading(false);
    };

    fetchDueCards();
  }, [user, deckId]);

  const currentQueueItem = queue[currentIndex];
  const isSessionComplete = !isLoading && currentIndex >= queue.length;

  const goToNextCard = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  }, []);
  
  const handleReview = async (rating: 1 | 2 | 3 | 4) => {
    if (!currentQueueItem) return;
    // The scheduling logic operates on the single 'due' card.
    const cardToUpdate = currentQueueItem.card;
    let { state, interval, ease_factor, lapses } = cardToUpdate;
    // ... (rest of the handleReview logic is unchanged)
    let newInterval: number;
    let newEaseFactor = ease_factor;
    let newState: SRSCard['state'] = 2;

    if (rating === 1) {
      lapses += (state === 2 ? 1 : 0);
      newEaseFactor = Math.max(1.3, ease_factor - 0.2);
      newInterval = 1;
      newState = 1;
      setSessionStats(s => ({ ...s, again: s.again + 1 }));
    } else {
        setSessionStats(s => ({ ...s, good: s.good + 1 }));
        if (state === 1 || state === 3) {
            newInterval = rating === 4 ? 4 : 1;
        } else {
            newInterval = rating === 2 ? Math.round(interval * 1.2) : Math.round(interval * ease_factor);
            if (rating === 4) newInterval = Math.round(newInterval * 1.3);
            if (rating === 2) newEaseFactor = Math.max(1.3, ease_factor - 0.15);
            if (rating === 4) newEaseFactor = ease_factor + 0.15;
        }
    }
    
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + newInterval);
    
    await supabase
      .from('user_words')
      .update({ due: newDueDate.toISOString(), interval: newInterval, ease_factor: newEaseFactor, state: newState, lapses })
      .eq('id', cardToUpdate.id);
    
    goToNextCard();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> <p className="ml-4">Loading your cards...</p></div>;
  }

  if (isSessionComplete) {
    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <h1 className="text-3xl font-bold">Session Complete!</h1>
            <p className="text-muted-foreground">You have finished all your due cards for now. Well done!</p>
            <Card className="w-80">
                {/* --- TYPO FIXED ON THIS LINE --- */}
                <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <p>Total cards reviewed: {queue.length}</p>
                    <p className="text-red-500">Again: {sessionStats.again}</p>
                    <p className="text-green-500">Good / Easy: {sessionStats.good}</p>
                </CardContent>
            </Card>
            <Button onClick={() => navigate('/quiz-mode')}>Back to Decks</Button>
        </div>
    );
  }

  // --- Framer Motion animation variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1 // This makes each child fade in 0.1s after the previous one
      }
    }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center space-y-6">
        <div className="w-full max-w-2xl">
            {/* --- MODIFIED BLOCK: Added exit button --- */}
            <div className="flex justify-between items-center mb-4">
                <Link to="/quiz-mode">
                    <Button variant="ghost">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Decks
                    </Button>
                </Link>
                <p className="text-muted-foreground">Card {currentIndex + 1} of {queue.length}</p>
            </div>
            <Progress value={((currentIndex + 1) / queue.length) * 100} className="h-2" />
        </div>
        
        <Card className="w-full max-w-2xl min-h-[300px] flex items-center justify-center text-center p-6">
            {isFlipped ? (
                // --- Show all anagrams with animation ---
                <motion.div
                    className="flex flex-wrap gap-4 justify-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {currentQueueItem.allAnagrams.sort().map((word) => (
                        <motion.div key={word} variants={itemVariants}>
                            <Badge variant="outline" className="text-xl font-semibold p-3">{word}</Badge>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                // --- Show anagram count ---
                <h2 className="text-4xl font-bold tracking-widest flex items-center gap-4">
                    {getAlphagram(currentQueueItem.card.word)}
                    <span className="text-2xl text-primary font-semibold">({currentQueueItem.allAnagrams.length})</span>
                </h2>
            )}
        </Card>

        {isFlipped ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-2xl">
                <Button variant="destructive" className="h-16 text-lg" onClick={() => handleReview(1)}>Again</Button>
                <Button variant="outline" className="h-16 text-lg" onClick={() => handleReview(2)}>Hard</Button>
                <Button variant="default" className="h-16 text-lg" onClick={() => handleReview(3)}>Good</Button>
                <Button variant="secondary" className="h-16 text-lg bg-blue-500 text-white" onClick={() => handleReview(4)}>Easy</Button>
            </div>
        ) : (
            <Button className="h-16 text-xl px-20" onClick={() => setIsFlipped(true)}>Show Answer</Button>
        )}
    </div>
  );
}