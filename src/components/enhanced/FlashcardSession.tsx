import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@supabase/auth-helpers-react";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";

const supabase = createClient();

interface Flashcard {
  word: string;
  anagrams: string[];
}

interface FlashcardSessionProps {
  folderId: string;
}

const FlashcardSession: React.FC<FlashcardSessionProps> = ({ folderId }) => {
  const user = useUser();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchFlashcards = async () => {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("folder_id", folderId)
        .eq("user_id", user?.id);

      if (error) console.error("Error loading flashcards:", error);
      else setFlashcards(data || []);
    };

    if (user) fetchFlashcards();
  }, [folderId, user]);

  const currentCard = flashcards[currentIndex];

  const handleCheck = () => {
    if (!currentCard) return;

    const inputWord = input.trim().toLowerCase();
    const correct = inputWord === currentCard.word.toLowerCase() ||
      currentCard.anagrams.includes(inputWord);

    if (correct) setRevealed(true);
  };

  const handleNext = () => {
    setRevealed(false);
    setInput("");
    setProgress((prev) => prev + 1);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-6">
      {currentCard ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              Flashcard {currentIndex + 1} / {flashcards.length}
              <Badge variant="secondary">{progress} mastered</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Guess the word or any of its known anagrams:
            </p>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={revealed}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              placeholder="Type a word or anagram"
            />
            <div className="flex gap-4">
              {!revealed ? (
                <Button onClick={handleCheck}>Check</Button>
              ) : (
                <Button onClick={handleNext}>Next</Button>
              )}
            </div>
            {revealed && (
              <div className="mt-4 space-y-2">
                <p className="font-bold text-primary">Correct Word:</p>
                <Badge variant="default" className="text-lg">
                  {currentCard.word}
                </Badge>
                <p className="mt-2 font-bold text-primary">Anagrams:</p>
                <div className="flex flex-wrap gap-2">
                  {currentCard.anagrams.map((a) => (
                    <Badge key={a} variant="outline">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          No flashcards found or session complete!
        </div>
      )}
    </div>
  );
};

export default FlashcardSession;
