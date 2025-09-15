import React, { useState, useEffect, useRef, useCallback } from "react";
import { Brain, Search, Lightbulb, X as XIcon, Loader2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from "jspdf";
import { dictionaryService } from "@/lib/dictionaryService";

const INITIAL_DISPLAY_LIMIT = 200;
const LOAD_MORE_AMOUNT = 200;

export default function PatternMatcher() {
  const [letters, setLetters] = useState("");
  const [pattern, setPattern] = useState("");
  const [includeDictionaryWords, setIncludeDictionaryWords] = useState(true);
  const [loadingDictionary, setLoadingDictionary] = useState(true);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);
  const [dictionaryWords, setDictionaryWords] = useState<string[]>([]);
  const [isDictionaryReady, setIsDictionaryReady] = useState(false);

  const [selectedLengths, setSelectedLengths] = useState<number[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);

  // Initialize dictionary
  useEffect(() => {
    const initializeDictionary = async () => {
      try {
        console.log('PatternMatcher: Initializing dictionary...');
        
        // Try to load from dictionary service
        await dictionaryService.loadDictionary();
        
        if (dictionaryService.isDictionaryLoaded()) {
          const words = await dictionaryService.getCachedWords();
          
          if (words.length > 0) {
            setDictionaryWords(words);
            setIsDictionaryReady(true);
            setLoadingDictionary(false);
            console.log('PatternMatcher: Dictionary loaded and ready');
            return;
          }
        }
        
        // Fallback dictionary
        console.log('PatternMatcher: Using fallback dictionary');
        const fallbackWords = [
          'SCRABBLE', 'WORD', 'GAME', 'PLAY', 'LETTER', 'TILE', 'BOARD', 'SCORE', 'POINT',
          'MATCH', 'PATTERN', 'SOLVE', 'FIND', 'SEARCH', 'QUICK', 'FAST', 'SPEED', 'TIME'
        ];
        setDictionaryWords(fallbackWords);
        setIsDictionaryReady(true);
        setLoadingDictionary(false);
        
      } catch (error) {
        console.error('PatternMatcher: Failed to load dictionary:', error);
        setDictionaryError('Failed to load dictionary');
        setLoadingDictionary(false);
      }
    };

    initializeDictionary();
  }, []);

  // Pattern matching function
  const matchesPattern = (word: string, pattern: string): boolean => {
    if (!pattern) return true;
    
    const cleanPattern = pattern.replace(/[^A-Za-z_]/g, '').toUpperCase();
    const cleanWord = word.toUpperCase();
    
    if (cleanPattern.length !== cleanWord.length) return false;
    
    for (let i = 0; i < cleanPattern.length; i++) {
      const patternChar = cleanPattern[i];
      const wordChar = cleanWord[i];
      
      if (patternChar !== '_' && patternChar !== wordChar) {
        return false;
      }
    }
    
    return true;
  };

  // Letter availability check
  const canMakeWord = (word: string, availableLetters: string): boolean => {
    if (!availableLetters) return true;
    
    const letterCount = new Map<string, number>();
    let blanks = 0;
    
    for (const letter of availableLetters.toUpperCase()) {
      if (letter === '?' || letter === '.') blanks++;
      else letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
    }
    
    for (const letter of word.toUpperCase()) {
      const count = letterCount.get(letter) || 0;
      if (count > 0) letterCount.set(letter, count - 1);
      else if (blanks > 0) blanks--;
      else return false;
    }
    
    return true;
  };

  // Length filter
  const matchesLength = (word: string, lengths: number[]): boolean => {
    if (lengths.length === 0) return true;
    return lengths.includes(word.length);
  };

  // Perform search
  const performSearch = useCallback(() => {
    if (!isDictionaryReady) return;

    setLoading(true);
    setResults([]);
    setDisplayLimit(INITIAL_DISPLAY_LIMIT);

    try {
      let filteredWords = dictionaryWords;

      // Filter by letters
      if (letters.trim()) {
        filteredWords = filteredWords.filter(word => 
          canMakeWord(word, letters.trim())
        );
      }

      // Filter by pattern
      if (pattern.trim()) {
        filteredWords = filteredWords.filter(word => 
          matchesPattern(word, pattern.trim())
        );
      }

      // Filter by length
      if (selectedLengths.length > 0) {
        filteredWords = filteredWords.filter(word => 
          matchesLength(word, selectedLengths)
        );
      }

      // Sort alphabetically
      filteredWords.sort((a, b) => a.localeCompare(b));

      setResults(filteredWords);
      setLoading(false);
      console.log(`PatternMatcher: Found ${filteredWords.length} words`);

    } catch (error) {
      console.error('PatternMatcher: Search error:', error);
      setLoading(false);
    }
  }, [letters, pattern, selectedLengths, dictionaryWords, isDictionaryReady]);

  const toggleLength = (length: number) => {
    setSelectedLengths(prev => {
      const newLengths = prev.includes(length) ? prev.filter(l => l !== length) : [...prev, length];
      return newLengths.sort((a, b) => a - b);
    });
  };

  const clearLengths = () => {
    setSelectedLengths([]);
  };

  // Auto-search when parameters change
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const handler = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(handler);
  }, [selectedLengths, includeDictionaryWords, performSearch]);

  const commonLengths = Array.from({ length: 14 }, (_, i) => i + 2);

  const handleLoadMore = () => {
    setDisplayLimit(prevLimit => prevLimit + LOAD_MORE_AMOUNT);
  };

  // Export functions
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
    const pageHeight = 280;
    const lineHeight = 6;
    
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
    y += lineHeight * 2;
    
    // Add words
    const wordsPerPage = Math.floor((pageHeight - y) / lineHeight);
    let currentPage = 1;
    let wordIndex = 0;
    
    while (wordIndex < results.length) {
      if (y > pageHeight - lineHeight) {
        doc.addPage();
        currentPage++;
        y = 20;
        doc.setFontSize(10);
        doc.text(`Page ${currentPage}`, 20, y);
        y += lineHeight * 2;
      }
      
      const word = results[wordIndex];
      doc.text(word, 20, y);
      y += lineHeight;
      wordIndex++;
    }
    
    doc.save(`pattern-results-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const displayedResults = results.slice(0, displayLimit);
  const hasMoreResults = results.length > displayLimit;

  return (
    <div className="min-h-screen bg-gradient-subtle dark:bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Pattern Matcher</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Find words that can be formed from your letters, or match a specific pattern (use _ for blanks).
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Available Letters</label>
                <Input
                  placeholder="Enter letters (e.g., SCRABBLE)"
                  value={letters}
                  onChange={(e) => setLetters(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Use ? or . for blank tiles
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Pattern</label>
                <Input
                  placeholder="Enter pattern (e.g., S_CR_BBLE)"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Use _ for any letter
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeDictionary"
                  checked={includeDictionaryWords}
                  onChange={(e) => setIncludeDictionaryWords(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeDictionary" className="text-sm font-medium">
                  Include dictionary words
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Word Lengths</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearLengths}
                    disabled={selectedLengths.length === 0}
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {commonLengths.map((length) => (
                    <Badge
                      key={length}
                      variant={selectedLengths.includes(length) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => toggleLength(length)}
                    >
                      {length}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={performSearch}
              disabled={loading || loadingDictionary}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Words
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {dictionaryError && (
          <Card className="max-w-4xl mx-auto border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <XIcon className="h-4 w-4" />
                <span className="font-medium">Dictionary Error</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {dictionaryError}
              </p>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Results ({results.length} words found)
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportAsTxt}>
                    <Download className="h-4 w-4 mr-2" />
                    Export TXT
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportAsPdf}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {displayedResults.map((word, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="p-2 text-center cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {word}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{word} ({word.length} letters)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
              
              {hasMoreResults && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={handleLoadMore}>
                    Load More ({results.length - displayLimit} remaining)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {results.length === 0 && !loading && isDictionaryReady && (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="pt-6 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No words found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search parameters or use different letters/pattern.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}