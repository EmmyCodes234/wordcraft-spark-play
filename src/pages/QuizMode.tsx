import React, { useState, useEffect, useContext } from "react";
import DictionaryContext from "@/context/DictionaryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Timer } from "lucide-react";

function getAlphagram(word: string) {
  return word.split("").sort().join("");
}

export default function QuizMode() {
  const dictionary = useContext(DictionaryContext);
  const [selectedLength, setSelectedLength] = useState<number | null>(null);
  const [alphagrams, setAlphagrams] = useState<
    { alpha: string; words: string[]; original: string[] }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [repeatedWords, setRepeatedWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackColor, setFeedbackColor] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(5);
  const [timer, setTimer] = useState<number>(300);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let interval: any;
    if (alphagrams.length && !showResults) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowResults(true);
            return 0;
          }
          setProgress(((prev - 1) / (timerMinutes * 60)) * 100);
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [alphagrams, showResults, timerMinutes]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const generateAlphagrams = () => {
    if (!dictionary) return;

    const wordMap = new Map<string, string[]>();

    dictionary.forEach((word) => {
      if (selectedLength && word.length === selectedLength) {
        const alpha = getAlphagram(word);
        if (!wordMap.has(alpha)) {
          wordMap.set(alpha, []);
        }
        wordMap.get(alpha)!.push(word);
      }
    });

    const entries = Array.from(wordMap.entries())
      .filter(([_, words]) => words.length >= 1)
      .sort(() => 0.5 - Math.random())
      .slice(0, 20)
      .map(([alpha, words]) => ({ alpha, words: words.slice(), original: words.slice() }));

    setAlphagrams(entries);
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
    const updatedAlphas = alphagrams
      .map(({ alpha, words, original }) => {
        if (words.includes(inputWord)) {
          found = true;
          const updatedWords = words.filter((w) => w !== inputWord);
          return { alpha, words: updatedWords, original };
        }
        return { alpha, words, original };
      })
      .filter(({ words }) => words.length > 0);

    if (found) {
      setTypedWords((prev) => [...prev, inputWord]);
      setAlphagrams(updatedAlphas);
      setFeedback("Correct!");
      setFeedbackColor("bg-green-600 animate-bounce");
    } else {
      setFeedback("Incorrect!");
      setFeedbackColor("bg-red-600 animate-shake");
    }

    setUserInput("");

    if (updatedAlphas.length === 0) {
      setShowResults(true);
    }
  };

  const score = typedWords.length;

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">Wordwalls Quiz</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Type all valid anagrams for each alphagram!</p>
      </div>

      {!alphagrams.length && (
        <Card className="max-w-3xl mx-auto border shadow-card">
          <CardContent className="p-6 space-y-4">
            <Input
              type="number"
              placeholder="Timer in minutes (e.g., 5)"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(Number(e.target.value))}
            />
            <div className="flex flex-wrap gap-2 justify-center">
              {[5, 6, 7, 8].map((len) => (
                <Button
                  key={len}
                  variant={selectedLength === len ? "default" : "outline"}
                  className={`hover:bg-green-700 ${selectedLength === len ? "bg-green-600 text-white" : ""}`}
                  onClick={() => setSelectedLength(selectedLength === len ? null : len)}
                >
                  {len}-letter
                </Button>
              ))}
            </div>
            <Button
              disabled={!selectedLength}
              onClick={generateAlphagrams}
              className="w-full mt-4 h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      {alphagrams.length > 0 && !showResults && (
        <>
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-5 w-5" /> {formatTime(timer)}
            </div>
            <Progress value={progress} className="w-2/3 rounded-full bg-green-100" />
          </div>

          <Card className="max-w-3xl mx-auto border shadow-card">
            <CardContent className="p-4 flex flex-wrap gap-2 justify-center">
              {alphagrams.map(({ alpha, words }, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 rounded-full shadow hover:scale-105 transition-all bg-green-100 text-green-800 font-mono text-sm"
                >
                  {alpha} ({words.length})
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="max-w-3xl mx-auto mt-4 flex gap-2">
            <Input
              placeholder="Type word and press Enter"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInput()}
              className="flex-grow border-2 border-green-600 focus:border-green-700"
            />
            <Button onClick={handleInput} className="bg-green-600 hover:bg-green-700 text-white">
              Submit
            </Button>
          </div>

          {feedback && (
            <div className={`max-w-3xl mx-auto mt-2 text-center text-white py-2 rounded ${feedbackColor}`}>
              {feedback}
            </div>
          )}
        </>
      )}

      {showResults && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold">Quiz Review</h2>
          <p className="text-lg">You scored {score} correct words!</p>
          <div className="overflow-x-auto">
            <table className="min-w-full border mt-4 text-left bg-white rounded shadow">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="border px-3 py-2">Alphagram</th>
                  <th className="border px-3 py-2">Correct</th>
                  <th className="border px-3 py-2">Missed</th>
                </tr>
              </thead>
              <tbody>
                {alphagrams.map(({ alpha, original }, idx) => {
                  const correct = original.filter((w) => typedWords.includes(w));
                  const missed = original.filter((w) => !typedWords.includes(w));
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-green-50" : "bg-white"}>
                      <td className="border px-3 py-2 font-mono">{alpha}</td>
                      <td className="border px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {correct.map((w, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-green-600 text-white">{w}</span>
                          ))}
                        </div>
                      </td>
                      <td className="border px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {missed.map((w, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-red-600 text-white">{w}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Button
            onClick={() => {
              setAlphagrams([]);
              setShowResults(false);
              setSelectedLength(null);
            }}
            className="bg-green-600 hover:bg-green-700 text-white mt-4"
          >
            Back to Setup
          </Button>
        </div>
      )}
    </div>
  );
}
