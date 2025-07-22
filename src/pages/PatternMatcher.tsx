import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Brain, Search, Lightbulb, X as XIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function PatternMatcher() {
  const [letters, setLetters] = useState("");
  const [pattern, setPattern] = useState("");
  const [includeDictionaryWords, setIncludeDictionaryWords] = useState(true);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  const [loadingDictionary, setLoadingDictionary] = useState(true);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);

  const [selectedLengths, setSelectedLengths] = useState<number[]>([]);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Correct path from src/pages/ to src/workers/
    workerRef.current = new Worker(new URL('../workers/dictionaryWorker.ts', import.meta.url));

    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'dictionaryLoaded') {
        setWordSet(new Set(event.data.wordSet));
        setLoadingDictionary(false);
      } else if (event.data.type === 'error') {
        setDictionaryError(event.data.message);
        setLoadingDictionary(false);
      }
    };

    workerRef.current.postMessage('loadDictionary');
    setLoadingDictionary(true);

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);


  const getMatchingWords = useCallback(() => {
    if (!letters && !pattern) return [];
    if (loadingDictionary) return [];

    const availableLetters = letters.toUpperCase().split("").sort();
    const cleanPattern = pattern.toUpperCase();

    let filteredWords: string[] = [];

    const sourceWords = includeDictionaryWords ? Array.from(wordSet) : [];

    for (const word of sourceWords) {
      if (
        (selectedLengths.length === 0 || selectedLengths.includes(word.length)) &&
        (word.length >= 2 && word.length <= 15)
      ) {
        if (cleanPattern) {
          if (word.length !== cleanPattern.length) continue;
          let patternMatch = true;
          for (let i = 0; i < cleanPattern.length; i++) {
            if (cleanPattern[i] !== "_" && cleanPattern[i] !== word[i]) {
              patternMatch = false;
              break;
            }
          }
          if (!patternMatch) continue;
        }

        if (availableLetters.length > 0) {
          let tempLetters = [...availableLetters];

          let patternFitsLetters = true;
          if (cleanPattern) {
            let tempLettersForPattern = [...availableLetters];
            for (let i = 0; i < cleanPattern.length; i++) {
              const char = cleanPattern[i];
              if (char !== '_') {
                const index = tempLettersForPattern.indexOf(char);
                if (index > -1) {
                  tempLettersForPattern.splice(index, 1);
                } else {
                  patternFitsLetters = false;
                  break;
                }
              }
            }
          }
          if (!patternFitsLetters) continue;

          let remainingWordChars = [];
          if (cleanPattern) {
              for (let i = 0; i < word.length; i++) {
                  if (cleanPattern[i] === '_') {
                      remainingWordChars.push(word[i]);
                  }
              }
          } else {
              remainingWordChars = word.split('');
          }

          let tempLettersForRemainingWord = [...availableLetters]; // Reset for this word check
          if (cleanPattern) {
              for (let i = 0; i < cleanPattern.length; i++) {
                  if (cleanPattern[i] !== '_') {
                      const idx = tempLettersForRemainingWord.indexOf(cleanPattern[i]);
                      if (idx > -1) {
                          tempLettersForRemainingWord.splice(idx, 1);
                      }
                  }
              }
          }


          let allCharsAvailable = true;
          for (const char of remainingWordChars) {
            const index = tempLettersForRemainingWord.indexOf(char);
            if (index > -1) {
              tempLettersForRemainingWord.splice(index, 1);
            } else {
              allCharsAvailable = false;
              break;
            }
          }
          if (!allCharsAvailable) continue;
        }

        filteredWords.push(word);
      }
    }

    return filteredWords.sort((a, b) => a.length - b.length || a.localeCompare(b));
  }, [letters, pattern, includeDictionaryWords, selectedLengths, wordSet, loadingDictionary]);

  const matchingWords = useMemo(() => getMatchingWords(), [getMatchingWords]);

  const toggleLength = (length: number) => {
    setSelectedLengths(prev => {
      if (prev.includes(length)) {
        return prev.filter(l => l !== length).sort((a, b) => a - b);
      } else {
        return [...prev, length].sort((a, b) => a - b);
      }
    });
  };

  const clearLengths = () => {
    setSelectedLengths([]);
  };

  const commonLengths = Array.from({ length: 14 }, (_, i) => i + 2);


  return (
    <div className="min-h-screen bg-gradient-subtle dark:bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Anagram Solver & Pattern Matcher</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Find words that can be formed from your letters, or match a specific pattern (use _ for blanks).
          </p>
        </div>

        <Card className="max-w-4xl mx-auto border shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="h-6 w-6 text-primary" /> Find Words</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="letters" className="text-sm font-medium mb-2 block">Your Letters</label>
                <Input
                  id="letters"
                  placeholder="e.g., AEINSPT"
                  value={letters}
                  onChange={(e) => setLetters(e.target.value)}
                  maxLength={15}
                  className="text-lg p-6 font-mono tracking-widest uppercase"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  disabled={loadingDictionary}
                />
                <p className="text-xs text-muted-foreground mt-2">Max 15 letters. Optional.</p>
              </div>
              <div>
                <label htmlFor="pattern" className="text-sm font-medium mb-2 block">Pattern (Use _ for blanks)</label>
                <Input
                  id="pattern"
                  placeholder="e.g., A_B_C"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  maxLength={15}
                  className="text-lg p-6 font-mono tracking-widest uppercase"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  disabled={loadingDictionary}
                />
                <p className="text-xs text-muted-foreground mt-2">Max 15 characters. Optional.</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Filter by Word Length:</label>
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  variant={selectedLengths.length === 0 ? "default" : "outline"}
                  onClick={clearLengths}
                  size="sm"
                  disabled={loadingDictionary}
                >
                  All Lengths
                </Button>
                {commonLengths.map(len => (
                  <Button
                    key={len}
                    variant={selectedLengths.includes(len) ? "default" : "outline"}
                    onClick={() => toggleLength(len)}
                    size="sm"
                    disabled={loadingDictionary}
                  >
                    {len}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeDictionaryWords"
                checked={includeDictionaryWords}
                onChange={(e) => setIncludeDictionaryWords(e.target.checked)}
                className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                disabled={loadingDictionary}
              />
              <label htmlFor="includeDictionaryWords" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Only show words from standard dictionary
              </label>
            </div>
          </CardContent>
        </Card>

        {loadingDictionary ? (
          <Card className="max-w-4xl mx-auto border shadow-elegant">
            <CardContent className="p-8 text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Loading Dictionary...</h3>
              <p className="text-muted-foreground">This may take a moment.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-6xl mx-auto border shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  Results
                </span>
                <Badge className="bg-gradient-primary text-primary-foreground text-base">
                  {` ${matchingWords.length} words found`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {dictionaryError && (
                <div className="bg-red-500/10 text-red-600 border border-red-500 rounded-md p-3 mb-4 text-center">
                  Error loading dictionary: {dictionaryError}. Please try again later.
                </div>
              )}
              {matchingWords.length === 0 && (letters || pattern) && (
                <p className="text-muted-foreground text-center py-4">No words found for your criteria.</p>
              )}
              {!letters && !pattern && (
                <p className="text-muted-foreground text-center py-4">Enter letters or a pattern above to find words.</p>
              )}
              {matchingWords.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {matchingWords.map((word) => (
                    <TooltipProvider key={word}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className="px-4 py-2 text-md font-semibold cursor-pointer truncate"
                            onClick={() => navigator.clipboard.writeText(word)}
                          >
                            {word}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to copy "{word}"</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-6 border-t mt-4 text-muted-foreground text-sm">
              <span className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                Tip: Use '_' for blank tiles in your pattern (e.g., "APP_E" for APPLE).
              </span>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}