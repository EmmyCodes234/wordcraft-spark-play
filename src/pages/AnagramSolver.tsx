import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, SortAsc, SortDesc, FileText, Download, Save, Shuffle, Filter } from "lucide-react";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AnagramSolver() {
  const { user } = useAuth();

  const [letters, setLetters] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [minLength, setMinLength] = useState<number | null>(null);
  const [maxLength, setMaxLength] = useState<number | null>(null);
  const [allowPartial, setAllowPartial] = useState(true);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [deckName, setDeckName] = useState("");

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await fetch("/dictionaries/CSW24.txt");
        const text = await response.text();
        const wordsArray = text.split("\n").map((w) => w.trim().toUpperCase());
        setWordSet(new Set(wordsArray));
        console.log("CSW24 dictionary loaded with", wordsArray.length, "words");
      } catch (error) {
        console.error("Failed to load CSW24 word list:", error);
      }
    };

    fetchWords();
  }, []);

  // Helper function to check if word can be made from letters
  const canMakeWord = (word: string, availableLetters: string): boolean => {
    const letterCount = new Map<string, number>();
    
    // Count available letters
    for (const letter of availableLetters.toUpperCase()) {
      letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
    }
    
    // Check if word can be made
    for (const letter of word) {
      const count = letterCount.get(letter) || 0;
      if (count === 0) return false;
      letterCount.set(letter, count - 1);
    }
    
    return true;
  };

  const handleSolve = () => {
    if (wordSet.size === 0 || !letters.trim()) return;

    setLoading(true);
    setResults([]);

    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      const inputLetters = letters.toUpperCase().replace(/[^A-Z]/g, '');
      let filtered: string[] = [];

      if (allowPartial) {
        // Find words that can be made from the letters (anagrams and sub-anagrams)
        filtered = Array.from(wordSet).filter((word) => 
          canMakeWord(word, inputLetters)
        );
      } else {
        // Find exact anagrams only
        const inputSorted = inputLetters.split("").sort().join("");
        filtered = Array.from(wordSet).filter((word) => {
          const wordSorted = word.split("").sort().join("");
          return wordSorted === inputSorted;
        });
      }

      // Apply length filters
      if (minLength) {
        filtered = filtered.filter((w) => w.length >= minLength);
      }
      if (maxLength) {
        filtered = filtered.filter((w) => w.length <= maxLength);
      }

      // Sort results
      filtered.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.length === b.length ? a.localeCompare(b) : a.length - b.length;
        } else {
          return a.length === b.length ? a.localeCompare(b) : b.length - a.length;
        }
      });

      setResults(filtered);
      setLoading(false);
    }, 100);
  };

  
  const saveToFlashcards = async () => {
    if (!user || !deckName.trim() || results.length === 0) {
      alert("Please enter a deck name and make sure results are available.");
      return;
    }

    const { error } = await supabase.from("flashcard_decks").insert([
      {
        user_id: user.id,
        name: deckName.trim(),
        words: results
      }
    ]);

    if (error) {
      console.error("Error saving flashcard deck:", error);
      alert("Failed to save. Try again.");
    } else {
      alert("Saved to flashcards!");
      setDeckName("");
      setShowSavePrompt(false);
    }
  };

const exportAsTxt = () => {
    const blob = new Blob([results.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anagrams.txt";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAsPdf = () => {
    const doc = new jsPDF();
    doc.text(results.join("\n"), 10, 10);
    doc.save("anagrams.pdf");
  };

  const saveToCardbox = async () => {
    if (!user) {
      alert("Please log in to save to cardbox.");
      return;
    }
    
    try {
      const { error } = await supabase.from("cardbox").insert([{ 
        words: results, 
        user_id: user.id 
      }]);
      
      if (error) {
        console.error("Error saving cardbox:", error);
        alert("Failed to save to cardbox. Please try again.");
      } else {
        alert("Saved to your cardbox!");
      }
    } catch (error) {
      console.error("Error saving cardbox:", error);
      alert("Failed to save to cardbox. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Anagram Solver
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Find all possible words that can be made from your letters using the CSW24 dictionary.
          </p>
        </div>

        {/* Search Form */}
        <Card className="max-w-4xl mx-auto border shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shuffle className="h-6 w-6 text-primary" />
              Letter Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Input */}
            <div className="flex gap-4">
              <Input
                placeholder="Enter your letters (e.g., RETAINS)"
                value={letters}
                onChange={(e) => setLetters(e.target.value)}
                className="flex-1 text-lg p-6 font-mono tracking-wider"
                onKeyPress={(e) => e.key === 'Enter' && handleSolve()}
                disabled={loading}
              />
              <Button
                onClick={handleSolve}
                disabled={loading || wordSet.size === 0 || !letters.trim()}
                className="px-8 py-6 text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <Search className="h-5 w-5 mr-2 animate-spin" />
                    Solving...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Solve
                  </>
                )}
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Type</label>
                <Button
                  variant={allowPartial ? "default" : "outline"}
                  onClick={() => setAllowPartial(!allowPartial)}
                  className="w-full"
                >
                  {allowPartial ? "All Words" : "Exact Anagrams"}
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Length</label>
                <Select value={minLength?.toString() || ""} onValueChange={(v) => setMinLength(v ? parseInt(v) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                                        {[2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Length</label>
                <Select value={maxLength?.toString() || ""} onValueChange={(v) => setMaxLength(v ? parseInt(v) : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                                        {[2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Order</label>
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="w-full"
                >
                  {sortOrder === "asc" ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
                  {sortOrder === "asc" ? "Short to Long" : "Long to Short"}
                </Button>
              </div>
            </div>

            {/* Export Options */}
            {results.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button onClick={exportAsTxt} variant="outline">
                  <FileText className="mr-2 h-4 w-4" /> Export TXT
                </Button>
                <Button onClick={exportAsPdf} variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                
                <Button onClick={exportAsTxt} variant="outline">
                  <FileText className="mr-2 h-4 w-4" /> Export TXT
                </Button>
                <Button onClick={exportAsPdf} variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                <Button onClick={saveToCardbox} variant="outline">
                  <Save className="mr-2 h-4 w-4" /> Save to Cardbox
                </Button>
                <Button onClick={() => setShowSavePrompt(true)} variant="outline">
                  📁 Save to Flashcards
                </Button>
                {showSavePrompt && (
                  <div className="flex gap-2 mt-4 w-full">
                    <Input
                      placeholder="Enter deck name"
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      className="w-full"
                    />
                    <Button onClick={saveToFlashcards} variant="default">Save</Button>
                  </div>
                )}

              </div>
            )}

            {wordSet.size === 0 && (
              <div className="text-center py-4">
                <Badge variant="outline" className="animate-pulse">
                  Loading CSW24 dictionary...
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card className="max-w-6xl mx-auto border shadow-elegant animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Results ({results.length} words found)</span>
                <div className="flex gap-2">
                  <Badge className="bg-gradient-primary text-primary-foreground">
                    From: {letters.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {allowPartial ? "All possible words" : "Exact anagrams only"}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {results.map((word, index) => (
                  <div 
                    key={index} 
                    className="border border-primary/20 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 text-center font-mono font-semibold hover:scale-105 transition-transform duration-200 hover:shadow-md"
                  >
                    <div className="text-lg">{word}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {word.length} letters
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && letters.trim() && wordSet.size > 0 && (
          <Card className="max-w-4xl mx-auto border shadow-elegant">
            <CardContent className="p-8 text-center space-y-4">
              <div className="text-4xl">🤔</div>
              <h3 className="text-xl font-semibold">No words found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or check your letter combination.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


  
