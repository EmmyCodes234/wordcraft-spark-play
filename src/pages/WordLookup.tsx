
import React, { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Celebration } from "@/components/ui/celebration";
import { WordAnalysis } from "@/components/enhanced/WordAnalysis";
import { SaveToStudyDeck } from "@/components/enhanced/SaveToStudyDeck";
import { calculateWordScore } from "@/lib/scrabbleUtils";
import { defineWord } from "@/lib/defineWord";

const WordLookup = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ valid: boolean; words: string[]; totalScore: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [definition, setDefinition] = useState<string | null>(null);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await fetch("/dictionaries/CSW24.txt");
        const text = await response.text();
        const wordsArray = text.split("\n").map((w) => w.trim().toUpperCase());
        setWordSet(new Set(wordsArray));
        console.log("CSW24 dictionary loaded with", wordsArray.length, "words");
      } catch (error) {
        console.error("Failed to load CSW24 word list:", error);
      }
    };
    fetchWords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setDefinition(null);
    setShowCelebration(false);
    setShowAnalysis(false);

    const word = input.trim().toUpperCase();
    if (!wordSet.has(word)) {
      setResult({ valid: false, words: [], totalScore: 0 });
      setLoading(false);
      return;
    }

    const letters = word.split("");
    const anagrams = Array.from(wordSet).filter((w) =>
      w.length === word.length &&
      w.split("").sort().join("") === letters.slice().sort().join("") &&
      w !== word
    );

    const totalScore = calculateWordScore(word);
    setResult({ valid: true, words: anagrams, totalScore });

    try {
      const def = await defineWord(word);
      setDefinition(def);
    } catch (err) {
      console.error("Definition fetch failed:", err);
    }

    setShowAnalysis(true);
    setShowCelebration(true);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a word"
          className="max-w-sm"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Check Word"} <Search className="ml-2 h-4 w-4" />
        </Button>
      </form>

      {result && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.valid ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
              {input.trim().toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {definition && <p className="text-sm italic text-muted-foreground mb-3">{definition}</p>}
            {result.valid ? (
              <div className="space-y-3">
                <p className="text-green-600 font-semibold">
                  ✅ Valid word — Score: {result.totalScore} points
                </p>
                {result.words.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Anagrams:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.words.map((w) => (
                        <Badge key={w} variant="outline">{w}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {showAnalysis && (
                  <div className="mt-4">
                    <WordAnalysis words={[input.trim().toUpperCase()]} dictionary={wordSet} animated />
                    <SaveToStudyDeck word={input.trim().toUpperCase()} />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-600">❌ Not a valid word</p>
            )}
          </CardContent>
        </Card>
      )}

      {showCelebration && <Celebration />}
    </div>
  );
};

export default WordLookup;
