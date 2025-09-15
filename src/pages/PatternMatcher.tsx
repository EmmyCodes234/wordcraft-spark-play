import React, { useState, useEffect, useRef, useCallback } from "react";
import { Brain, Search, Lightbulb, X as XIcon, Loader2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import jsPDF from "jspdf";
import { dictionaryService } from "@/lib/dictionaryService";

const INITIAL_DISPLAY_LIMIT = 200;
const LOAD_MORE_AMOUNT = 200;

export default function PatternMatcher() {
  const isMobile = useIsMobile();
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
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="mobile-container mx-auto py-4 sm:py-8 space-y-4 sm:space-y-8">
        <div className="text-center space-y-3">
          <Brain className="h-8 w-8 sm:h-12 sm:w-12 text-primary mx-auto" />
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-primary leading-tight">Pattern Matcher</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base lg:text-lg px-2">
            Find words that can be formed from your letters, or match a specific pattern (use _ for blanks).
          </p>
        </div>

        <Card className="max-w-4xl mx-auto mobile-card">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Search Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Available Letters</label>
                <Input
                  placeholder="Enter letters (e.g., SCRABBLE)"
                  value={letters}
                  onChange={(e) => setLetters(e.target.value.toUpperCase())}
                  className="mobile-input uppercase text-base font-mono tracking-widest"
                  disabled={loadingDictionary}
                />
                <p className="text-xs text-muted-foreground">
                  Use ? or . for blank tiles
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pattern</label>
                <Input
                  placeholder="Enter pattern (e.g., S_CR_BBLE)"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value.toUpperCase())}
                  className="mobile-input uppercase text-base font-mono tracking-widest"
                  disabled={loadingDictionary}
                />
                <p className="text-xs text-muted-foreground">
                  Use _ for any letter
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeDictionary"
                  checked={includeDictionaryWords}
                  onChange={(e) => setIncludeDictionaryWords(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-primary text-primary focus:ring-primary"
                  disabled={loadingDictionary}
                />
                <label htmlFor="includeDictionary" className="text-sm font-medium text-foreground">
                  Include dictionary words
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Word Lengths</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearLengths}
                    disabled={selectedLengths.length === 0}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {commonLengths.map((length) => (
                    <Badge
                      key={length}
                      variant={selectedLengths.includes(length) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground px-3 py-1 text-sm"
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
              className="mobile-button w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Search Words
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {dictionaryError && (
          <Card className="max-w-4xl mx-auto mobile-card border-destructive">
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
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
          <Card className="max-w-4xl mx-auto mobile-card">
            <CardHeader className="px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  Results ({results.length} words found)
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportAsTxt} className="text-xs">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {isMobile ? "TXT" : "Export TXT"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportAsPdf} className="text-xs">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {isMobile ? "PDF" : "Export PDF"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
                {displayedResults.map((word, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="mobile-word-tile text-center cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm sm:text-base"
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
                  <Button variant="outline" onClick={handleLoadMore} className="mobile-button">
                    Load More ({results.length - displayLimit} remaining)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {results.length === 0 && !loading && isDictionaryReady && (
          <Card className="max-w-4xl mx-auto mobile-card">
            <CardContent className="pt-4 sm:pt-6 text-center p-4 sm:p-6">
              <Brain className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No words found</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Try adjusting your search parameters or use different letters/pattern.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}