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
import { usePageSession } from "@/context/SessionContext";
import { useToast } from '@/hooks/use-toast';
import { dictionaryService } from '@/lib/dictionaryService';

const WORDNIK_API_KEY = "q6ozgglz09jnvewsiy4cvvaywtzey98sz3a108u6dmnvystl9";
type Definition = { text: string; partOfSpeech: string; };

const INITIAL_DISPLAY_LIMIT = 200;
const LOAD_MORE_AMOUNT = 200;

export default function AnagramSolver() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { session, setSession } = usePageSession('anagramSolver');
  
  // Initialize state from session or defaults
  const [letters, setLetters] = useState(session?.letters || "");
  const [results, setResults] = useState<any[]>(session?.results || []);
  const [loading, setLoading] = useState(false);
  const [loadingDictionary, setLoadingDictionary] = useState(true);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);

  // Pre-loaded dictionary data for instant search
  const [dictionaryWords, setDictionaryWords] = useState<string[]>([]);
  const [frequencyMap, setFrequencyMap] = useState<Map<string, any>>(new Map());
  const [isDictionaryReady, setIsDictionaryReady] = useState(false);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(session?.sortOrder || "desc");
  const [selectedLengths, setSelectedLengths] = useState<number[]>(session?.selectedLengths || []);
  const [allowPartial, setAllowPartial] = useState(session?.allowPartial !== false);

  const [startsWith, setStartsWith] = useState(session?.startsWith || "");
  const [endsWith, setEndsWith] = useState(session?.endsWith || "");
  const [contains, setContains] = useState(session?.contains || "");
  const [containsAll, setContainsAll] = useState(session?.containsAll || "");
  const [qWithoutU, setQWithoutU] = useState(session?.qWithoutU || false);
  const [isVowelHeavy, setIsVowelHeavy] = useState(session?.isVowelHeavy || false);
  const [noVowels, setNoVowels] = useState(session?.noVowels || false);
  
  // Probability filters
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | 'common' | 'uncommon' | 'rare' | 'expert'>(session?.frequencyFilter || 'all');
  const [minProbability, setMinProbability] = useState(session?.minProbability || 0);
  const [maxProbability, setMaxProbability] = useState(session?.maxProbability || 100);
  const [sortByFrequency, setSortByFrequency] = useState(session?.sortByFrequency || false);

  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [makeDeckPublic, setMakeDeckPublic] = useState(false);
  const [publicDescription, setPublicDescription] = useState("");
  const [saveDeckMessage, setSaveDeckMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);

  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);


  // Consolidated dictionary loading logic
  useEffect(() => {
    const initializeDictionary = async () => {
      try {
        setLoadingDictionary(true);
        setDictionaryError(null);
        console.log('AnagramSolver: Starting dictionary initialization...');
        
        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Dictionary loading timeout')), 15000);
        });
        
        const loadPromise = (async () => {
          // First, try to get cached data from dictionary service
          try {
            console.log('AnagramSolver: Checking cached data...');
            const cachedWords = await dictionaryService.getCachedWords();
            const cachedFrequencyMap = await dictionaryService.getCachedFrequencyMap();
            
            if (cachedWords.length > 0) {
              setDictionaryWords(cachedWords);
              setFrequencyMap(cachedFrequencyMap);
              setIsDictionaryReady(true);
              setLoadingDictionary(false);
              console.log('AnagramSolver: Dictionary loaded from cache, ready for instant search');
              console.log('AnagramSolver: Cached words count:', cachedWords.length);
              return;
            }
          } catch (cacheError) {
            console.warn('AnagramSolver: Cache access failed:', cacheError);
          }
          
          // If no cache, try to load dictionary service
          try {
            console.log('AnagramSolver: Loading dictionary service...');
            await dictionaryService.loadDictionary();
            
            if (dictionaryService.isDictionaryLoaded()) {
              const words = await dictionaryService.getCachedWords();
              const freqMap = await dictionaryService.getCachedFrequencyMap();
              
              if (words.length > 0) {
                setDictionaryWords(words);
                setFrequencyMap(freqMap);
                setIsDictionaryReady(true);
                setLoadingDictionary(false);
                console.log('AnagramSolver: Dictionary loaded and ready for instant search');
                console.log('AnagramSolver: Service words count:', words.length);
                return;
              }
            }
          } catch (serviceError) {
            console.warn('AnagramSolver: Dictionary service failed:', serviceError);
            throw serviceError;
          }
        })();
        
        // Race between loading and timeout
        await Promise.race([loadPromise, timeoutPromise]);
        
      } catch (error) {
        console.error('AnagramSolver: Failed to load dictionary:', error);
        
        // Use fallback dictionary on any error
        console.log('AnagramSolver: Using fallback dictionary due to error');
        const fallbackWords = [
          'CAT', 'DOG', 'BAT', 'RAT', 'HAT', 'MAT', 'SAT', 'FAT',
          'STAR', 'RATS', 'ARTS', 'TARS', 'CARE', 'RACE', 'ACRE',
          'HEART', 'EARTH', 'THREA', 'THREE', 'EIGHT', 'WEIGHT',
          'LETTER', 'RETTLE', 'TREBLE', 'BETTER', 'REBATE',
          'ANIMAL', 'LAMINA', 'MANILA', 'ALAMIN', 'AMINAL',
          'RETIRE', 'TERRIE', 'RETIER', 'TIERER', 'RETIER',
          'SILENT', 'LISTEN', 'ENLIST', 'TINSEL', 'INLETS',
          'TRIANGLE', 'INTEGRAL', 'RELATING', 'ALTERING',
          'DICTIONARY', 'INDICATORY', 'INDICATORY'
        ];
        
        const fallbackFrequencyMap = new Map();
        fallbackWords.forEach(word => {
          fallbackFrequencyMap.set(word, { frequency: 50, difficulty: 'uncommon' });
        });
        
        setDictionaryWords(fallbackWords);
        setFrequencyMap(fallbackFrequencyMap);
        setIsDictionaryReady(true);
        setLoadingDictionary(false);
        setDictionaryError(null);
        console.log('AnagramSolver: Using fallback dictionary with', fallbackWords.length, 'words');
      }
    };

    initializeDictionary();
  }, []);

  // Save session data whenever relevant state changes
  useEffect(() => {
    const sessionData = {
      letters,
      results,
      sortOrder,
      selectedLengths,
      allowPartial,
      startsWith,
      endsWith,
      contains,
      containsAll,
      qWithoutU,
      isVowelHeavy,
      noVowels,
      frequencyFilter,
      minProbability,
      maxProbability,
      sortByFrequency,
    };
    setSession(sessionData);
  }, [
    letters, results, sortOrder, selectedLengths, allowPartial,
    startsWith, endsWith, contains, containsAll, qWithoutU, isVowelHeavy, noVowels,
    frequencyFilter, minProbability, maxProbability, sortByFrequency
    // Removed setSession from dependencies to prevent infinite loop
  ]);


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
    if (!isDictionaryReady || dictionaryError || dictionaryWords.length === 0) {
      toast({
        title: "Search Error",
        description: "Dictionary not ready. Please wait a moment and try again.",
        variant: "destructive"
      });
      return;
    }

    const searchStartTime = Date.now();
    setLoading(true);
    setResults([]);
    setDisplayLimit(INITIAL_DISPLAY_LIMIT);

    // Always use instant search - it's fast enough with 280k words
    performInstantSearch(searchStartTime);
  }, [
    letters, allowPartial, selectedLengths, startsWith, endsWith, contains, containsAll,
    qWithoutU, isVowelHeavy, noVowels, sortOrder, frequencyFilter, minProbability, 
    maxProbability, sortByFrequency, isDictionaryReady, dictionaryError, dictionaryWords
  ]);

  // Instant search using pre-loaded dictionary data - handles ALL filters
  const performInstantSearch = (startTime: number) => {
    try {
      let filteredWords = [...dictionaryWords]; // Use pre-loaded data

      // Apply anagram filter
      if (letters && letters.trim()) {
        const inputLetters = (letters || '').toUpperCase().replace(/[^A-Z?.]/g, "");
        if (allowPartial) {
          filteredWords = filteredWords.filter((word) => canMakeWord(word, inputLetters));
        } else {
          const nonBlankLetters = inputLetters.replace(/[?.]/g, '');
          if (inputLetters.length !== nonBlankLetters.length) {
            filteredWords = filteredWords.filter(word => word.length === inputLetters.length && canMakeWord(word, inputLetters));
          } else {
            const inputSorted = nonBlankLetters.split("").sort().join("");
            filteredWords = filteredWords.filter((word) => {
              if (word.length !== inputSorted.length) return false;
              const wordSorted = word.split("").sort().join("");
              return wordSorted === inputSorted;
            });
          }
        }
      }

      // Apply length filters
      if (selectedLengths && selectedLengths.length > 0) {
        filteredWords = filteredWords.filter(word => selectedLengths.includes(word.length));
      }

      // Apply string filters
      if (startsWith) filteredWords = filteredWords.filter(w => w.startsWith(startsWith.toUpperCase()));
      if (endsWith) filteredWords = filteredWords.filter(w => w.endsWith(endsWith.toUpperCase()));
      if (contains) filteredWords = filteredWords.filter(w => w.includes(contains.toUpperCase()));
      if (containsAll) {
        const allChars = containsAll.toUpperCase().split('');
        filteredWords = filteredWords.filter(w => allChars.every(char => w.includes(char)));
      }

      // Apply special filters
      if (qWithoutU) filteredWords = filteredWords.filter(w => w.includes('Q') && !w.includes('U'));
      if (noVowels) filteredWords = filteredWords.filter(w => !/[AEIOU]/.test(w));
      if (isVowelHeavy) {
        filteredWords = filteredWords.filter(w => {
          if (w.length === 0) return false;
          const vowelCount = (w.match(/[AEIOU]/g) || []).length;
          return vowelCount / w.length > 0.6;
        });
      }

      // Apply frequency filters
      if (frequencyFilter && frequencyFilter !== 'all') {
        filteredWords = filteredWords.filter(word => {
          const freq = frequencyMap.get(word);
          return freq && freq.difficulty === frequencyFilter;
        });
      }

      if (minProbability !== undefined && maxProbability !== undefined) {
        filteredWords = filteredWords.filter(word => {
          const freq = frequencyMap.get(word);
          if (!freq) return true;
          return freq.frequency >= minProbability && freq.frequency <= maxProbability;
        });
      }

      // Apply basic filters
      filteredWords = filteredWords.filter((word) => (word.length >= 2 && word.length <= 15));

      // Sort results
      if (sortByFrequency) {
        filteredWords.sort((a, b) => {
          const freqA = frequencyMap.get(a)?.frequency || 50;
          const freqB = frequencyMap.get(b)?.frequency || 50;
          return freqB - freqA;
        });
      } else {
        filteredWords.sort((a, b) => sortOrder === "asc" ? 
          (a.length === b.length ? a.localeCompare(b) : a.length - b.length) : 
          (a.length === b.length ? a.localeCompare(b) : b.length - a.length)
        );
      }

      // Add frequency data and limit results for performance
      const limitedResults = filteredWords.slice(0, 1000).map(word => ({
        word,
        frequency: frequencyMap.get(word) || { frequency: 50, difficulty: 'uncommon' }
      }));

      setResults(limitedResults);
      setLoading(false);
      
      const searchTime = Date.now() - startTime;
      console.log(`Instant search completed: ${limitedResults.length} results in ${searchTime}ms`);
      
      // Show performance feedback for slow searches
      if (searchTime > 500) {
        toast({
          title: "Search Complete",
          description: `Found ${limitedResults.length} words in ${searchTime}ms`,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Instant search failed:', error);
      setLoading(false);
    }
  };


  // Utility function for word matching (copied from worker)
  const canMakeWord = (word: string, availableLetters: string): boolean => {
    if (!word || !availableLetters) return false;
    
    const letterCount = new Map<string, number>();
    let blanks = 0;
    for (const letter of (availableLetters || '').toUpperCase()) {
      if (letter === '?' || letter === '.') blanks++;
      else letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
    }
    for (const letter of (word || '').toUpperCase()) {
      const count = letterCount.get(letter) || 0;
      if (count > 0) letterCount.set(letter, count - 1);
      else if (blanks > 0) blanks--;
      else return false;
    }
    return true;
  };

  // Remove auto-search - only search when button is clicked
  // const debouncedSearch = useDebounce(performSearch, 300);

  // Remove auto-search effect
  // useEffect(() => {
  //   if (letters.trim().length > 0) {
  //     debouncedSearch();
  //   }
  // }, [letters, debouncedSearch]);

  const handleSolve = () => {
    if (letters.trim().length > 0) {
      performSearch(); // Only search when button is clicked
    }
  };


  const fetchDefinition = async (word: string) => {
    try {
      const response = await fetch(`https://api.wordnik.com/v4/word.json/${word}/definitions?limit=1&includeRelated=false&sourceDictionaries=all&useCanonical=false&includeTags=false&api_key=${WORDNIK_API_KEY}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        setDefinition({
          text: data[0].text,
          partOfSpeech: data[0].partOfSpeech || 'unknown'
        });
      } else {
        setDefinitionError('No definition found for this word.');
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      setDefinitionError('Failed to fetch definition. Please try again.');
    } finally {
      setDefinitionLoading(false);
    }
  };
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

    console.log("Attempting Supabase insert with deck name:", deckName.trim());
    console.log("Deck Public:", makeDeckPublic);
    console.log("Deck Description:", publicDescription);

    // Save to flashcard_decks table (which is what QuizMode uses)
    const { error } = await (supabase as any).from("flashcard_decks").insert([
      {
        user_id: user.id,
        name: deckName.trim(),
        words: results.map(wordObj => typeof wordObj === 'string' ? wordObj : wordObj.word || '').filter(word => word.trim().length > 0), // Extract word strings from objects
        is_public: makeDeckPublic,
        description: makeDeckPublic ? publicDescription.trim() : null
      }
    ]);

    if (error) {
      console.error("Supabase Insert Error:", error); // Log the full error object for debugging
      if (error.code === '23505') { // PostgreSQL unique violation error code
        setSaveDeckMessage("Error: A deck with this name already exists or is a duplicate.");
      } else {
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

  const exportAsTxt = async () => {
    // Get ALL results, not just the limited ones
    const allResults = await getAllSearchResults();
    
    const header = `Anagram Solver Results\nGenerated on: ${new Date().toLocaleDateString()}\nSearch criteria: ${letters || 'Any letters'}\nTotal words found: ${allResults.length}\n\n`;
    
    const content = header + allResults.map(wordObj => {
      const word = typeof wordObj === 'string' ? wordObj : wordObj.word || '';
      return word;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anagram-results-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPdf = async () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Anagram Solver Results', 20, 20);
    doc.setFontSize(12);
    
    // Get ALL results, not just the limited ones
    const allResults = await getAllSearchResults();
    
    let y = 40;
    const wordsPerPage = 45; // Reduced to ensure proper spacing
    const pageHeight = 280; // A4 page height minus margins
    const lineHeight = 6; // Increased line height for better readability
    
    const words = allResults.map(wordObj => {
      const word = typeof wordObj === 'string' ? wordObj : wordObj.word || '';
      return word;
    });
    
    // Add summary information
    doc.text(`Total words found: ${words.length}`, 20, y);
    y += lineHeight;
    doc.text(`Search criteria: ${letters || 'Any letters'}`, 20, y);
    y += lineHeight;
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, y);
    y += lineHeight * 2; // Extra space before words
    
    let wordIndex = 0;
    let currentPage = 1;
    
    while (wordIndex < words.length) {
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
      while (wordIndex < words.length && y + lineHeight <= pageHeight) {
        doc.text(words[wordIndex], 20, y);
        y += lineHeight;
        wordIndex++;
      }
    }
    
    doc.save(`anagram-results-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Function to get ALL search results without limits for PDF export
  const getAllSearchResults = async () => {
    if (!isDictionaryReady || dictionaryError) {
      return results; // Return current results if dictionary not ready
    }

    try {
      const availableLetters = (letters || "").toUpperCase().replace(/[^A-Z?.]/g, "");
      
      // Apply all filters to get complete results
      let filteredWords = dictionaryWords.filter(word => {
        // Length filter
        if (selectedLengths.length > 0 && !selectedLengths.includes(word.length)) {
          return false;
        }
        
        // Letter matching
        if (availableLetters && !canMakeWord(word, availableLetters)) {
          return false;
        }
        
        // Pattern filters
        if (startsWith && !word.toLowerCase().startsWith(startsWith.toLowerCase())) {
          return false;
        }
        if (endsWith && !word.toLowerCase().endsWith(endsWith.toLowerCase())) {
          return false;
        }
        if (contains && !word.toLowerCase().includes(contains.toLowerCase())) {
          return false;
        }
        if (containsAll) {
          const requiredLetters = containsAll.toLowerCase().split('');
          if (!requiredLetters.every(letter => word.toLowerCase().includes(letter))) {
            return false;
          }
        }
        
        // Special filters
        if (qWithoutU && word.toLowerCase().includes('q') && !word.toLowerCase().includes('qu')) {
          return false;
        }
        if (isVowelHeavy) {
          const vowelCount = (word.match(/[aeiou]/gi) || []).length;
          const consonantCount = word.length - vowelCount;
          if (vowelCount <= consonantCount) return false;
        }
        if (noVowels && /[aeiou]/i.test(word)) {
          return false;
        }
        
        // Frequency filter
        if (frequencyFilter !== 'all') {
          const freqData = frequencyMap.get(word);
          if (freqData) {
            const freq = freqData.frequency;
            const diff = freqData.difficulty;
            
            switch (frequencyFilter) {
              case 'common': if (freq < 70 || diff !== 'common') return false; break;
              case 'uncommon': if (freq < 30 || freq >= 70 || diff !== 'uncommon') return false; break;
              case 'rare': if (freq >= 30 || diff !== 'rare') return false; break;
              case 'expert': if (freq >= 10 || diff !== 'expert') return false; break;
            }
          }
        }
        
        // Probability range filter
        if (minProbability > 0 || maxProbability < 100) {
          const freqData = frequencyMap.get(word);
          if (freqData) {
            const freq = freqData.frequency;
            if (freq < minProbability || freq > maxProbability) return false;
          }
        }
        
        return true;
      });

      // Sort results
      if (sortOrder === "frequency") {
        filteredWords.sort((a, b) => {
          const freqA = frequencyMap.get(a)?.frequency || 50;
          const freqB = frequencyMap.get(b)?.frequency || 50;
          return freqB - freqA;
        });
      } else {
        filteredWords.sort((a, b) => sortOrder === "asc" ? 
          (a.length === b.length ? a.localeCompare(b) : a.length - b.length) : 
          (a.length === b.length ? a.localeCompare(b) : b.length - a.length)
        );
      }

      // Return ALL results with frequency data (no limit)
      return filteredWords.map(word => ({
        word,
        frequency: frequencyMap.get(word) || { frequency: 50, difficulty: 'uncommon' }
      }));
    } catch (error) {
      console.error('Error getting all search results:', error);
      return results; // Fallback to current results
    }
  };

  // --- REMOVED: saveToCardbox function (as requested) ---
  // const saveToCardbox = async () => { ... };
  // --- END REMOVED ---


  // --- FIX: Determine if the solve button should be disabled ---
  const isSolveButtonDisabled = loading || !isDictionaryReady || dictionaryError !== null || (
    // Button is disabled if:
    // 1. App is currently searching
    // 2. Dictionary is not ready
    // 3. Dictionary had an error loading
    // 4. AND NO search criteria are provided at all (all input fields are empty)
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
        <div className="mobile-container mx-auto py-6 sm:py-8 space-y-6 sm:space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary leading-tight">Anagram Solver</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base lg:text-lg px-2">Find words with the ultimate toolkit.</p>
          </div>
          
          {/* Main Input Form */}
          <Card className="max-w-4xl mx-auto mobile-card">
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
                    disabled={loading || !isDictionaryReady || dictionaryError !== null}
                    className="text-base font-mono tracking-widest uppercase"
                  />
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      placeholder="ENTER LETTERS (E.G., RETAINS?)"
                      value={letters}
                      onChange={(e) => setLetters((e.target.value || '').toUpperCase())}
                      className="mobile-input flex-1 text-base sm:text-lg p-4 sm:p-6 font-mono tracking-widest uppercase"
                      onKeyPress={(e) => e.key === 'Enter' && handleSolve()}
                      disabled={loading || !isDictionaryReady || dictionaryError !== null}
                    />
                    <Button
                      id="solve-button"
                      onClick={handleSolve}
                      disabled={isSolveButtonDisabled}
                      className="mobile-button px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300 h-12 sm:h-auto"
                    >
                      {!isDictionaryReady ? <><LoaderCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" /> Loading...</> :
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
                    {!isDictionaryReady ? <><LoaderCircle className="h-5 w-5 mr-2 animate-spin" /> Loading...</> :
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
              
              {/* Filters Section */}
              <Collapsible>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Search Type</Label>
                    <Button 
                      variant={allowPartial ? "default" : "outline"} 
                      onClick={() => setAllowPartial(!allowPartial)} 
                      className="w-full" 
                      disabled={loading || !isDictionaryReady || dictionaryError !== null}
                    >
                      {allowPartial ? "Partial Match" : "Exact Match"}
                    </Button>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Advanced</Label>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
                      >
                        <Filter className="mr-2 h-4 w-4" /> More Filters
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                
                <CollapsibleContent className="mt-6 space-y-6 border-t pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Starts With</Label>
                      <Input 
                        placeholder="E.G., PRE" 
                        value={startsWith} 
                        onChange={e => setStartsWith((e.target.value || '').toUpperCase())} 
                        className="uppercase" 
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ends With</Label>
                      <Input 
                        placeholder="E.G., ING" 
                        value={endsWith} 
                        onChange={e => setEndsWith((e.target.value || '').toUpperCase())} 
                        className="uppercase" 
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contains Substring</Label>
                      <Input 
                        placeholder="E.G., ZY" 
                        value={contains} 
                        onChange={e => setContains((e.target.value || '').toUpperCase())} 
                        className="uppercase" 
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Contains All These Letters</Label>
                    <Input 
                      placeholder="E.G., XYZ" 
                      value={containsAll} 
                      onChange={e => setContainsAll((e.target.value || '').toUpperCase())} 
                      className="uppercase" 
                      disabled={loading || !isDictionaryReady || dictionaryError !== null}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="q-no-u" 
                        checked={qWithoutU} 
                        onCheckedChange={setQWithoutU} 
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
                      />
                      <Label htmlFor="q-no-u">Q without U</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="vowel-heavy" 
                        checked={isVowelHeavy} 
                        onCheckedChange={setIsVowelHeavy} 
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
                      />
                      <Label htmlFor="vowel-heavy">Vowel-Heavy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="no-vowels" 
                        checked={noVowels} 
                        onCheckedChange={setNoVowels} 
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
                      />
                      <Label htmlFor="no-vowels">No Vowels</Label>
                    </div>
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
                          disabled={loading || !isDictionaryReady || dictionaryError !== null}
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
                            disabled={loading || !isDictionaryReady || dictionaryError !== null}
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
                          disabled={loading || !isDictionaryReady || dictionaryError !== null}
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
                          disabled={loading || !isDictionaryReady || dictionaryError !== null}
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
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
                      >
                        Reset Filters
                      </Button>
                      <Button
                        variant={frequencyFilter === 'common' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('common')}
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
                      >
                        Common Only
                      </Button>
                      <Button
                        variant={frequencyFilter === 'rare' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('rare')}
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
                      >
                        Rare Only
                      </Button>
                      <Button
                        variant={frequencyFilter === 'expert' ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFrequencyFilter('expert')}
                        disabled={loading || !isDictionaryReady || dictionaryError !== null}
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
                    disabled={loading || !isDictionaryReady || dictionaryError !== null}
                  >
                    All Lengths
                  </Button>
                  {commonLengths.map(len => (
                    <Button
                      key={len}
                      variant={selectedLengths.includes(len) ? "default" : "outline"}
                      onClick={() => toggleLength(len)}
                      size="sm"
                      disabled={loading || !isDictionaryReady || dictionaryError !== null}
                    >
                      {len} Letters
                    </Button>
                  ))}
                </div>
              </div>
              
              {results.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-6 border-t">
                  <Button onClick={exportAsTxt} variant="outline">
                    <FileText className="mr-2 h-4 w-4" /> Export TXT
                  </Button>
                  <Button onClick={exportAsPdf} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export PDF
                  </Button>
                  <Button onClick={() => setShowSavePrompt(true)} variant="outline">
                    📁 Save as Quiz Deck
                  </Button>
                  {showSavePrompt && (
                    <div className="flex flex-col gap-2 w-full pt-2">
                      <Input 
                        placeholder="Enter deck name" 
                        value={deckName} 
                        onChange={(e) => setDeckName(e.target.value)} 
                        className="flex-grow" 
                      />
                      <div className="flex items-center space-x-2 mt-2">
                        <Switch 
                          id="make-public" 
                          checked={makeDeckPublic} 
                          onCheckedChange={setMakeDeckPublic} 
                        />
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
                      <Button onClick={saveAsQuizDeck} disabled={!deckName.trim()} variant="default">
                        Save Deck
                      </Button>
                      {saveDeckMessage && (
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
          
          {/* Loading State */}
          {!isDictionaryReady ? (
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
                                className="mobile-word-tile border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 text-center font-mono font-semibold hover:scale-105 transition-transform duration-200 hover:shadow-md hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
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
                                className="mobile-word-tile border border-primary/20 p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 text-center font-mono font-semibold hover:scale-105 transition-transform duration-200 hover:shadow-md hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary min-h-[60px] sm:min-h-[80px]"
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