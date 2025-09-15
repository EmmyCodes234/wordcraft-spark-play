import React, { useState, useEffect, useRef, useCallback } from "react";
import { Brain, Search, Lightbulb, X as XIcon, Loader2, Download } from "lucide-react"; // Loader2 is correctly imported here
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from "jspdf";

import { FixedSizeList } from 'react-window';

const INITIAL_DISPLAY_LIMIT = 200;
const LOAD_MORE_AMOUNT = 200;

export default function PatternMatcher() {
  const [letters, setLetters] = useState("");
  const [pattern, setPattern] = useState("");
  const [includeDictionaryWords, setIncludeDictionaryWords] = useState(true);
  const [loadingDictionary, setLoadingDictionary] = useState(true);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);

  const [selectedLengths, setSelectedLengths] = useState<number[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);

  const workerRef = useRef<Worker | null>(null);
  const componentId = useRef(Date.now().toString()).current;

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/dictionaryWorker.ts', import.meta.url));

    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'dictionaryLoaded') {
        setLoadingDictionary(false);
      } else if (event.data.type === 'searchResults' && event.data.componentId === componentId) {
        setResults(event.data.results);
        setLoading(false);
        setDisplayLimit(INITIAL_DISPLAY_LIMIT);
      } else if (event.data.type === 'error') {
        setDictionaryError(event.data.message);
        setLoadingDictionary(false);
        setLoading(false);
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


  const handleSearch = useCallback(() => {
    if (loadingDictionary || dictionaryError) return;

    setLoading(true);
    setResults([]);
    setDisplayLimit(INITIAL_DISPLAY_LIMIT);

    workerRef.current?.postMessage({
      type: 'searchWords',
      componentId: componentId,
      searchParams: {
        searchType: 'pattern',
        letters, pattern, includeDictionaryWords, selectedLengths,
        startsWith: '', endsWith: '', contains: '', containsAll: '',
        qWithoutU: false, isVowelHeavy: false, noVowels: false,
        sortOrder: 'asc'
      }
    });
  }, [
    letters, pattern, includeDictionaryWords, selectedLengths,
    loadingDictionary, dictionaryError, componentId
  ]);

  const toggleLength = (length: number) => {
    setSelectedLengths(prev => {
      const newLengths = prev.includes(length) ? prev.filter(l => l !== length) : [...prev, length];
      return newLengths.sort((a, b) => a - b);
    });
  };

  const clearLengths = () => {
    setSelectedLengths([]);
  };

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const handler = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(handler);
  }, [selectedLengths, includeDictionaryWords]);


  const commonLengths = Array.from({ length: 14 }, (_, i) => i + 2);

  const handleLoadMore = () => {
    setDisplayLimit(prevLimit => prevLimit + LOAD_MORE_AMOUNT);
  };

  // Export functions for ALL results
  const exportAsTxt = () => {
    const header = `Pattern Matcher Results\nGenerated on: ${new Date().toLocaleDateString()}\nLetters: ${letters || 'Any'}\nPattern: ${pattern || 'Any'}\nInclude Dictionary Words: ${includeDictionaryWords}\nTotal words found: ${results.length}\n\n`;
    
    const content = header + results.join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pattern-results-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Pattern Matcher Results', 20, 20);
    doc.setFontSize(12);
    
    let y = 40;
    const pageHeight = 280; // A4 page height minus margins
    const lineHeight = 6; // Increased line height for better readability
    
    // Add summary information
    doc.text(`Total words found: ${results.length}`, 20, y);
    y += lineHeight;
    doc.text(`Letters: ${letters || 'Any'}`, 20, y);
    y += lineHeight;
    doc.text(`Pattern: ${pattern || 'Any'}`, 20, y);
    y += lineHeight;
    doc.text(`Include Dictionary Words: ${includeDictionaryWords}`, 20, y);
    y += lineHeight;
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, y);
    y += lineHeight * 2; // Extra space before words
    
    let wordIndex = 0;
    let currentPage = 1;
    
    while (wordIndex < results.length) {
      // Check if we need a new page
      if (y + lineHeight > pageHeight) {
        doc.addPage();
        currentPage++;
        y = 20; // Reset to top of new page
      }
      
      // Add page number for pages after the first
      if (currentPage > 1) {
        doc.setFontSize(10);
        doc.text(`Page ${currentPage}`, 20, 15);
        doc.setFontSize(12);
        y = 25; // Start content below page number
      }
      
      // Add words to current page
      while (wordIndex < results.length && y + lineHeight <= pageHeight) {
        doc.text(results[wordIndex], 20, y);
        y += lineHeight;
        wordIndex++;
      }
    }
    
    doc.save(`pattern-results-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const isSearchButtonDisabled = loading || loadingDictionary || dictionaryError !== null || (!letters.trim() && !pattern.trim());

  interface RowProps {
    index: number;
    style: React.CSSProperties;
    data: {
      words: string[];
      letters: string;
      pattern: string;
    };
  }

  const Row: React.FC<RowProps> = ({ index, style, data }) => {
    const word = data.words[index];
    const highlighted = word.toUpperCase();

    return (
      <div style={style} className="flex items-center justify-center p-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="w-full h-10 px-2 py-1 text-base font-semibold cursor-pointer truncate flex items-center justify-center"
                onClick={() => navigator.clipboard.writeText(word)}
              >
                {highlighted}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to copy "{word}"</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

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
                  disabled={loading || loadingDictionary || dictionaryError !== null}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                  disabled={loading || loadingDictionary || dictionaryError !== null}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
            <Button
              onClick={handleSearch}
              disabled={isSearchButtonDisabled}
              className="w-full h-12 text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300"
            >
              {loadingDictionary ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading Dictionary...</> :
               loading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Searching...</> :
               <><Search className="h-5 w-5 mr-2" /> Search</>}
            </Button>
          </CardContent>
        </Card>

        {loadingDictionary ? (
          <Card className="max-w-4xl mx-auto border shadow-elegant">
            <CardContent className="p-8 text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" /> {/* Corrected from LoaderCircle */}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {results.slice(0, displayLimit).map((word) => (
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
              {results.length > displayLimit && (
                  <div className="text-center mt-6">
                    <Button onClick={handleLoadMore} variant="outline" disabled={loading}>
                      Load More ({results.length - displayLimit} remaining)
                    </Button>
                  </div>
              )}
            </CardContent>
            <CardFooter className="p-6 border-t mt-4">
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Lightbulb className="h-4 w-4" />
                  Tip: Use '_' for blank tiles in your pattern (e.g., "APP_E" for APPLE).
                </span>
                <div className="flex gap-2">
                  <Button onClick={exportAsTxt} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Export TXT
                  </Button>
                  <Button onClick={exportAsPdf} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Export PDF
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        ) : (!loading && dictionaryError === null && !letters.trim() && !pattern.trim() && results.length === 0) ? (
            <Card className="max-w-4xl mx-auto border shadow-elegant">
              <CardContent className="p-8 text-center space-y-4">
                <div className="text-4xl">👋</div>
                <h3 className="text-xl font-semibold">Ready to match patterns?</h3>
                <p className="text-muted-foreground">Enter letters or a pattern above to get started!</p>
              </CardContent>
            </Card>
          ) : !loading && dictionaryError === null && (letters.trim() || pattern.trim()) && results.length === 0 && (
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