import React, { useState, useEffect } from "react";
import { Scale, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const WordJudge = () => {
  const [words, setWords] = useState("");
  const [result, setResult] = useState<"acceptable" | "not-acceptable" | null>(null);
  const [loading, setLoading] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  const [dictStatus, setDictStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await fetch("/dictionaries/CSW24.txt");
        const text = await response.text();
        const wordsArray = text.split("\n").map((w) => w.trim().toUpperCase());
        setWordSet(new Set(wordsArray));
        setDictStatus("loaded");
      } catch (error) {
        console.error("Failed to load CSW24 word list:", error);
        setDictStatus("error");
      }
    };
    fetchWords();
  }, []);

  const handleJudge = () => {
    if (!words.trim() || wordSet.size === 0) return;
    setLoading(true);
    setResult(null);
    // The 'words' state is already uppercase, but we trim and split
    const wordList = words.trim().split(/\s+/);
    setTimeout(() => {
      const allValid = wordList.every(word => wordSet.has(word));
      setResult(allValid ? "acceptable" : "not-acceptable");
      setLoading(false);
    }, 300);
  };

  const handleClear = () => {
    setWords("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-4">
                  <Scale className="h-16 w-16 text-primary mx-auto" />
        <h1 className="text-5xl md:text-6xl font-bold text-primary">
            Word Judge
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Check if a word is valid according to the CSW24 dictionary. You can enter multiple words separated by spaces.
          </p>
        </div>

        {dictStatus === "loading" && <div className="text-center text-yellow-500">Loading dictionary...</div>}
        {dictStatus === "error" && <div className="text-center text-red-500">Failed to load dictionary.</div>}

        {dictStatus === "loaded" && (
          <div className="max-w-xl mx-auto space-y-6">
            <Input
              placeholder="ENTER A WORD..."
              value={words}
              // --- FIX: Convert input to uppercase on change ---
              onChange={(e) => setWords((e.target.value || '').toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleJudge()}
              // --- FIX: Added 'uppercase' class for consistent styling ---
              className="text-lg p-6 text-center font-mono tracking-widest uppercase"
              disabled={loading}
            />
            <div className="flex gap-4 justify-center">
              <Button onClick={handleJudge} disabled={loading || !words.trim()} size="lg">
                {loading ? "Checking..." : "Judge Word(s)"}
              </Button>
              <Button variant="outline" onClick={handleClear} size="lg">Clear</Button>
            </div>

            {result && (
              <Card className="text-center mt-6 animate-fade-in">
                <CardContent className="py-8 flex flex-col items-center gap-4">
                  {result === "acceptable" ? (
                    <>
                      <CheckCircle2 className="text-green-500 w-12 h-12" />
                      <p className="text-xl text-green-600 font-semibold">Acceptable!</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-red-500 w-12 h-12" />
                      <p className="text-xl text-red-600 font-semibold">Not Acceptable</p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WordJudge;