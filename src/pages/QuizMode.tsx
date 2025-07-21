import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Timer, Brain, Target, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext"; // <-- FIX: Import useAuth
import { supabase } from "@/lib/supabaseClient"; // <-- FIX: Import supabase

const tickSound = new Audio("/sounds/tick.mp3");
const endSound = new Audio("/sounds/end.mp3");
tickSound.volume = 0.05;
endSound.volume = 0.2;

function getAlphagram(word: string) {
  return word.split("").sort().join("");
}

export default function QuizMode() {
  const { user } = useAuth(); // <-- FIX: Get the current user
  const [selectedLength, setSelectedLength] = useState<number | null>(null);
  const [alphagrams, setAlphagrams] = useState<{ alpha: string; words: string[]; original: string[] }[]>([]);
  const [initialAlphagrams, setInitialAlphagrams] = useState<{ alpha: string; words: string[]; original: string[] }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [repeatedWords, setRepeatedWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackColor, setFeedbackColor] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(5);
  const [timer, setTimer] = useState<number>(300);
  const [progress, setProgress] = useState(100);
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (alphagrams.length && !showResults) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            endSound.play().catch(e => console.error("Sound play failed:", e));
            setShowResults(true);
            return 0;
          }
          tickSound.play().catch(e => console.error("Sound play failed:", e));
          setProgress(((prev - 1) / (timerMinutes * 60)) * 100);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [alphagrams, showResults, timerMinutes]);

  const allPossibleAnswers = initialAlphagrams.flatMap(a => a.original);
  const uniqueCorrectWords = [...new Set(typedWords)].filter((w) => allPossibleAnswers.includes(w));
  const totalCorrectCount = allPossibleAnswers.length;
  const score = uniqueCorrectWords.length;
  const accuracy = totalCorrectCount > 0 ? Math.round((score / totalCorrectCount) * 100) : 0;

  // --- FIX: New function to save quiz results to the database ---
  const saveQuizResults = async () => {
    if (!user || totalCorrectCount === 0) return;
    try {
      const { error } = await supabase.from("quiz_results").insert({
        user_id: user.id,
        correct: score,
        total: totalCorrectCount,
        accuracy: accuracy,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error saving quiz results:", error);
    }
  };

  // --- FIX: New useEffect to trigger the save when the quiz ends ---
  useEffect(() => {
    if (showResults && totalCorrectCount > 0) {
      saveQuizResults();
    }
  }, [showResults]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const generateAlphagrams = () => {
    if (wordSet.size === 0 || !selectedLength) return;

    const wordMap = new Map<string, string[]>();
    wordSet.forEach((word) => {
      if (word.length === selectedLength) {
        const alpha = getAlphagram(word);
        if (!wordMap.has(alpha)) {
          wordMap.set(alpha, []);
        }
        wordMap.get(alpha)!.push(word);
      }
    });

    const entries = Array.from(wordMap.entries())
      .filter(([, words]) => words.length >= 1)
      .sort(() => 0.5 - Math.random())
      .slice(0, 20)
      .map(([alpha, words]) => ({ alpha, words: [...words], original: [...words] }));

    setAlphagrams(entries);
    setInitialAlphagrams(entries);
    setUserInput("");
    setTypedWords([]);
    setRepeatedWords([]);
    setFeedback("");
    setShowResults(false);
    setTimer(timerMinutes * 60);
    setProgress(100);
  };

  const handleInput = () => {
    const inputWord = userInput.toUpperCase().trim();
    if (!inputWord) return;

    if (typedWords.includes(inputWord)) {
      setFeedback("Already typed!");
      setFeedbackColor("bg-blue-500 animate-pulse");
      setRepeatedWords((prev) => [...prev, inputWord]);
      setUserInput("");
      return;
    }

    let found = false;
    let remainingAlphagrams = 0;
    const updatedAlphas = alphagrams
      .map(({ alpha, words, original }) => {
        if (words.includes(inputWord)) {
          found = true;
          const updatedWords = words.filter((w) => w !== inputWord);
          if (updatedWords.length > 0) remainingAlphagrams++;
          return { alpha, words: updatedWords, original };
        }
        if (words.length > 0) remainingAlphagrams++;
        return { alpha, words, original };
      });
    
    if (found) {
      setTypedWords((prev) => [...prev, inputWord]);
      setAlphagrams(updatedAlphas);
      setFeedback("Correct!");
      setFeedbackColor("bg-green-600 animate-bounce");
      if (remainingAlphagrams === 0) {
        endSound.play().catch(e => console.error("Sound play failed:", e));
        setShowResults(true);
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      }
    } else {
      setFeedback("Incorrect!");
      setFeedbackColor("bg-red-600 animate-shake");
    }

    setUserInput("");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle dark:bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Brain className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Anagram Challenge
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Test your word skills! Find all valid anagrams for each letter pattern within the time limit.
          </p>
        </div>

        {!alphagrams.length && !showResults && (
          <Card className="max-w-4xl mx-auto border shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Quiz Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Timer Duration (minutes)</label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Number(e.target.value))}
                    className="max-w-xs"
                    min="1"
                    max="30"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-3 block">Word Length</label>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {[4, 5, 6, 7, 8, 9].map((len) => (
                      <Button
                        key={len}
                        variant={selectedLength === len ? "default" : "outline"}
                        className={`transition-all duration-200 ${
                          selectedLength === len 
                            ? "bg-gradient-primary text-primary-foreground shadow-glow" 
                            : "hover:bg-primary/10"
                        }`}
                        onClick={() => setSelectedLength(selectedLength === len ? null : len)}
                      >
                        {len}-letter words
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <Button
                disabled={!selectedLength || wordSet.size === 0}
                onClick={generateAlphagrams}
                className="w-full mt-6 h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-300"
              >
                {wordSet.size === 0 ? (
                  <>Loading dictionary...</>
                ) : (
                  <>
                    <Award className="mr-2 h-5 w-5" />
                    Start Challenge
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {alphagrams.length > 0 && !showResults && (
          <div className="space-y-6">
            <Card className="max-w-4xl mx-auto border shadow-elegant">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">{formatTime(timer)}</span>
                  </div>
                  <Badge className="bg-gradient-primary text-primary-foreground">
                    Score: {score}
                  </Badge>
                </div>
                <Progress value={progress} className="h-3 rounded-full" />
              </CardContent>
            </Card>

            <Card className="max-w-6xl mx-auto border shadow-elegant">
              <CardHeader>
                <CardTitle className="text-center">Letter Patterns</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  {alphagrams.map(({ alpha, words }, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="px-4 py-3 text-lg font-mono tracking-wider hover:scale-105 transition-all duration-200 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10"
                    >
                      {alpha} <span className="text-primary font-bold">({words.length})</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="max-w-4xl mx-auto border shadow-elegant">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Input
                    placeholder="TYPE YOUR ANSWER AND PRESS ENTER..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleInput()}
                    className="flex-1 text-lg p-6 font-mono tracking-widest uppercase"
                    autoFocus
                  />
                  <Button 
                    onClick={handleInput} 
                    className="px-8 py-6 text-lg bg-gradient-primary hover:opacity-90"
                  >
                    Submit
                  </Button>
                </div>

                {feedback && (
                  <div className={`mt-4 text-center text-lg font-semibold py-3 rounded-lg ${feedbackColor}`}>
                    {feedback}
                  </div>
                )}
                <div className="text-center">
                    <Button
                        variant="destructive"
                        onClick={() => {
                        endSound.play().catch(e => console.error("Sound play failed:", e));
                        setShowResults(true);
                        }}
                        className="mt-4"
                    >
                        Give Up
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showResults && (
          <div className="space-y-8">
            <Card className="max-w-4xl mx-auto border shadow-elegant">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Challenge Complete!</CardTitle>
                <div className="flex justify-center gap-6 mt-4">
                  <Badge className="bg-gradient-celebration text-white text-xl px-6 py-3">
                    🎯 {score} words found
                  </Badge>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {accuracy}% accuracy
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card className="max-w-6xl mx-auto border shadow-elegant">
              <CardHeader>
                <CardTitle>Detailed Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {initialAlphagrams.map(({ alpha, original }, idx) => {
                    const correct = original.filter((w) => typedWords.includes(w));
                    const missed = original.filter((w) => !typedWords.includes(w));
                    return (
                      <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="font-mono text-lg px-4 py-2">
                            {alpha}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {correct.length} of {original.length} found
                          </span>
                        </div>
                        
                        {correct.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">✓ Found:</h4>
                            <div className="flex flex-wrap gap-2">
                              {correct.map((w, i) => (
                                <Badge key={i} className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                  {w}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {missed.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">✗ Missed:</h4>
                            <div className="flex flex-wrap gap-2">
                              {missed.map((w, i) => (
                                <Badge key={i} variant="destructive">
                                  {w}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
              <Button
                onClick={() => {
                  setAlphagrams([]);
                  setInitialAlphagrams([]);
                  setShowResults(false);
                  setSelectedLength(null);
                }}
                className="bg-gradient-primary hover:opacity-90 px-8 py-4 text-lg"
              >
                New Challenge
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}