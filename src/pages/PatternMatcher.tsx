import React, { useState, useMemo, useEffect, useRef, useCallback } from "react"; // Removed useMemo
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
  // Removed wordSet state, as worker now manages dictionary
  const [loadingDictionary, setLoadingDictionary] = useState(true);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);

  const [selectedLengths, setSelectedLengths] = useState<number[]>([]);
  const [results, setResults] = useState<string[]>([]); // New state to store results received from worker
  const [loading, setLoading] = useState(false); // New state to indicate ongoing search

  const workerRef = useRef<Worker | null>(null);
  const componentId = useRef(Date.now().toString()).current; // Unique ID for this component instance

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/dictionaryWorker.ts', import.meta.url));

    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'dictionaryLoaded') {
        setLoadingDictionary(false);
      } else if (event.data.type === 'searchResults' && event.data.componentId === componentId) {
        setResults(event.data.results);
        setLoading(false); // Stop loading after results received
      } else if (event.data.type === 'error') {
        setDictionaryError(event.data.message);
        setLoadingDictionary(false);
        setLoading(false); // Stop loading if error occurs
      }
    };

    workerRef.current.postMessage({ type: 'loadDictionary' });
    setLoadingDictionary(true);

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [componentId]);


  // handleSearch now sends parameters to the worker
  const handleSearch = useCallback(() => {
    // Only attempt search if dictionary is loaded and no current error
    if (loadingDictionary || dictionaryError) return;

    setLoading(true); // Start loading spinner for search results
    setResults([]); // Clear previous results immediately for visual feedback

    // Send all relevant search parameters to the worker
    workerRef.current?.postMessage({
      type: 'searchWords',
      componentId: componentId, // Send componentId to worker to identify results
      searchParams: {
        searchType: 'pattern', // Indicate this is a pattern search
        letters, pattern, includeDictionaryWords, selectedLengths,
        // PatternMatcher doesn't use these specific filters in its direct UI,
        // but they are part of the common searchParams object if we assume future expansion
        startsWith: '', endsWith: '', contains: '', containsAll: '',
        qWithoutU: false, isVowelHeavy: false, noVowels: false,
        sortOrder: 'asc' // PatternMatcher doesn't have a sort option, default to asc
      }
    });
  }, [
    letters, pattern, includeDictionaryWords, selectedLengths,
    loadingDictionary, dictionaryError, componentId
  ]);

  // Removed getMatchingWords and useMemo that wraps it.

  const toggleLength = (length: number) => {
    setSelectedLengths(prev => {
      if (prev.includes(length)) {
        return prev.filter(l => l !== length).sort((a, b) => a - b);
      } else {
        return [...prev, length].sort((a, b) => a - b);
      }
    });
    // Trigger search after length change
    setTimeout(handleSearch, 0); // Use setTimeout to allow state to update first
  };

  const clearLengths = () => {
    setSelectedLengths([]);
    setTimeout(handleSearch, 0); // Trigger search after clearing lengths
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
                  disabled={loading || loadingDictionary || dictionaryError !== null} // Disable input if loading
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()} // Trigger search on Enter
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
                  disabled={loading || loadingDictionary || dictionaryError !== null} // Disable input if loading
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()} // Trigger search on Enter
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
                  disabled={loadingDictionary || loading || dictionaryError !== null}
                >
                  All Lengths
                </Button>
                {commonLengths.map(len => (
                  <Button
                    key={len}
                    variant={selectedLengths.includes(len) ? "default" : "outline"}
                    onClick={() => toggleLength(len)}
                    size="sm"
                    disabled={loadingDictionary || loading || dictionaryError !== null}
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
                disabled={loadingDictionary || loading || dictionaryError !== null}
              />
              <label htmlFor="includeDictionaryWords" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Only show words from standard dictionary
              </label>
            </div>
            {/* Added a dedicated Search button for consistency, if user doesn't press Enter */}
            <Button
              onClick={handleSearch}
              disabled={loading || loadingDictionary || dictionaryError !== null || (!letters.trim() && !pattern.trim())} // Disable if no input
              className="w-full h-12 text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300"
            >
              {loadingDictionary ? <><LoaderCircle className="h-5 w-5 mr-2 animate-spin" /> Loading Dictionary...</> :
               loading ? <><LoaderCircle className="h-5 w-5 mr-2 animate-spin" /> Searching...</> :
               <><Search className="h-5 w-5 mr-2" /> Search</>}
            </Button>
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
        ) : results.length > 0 ? (
          <Card className="max-w-6xl mx-auto border shadow-elegant animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  Results
                </span>
                <Badge className="bg-gradient-primary text-primary-foreground text-base">
                  {` ${results.length} words found`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {dictionaryError && (
                <div className="bg-red-500/10 text-red-600 border border-red-500 rounded-md p-3 mb-4 text-center">
                  Error loading dictionary: {dictionaryError}. Please try again later.
                </div>
              )}
              {results.length === 0 && (letters || pattern) && (
                <p className="text-muted-foreground text-center py-4">No words found for your criteria.</p>
              )}
              {results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {results.map((word) => (
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
        ) : (!loading && dictionaryError === null && !letters.trim() && !pattern.trim() && results.length === 0) ? (
            // Initial message when nothing entered
            <Card className="max-w-4xl mx-auto border shadow-elegant">
              <CardContent className="p-8 text-center space-y-4">
                <div className="text-4xl">👋</div>
                <h3 className="text-xl font-semibold">Ready to match patterns?</h3>
                <p className="text-muted-foreground">Enter letters or a pattern above to get started!</p>
              </CardContent>
            </Card>
          ) : !loading && dictionaryError === null && (letters.trim() || pattern.trim()) && results.length === 0 && (
            // No results found message (after search attempt)
            <Card className="max-w-4xl mx-auto border shadow-elegant">
              <CardContent className="p-8 text-center space-y-4">
                <div className="text-4xl">🤔</div>
                <h3 className="text-xl font-semibold">No words found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria or check your pattern/letters.</p>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}