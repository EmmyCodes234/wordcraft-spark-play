import React, { useState, useEffect } from "react";
import { Scale, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const WordJudge = () => {
  const [word, setWord] = useState("");
  const [result, setResult] = useState<"valid" | "invalid" | null>(null);
  const [loading, setLoading] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());

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

  const handleJudge = () => {
    if (!word.trim() || wordSet.size === 0) return;

    setLoading(true);
    setResult(null);

    const cleanWord = word.trim().toUpperCase();
    
    setTimeout(() => {
      const isValid = wordSet.has(cleanWord);
      setResult(isValid ? "valid" : "invalid");
      setLoading(false);
    }, 300);
  };

  const handleNewWord = () => {
    setWord("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Scale className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Word Judge
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-xl">
            Quick word validation. Enter a word to see if it's acceptable in CSW24.
          </p>
        </div>

        {/* Input Section */}
        <Card className="max-w-2xl mx-auto border-2 shadow-elegant">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <Input
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Enter a word..."
                className="text-2xl p-6 font-mono tracking-wider text-center border-2 focus:border-primary"
                onKeyPress={(e) => e.key === 'Enter' && handleJudge()}
                disabled={loading}
                maxLength={15}
              />
              
              <Button
                onClick={handleJudge}
                disabled={loading || wordSet.size === 0 || !word.trim()}
                className="w-full py-6 text-xl bg-gradient-primary hover:opacity-90 transition-all duration-300"
              >
                {loading ? "Judging..." : "Judge Word"}
              </Button>
            </div>

            {wordSet.size === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                Loading dictionary...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className={`max-w-2xl mx-auto border-4 shadow-elegant animate-scale-in ${
            result === "valid" 
              ? 'border-success bg-success/10 shadow-glow-success' 
              : 'border-destructive bg-destructive/10'
          }`}>
            <CardContent className="p-12 text-center space-y-8">
              <div className="text-4xl font-bold font-mono tracking-wider uppercase">
                {word}
              </div>
              
              <div className="flex items-center justify-center gap-6">
                {result === "valid" ? (
                  <>
                    <CheckCircle2 className="h-24 w-24 text-success animate-bounce" />
                    <div className="text-left">
                      <div className="text-5xl font-black text-success uppercase tracking-tight">
                        ACCEPTABLE
                      </div>
                      <div className="text-xl text-success/80 font-medium">
                        Valid in CSW24
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-24 w-24 text-destructive animate-pulse" />
                    <div className="text-left">
                      <div className="text-5xl font-black text-destructive uppercase tracking-tight">
                        NOT ACCEPTABLE
                      </div>
                      <div className="text-xl text-destructive/80 font-medium">
                        Not in CSW24
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Button 
                onClick={handleNewWord} 
                variant="outline"
                className="text-lg px-8 py-4 border-2"
              >
                Judge Another Word
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WordJudge;