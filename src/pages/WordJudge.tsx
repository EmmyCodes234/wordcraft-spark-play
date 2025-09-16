import React, { useState, useEffect, useRef } from "react";
import { Scale, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-boundary";
import { usePageSession } from "@/context/SessionContext";
import { useIsMobile } from "@/hooks/use-mobile";

type Stage = "wordCount" | "judge" | "result";

const WordJudge = () => {
  const { session, setSession } = usePageSession('wordJudge');
  const isMobile = useIsMobile();
  
  const [stage, setStage] = useState<Stage>("wordCount");
  const [wordCount, setWordCount] = useState(0);
  const [words, setWords] = useState("");
  const [result, setResult] = useState<"acceptable" | "not-acceptable" | null>(null);
  const [loading, setLoading] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  const [dictStatus, setDictStatus] = useState<"loading" | "loaded" | "error">("loading");
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Save session data whenever relevant state changes
  useEffect(() => {
    const sessionData = {
      stage,
      wordCount,
      words,
      result,
    };
    setSession(sessionData);
  }, [stage, wordCount, words, result]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (stage === "judge") {
        // Desktop: use TAB to judge
        if (!isMobile && event.key === "Tab") {
          event.preventDefault();
          handleJudge();
        } else if (!isMobile && event.key !== "Tab" && result) {
          // Clear results when any key is pressed (except TAB)
          setResult(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, words, wordSet, result, isMobile]);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        setDictStatus("loading");
        const response = await fetch("/dictionaries/CSW24.txt");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const wordsArray = text.split("\n").map((w) => w.trim().toUpperCase());
        setWordSet(new Set(wordsArray));
        setDictStatus("loaded");
      } catch (error) {
        console.error("Failed to load CSW24 word list:", error);
        setDictStatus("error");
      }
    };
    fetchWords();
  }, []);

  const handleJudge = () => {
    if (!words.trim() || wordSet.size === 0) return;

    setLoading(true);
    const wordsArray = words.trim().split(/\s+/).map((w) => w.trim().toUpperCase());
    const allValid = wordsArray.every((word) => wordSet.has(word));
    setResult(allValid ? "acceptable" : "not-acceptable");
    setStage("result");
    setLoading(false);
  };

  const handleWordCountSubmit = (count?: number) => {
    const currentCount = count || wordCount;
    console.log('handleWordCountSubmit called, wordCount:', currentCount);
    if (currentCount > 0) {
      console.log('Setting stage to judge');
      setStage("judge");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      console.log('Word count is 0, not proceeding');
    }
  };

  const resetToWordCount = () => {
    setStage("wordCount");
    setWordCount(0);
    setWords("");
    setResult(null);
  };

  const resetToJudge = () => {
    setStage("judge");
    setWords("");
    setResult(null);
  };

  if (dictStatus === "loading") {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 py-16 space-y-12">
          <div className="text-center space-y-4">
            <Scale className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-5xl md:text-6xl font-bold text-primary">
              Word Judge
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Check if words are valid according to the CSW24 dictionary.
            </p>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground">Loading dictionary...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dictStatus === "error") {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 py-16 space-y-12">
          <div className="text-center space-y-4">
            <Scale className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-5xl md:text-6xl font-bold text-primary">
              Word Judge
            </h1>
          </div>
          
          <div className="max-w-xl mx-auto">
            <ErrorState
              title="Dictionary Loading Failed"
              message="Unable to load the CSW24 dictionary. Please check your internet connection and try refreshing the page."
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-4">
          <Scale className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-5xl md:text-6xl font-bold text-primary">
            Word Judge
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Check if words are valid according to the CSW24 dictionary.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <AnimatePresence mode="wait">
            {stage === "wordCount" && (
              <motion.div
                key="wordCount"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="bg-white min-h-[600px] flex flex-col justify-between p-8 rounded-lg cursor-text"
                  onClick={() => inputRef.current?.focus()}
                  tabIndex={0}
                >
                  {/* Top Section */}
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-black mb-2">
                      CHALLENGER:
                    </h2>
                    <p className="text-lg text-black">
                      How many words would you like to challenge?
                    </p>
                  </div>

                  {/* Middle Section - Large Number Display */}
                  <div className="text-center">
                    {wordCount > 0 && (
                      <div className="text-8xl font-bold text-black mb-8">
                        {wordCount}
                      </div>
                    )}
                    <div className="text-lg text-black">
                      Continue
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="flex justify-between items-end">
                    {/* Left - Brand Info */}
                    <div className="text-sm text-black">
                      <p className="font-semibold">WordSmith Word Judge</p>
                      <p>Version 1.0</p>
                    </div>

                    {/* Center - Scrabble Tile */}
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-green-600 border-2 border-white rounded flex items-center justify-center relative">
                        <span className="text-white text-2xl font-bold">W</span>
                        <span className="absolute bottom-1 right-1 text-white text-xs font-bold">4</span>
                      </div>
                    </div>

                    {/* Right - Lexicon Info */}
                    <div className="text-sm text-black text-right">
                      <p>Lexicon: CSW24</p>
                      <p>{new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  </div>

                  {/* Hidden input for keyboard events */}
                  <input
                    ref={inputRef}
                    type="text"
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('Input value:', value);
                      if (value.match(/^\d+$/)) {
                        const num = parseInt(value);
                        console.log('Parsed number:', num);
                        if (num >= 1 && num <= 10) {
                          console.log('Setting word count to:', num);
                          setWordCount(num);
                          setTimeout(() => {
                            console.log('Calling handleWordCountSubmit with:', num);
                            handleWordCountSubmit(num);
                          }, 300);
                        }
                      }
                    }}
                    className="absolute opacity-0 pointer-events-none"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {stage === "judge" && (
              <motion.div
                key="judge"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                {isMobile ? (
                  <div className="bg-gray-100 min-h-[70vh] flex flex-col justify-between p-4 rounded-lg">
                    {/* Top Section - Instructions (Mobile wording) */}
                    <div className="text-center space-y-1">
                      <p className="text-base text-black">
                        1. CHALLENGER: Enter {wordCount} word{wordCount !== 1 ? 's' : ''}.
                      </p>
                      <p className="text-base text-black">
                        2. Tap JUDGE to check the play.
                      </p>
                      <p className="text-base text-black">
                        3. Tap CLEAR to reset.
                      </p>
                    </div>

                    {/* Middle Section - Large Input Area */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-full">
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder=""
                          value={words}
                          onChange={(e) => setWords(e.target.value.toUpperCase())}
                          className="w-full h-40 bg-white border-0 text-[14vw] leading-none font-mono text-black px-4 focus:outline-none"
                          disabled={loading}
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Bottom Section - Mobile Controls */}
                    <div className="flex gap-3">
                      <Button onClick={handleJudge} disabled={!words.trim() || loading} className="flex-1 h-12 text-base">
                        Judge
                      </Button>
                      <Button variant="outline" onClick={() => { setWords(""); setResult(null); inputRef.current?.focus(); }} className="h-12 text-base">
                        Clear
                      </Button>
                      <Button variant="outline" onClick={resetToWordCount} className="h-12 text-base">
                        Back
                      </Button>
                    </div>
                  </div>
                ) : (
                <div className="bg-gray-100 min-h-[600px] flex flex-col justify-between p-8 rounded-lg">
                  {/* Top Section - Instructions */}
                  <div className="text-center space-y-2">
                    <p className="text-lg text-black">
                      1. CHALLENGER: Enter {wordCount} word{wordCount !== 1 ? 's' : ''}.
                    </p>
                    <p className="text-lg text-black">
                      2. OPPONENT: Press TAB to judge the play.
                    </p>
                    <p className="text-lg text-black">
                      3. Press any key to clear the results.
                    </p>
                  </div>

                  {/* Middle Section - Large Input Area */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-4xl">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder=""
                        value={words}
                        onChange={(e) => setWords(e.target.value.toUpperCase())}
                        className="w-full h-64 bg-white border-0 text-[12rem] font-mono text-black px-8 focus:outline-none"
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="flex justify-between items-end">
                    {/* Left - Brand Info */}
                    <div className="text-sm text-black">
                      <p className="font-semibold">WordSmith Word Judge</p>
                      <p>Version 1.0</p>
                    </div>

                    {/* Center - Scrabble Tile */}
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-green-600 border-2 border-white rounded flex items-center justify-center relative">
                        <span className="text-white text-2xl font-bold">W</span>
                        <span className="absolute bottom-1 right-1 text-white text-xs font-bold">4</span>
                      </div>
                    </div>

                    {/* Right - Lexicon Info */}
                    <div className="text-sm text-black text-right">
                      <p>Lexicon: CSW24</p>
                      <p>{new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                </div>
                )}
              </motion.div>
            )}

            {stage === "result" && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`shadow-lg ${result === "acceptable" ? "bg-green-50 dark:bg-green-950/20 border-green-500 dark:border-green-400" : "bg-red-50 dark:bg-red-950/20 border-red-500 dark:border-red-400"} border-4`}>
                  <CardContent className="py-12 flex flex-col items-center gap-6">
                    {result === "acceptable" ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle2 className="w-16 h-16" style={{ color: '#000000' }} />
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center"
                        >
                          <p className="text-lg font-medium" style={{ color: '#16a34a' }}>
                            YES, the play is
                          </p>
                          <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>
                            ACCEPTABLE
                          </p>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-center"
                        >
                          <p className="text-3xl font-bold text-black font-mono tracking-wider">
                            {words.toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Lexicon: CSW24
                          </p>
                        </motion.div>
                      </>
                    ) : (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        >
                          <XCircle className="w-16 h-16" style={{ color: '#000000' }} />
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-center"
                        >
                          <p className="text-lg font-medium" style={{ color: '#dc2626' }}>
                            NO, the play is
                          </p>
                          <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>
                            UNACCEPTABLE
                          </p>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-center"
                        >
                          <p className="text-3xl font-bold text-black font-mono tracking-wider">
                            {words.toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Lexicon: CSW24
                          </p>
                        </motion.div>
                      </>
                    )}
                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={resetToJudge}
                        className="flex-1 h-12"
                      >
                        Judge Another
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetToWordCount}
                        className="h-12"
                      >
                        New Challenge
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default WordJudge;