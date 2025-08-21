import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Timer, Brain, Target, Award, Layers, X as XIcon, Settings, BrainCircuit, Loader2, Share2, Trophy, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const tickSound = new Audio("/sounds/tick.mp3");
const endSound = new Audio("/sounds/end.mp3");
tickSound.volume = 0.05;
endSound.volume = 0.2;

function getAlphagram(word: string) {
  return word.toUpperCase().split("").sort().join("");
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getWordsFromDeck(deckWords: string | string[] | null | undefined): string[] {
    if (typeof deckWords === 'string') {
        return deckWords ? deckWords.split(',') : [];
    }
    if (Array.isArray(deckWords)) {
        return deckWords;
    }
    return [];
}

type AlphagramEntry = { alpha: string; words: string[]; original: string[] };

type Deck = {
    id: string; // Changed to string to match Supabase UUID
    name: string;
    words: string | string[];
    is_public?: boolean; // Added for checking if public deck
    user_id?: string; // Added to check deck ownership
};

export default function QuizMode() {
    const { user } = useAuth();
    const [selectedLength, setSelectedLength] = useState<number | null>(null);
    const [alphagrams, setAlphagrams] = useState<AlphagramEntry[]>([]);
    const [initialAlphagrams, setInitialAlphagrams] = useState<AlphagramEntry[]>([]);
    const [userInput, setUserInput] = useState("");
    const [typedWords, setTypedWords] = useState<string[]>([]);
    const [feedback, setFeedback] = useState("");
    const [feedbackColor, setFeedbackColor] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [timerMinutes, setTimerMinutes] = useState<number>(5);
    const [timer, setTimer] = useState<number>(300);
    const [progress, setProgress] = useState(100);
    const [wordSet, setWordSet] = useState<Set<string>>(new Set());
    const [loadingDictionary, setLoadingDictionary] = useState(true);
    const [dictionaryError, setDictionaryError] = useState<string | null>(null);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [configuringDeck, setConfiguringDeck] = useState<Deck | null>(null);
    const [quizWordCount, setQuizWordCount] = useState<number>(20);
    const [randomQuizWordCount, setRandomQuizWordCount] = useState<number>(20);
    const [randomQuizTimeLimit, setRandomQuizTimeLimit] = useState<number>(5); // Custom time limit for random quiz

    const [isFromPublicDeck, setIsFromPublicDeck] = useState<boolean>(false);
    const [sourceDeckId, setSourceDeckId] = useState<string | null>(null);
    const [sourceDeckAllWords, setSourceDeckAllWords] = useState<string[] | null>(null);
    const [sourceDeckAlphagrams, setSourceDeckAlphagrams] = useState<AlphagramEntry[] | null>(null);
    const [currentQuizWordLimit, setCurrentQuizWordLimit] = useState<number | null>(null);

    const workerRef = useRef<Worker | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Combined useEffect for dictionary loading and initial deck fetching
    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/dictionaryWorker.ts', import.meta.url));

        workerRef.current.onmessage = (event) => {
            console.log('QuizMode: Worker message received:', event.data.type);
            if (event.data.type === 'dictionaryLoaded') {
                console.log('QuizMode: Dictionary loaded, word count:', event.data.wordSet?.length || 0);
                setWordSet(new Set(event.data.wordSet));
                setLoadingDictionary(false);
            } else if (event.data.type === 'error') {
                console.error('QuizMode: Dictionary loading error:', event.data.message);
                setDictionaryError(event.data.message);
                setLoadingDictionary(false);
            }
        };

        workerRef.current.postMessage({ type: 'loadDictionary' });
        setLoadingDictionary(true);
        
        // Add a timeout in case the worker doesn't respond
        const timeout = setTimeout(() => {
            if (loadingDictionary) {
                console.error('QuizMode: Dictionary loading timeout');
                setDictionaryError('Dictionary loading timed out. Please refresh the page.');
                setLoadingDictionary(false);
            }
        }, 30000); // 30 second timeout

        const fetchDecks = async () => {
            if (!user) return;
            const { data, error } = await supabase.from("flashcard_decks").select("id, name, words, is_public, user_id").eq("user_id", user.id);
            if (error) { console.error("Error fetching decks:", error); }
            else { setDecks(data as Deck[] || []); }
        };
        fetchDecks();

        return () => {
            clearTimeout(timeout);
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, [user]);

    // Effect to handle starting quiz from deckId in URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const deckId = params.get('deckId');

        if (deckId && alphagrams.length === 0 && !showResults && !loadingDictionary && !dictionaryError) {
            const processAndStartDeck = async (deckToProcess: Deck) => {
                const allWords = getWordsFromDeck(deckToProcess.words);
                if (allWords.length === 0) {
                    console.warn(`Deck "${deckToProcess.name}" (ID: ${deckId}) has no words to play.`);
                    setDictionaryError(`Selected deck "${deckToProcess.name}" is empty.`);
                    navigate(location.pathname, { replace: true });
                    return;
                }

                const wordMap = new Map<string, string[]>();
                allWords.forEach((rawWord) => {
                    const word = rawWord.trim().toUpperCase();
                    if (!word) return;
                    const alpha = getAlphagram(word);
                    if (!wordMap.has(alpha)) { wordMap.set(alpha, []); }
                    wordMap.get(alpha)!.push(word);
                });
                const alphagramEntries = Array.from(wordMap.entries()).map(([alpha, words]) => ({ alpha, words: [...words], original: [...words] }));
                
                const numAlphagrams = alphagramEntries.length;
                const dynamicLimit = numAlphagrams >= 100 ? 50 : 20;
                setCurrentQuizWordLimit(dynamicLimit);

                let wordsForQuiz: string[] = [];
                const shuffledAlphagrams = shuffleArray(alphagramEntries);
                let currentWordCount = 0;

                for (const alphaEntry of shuffledAlphagrams) {
                    if (currentWordCount + alphaEntry.original.length <= dynamicLimit) {
                        wordsForQuiz.push(...alphaEntry.original);
                        currentWordCount += alphaEntry.original.length;
                    }
                    if (wordsForQuiz.length >= dynamicLimit) break;
                }

                if (wordsForQuiz.length === 0 && alphagramEntries.length > 0) {
                    wordsForQuiz.push(...alphagramEntries[0].original);
                }

                startQuiz(wordsForQuiz, true); // Keep source info for public/URL decks
                setIsFromPublicDeck(true);
                setSourceDeckId(deckToProcess.id);
                setSourceDeckAllWords(allWords);
                setSourceDeckAlphagrams(alphagramEntries);

                navigate(location.pathname, { replace: true });
            };

            const findAndStartDeck = async () => {
                 let deckToPlay = decks.find(d => d.id === deckId); // Try user's own decks first
                 if (deckToPlay) {
                     processAndStartDeck(deckToPlay);
                     return;
                 }

                 // If not found in user's decks, fetch from database (could be a public deck)
                 const { data, error: fetchError } = await supabase
                     .from('flashcard_decks')
                     .select('id, name, words, is_public, user_id')
                     .eq('id', deckId)
                     .single();

                 if (fetchError || !data) {
                     console.error("Error fetching deck by ID:", fetchError);
                     setDictionaryError(`Could not load deck with ID: ${deckId}.`);
                     navigate(location.pathname, { replace: true });
                     return;
                 }

                 deckToPlay = data as Deck;

                 // Ensure it's public or belongs to the current user
                 if (deckToPlay.is_public || (user && deckToPlay.user_id === user.id)) {
                     processAndStartDeck(deckToPlay);
                 } else {
                     setDictionaryError(`Deck with ID: ${deckId} is private.`);
                     navigate(location.pathname, { replace: true });
                 }
            };

            if (decks.length > 0 || !user) { // If decks are loaded or user is not logged in, attempt to find/fetch
                findAndStartDeck();
            }

        } else if (deckId && (loadingDictionary || dictionaryError)) {
             // Do nothing, loading/error state is already shown.
        } else if (deckId && alphagrams.length > 0) {
            navigate(location.pathname, { replace: true });
        }
    }, [location.search, decks, alphagrams.length, showResults, loadingDictionary, dictionaryError, timerMinutes, navigate, location.pathname, user]);


    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (alphagrams.length > 0 && !showResults && timer > 0) {
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
    }, [alphagrams.length, showResults, timer, timerMinutes]);

    const allPossibleAnswers = initialAlphagrams.flatMap(a => a.original);
    const score = typedWords.filter(w => allPossibleAnswers.includes(w)).length;
    const totalCorrectCount = allPossibleAnswers.length;
    const accuracy = totalCorrectCount > 0 ? Math.round((score / totalCorrectCount) * 100) : 0;

    const saveQuizResults = async () => {
      if (!user || totalCorrectCount === 0) return;
      try {
        const { error } = await supabase.from("quiz_results").insert({ user_id: user.id, correct: score, total: totalCorrectCount, accuracy: accuracy, profile_id: user.id });
        if (error) throw error;
      } catch (error) {
        console.error("Error saving quiz results:", error);
      }
    };

    useEffect(() => { if (showResults && totalCorrectCount > 0) { saveQuizResults(); } }, [showResults]);

    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60).toString().padStart(2, "0");
      const s = (secs % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    };

    // --- FIX: startQuiz function now accepts a keepSourceInfo parameter ---
    const startQuiz = (wordsForQuiz: string[], keepSourceInfo: boolean = false, customTimerMinutes?: number) => {
      if (wordsForQuiz.length === 0) return;
      const wordMap = new Map<string, string[]>();
      wordsForQuiz.forEach((rawWord) => {
        const word = rawWord.trim().toUpperCase();
        if (!word) return;
        const alpha = getAlphagram(word);
        if (!wordMap.has(alpha)) { wordMap.set(alpha, []); }
        wordMap.get(alpha)!.push(word);
      });
      const entries = Array.from(wordMap.entries()).map(([alpha, words]) => ({ alpha, words: [...words], original: [...words] }));
      setAlphagrams(entries);
      setInitialAlphagrams(entries);
      setUserInput("");
      setTypedWords([]);
      setFeedback("");
      setShowResults(false);
      
      // Use custom timer if provided, otherwise use the current timerMinutes
      const finalTimerMinutes = customTimerMinutes ?? timerMinutes;
      setTimer(finalTimerMinutes * 60);
      setProgress(100);
      setConfiguringDeck(null);

      // --- Conditional reset of source info ---
      if (!keepSourceInfo) {
        setIsFromPublicDeck(false);
        setSourceDeckId(null);
        setSourceDeckAllWords(null);
        setSourceDeckAlphagrams(null);
        setCurrentQuizWordLimit(null);
      }
    };
    // --- END FIX ---

    const handleStartConfiguredQuiz = () => {
      if (!configuringDeck) return;
      const allWordsFromDeck = getWordsFromDeck(configuringDeck.words);
      const completeWordMap = new Map<string, string[]>();
      allWordsFromDeck.forEach(word => {
          const alpha = getAlphagram(word);
          if (!completeWordMap.has(alpha)) {
              completeWordMap.set(alpha, []);
          }
          completeWordMap.get(alpha)!.push(word);
      });
      const shuffledAlphagrams = shuffleArray(Array.from(completeWordMap.keys()));
      let wordsForQuiz: string[] = [];
      for (const alpha of shuffledAlphagrams) {
          const wordsInGroup = completeWordMap.get(alpha)!;
          if (wordsForQuiz.length + wordsInGroup.length <= quizWordCount) {
              wordsForQuiz.push(...wordsInGroup);
          }
          if(wordsForQuiz.length >= quizWordCount) break;
      }
      if (wordsForQuiz.length === 0 && shuffledAlphagrams.length > 0) {
          wordsForQuiz.push(...completeWordMap.get(shuffledAlphagrams[0])!);
      }
      startQuiz(wordsForQuiz, false); // No need to keep source info for configured quiz
    };

    const handleStartRandomQuiz = () => {
        console.log('handleStartRandomQuiz called');
        console.log('wordSet.size:', wordSet.size);
        console.log('selectedLength:', selectedLength);
        console.log('loadingDictionary:', loadingDictionary);
        
        if (wordSet.size === 0 || !selectedLength || loadingDictionary) {
            console.log('handleStartRandomQuiz: Early return due to conditions not met');
            if (wordSet.size === 0) {
                alert('Dictionary not loaded. Please refresh the page and try again.');
            } else if (!selectedLength) {
                alert('Please select a word length first.');
            } else if (loadingDictionary) {
                alert('Dictionary is still loading. Please wait a moment.');
            }
            return;
        }
        const wordsOfLength = Array.from(wordSet).filter(word => word.length === selectedLength);
        console.log('wordsOfLength count:', wordsOfLength.length);
        console.log('Sample words of length', selectedLength, ':', wordsOfLength.slice(0, 5));
        
        const wordMap = new Map<string, string[]>();
        wordsOfLength.forEach((word) => {
            const alpha = getAlphagram(word);
            if(!wordMap.has(alpha)) wordMap.set(alpha, []);
            wordMap.get(alpha)!.push(word);
        });
        const allAlphagramGroups = Array.from(wordMap.entries());
        let selectedGroups: [string, string[]][] = [];
        let currentWordCount = 0;
        const shuffledGroups = shuffleArray(allAlphagramGroups);

        for (const alphaEntry of shuffledGroups) {
            if (currentWordCount + alphaEntry[1].length <= randomQuizWordCount) {
                selectedGroups.push(alphaEntry);
                currentWordCount += alphaEntry[1].length;
            }
            if (currentWordCount >= randomQuizWordCount) break;
        }

        if (selectedGroups.length === 0 && shuffledGroups.length > 0) {
            selectedGroups.push(shuffledGroups[0]);
        }

        const entries = selectedGroups.map(([alpha, words]) => ({ alpha, words: [...words], original: [...words]}));
        
        // Set the custom time limit and start the quiz
        setTimerMinutes(randomQuizTimeLimit);
        startQuiz(entries.flatMap(e => e.words), false, randomQuizTimeLimit); // Pass custom timer to startQuiz
    };

    const handleRetryQuiz = () => {
        setAlphagrams(initialAlphagrams.map(ag => ({ ...ag, words: [...ag.original] })));
        setUserInput("");
        setTypedWords([]);
        setFeedback("");
        setShowResults(false);
        setTimer(timerMinutes * 60);
        setProgress(100);
        // sourceDeckId/isFromPublicDeck states are implicitly preserved here because startQuiz is not called.
    };

    // NEW: Handle playing another quiz from the same public deck
    const handlePlayAnotherFromDeck = () => {
        console.log("handlePlayAnotherFromDeck called.");
        console.log("Source Data:", { sourceDeckId, sourceDeckAllWords, sourceDeckAlphagrams, currentQuizWordLimit });

        if (!sourceDeckId || !sourceDeckAllWords || !sourceDeckAlphagrams || currentQuizWordLimit === null) {
            console.error("Play Another: Missing required source data. Cannot start new quiz from same deck.");
            setDictionaryError("Missing original deck data. Please try 'New Challenge'."); // Provide user feedback
            return;
        }

        let wordsForQuiz: string[] = [];
        const shuffledAlphagrams = shuffleArray(sourceDeckAlphagrams); // Shuffle original alphagrams again
        let currentWordCount = 0;

        for (const alphaEntry of shuffledAlphagrams) {
            if (currentWordCount + alphaEntry.original.length <= currentQuizWordLimit) {
                wordsForQuiz.push(...alphaEntry.original);
                currentWordCount += alphaEntry.original.length;
            }
            if (wordsForQuiz.length >= currentQuizWordLimit) break;
        }

        if (wordsForQuiz.length === 0 && sourceDeckAlphagrams.length > 0) {
            wordsForQuiz.push(...sourceDeckAlphagrams[0].original);
        }
        
        startQuiz(wordsForQuiz, true); // Start a new quiz, and IMPORTANT: keep source info
        // The sourceDeckId, etc. are implicitly maintained because startQuiz was called with keepSourceInfo = true.
        console.log("Play Another: New quiz started from same deck.");
    };


    const handleInput = () => {
      const inputWord = userInput.toUpperCase().trim();
      if (!inputWord) return;

      if (typedWords.includes(inputWord)) {
        setFeedback("Already typed!");
        setFeedbackColor("bg-yellow-500/20 text-yellow-600");
        setUserInput("");
        return;
      }

      const targetAlphagram = alphagrams.find(ag => ag.words.includes(inputWord));
      if (targetAlphagram) {
        setTypedWords(prev => [...prev, inputWord]);
        setFeedback("Correct!");
        setFeedbackColor("bg-green-500/20 text-green-600");
        const updatedAlphas = alphagrams.map(ag => {
          if (ag.alpha === targetAlphagram.alpha) {
            return { ...ag, words: ag.words.filter(w => w !== inputWord) };
          }
          return ag;
        }).filter(ag => ag.words.length > 0);
        setAlphagrams(updatedAlphas);
        if (updatedAlphas.length === 0) {
          endSound.play().catch(e => console.error("Sound play failed:", e));
          setShowResults(true);
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        }
      } else {
        setFeedback("Incorrect!");
        setFeedbackColor("bg-red-500/20 text-red-600");
      }
      setUserInput("");
    };

    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
          <div className="text-center space-y-3 sm:space-y-4">
            <Brain className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mx-auto" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 leading-tight">Study Modes</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg px-2">Choose a deck to practice with timed anagram quizzes or spaced repetition flashcards.</p>
          </div>

          {!alphagrams.length && !showResults ? (
            <div className="space-y-8">
              {/* Dictionary Loading Indicator */}
              {loadingDictionary ? (
                 <Card className="max-w-4xl mx-auto border shadow-elegant">
                   <CardContent className="p-8 text-center space-y-4">
                     <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                     <h3 className="text-xl font-semibold">Loading Dictionary...</h3>
                     <p className="text-muted-foreground">This may take a moment.</p>
                   </CardContent>
                 </Card>
              ) : dictionaryError ? ( // Show error card if dictionary loading failed
                <Card className="max-w-4xl mx-auto border shadow-elegant">
                  <CardContent className="p-8 text-center space-y-4">
                    <XIcon className="w-12 h-12 text-destructive mx-auto" />
                    <h3 className="text-xl font-semibold text-destructive">Error Loading Dictionary</h3>
                    <p className="text-muted-foreground">{dictionaryError}. Please try refreshing the page.</p>
                  </CardContent>
                </Card>
              ) : ( // Show quiz selection options once dictionary is loaded successfully
                <>
                  

                  <Card className="max-w-4xl mx-auto border shadow-elegant">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="h-6 w-6 text-primary" /> My Decks</CardTitle></CardHeader>
                    <CardContent className="p-6">
                      {decks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                          {decks.map(deck => {
                            const deckWords = getWordsFromDeck(deck.words);
                            return (
                              <Card key={deck.id} className="flex flex-col justify-between">
                                  <CardHeader className="text-center p-4">
                                      <CardTitle>{deck.name}</CardTitle>
                                      <p className="text-xs text-muted-foreground">{deckWords.length} words</p>
                                  </CardHeader>
                                  <CardContent className="flex-grow p-4 pt-0">
                                      <Button variant="outline" className="w-full h-full" onClick={() => { setConfiguringDeck(deck); setQuizWordCount(Math.min(20, deckWords.length)); }}>
                                          <Award className="mr-2 h-4 w-4" /> Anagram Quiz
                                      </Button>
                                  </CardContent>
                                  <CardFooter className="p-4 pt-0 flex flex-col sm:grid sm:grid-cols-5 gap-2">
                                      <Link to={`/flashcards/${deck.id}`} className="w-full sm:col-span-4">
                                          <Button size="sm" className="w-full">
                                              <BrainCircuit className="h-4 w-4 mr-2" /> Study
                                          </Button>
                                      </Link>
                                      <Link to={`/decks/${deck.id}/options`} className="w-full sm:col-span-1">
                                          <Button size="sm" variant="ghost" className="w-full">
                                              <Settings className="h-4 w-4" />
                                          </Button>
                                      </Link>
                                  </CardFooter>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">You haven't saved any quiz decks yet. Go to the Anagram Solver to create one!</p>
                      )}
                    </CardContent>
                  </Card>

                  {configuringDeck && (
                      <Card className="max-w-4xl mx-auto border-2 border-primary shadow-lg animate-fade-in">
                          <CardHeader>
                              <div className="flex justify-between items-center">
                                  <CardTitle className="text-lg sm:text-xl">Configure Quiz: {configuringDeck.name}</CardTitle>
                                  <Button variant="ghost" size="icon" onClick={() => setConfiguringDeck(null)}><XIcon className="h-5 w-5" /></Button>
                              </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-6">
                              {(() => {
                                  const deckWords = getWordsFromDeck(configuringDeck.words);
                                  return (
                                      <>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                              <div>
                                                  <label className="text-sm font-medium mb-2 block">Number of Words (Approximate)</label>
                                                  <Input type="number" value={quizWordCount} onChange={(e) => setQuizWordCount(Math.min(100, deckWords.length, Math.max(1, Number(e.target.value))))} min="1" max={Math.min(100, deckWords.length)} />
                                                  <p className="text-xs text-muted-foreground mt-2">
                                                      Final count may be higher as all anagrams of selected words are included.
                                                  </p>
                                              </div>
                                              <div>
                                                  <label className="text-sm font-medium mb-2 block">Timer (minutes)</label>
                                                  <Input type="number" value={timerMinutes} onChange={(e) => setTimerMinutes(Math.max(1, Number(e.target.value)))} min="1" max="30" />
                                              </div>
                                          </div>
                                          <Button onClick={handleStartConfiguredQuiz} className="w-full h-12 text-lg bg-gradient-primary">
                                              <Award className="mr-2 h-5 w-5" /> Start Challenge
                                          </Button>
                                      </>
                                  )
                              })()}
                          </CardContent>
                      </Card>
                  )}

                  <Card className="max-w-4xl mx-auto border shadow-elegant">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-6 w-6 text-primary" /> Random Anagram Challenge</CardTitle></CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <label className="text-sm font-medium mb-3 block">Word Length</label>
                        <div className="flex flex-wrap gap-3">
                          {[4, 5, 6, 7, 8, 9].map((len) => (
                            <Button key={len} variant={selectedLength === len ? "default" : "outline"} onClick={() => setSelectedLength(selectedLength === len ? null : len)} disabled={!wordSet.size}>
                              {len}-letter words
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Number of Words (Approximate)</label>
                        <Input type="number" value={randomQuizWordCount} onChange={(e) => setRandomQuizWordCount(Math.min(100, Math.max(1, Number(e.target.value))))} min="1" max="100" disabled={!wordSet.size} />
                        <p className="text-xs text-muted-foreground mt-2">
                          Final count may be higher as all anagrams of selected words are included.
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Time Limit (minutes)</label>
                        <div className="space-y-3">
                          <Input 
                            type="number" 
                            value={randomQuizTimeLimit} 
                            onChange={(e) => setRandomQuizTimeLimit(Math.min(60, Math.max(1, Number(e.target.value))))} 
                            min="1" 
                            max="60"
                            disabled={!wordSet.size}
                            className="text-center text-lg font-semibold"
                          />
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {[1, 3, 5, 10, 15, 30].map((preset) => (
                              <Button
                                key={preset}
                                variant={randomQuizTimeLimit === preset ? "default" : "outline"}
                                size="sm"
                                onClick={() => setRandomQuizTimeLimit(preset)}
                                disabled={!wordSet.size}
                                className="text-xs sm:text-sm font-medium"
                              >
                                {preset}m
                              </Button>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Set your custom time limit for this challenge (1-60 minutes).
                        </p>
                      </div>
                      <Button disabled={!selectedLength || !wordSet.size} onClick={handleStartRandomQuiz} className="w-full h-12 text-lg bg-gradient-primary">
                          <Timer className="mr-2 h-5 w-5" />
                          Start {randomQuizTimeLimit}-minute Challenge
                      </Button>
                      {!wordSet.size && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Dictionary loading... ({wordSet.size} words loaded)
                        </p>
                      )}
                      {dictionaryError && (
                        <div className="text-center space-y-2">
                          <p className="text-xs text-red-500">
                            Error: {dictionaryError}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setDictionaryError(null);
                              setLoadingDictionary(true);
                              if (workerRef.current) {
                                workerRef.current.postMessage({ type: 'loadDictionary' });
                              }
                            }}
                          >
                            Retry Loading Dictionary
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          ) : null}

          {alphagrams.length > 0 && !showResults && (
              <div className="space-y-6">
              <Card className="max-w-4xl mx-auto border shadow-elegant">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2"><Timer className="h-5 w-5 text-primary" /><span className="text-lg font-semibold">{formatTime(timer)}</span></div>
                    <Badge className="bg-gradient-primary text-primary-foreground text-base">Score: {score}</Badge>
                  </div>
                  <Progress value={progress} className="h-3 rounded-full" />
                </CardContent>
              </Card>
              <Card className="max-w-6xl mx-auto border shadow-elegant">
                <CardHeader><CardTitle className="text-center">Remaining Letter Patterns</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    {alphagrams.map(({ alpha, words }, idx) => (
                      <Badge key={idx} variant="outline" className="px-3 py-2 text-base sm:px-4 sm:py-3 sm:text-lg font-mono tracking-wider border-2">
                        {alpha} <span className="text-primary font-bold ml-2">({words.length})</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="max-w-4xl mx-auto border shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input placeholder="TYPE YOUR ANSWER AND PRESS ENTER..." value={userInput} onChange={(e) => setUserInput((e.target.value || '').toUpperCase())} onKeyDown={(e) => e.key === "Enter" && handleInput()} className="flex-1 text-base sm:text-lg p-4 sm:p-6 font-mono tracking-widest uppercase" autoFocus />
                    <Button onClick={handleInput} className="px-6 py-4 text-base sm:text-lg sm:px-8 sm:py-6 bg-gradient-primary h-12 sm:h-auto">Submit</Button>
                  </div>
                  {feedback && <div className={`mt-4 text-center text-lg font-semibold py-3 rounded-lg ${feedbackColor}`}>{feedback}</div>}
                  <div className="text-center mt-4">
                    <Button variant="destructive" size="sm" onClick={() => { endSound.play().catch(e => console.error("Sound play failed:", e)); setShowResults(true); }}>Give Up</Button>
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
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    <Badge className="text-lg px-4 py-2 bg-gradient-primary">🎯 {score} of {totalCorrectCount} words found</Badge>
                    <Badge variant="outline" className="text-lg px-4 py-2">{accuracy}% accuracy</Badge>
                  </div>
                </CardHeader>
              </Card>
              <Card className="max-w-6xl mx-auto border shadow-elegant">
                <CardHeader><CardTitle>Detailed Results</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {initialAlphagrams.map(({ alpha, original }, idx) => {
                      const correct = original.filter((w) => typedWords.includes(w));
                      const missed = original.filter((w) => !typedWords.includes(w));
                      if (original.length === 0) return null;
                      return (
                        <div key={idx} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="font-mono text-lg px-4 py-2">{alpha}</Badge>
                            <span className="text-sm text-muted-foreground">{correct.length} of {original.length} found</span>
                          </div>
                          {correct.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">✓ Found:</h4>
                              <div className="flex flex-wrap gap-2">{correct.map((w, i) => (<Badge key={i} className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">{w}</Badge>))}</div>
                            </div>
                          )}
                          {missed.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">✗ Missed:</h4>
                              <div className="flex flex-wrap gap-2">{missed.map((w, i) => (<Badge key={i} variant="destructive">{w}</Badge>))}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button onClick={handleRetryQuiz} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">Retry Quiz</Button>
                {isFromPublicDeck && sourceDeckAlphagrams && sourceDeckAlphagrams.length >= 100 && (
                    <Button onClick={handlePlayAnotherFromDeck} className="bg-gradient-primary px-8 py-4 text-lg">
                        <RefreshCw className="mr-2 h-5 w-5" /> Play Another From Deck
                    </Button>
                )}
                <Button onClick={() => { setAlphagrams([]); setInitialAlphagrams([]); setShowResults(false); setSelectedLength(null); setConfiguringDeck(null); }} className="bg-gradient-primary px-8 py-4 text-lg">New Challenge</Button>
              </div>
              </div>
          )}
        </div>
      </div>
    );
}