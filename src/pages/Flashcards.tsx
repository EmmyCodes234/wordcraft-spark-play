import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle, Lightbulb, XCircle, Folder } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

function getAlphagram(word: string): string {
  return word.toUpperCase().split("").sort().join("");
}

function getHooks(word: string, wordSet: Set<string>) {
  const hooks = { front: [], back: [] };
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const letter of alphabet) {
    const frontHook = letter + word;
    const backHook = word + letter;
    if (wordSet.has(frontHook)) hooks.front.push(letter);
    if (wordSet.has(backHook)) hooks.back.push(letter);
  }
  return hooks;
}

function DeckCard({ deck, onSelect }: { deck: any; onSelect: () => void }) {
  const wordCount = deck.words?.length || 0;
  return (
    <Card
      onClick={onSelect}
      className="cursor-pointer hover:shadow-md transition-all duration-200 border border-green-400"
    >
      <CardHeader className="flex flex-row items-center gap-3">
        <Folder className="text-yellow-500" />
        <CardTitle className="text-green-700">{deck.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>{wordCount} words</p>
        <p className="text-xs">Tap to start</p>
      </CardContent>
    </Card>
  );
}

export default function Flashcards() {
  const { user } = useAuth();
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
  const anagrams = Array.from(wordSet).filter(
    (w) => getAlphagram(w) === alphagram && w !== currentWord
  );
  const isCorrect = anagrams.includes(input) || input === currentWord?.toUpperCase();

  const filteredDecks = decks.filter((deck) =>
    deck.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const fetchDecks = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("flashcard_decks")
        .select("id, name, words")
        .eq("user_id", user.id);
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
      const timer = setTimeout(() => {
        handleNext();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, revealed]);

  const handleSubmit = () => setRevealed(true);
  const handleNext = () => {
    setInput("");
    setShowHint(false);
    setRevealed(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleMastered = () => {
    setMasteredWords((prev) => [...new Set([...prev, currentWord.toUpperCase()])]);
    handleNext();
  };

  const saveProgress = async () => {
    const { error } = await supabase.from("flashcard_progress").upsert({
      user_id: user.id,
      deck_id: selectedDeck.id,
      current_index: currentIndex,
      mastered: masteredWords,
    }, { onConflict: "user_id,deck_id" });

    if (!error) toast({ title: "Progress saved", description: "You can continue later." });
    else toast({ title: "Error saving progress", description: error.message });
  };

  const loadProgress = async (deck: any) => {
    const { data, error } = await supabase
      .from("flashcard_progress")
      .select("current_index, mastered")
      .eq("user_id", user.id)
      .eq("deck_id", deck.id)
      .single();

    if (!error && data) {
      setCurrentIndex(data.current_index || 0);
      setMasteredWords(data.mastered || []);
    }
  };

  const progressPercent = Math.floor(((currentIndex + 1) / (words.length || 1)) * 100);

  if (!selectedDeck) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Select a Flashcard Deck</h2>
          <Input
            placeholder="Search decks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-1/2 sm:w-64"
          />
        </div>

        {filteredDecks.length === 0 ? (
          <p className="text-muted-foreground text-center">No decks found. Create one!</p>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {filteredDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onSelect={async () => {
                  setWords(deck.words || []);
                  setSelectedDeck(deck);
                  await loadProgress(deck);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6">
      <Card className="text-center p-6 space-y-4 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-widest">
            {revealed ? currentWord.toUpperCase() : alphagram}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!revealed && (
            <>
              <Input
                placeholder="Type any valid word"
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <div className="flex flex-wrap justify-center gap-2">
                {!isCorrect && (
                  <Button onClick={handleSubmit} variant="default">Check</Button>
                )}
                <Button onClick={() => setShowHint(true)} variant="ghost">
                  <Lightbulb className="h-5 w-5 mr-1" /> Hint
                </Button>
              </div>
              {showHint && (
                <p className="text-sm text-muted-foreground">
                  First letter: <strong>{currentWord[0]}</strong>
                </p>
              )}
            </>
          )}

          {revealed && (
            <>
              <div className="space-y-2">
                <p className="text-lg">
                  {isCorrect ? (
                    <span className="text-green-600 flex items-center justify-center gap-1">
                      <CheckCircle className="h-5 w-5" /> Correct!
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center justify-center gap-1">
                      <XCircle className="h-5 w-5" /> You typed: {input}
                    </span>
                  )}
                </p>
                {anagrams.length > 0 && (
                  <p className="text-sm">Anagrams: <strong>{anagrams.join(", ")}</strong></p>
                )}
                {(hooks.front.length > 0 || hooks.back.length > 0) && (
                  <p className="text-sm">
                    Hooks:{" "}
                    <strong>
                      {hooks.front.map(l => l + currentWord).join(", ")}{" "}
                      {hooks.back.map(l => currentWord + l).join(", ")}
                    </strong>
                  </p>
                )}
              </div>
              <div className="grid gap-2 mt-4 grid-cols-1 sm:grid-cols-2">
                <div className="flex justify-center gap-2">
                  <Button onClick={handleNext} variant="secondary">Still Learning</Button>
                  <Button onClick={handleMastered} variant="default">Mastered</Button>
                </div>
                <div className="flex justify-center gap-2">
                  <Button onClick={saveProgress} variant="outline">💾 Save</Button>
                  <Button variant="ghost" disabled>Progress: {progressPercent}%</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
