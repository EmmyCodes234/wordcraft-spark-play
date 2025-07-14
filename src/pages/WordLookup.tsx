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

const WordLookup = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ valid: boolean; words: string[]; totalScore: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

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

  const handleAnalyze = () => {
    if (!input.trim() || wordSet.size === 0) return;

    setLoading(true);
    setResult(null);
    setShowAnalysis(false);
    setShowCelebration(false);

    const words = input.trim().split(/\s+/).map((w) => w.toUpperCase());
    const allValid = words.every((word) => wordSet.has(word));
    const totalScore = words.reduce((sum, word) => sum + calculateWordScore(word), 0);

    setTimeout(() => {
      setResult({ valid: allValid, words, totalScore });
      setLoading(false);
      
      if (allValid) {
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          setShowAnalysis(true);
        }, 1500);
      }
    }, 800);
  };

  const handleNewSearch = () => {
    setInput("");
    setResult(null);
    setShowAnalysis(false);
    setShowCelebration(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Word Judge
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Enter words separated by spaces to validate them against the CSW24 lexicon and analyze their Scrabble value.
          </p>
        </div>

        {/* Search Form */}
        <Card className="max-w-4xl mx-auto border shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Enter Your Play
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., QUIZ JAZZY FYLFOT"
                className="text-lg p-6 font-mono tracking-wider"
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                disabled={loading}
              />
              <Button
                onClick={handleAnalyze}
                disabled={loading || wordSet.size === 0 || !input.trim()}
                className="px-8 py-6 text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Trophy className="h-5 w-5 mr-2" />
                    Judge Play
                  </>
                )}
              </Button>
            </div>

            {wordSet.size === 0 && (
              <div className="text-center py-4">
                <Badge variant="outline" className="animate-pulse">
                  Loading CSW24 dictionary...
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Celebration Animation */}
        {showCelebration && result?.valid && (
          <Celebration
            type="correct"
            title="Valid Play!"
            message="All words accepted in CSW24"
            xpGained={result.totalScore}
            onContinue={() => setShowCelebration(false)}
            autoClose={true}
            autoCloseDelay={1500}
          />
        )}

        {/* Instant Result */}
        {result && !showAnalysis && (
          <Card className={`max-w-4xl mx-auto border-2 shadow-elegant animate-scale-in ${
            result.valid 
              ? 'border-success bg-success/5 shadow-glow-success' 
              : 'border-destructive bg-destructive/5'
          }`}>
            <CardContent className="p-8 text-center space-y-6">
              <div className="text-4xl font-bold font-mono tracking-wider">
                {result.words.join(" ")}
              </div>
              
              <div className="flex items-center justify-center gap-4">
                {result.valid ? (
                  <>
                    <CheckCircle className="h-16 w-16 text-success animate-bounce" />
                    <div>
                      <div className="text-2xl font-bold text-success">VALID PLAY!</div>
                      <div className="text-lg text-success/80">All words accepted in CSW24</div>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-16 w-16 text-destructive animate-pulse" />
                    <div>
                      <div className="text-2xl font-bold text-destructive">INVALID PLAY</div>
                      <div className="text-lg text-destructive/80">One or more words not in CSW24</div>
                    </div>
                  </>
                )}
              </div>

              {result.valid && (
                <div className="flex items-center justify-center gap-4">
                  <Badge className="bg-gradient-primary text-primary-foreground text-xl px-6 py-3">
                    {result.totalScore} total points
                  </Badge>
                  {result.words.some(w => w.length >= 7) && (
                    <Badge className="bg-gradient-celebration text-white text-lg px-4 py-2 animate-pulse-glow">
                      🎯 Bingo Potential!
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex justify-center gap-4">
                <Button onClick={handleNewSearch} variant="outline">
                  New Search
                </Button>
                {result.valid && (
                  <Button 
                    onClick={() => setShowAnalysis(true)}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    View Analysis
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Analysis */}
        {showAnalysis && result?.valid && (
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Detailed Analysis</h2>
              <Button onClick={handleNewSearch} variant="outline">
                New Search
              </Button>
            </div>

            <SaveToStudyDeck words={result.words} />
            
            <WordAnalysis 
              words={result.words} 
              dictionary={wordSet}
              animated={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WordLookup;