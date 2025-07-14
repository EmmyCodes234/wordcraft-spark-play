import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DailyPuzzle() {
  const { user } = useAuth();
  const [puzzle, setPuzzle] = useState<any>(null);
  const [inputWord, setInputWord] = useState("");
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchPuzzle = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_puzzles")
        .select("*")
        .eq("date", today)
        .single();

      if (data) setPuzzle(data);
      else console.error("Error fetching puzzle:", error);
    };

    fetchPuzzle();
  }, []);

  const handleSubmit = async () => {
    const word = inputWord.trim().toUpperCase();
    if (!word || foundWords.includes(word)) return;

    // Check validity (simplified — replace with your dictionary check)
    if (word.length >= 3 && puzzle.puzzle_letters.includes(word[0])) {
      setFoundWords((prev) => [...prev, word]);
      setScore((prev) => prev + word.length);
    }

    setInputWord("");
  };

  const handleFinish = async () => {
    await supabase.from("user_puzzle_attempts").insert({
      user_id: user.id,
      puzzle_id: puzzle.id,
      words_found: foundWords,
      score,
      completed: true,
    });
    setCompleted(true);
  };

  if (!puzzle) return <p className="text-center py-10">Loading today's puzzle...</p>;

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-3xl font-bold mb-2">🔥 Daily Puzzle</h1>
      <p className="text-muted-foreground mb-6">Find as many words as you can using:</p>
      <h2 className="text-4xl font-bold mb-4 tracking-widest">{puzzle.puzzle_letters}</h2>

      {!completed ? (
        <>
          <div className="flex justify-center gap-2 mb-4">
            <Input
              placeholder="Type a word"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              className="w-1/2"
            />
            <Button onClick={handleSubmit}>Submit</Button>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {foundWords.map((w, i) => (
              <Badge key={i} variant="secondary">{w}</Badge>
            ))}
          </div>

          <p className="mb-4">Current Score: <span className="font-bold">{score}</span></p>
          <Button onClick={handleFinish} variant="success">Finish Puzzle</Button>
        </>
      ) : (
        <>
          <p className="text-success mb-4">✅ Puzzle submitted! Your score: <strong>{score}</strong></p>
          <Button onClick={() => window.location.reload()}>Try Again Tomorrow</Button>
        </>
      )}
    </div>
  );
}
