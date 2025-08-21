// File: src/pages/AnagramSolver.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "@/hooks/use-performance";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, SortAsc, SortDesc, FileText, Download, Save, Shuffle, X, LoaderCircle, Filter } from "lucide-react";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MobileSearchInput from "@/components/ui/MobileSearchInput";
import WordTile from "@/components/ui/WordTile";
import { useIsMobile } from "@/hooks/use-mobile";

const WORDNIK_API_KEY = "q6ozgglz09jnvewsiy4cvvaywtzey98sz3a108u6dmnvystl9";
type Definition = { text: string; partOfSpeech: string; };

const INITIAL_DISPLAY_LIMIT = 200;
const LOAD_MORE_AMOUNT = 200;

export default function AnagramSolver() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [letters, setLetters] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDictionary, setLoadingDictionary] = useState(true);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedLengths, setSelectedLengths] = useState<number[]>([]);
  const [allowPartial, setAllowPartial] = useState(true);

  const [startsWith, setStartsWith] = useState("");
  const [endsWith, setEndsWith] = useState("");
  const [contains, setContains] = useState("");
  const [containsAll, setContainsAll] = useState("");
  const [qWithoutU, setQWithoutU] = useState(false);
  const [isVowelHeavy, setIsVowelHeavy] = useState(false);
  const [noVowels, setNoVowels] = useState(false);
  
  // Probability filters
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | 'common' | 'uncommon' | 'rare' | 'expert'>('all');
  const [minProbability, setMinProbability] = useState(0);
  const [maxProbability, setMaxProbability] = useState(100);
  const [sortByFrequency, setSortByFrequency] = useState(false);

  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [makeDeckPublic, setMakeDeckPublic] = useState(false);
  const [publicDescription, setPublicDescription] = useState("");
  const [saveDeckMessage, setSaveDeckMessage] = useState<string | null>(null); // For save deck feedback

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);

  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);

  const workerRef = useRef<Worker | null>(null);
  const componentId = useRef(Date.now().toString()).current;

  // Web Worker for dictionary loading and search logic
  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/dictionaryWorker.ts', import.meta.url));

    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'dictionaryLoaded') {
        setLoadingDictionary(false);
      } else if (event.data.type === 'searchResults' && event.data.componentId === componentId) {
        setResults(event.data.results);
        setLoading(false);
        setDisplayLimit(INITIAL_DISPLAY_LIMIT); // Reset display limit on new search
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

  const performSearch = useCallback(() => {
    if (loadingDictionary || dictionaryError) return;

    setLoading(true);
    setResults([]);
    setDisplayLimit(INITIAL_DISPLAY_LIMIT); // Reset display limit for new search

    workerRef.current?.postMessage({
      type: 'searchWords',
      componentId: componentId,
      searchParams: {
        searchType: 'anagram',
        letters,
        allowPartial, selectedLengths,
        startsWith, endsWith, contains, containsAll,
        qWithoutU, isVowelHeavy, noVowels, sortOrder,
        frequencyFilter, minProbability, maxProbability, sortByFrequency
      }
    });
  }, [
    letters, allowPartial, selectedLengths, startsWith, endsWith, contains, containsAll,
    qWithoutU, isVowelHeavy, noVowels, sortOrder, frequencyFilter, minProbability, 
    maxProbability, sortByFrequency, loadingDictionary, dictionaryError, componentId
  ]);

  // Debounced search for better performance
  const debouncedSearch = useDebounce(performSearch, 300);

  // Auto-search when letters change (with debouncing)
  useEffect(() => {
    if (letters.trim().length > 0) {
      debouncedSearch();
    }
  }, [letters, debouncedSearch]);

  const handleSolve = () => {
    performSearch(); // Immediate search when button is clicked
  };


  const fetchDefinition = async (word: string) => { /* ... unchanged ... */ };
  const handleWordClick = (word: string) => {
    if (!word) return;
    
    // Copy word to clipboard
    navigator.clipboard.writeText(word).then(() => {
      console.log(`Copied "${word}" to clipboard`);
    }).catch(err => {
      console.error('Failed to copy word:', err);
    });
    
    // Open definition modal
    setSelectedWord(word);
    setIsModalOpen(true);
    setDefinitionLoading(true);
    setDefinitionError(null);
    
    // Fetch definition
    fetchDefinition(word);
  };

  // --- FIX: Save to Quiz Deck Function ---
  const saveAsQuizDeck = async () => {
    setSaveDeckMessage(null); // Clear previous messages
    console.log("saveAsQuizDeck: Attempting to save deck.");
    console.log("User:", user);
    console.log("Deck Name:", deckName.trim());
    console.log("Results Length:", results.length);

    if (!user) {
        setSaveDeckMessage("Please log in to save decks.");
        console.error("Save Deck Failed: User not logged in.");
        return;
    }
    if (!deckName.trim()) {
        setSaveDeckMessage("Please enter a deck name.");
        console.error("Save Deck Failed: Deck name is empty.");
        return;
    }
    if (results.length === 0) {
        setSaveDeckMessage("No words to save. Please generate some results first.");
        console.error("Save Deck Failed: No results to save.");
        return;
    }

    // Determine the profile_id to associate with the deck
    // Assuming user.id from useAuth is the same as profile.id
    const deckProfileId = user.id; 
    console.log("Attempting Supabase insert with profile_id:", deckProfileId);
    console.log("Deck Public:", makeDeckPublic);
    console.log("Deck Description:", publicDescription);

    const { error } = await supabase.from("cardbox").insert([
      {
        user_id: user.id,
        profile_id: deckProfileId, // FIX: Include profile_id for foreign key
        name: deckName.trim(),
        words: results, // Ensure this matches your DB column type (e.g., text[] for array of words)
        is_public: makeDeckPublic,
        description: makeDeckPublic ? publicDescription.trim() : null
      }
    ]);

    if (error) {
      console.error("Supabase Insert Error:", error); // Log the full error object for debugging
      if (error.code === '23505') { // PostgreSQL unique violation error code
        setSaveDeckMessage("Error: A deck with this name already exists or is a duplicate.");
      } else if (error.message.includes('foreign key constraint') || error.message.includes('null value in column "profile_id"')) {
        setSaveDeckMessage("Error: Database profile link missing or invalid. Please ensure your database migration for 'profile_id' is complete and you are logged in.");
      }
      else {
        setSaveDeckMessage(`Error saving deck: ${error.message || "Unknown database error"}`);
      }
    } else {
      setSaveDeckMessage("Quiz Deck saved successfully!");
      console.log("Deck saved successfully!");
      // Clear inputs and hide prompt after successful save (with a small delay for message visibility)
      setDeckName("");
      setMakeDeckPublic(false);
      setPublicDescription("");
      setTimeout(() => setShowSavePrompt(false), 2000); 
    }
  };
  // --- END FIX: Save to Quiz Deck Function ---

  const exportAsTxt = () => { /* ... unchanged ... */ };
  const exportAsPdf = () => { /* ... unchanged ... */ };

  // --- REMOVED: saveToCardbox function (as requested) ---
  // const saveToCardbox = async () => { ... };
  // --- END REMOVED ---


  // --- FIX: Determine if the solve button should be disabled ---
  const isSolveButtonDisabled = loading || loadingDictionary || dictionaryError !== null || (
    // Button is disabled if:
    // 1. App is currently loading dictionary or searching
    // 2. Dictionary had an error loading
    // 3. AND NO search criteria are provided at all (all input fields are empty)
    letters.trim().length === 0 &&
    startsWith.trim().length === 0 &&
    endsWith.trim().length === 0 &&
    contains.trim().length === 0 &&
    containsAll.trim().length === 0 &&
    selectedLengths.length === 0 // Check if no length filters are selected
  );
  // --- END FIX ---

  const handleLoadMore = () => {
    setDisplayLimit(prevLimit => prevLimit + LOAD_MORE_AMOUNT);
  };


  return (
    <>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary leading-tight">Anagram Solver</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base lg:text-lg px-2">Find words with the ultimate toolkit.</p>
          </div>
          <Card className="max-w-4xl mx-auto border shadow-elegant">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shuffle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> 
                Letter & Word Finder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                {isMobile ? (
                  <MobileSearchInput
                    value={letters}
                    onChange={(value) => setLetters(value.toUpperCase())}
                    placeholder="ENTER LETTERS (E.G., RETAINS?)"
                    onSearch={handleSolve}
                    disabled={loading || loadingDictionary || dictionaryError !== null}
                    className="text-base font-mono tracking-widest uppercase"
                  />
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      placeholder="ENTER LETTERS (E.G., RETAINS?)"
                      value={letters}
                      onChange={(e) => setLetters((e.target.value || '').toUpperCase())}
                      className="flex-1 text-base sm:text-lg p-4 sm:p-6 font-mono tracking-widest uppercase"
                      onKeyPress={(e) => e.key === 'Enter' && handleSolve()}
                      disabled={loading || loadingDictionary || dictionaryError !== null}
                    />
                    <Button
                      id="solve-button"
                      onClick={handleSolve}
                      disabled={isSolveButtonDisabled}
                      className="px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300 h-12 sm:h-auto"
                    >
                      {loadingDictionary ? <><LoaderCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" /> Loading...</> :
                       loading ? <><LoaderCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" /> Solving...</> :
                       <><Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Solve</>}
                    </Button>
                  </div>
                )}
                
                {isMobile && (
                  <Button
                    id="solve-button-mobile"
                    onClick={handleSolve}
                    disabled={isSolveButtonDisabled}
                    className="w-full py-4 text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300"
                  >
                    {loadingDictionary ? <><LoaderCircle className="h-5 w-5 mr-2 animate-spin" /> Loading...</> :
                     loading ? <><LoaderCircle className="h-5 w-5 mr-2 animate-spin" /> Solving...</> :
                     <><Search className="h-5 w-5 mr-2" /> Solve</>}
                  </Button>
                )}
              </div>
              {dictionaryError && (
                <div className="bg-red-500/10 text-red-600 border border-red-500 rounded-md p-3 text-center">
                  Error: {dictionaryError}. Please refresh the page.
                </div>
              )}
              <Collapsible>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Search Type</Label>
                    <Button variant={allowPartial ? "default" : "outline"} onClick={() => setAllowPartial(!allowPartial)} className="w-full" disabled={loadingDictionary || loading || dictionaryError !== null}>{allowPartial ? "Partial Match" : "Exact Match"}</Button>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Advanced</Label>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full" disabled={loadingDictionary || loading || dictionaryError !== null}><Filter className="mr-2 h-4 w-4" /> More Filters</Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent className="mt-6 space-y-6 border-t pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Starts With</Label><Input placeholder="E.G., PRE" value={startsWith} onChange={e => setStartsWith((e.target.value || '').toUpperCase())} className="uppercase" disabled={loadingDictionary || loading || dictionaryError !== null}/></div>
                    <div className="space-y-2"><Label>Ends With</Label><Input placeholder="E.G., ING" value={endsWith} onChange={e => setEndsWith((e.target.value || '').toUpperCase())} className="uppercase" disabled={loadingDictionary || loading || dictionaryError !== null}/></div>
                    <div className="space-y-2"><Label>Contains Substring</Label><Input placeholder="E.G., ZY" value={contains} onChange={e => setContains((e.target.value || '').toUpperCase())} className="uppercase" disabled={loadingDictionary || loading || dictionaryError !== null}/></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contains All These Letters</Label>
                    <Input placeholder="E.G., XYZ" value={containsAll} onChange={e => setContainsAll((e.target.value || '').toUpperCase())} className="uppercase" disabled={loadingDictionary || loading || dictionaryError !== null}/>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center space-x-2"><Switch id="q-no-u" checked={qWithoutU} onCheckedChange={setQWithoutU} disabled={loadingDictionary || loading || dictionaryError !== null}/><Label htmlFor="q-no-u">Q without U</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="vowel-heavy" checked={isVowelHeavy} onCheckedChange={setIsVowelHeavy} disabled={loadingDictionary || loading || dictionaryError !== null}/><Label htmlFor="vowel-heavy">Vowel-Heavy</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="no-vowels" checked={noVowels} onCheckedChange={setNoVowels} disabled={loadingDictionary || loading || dictionaryError !== null}/><Label htmlFor="no-vowels">No Vowels</Label></div>
                  </div>
                  
                  {/* Probability/Frequency Filters */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Word Frequency Filter</Label>
                      <Badge variant="outline" className="text-xs">Probability-based</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Frequency Level</Label>
                        <Select 
                          value={frequencyFilter} 
                          onValueChange={(value: 'all' | 'common' | 'uncommon' | 'rare' | 'expert') => setFrequencyFilter(value)}
                          disabled={loadingDictionary || loading || dictionaryError !== null}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Words</SelectItem>
                            <SelectItem value="common">Common (70%+ frequency)</SelectItem>
                            <SelectItem value="uncommon">Uncommon (50-70% frequency)</SelectItem>
                            <SelectItem value="rare">Rare (25-50% frequency)</SelectItem>
                            <SelectItem value="expert">Expert (&lt; 25% frequency)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="sort-by-frequency" 
                            checked={sortByFrequency} 
                            onCheckedChange={setSortByFrequency} 
                            disabled={loadingDictionary || loading || dictionaryError !== null}
                          />
                          <Label htmlFor="sort-by-frequency">Sort by Frequency</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Show most common words first
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Min Probability (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={minProbability}
                          onChange={(e) => setMinProbability(Math.max(0, Math.min(100, Number(e.target.value))))}
                          disabled={loadingDictionary || loading || dictionaryError !== null}
                          className="text-center"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Max Probability (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={maxProbability}
                          onChange={(e) => setMaxProbability(Math.max(0, Math.min(100, Number(e.target.value))))}
                          disabled={loadingDictionary || loading || dictionaryError !== null}
                          className="text-center"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={frequencyFilter === 'all' && minProbability === 0 && maxProbability === 100 ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFrequencyFilter('all');
                          setMinProbability(0);
                          setMaxProbability(100);
                        }}
                        disabled={loadingDictionary || loading || dictionaryError !== null}
                      >
                        Reset Filters
                      </Button>
                      <Button
                        variant={frequencyFilter === 'common' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('common')}
                        disabled={loadingDictionary || loading || dictionaryError !== null}
                      >
                        Common Only
                      </Button>
                      <Button
                        variant={frequencyFilter === 'rare' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('rare')}
                        disabled={loadingDictionary || loading || dictionaryError !== null}
                      >
                        Rare Only
                      </Button>
                      <Button
                        variant={frequencyFilter === 'expert' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('expert')}
                        disabled={loadingDictionary || loading || dictionaryError !== null}
                      >
                        Expert Only
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <div className="pt-6 border-t">
                <Label className="text-sm font-medium mb-2 block">Filter by Word Length:</Label>
                <div className="flex flex-wrap gap-2">
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
                      {len} Letters
                    </Button>
                  ))}
                </div>
              </div>
              {results.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-6 border-t">
                  <Button onClick={exportAsTxt} variant="outline"><FileText className="mr-2 h-4 w-4" /> Export TXT</Button>
                  <Button onClick={exportAsPdf} variant="outline"><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
                  <Button onClick={() => setShowSavePrompt(true)} variant="outline">📁 Save as Quiz Deck</Button>
                  {showSavePrompt && (
                    <div className="flex flex-col gap-2 w-full pt-2">
                      <Input placeholder="Enter deck name" value={deckName} onChange={(e) => setDeckName(e.target.value)} className="flex-grow" />
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch id="make-public" checked={makeDeckPublic} onCheckedChange={setMakeDeckPublic} />
                        <Label htmlFor="make-public">Make Public</Label>
                      </div>
                      {makeDeckPublic && (
                        <Input
                          placeholder="Add a public description (optional)"
                          value={publicDescription}
                          onChange={(e) => setPublicDescription(e.target.value)}
                          className="mt-2 h-10 bg-gray-900 border-gray-700 text-base"
                        />
                      )}
                      <Button onClick={saveAsQuizDeck} disabled={!deckName.trim()} variant="default">Save Deck</Button>
                      {saveDeckMessage && ( // Display feedback message for saving deck
                        <p className={`text-sm mt-2 text-center ${saveDeckMessage.includes("Error") ? "text-red-400" : "text-green-400"}`}>
                          {saveDeckMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          {loadingDictionary ? (
             <Card className="max-w-4xl mx-auto border shadow-elegant">
               <CardContent className="p-8 text-center space-y-4">
                 <LoaderCircle className="w-12 h-12 animate-spin text-primary mx-auto" />
                 <h3 className="text-xl font-semibold">Loading Dictionary...</h3>
                 <p className="text-muted-foreground">This may take a moment.</p>
               </CardContent>
             </Card>
          ) : results.length > 0 ? (
            <Card className="max-w-7xl mx-auto border shadow-elegant animate-fade-in">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <CardTitle>Results ({results.length} words found)</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-normal">Sort:</Label>
                    <Select value={sortByFrequency ? "frequency" : sortOrder} onValueChange={(v) => {
                      if (v === "frequency") {
                        setSortByFrequency(true);
                        setSortOrder("desc");
                      } else {
                        setSortByFrequency(false);
                        setSortOrder(v as "asc" | "desc");
                      }
                    }}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sort Order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Length (Desc)</SelectItem>
                        <SelectItem value="asc">Length (Asc)</SelectItem>
                        <SelectItem value="frequency">Frequency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                  {results.slice(0, displayLimit).map((wordObj, index) => {
                    const word = typeof wordObj === 'string' ? wordObj : wordObj.word || '';
                    const frequencyData = typeof wordObj === 'object' && wordObj.frequency ? wordObj.frequency : null;
                    const frequency = frequencyData && typeof frequencyData === 'object' ? frequencyData.frequency : null;
                    const difficulty = frequencyData && typeof frequencyData === 'object' ? frequencyData.difficulty : null;
                    const available = (letters || "").toUpperCase().replace(/[^A-Z?.]/g, "");
                    const used = new Map();
                    for (const c of available) if (c !== '?' && c !== '.') used.set(c, (used.get(c) || 0) + 1);
                    const highlighted = (word || '').toUpperCase().split("").map((char, i) => {
                      if (used.has(char) && used.get(char) > 0) {
                        used.set(char, used.get(char) - 1);
                        return <span key={i}>{char}</span>;
                      } else {
                        return <span key={i} className="text-pink-500 font-bold">{char}</span>;
                      }
                    });
                    
                    // Get frequency badge color
                    const getFrequencyBadgeColor = (freq: number | null, diff: string | null) => {
                      if (!freq && !diff) return '';
                      if (diff === 'common' || (freq && freq >= 70)) return 'bg-green-100 text-green-800 border-green-200';
                      if (diff === 'uncommon' || (freq && freq >= 50)) return 'bg-blue-100 text-blue-800 border-blue-200';
                      if (diff === 'rare' || (freq && freq >= 25)) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      if (diff === 'expert' || (freq && freq < 25)) return 'bg-red-100 text-red-800 border-red-200';
                      return 'bg-gray-100 text-gray-800 border-gray-200';
                    };
                    
                    return (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {isMobile ? (
                              <button 
                                onClick={() => handleWordClick(word)} 
                                className="word-tile border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 text-center font-mono font-semibold hover:scale-105 transition-transform duration-200 hover:shadow-md hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <div className="text-sm tracking-wider leading-tight">{highlighted}</div>
                                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                                  <span>{word.length} letters</span>
                                  {frequency && (
                                    <Badge variant="outline" className={`text-xs px-1 py-0 ${getFrequencyBadgeColor(frequency, difficulty)}`}>
                                      {frequency}%
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleWordClick(word)} 
                                className="border border-primary/20 p-2 sm:p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 text-center font-mono font-semibold hover:scale-105 transition-transform duration-200 hover:shadow-md hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary min-h-[60px] sm:min-h-[80px]"
                              >
                                <div className="text-sm sm:text-lg tracking-wider leading-tight">{highlighted}</div>
                                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                  <div>{word.length} letters</div>
                                  {frequency && (
                                    <Badge variant="outline" className={`text-xs ${getFrequencyBadgeColor(frequency, difficulty)}`}>
                                      {difficulty || `${frequency}%`}
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p>Click to copy "{word}"</p>
                              {frequency && (
                                <p className="text-xs">
                                  Frequency: {frequency}% ({difficulty || 'unknown'})
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
                {results.length > displayLimit && (
                  <div className="text-center mt-6">
                    <Button onClick={handleLoadMore} variant="outline" disabled={loading}>
                      Load More ({results.length - displayLimit} remaining)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (!loading && dictionaryError === null && letters.trim().length === 0 && results.length === 0 && startsWith.trim().length === 0 && endsWith.trim().length === 0 && contains.trim().length === 0 && selectedLengths.length === 0 && containsAll.trim().length === 0) ? (
            <Card className="max-w-4xl mx-auto border shadow-elegant">
              <CardContent className="p-8 text-center space-y-4">
                <div className="text-4xl">👋</div>
                <h3 className="text-xl font-semibold">Ready to find words?</h3>
                <p className="text-muted-foreground">Enter letters or use the filters above to get started!</p>
              </CardContent>
            </Card>
          ) : !loading && dictionaryError === null && (letters.trim() || startsWith.trim() || endsWith.trim() || contains.trim() || selectedLengths.length > 0 || containsAll.trim().length > 0) && results.length === 0 && (
            <Card className="max-w-4xl mx-auto border shadow-elegant">
              <CardContent className="p-8 text-center space-y-4">
                <div className="text-4xl">🤔</div>
                <h3 className="text-xl font-semibold">No words found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria or check your letter combination.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <DefinitionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} word={selectedWord} definition={definition} error={definitionError} isLoading={definitionLoading}/>
    </>
  );
}

const DefinitionModal = ({ isOpen, onClose, word, definition, error, isLoading }: {
    isOpen: boolean;
    onClose: () => void;
    word: string | null;
    definition: Definition | null;
    error: string | null;
    isLoading: boolean;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-background rounded-lg shadow-xl w-full max-w-lg p-6 relative">
            <Button onClick={onClose} variant="ghost" className="absolute top-2 right-2 h-8 w-8 p-0">
              <X className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-bold text-primary">{word}</h2>
            <div className="mt-4 min-h-[100px] flex items-center justify-center">
              {isLoading ? (<LoaderCircle className="w-8 h-8 animate-spin text-primary" />) : error ? (<p className="text-red-500 text-center">{error}</p>) : (definition && (
                <div className="space-y-2 text-left">
                  <p className="font-semibold italic text-muted-foreground">{definition.partOfSpeech}</p>
                  <p className="text-base" dangerouslySetInnerHTML={{ __html: definition.text }}></p>
                </div>
              )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};