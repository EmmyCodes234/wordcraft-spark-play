import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle, Lightbulb, XCircle, Folder, LoaderCircle, Check, X, ArrowLeft, Brain, Layers } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// --- Main Hub Component ---
function FlashcardsHub({ onSelectMode }: { onSelectMode: (mode: 'srs_study' | 'deck_quiz') => void }) {
  return (
    <div className="container mx-auto py-10 text-center">
      <h1 className="text-4xl font-bold mb-4">Flashcards & Quizzes</h1>
      <p className="text-muted-foreground mb-8">Choose a way to study your saved words.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card onClick={() => onSelectMode('srs_study')} className="cursor-pointer hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 p-6">
          <CardHeader>
            <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">SRS Study Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Study words due for review using an intelligent Spaced Repetition System to build long-term memory.</p>
          </CardContent>
        </Card>
        <Card onClick={() => onSelectMode('deck_quiz')} className="cursor-pointer hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 p-6">
          <CardHeader>
            <Layers className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Practice a Deck</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Take a classic anagram quiz from one of your saved decks to test your recall speed.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


// --- SRS Study Session Component ---
type ReviewCard = { id: number; word: string; definition?: string; mastery_level: number; };
const srsIntervals = [1, 2, 4, 8, 16, 32, 64];

function SRSStudySession({ onExit }: { onExit: () => void }) {
  const { user } = useAuth();
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDueCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_words")
      .select("id, word, definition, mastery_level")
      .eq("user_id", user.id)
      .lte("next_review_at", new Date().toISOString())
      .limit(20);

    if (error) console.error("Error fetching review cards:", error);
    else setReviewCards(data || []);
    setLoading(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [user]);

  useEffect(() => { fetchDueCards(); }, [fetchDueCards]);

  const handleUpdateMastery = async (cardId: number, currentLevel: number, knewIt: boolean) => {
    const newLevel = knewIt ? Math.min(currentLevel + 1, srsIntervals.length - 1) : Math.max(0, currentLevel - 1);
    const intervalDays = srsIntervals[newLevel];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    await supabase.from("user_words").update({ mastery_level: newLevel, next_review_at: nextReviewDate.toISOString() }).eq("id", cardId);

    setIsFlipped(false);
    setTimeout(() => { setCurrentCardIndex(prev => prev + 1); }, 300);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoaderCircle className="w-10 h-10 animate-spin text-primary" /></div>;
  }
  
  const currentCard = reviewCards[currentCardIndex];

  return (
    <div className="container mx-auto py-10 flex flex-col items-center">
        <Button onClick={onExit} variant="ghost" className="self-start mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Modes</Button>
        
        {reviewCards.length === 0 ? (
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">All Caught Up!</h2>
                <p className="text-muted-foreground mb-6">You have no words due for review right now.</p>
                <Button onClick={fetchDueCards}>Check Again</Button>
            </div>
        ) : currentCardIndex >= reviewCards.length ? (
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Session Complete! 🎉</h2>
                <p className="text-muted-foreground mb-6">You've reviewed all due cards for now. Great work!</p>
                <Button onClick={fetchDueCards}>Start New Session</Button>
            </div>
        ) : (
            <>
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold">Study Session</h1>
                    <p className="text-muted-foreground">{currentCardIndex + 1} of {reviewCards.length} words due for review.</p>
                </div>
                <div className="w-full max-w-xl h-80 [perspective:1000px]">
                    <motion.div className="relative w-full h-full" animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5 }} style={{ transformStyle: "preserve-3d" }}>
                        <div onClick={() => setIsFlipped(true)} className="absolute w-full h-full [backface-visibility:hidden] cursor-pointer"><Card className="w-full h-full flex items-center justify-center"><CardContent className="p-6 text-center"><p className="text-4xl font-bold font-mono tracking-wider">{currentCard.word}</p></CardContent></Card></div>
                        <div className="absolute w-full h-full [backface-visibility:hidden]" style={{ transform: "rotateY(180deg)" }}><Card className="w-full h-full flex items-center justify-center" onClick={() => setIsFlipped(false)}><CardContent className="p-6 text-center"><p className="text-lg text-muted-foreground">{currentCard.definition || "No definition saved."}</p></CardContent></Card></div>
                    </motion.div>
                </div>
                {isFlipped && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 mt-8">
                        <Button variant="destructive" size="lg" onClick={() => handleUpdateMastery(currentCard.id, currentCard.mastery_level, false)} className="w-44 h-16 text-lg"><X className="mr-2" /> Review Again</Button>
                        <Button size="lg" onClick={() => handleUpdateMastery(currentCard.id, currentCard.mastery_level, true)} className="w-44 h-16 text-lg bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"><Check className="mr-2" /> I Knew It</Button>
                    </motion.div>
                )}
            </>
        )}
    </div>
  );
}


