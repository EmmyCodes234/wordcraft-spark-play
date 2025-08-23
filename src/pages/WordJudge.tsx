import React, { useState, useEffect } from "react";
import { Scale, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading";
import { ErrorState } from "@/components/ui/error-boundary";

const WordJudge = () => {
  const [words, setWords] = useState("");
  const [result, setResult] = useState<"acceptable" | "not-acceptable" | null>(null);
  const [loading, setLoading] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  const [dictStatus, setDictStatus] = useState<"loading" | "loaded" | "error">("loading");

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
    setResult(null);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      const wordList = words.trim().split(/\s+/);
      const allValid = wordList.every(word => wordSet.has(word));
      setResult(allValid ? "acceptable" : "not-acceptable");
      setLoading(false);
    }, 300);
  };

  const handleClear = () => {
    setWords("");
    setResult(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && dictStatus === "loaded") {
      handleJudge();
    }
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
              Check if a word is valid according to the CSW24 dictionary.
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <Scale className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-5xl md:text-6xl font-bold text-primary">
            Word Judge
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Check if a word is valid according to the CSW24 dictionary. You can enter multiple words separated by spaces.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-xl mx-auto space-y-6"
        >
          <div className="space-y-4">
            <Input
              placeholder="ENTER A WORD..."
              value={words}
              onChange={(e) => setWords((e.target.value || '').toUpperCase())}
              onKeyPress={handleKeyPress}
              className="text-lg p-6 text-center font-mono tracking-widest uppercase border-2 focus:border-primary"
              disabled={loading}
            />
            
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handleJudge} 
                disabled={loading || !words.trim()} 
                size="lg"
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Judge Word(s)"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClear} 
                size="lg"
                disabled={loading}
              >
                Clear
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="py-8 flex flex-col items-center gap-4">
                    {result === "acceptable" ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle2 className="text-success w-12 h-12" />
                        </motion.div>
                        <motion.p 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-xl text-success font-semibold"
                        >
                          Acceptable!
                        </motion.p>
                      </>
                    ) : (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        >
                          <XCircle className="text-destructive w-12 h-12" />
                        </motion.div>
                        <motion.p 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-xl text-destructive font-semibold"
                        >
                          Not Acceptable
                        </motion.p>
                      </>
                    )}
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