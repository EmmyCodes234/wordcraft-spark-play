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
    if (!words.trim() || wordSet.size === 0) return;

    setLoading(true);
    setResult(null);

    const wordList = words.trim().toUpperCase().split(/\s+/);
    
    setTimeout(() => {
      const allValid = wordList.every(word => wordSet.has(word));
      setResult(allValid ? "acceptable" : "not-acceptable");
      setLoading(false);
    }, 300);
  };

  const handleNewWord = () => {
    setWords("");
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
            Quick word validation. Enter one or more words (space-separated) to check if they're acceptable in CSW24.
          </p>
        </div>

        {/* Input Section */}
        <Card className="max-w-2xl mx-auto border-2 shadow-elegant">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <Input
                value={words}
                onChange={(e) => setWords(e.target.value)}
                placeholder="Enter words (e.g., 'BED CAT GOAT')..."
                className="text-2xl p-6 font-mono tracking-wider text-center border-2 focus:border-primary"
                onKeyPress={(e) => e.key === 'Enter' && handleJudge()}
                disabled={loading}
              />
              
              <Button
                onClick={handleJudge}
                disabled={loading || wordSet.size === 0 || !words.trim()}
                className="w-full py-6 text-xl bg-gradient-primary hover:opacity-90 transition-all duration-300"
              >
                {loading ? "Judging..." : "Judge Words"}
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
            result === "acceptable" 
              ? 'border-success bg-success/10 shadow-glow-success' 
              : 'border-destructive bg-destructive/10'
          }`}>
            <CardContent className="p-12 text-center space-y-8">
              <div className="text-4xl font-bold font-mono tracking-wider uppercase">
                {words}
              </div>
              
              <div className="flex items-center justify-center gap-6">
                {result === "acceptable" ? (
                  <>
                    <CheckCircle2 className="h-24 w-24 text-success animate-bounce" />
                    <div className="text-left">
                      <div className="text-5xl font-black text-success uppercase tracking-tight">
                        ACCEPTABLE
                      </div>
                      <div className="text-xl text-success/80 font-medium">
                        All words valid in CSW24
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
                        One or more words not in CSW24
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
                Judge More Words
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WordJudge;