// --- Deck Quizzer Component (Your Original Anagram Trainer) ---
function getAlphagram(word: string): string { return word.toUpperCase().split("").sort().join(""); }
function getHooks(word: string, wordSet: Set<string>) {
  const hooks: {front: string[], back: string[]} = { front: [], back: [] };
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const letter of alphabet) {
    if (wordSet.has(letter + word)) hooks.front.push(letter);
    if (wordSet.has(word + letter)) hooks.back.push(letter);
  }
  return hooks;
}
function DeckCard({ deck, onSelect }: { deck: any; onSelect: () => void }) {
  const wordCount = deck.words?.length || 0;
  return (
    <Card onClick={onSelect} className="cursor-pointer hover:shadow-md transition-all duration-200">
      <CardHeader className="flex flex-row items-center gap-3 p-4"><Folder className="text-yellow-500" /><CardTitle>{deck.name}</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground p-4 pt-0"><p>{wordCount} words</p></CardContent>
    </Card>
  );
}
function DeckQuizzer({ onExit }: { onExit: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [words, setWords] = useState<string[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [wordSet, setWordSet] = useState(new Set<string>());
  const [search, setSearch] = useState("");
  const [masteredWords, setMasteredWords] = useState<string[]>([]);

  const currentWord = words[currentIndex];
  const alphagram = getAlphagram(currentWord || "");
  const hooks = getHooks(currentWord || "", wordSet);
  const anagrams = Array.from(wordSet).filter((w) => getAlphagram(w) === alphagram && w !== currentWord);
  const isCorrect = anagrams.includes(input) || input === currentWord?.toUpperCase();
  const filteredDecks = decks.filter((deck) => deck.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const fetchDecks = async () => {
      if (!user) return;
      const { data, error } = await supabase.from("flashcard_decks").select("id, name, words").eq("user_id", user.id);
      if (!error) setDecks(data || []);
    };
    const fetchDict = async () => {
      const res = await fetch("/dictionaries/CSW24.txt");
      const txt = await res.text();
      setWordSet(new Set(txt.split("\n").map(w => w.trim().toUpperCase())));
    };
    fetchDecks();
    fetchDict();
  }, [user]);

  useEffect(() => {
    if (!revealed && isCorrect) {
      setRevealed(true);
      const timer = setTimeout(() => { handleNext(); }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, revealed]);

  const handleSubmit = () => setRevealed(true);
  const handleNext = () => {
    setInput("");
    setShowHint(false);
    setRevealed(false);
    if (currentIndex < words.length - 1) {
        setCurrentIndex((prev) => prev + 1);
    } else {
        toast({ title: "Deck Complete!", description: "You've finished this deck." });
        setSelectedDeck(null); // Go back to deck selection
    }
  };
  const handleMastered = () => {
    setMasteredWords((prev) => [...new Set([...prev, currentWord.toUpperCase()])]);
    handleNext();
  };
  const saveProgress = async () => {
    if (!user) return;
    const { error } = await supabase.from("flashcard_progress").upsert({ user_id: user.id, deck_id: selectedDeck.id, current_index: currentIndex, mastered: masteredWords }, { onConflict: "user_id,deck_id" });
    if (!error) toast({ title: "Progress saved", description: "You can continue later." });
    else toast({ title: "Error saving progress", description: error.message });
  };
  const loadProgress = async (deck: any) => {
    if (!user) return;
    const { data } = await supabase.from("flashcard_progress").select("current_index, mastered").eq("user_id", user.id).eq("deck_id", deck.id).single();
    if (data) {
      setCurrentIndex(data.current_index || 0);
      setMasteredWords(data.mastered || []);
    }
  };

  const progressPercent = Math.floor(((currentIndex) / (words.length || 1)) * 100);

  if (!selectedDeck) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-4">
            <Button onClick={onExit} variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Modes</Button>
            <Input placeholder="Search decks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-1/2 sm:w-64" />
        </div>
        {filteredDecks.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">No decks found. Create one in the Anagram Solver!</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {filteredDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} onSelect={async () => {
                  setWords(deck.words || []);
                  setSelectedDeck(deck);
                  await loadProgress(deck);
              }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto w-full max-w-xl px-4 py-6">
      <Button onClick={() => setSelectedDeck(null)} variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Decks</Button>
      <Card className="text-center p-6 space-y-4 shadow-xl">
        <CardHeader><CardTitle className="text-3xl font-bold tracking-widest">{revealed ? currentWord.toUpperCase() : alphagram}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!revealed && (
            <>
              <Input placeholder="TYPE ANY VALID WORD" value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} className="text-center uppercase font-mono tracking-widest"/>
              <div className="flex flex-wrap justify-center gap-2">
                {!isCorrect && <Button onClick={handleSubmit}>Check</Button>}
                <Button onClick={() => setShowHint(true)} variant="ghost"><Lightbulb className="h-5 w-5 mr-1" /> Hint</Button>
              </div>
              {showHint && <p className="text-sm text-muted-foreground">First letter: <strong>{currentWord[0]}</strong></p>}
            </>
          )}
          {revealed && (
            <>
              <div className="space-y-2">
                <p className="text-lg">{isCorrect ? (<span className="text-green-600 flex items-center justify-center gap-1"><CheckCircle className="h-5 w-5" /> Correct!</span>) : (<span className="text-red-600 flex items-center justify-center gap-1"><XCircle className="h-5 w-5" /> You typed: {input}</span>)}</p>
                {anagrams.length > 0 && (<p className="text-sm">Anagrams: <strong>{anagrams.join(", ")}</strong></p>)}
                {(hooks.front.length > 0 || hooks.back.length > 0) && (<p className="text-sm">Hooks: <strong>{hooks.front.map(l => l + currentWord).join(", ")}{" "}{hooks.back.map(l => currentWord + l).join(", ")}</strong></p>)}
              </div>
              <div className="grid gap-2 mt-4 grid-cols-1">
                <div className="flex justify-center gap-2">
                  <Button onClick={handleNext} variant="secondary">Still Learning</Button>
                  <Button onClick={handleMastered}>Mastered</Button>
                </div>
                <div className="flex justify-center gap-2">
                  <Button onClick={saveProgress} variant="outline">💾 Save Progress</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
             <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <p className="text-sm text-muted-foreground">Progress: {currentIndex} / {words.length}</p>
      </Card>
    </div>
  );
}


// --- Main Parent Component ---
export default function FlashcardsPage() {
  const [mode, setMode] = useState<'hub' | 'srs_study' | 'deck_quiz'>('hub');

  const renderContent = () => {
    switch (mode) {
      case 'srs_study':
        return <SRSStudySession onExit={() => setMode('hub')} />;
      case 'deck_quiz':
        return <DeckQuizzer onExit={() => setMode('hub')} />;
      default:
        return <FlashcardsHub onSelectMode={setMode} />;
    }
  };

  return <>{renderContent()}</>;
}