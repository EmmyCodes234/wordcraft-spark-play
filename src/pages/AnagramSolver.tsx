import React, { useState, useEffect } from "react";
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

const WORDNIK_API_KEY = "q6ozgglz09jnvewsiy4cvvaywtzey98sz3a108u6dmnvystl9";
type Definition = { text: string; partOfSpeech: string; };

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

  const [startsWith, setStartsWith] = useState("");
  const [endsWith, setEndsWith] = useState("");
  const [contains, setContains] = useState("");
  const [containsAll, setContainsAll] = useState("");
  const [qWithoutU, setQWithoutU] = useState(false);
  const [isVowelHeavy, setIsVowelHeavy] = useState(false);
  const [noVowels, setNoVowels] = useState(false);
  
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await fetch("/dictionaries/CSW24.txt");
        const text = await response.text();
        const wordsArray = text.split("\n").map((w) => w.trim().toUpperCase());
        setWordSet(new Set(wordsArray));
      } catch (error) {
        console.error("Failed to load word list:", error);
      }
    };
    fetchWords();
  }, []);

  const handleQuickLengthFilter = (length: number) => {
    setMinLength(length);
    setMaxLength(length);
    setTimeout(() => document.getElementById("solve-button")?.click(), 0);
  };
  
  const canMakeWord = (word: string, availableLetters: string): boolean => {
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

  const handleSolve = () => {
    if (wordSet.size === 0) return;
    setLoading(true);
    setResults([]);
    setTimeout(() => {
      let filtered: string[] = Array.from(wordSet);
      if (letters.trim()) {
          const inputLetters = letters.toUpperCase().replace(/[^A-Z?.]/g, "");
          if (allowPartial) {
            filtered = filtered.filter((word) => canMakeWord(word, inputLetters));
          } else {
            const nonBlankLetters = inputLetters.replace(/[?.]/g, '');
            if (inputLetters.length !== nonBlankLetters.length) {
              filtered = filtered.filter(word => word.length === inputLetters.length && canMakeWord(word, inputLetters));
            } else {
              const inputSorted = nonBlankLetters.split("").sort().join("");
              filtered = filtered.filter((word) => {
                if (word.length !== inputSorted.length) return false;
                const wordSorted = word.split("").sort().join("");
                return wordSorted === inputSorted;
              });
            }
          }
      }
      if (startsWith) filtered = filtered.filter(w => w.startsWith(startsWith.toUpperCase()));
      if (endsWith) filtered = filtered.filter(w => w.endsWith(endsWith.toUpperCase()));
      if (contains) filtered = filtered.filter(w => w.includes(contains.toUpperCase()));
      if (containsAll) {
        const allChars = containsAll.toUpperCase().split('');
        filtered = filtered.filter(w => allChars.every(char => w.includes(char)));
      }
      if (qWithoutU) filtered = filtered.filter(w => w.includes('Q') && !w.includes('U'));
      if (noVowels) filtered = filtered.filter(w => !/[AEIOU]/.test(w));
      if (isVowelHeavy) {
        filtered = filtered.filter(w => {
            if (w.length === 0) return false;
            const vowelCount = (w.match(/[AEIOU]/g) || []).length;
            return vowelCount / w.length > 0.6;
        });
      }
      if (minLength) filtered = filtered.filter((w) => w.length >= minLength);
      if (maxLength) filtered = filtered.filter((w) => w.length <= maxLength);
      filtered.sort((a, b) => sortOrder === "asc" ? (a.length === b.length ? a.localeCompare(b) : a.length - b.length) : (a.length === b.length ? a.localeCompare(b) : b.length - a.length));
      setResults(filtered);
      setLoading(false);
    }, 100);
  };

  const fetchDefinition = async (word: string) => {
    if (!word) return;
    setDefinitionLoading(true);
    setDefinition(null);
    setDefinitionError(null);
    try {
      const response = await fetch(`https://api.wordnik.com/v4/word.json/${word.toLowerCase()}/definitions?limit=1&includeRelated=false&useCanonical=true&includeTags=false&api_key=${WORDNIK_API_KEY}`);
      if (!response.ok) throw new Error(`Wordnik API responded with status: ${response.status}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setDefinition({ text: data[0].text, partOfSpeech: data[0].partOfSpeech });
      } else {
        setDefinitionError("No definition found for this word.");
      }
    } catch (error) {
      console.error("Failed to fetch definition:", error);
      setDefinitionError("Could not retrieve definition.");
    } finally {
      setDefinitionLoading(false);
    }
  };

  const handleWordClick = (word: string) => {
    setSelectedWord(word);
    setIsModalOpen(true);
    fetchDefinition(word);
  };
  
  const saveAsQuizDeck = async () => {
    if (!user || !deckName.trim() || results.length === 0) {
      alert("Please log in, enter a deck name, and make sure results are available.");
      return;
    }
    const { error } = await supabase.from("flashcard_decks").insert([{ user_id: user.id, name: deckName.trim(), words: results }]);
    if (error) {
      alert("Failed to save deck. Try again.");
    } else {
      alert("Quiz Deck saved successfully!");
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportAsPdf = () => {
    const doc = new jsPDF();
    doc.text(results.join("\n"), 10, 10);
    doc.save("anagrams.pdf");
  };

  const saveToCardbox = async () => {
    if (!user || results.length === 0) {
      alert("Please log in and find words to save.");
      return;
    }
    const wordsToInsert = results.map(word => ({
      user_id: user.id,
      word: word,
    }));
    try {
      const { error } = await supabase
        .from("user_words")
        .insert(wordsToInsert, { onConflict: 'user_id, word' });
      if (error) throw error;
      alert("Saved to your Cardbox for studying!");
    } catch (error) {
      console.error("Error saving to cardbox:", error);
      alert("Failed to save words. Some may already be in your Cardbox.");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Anagram Solver</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">Find words with the ultimate toolkit.</p>
          </div>
          <Card className="max-w-4xl mx-auto border shadow-elegant">
            <CardHeader><CardTitle className="flex items-center gap-2"><Shuffle className="h-6 w-6 text-primary" /> Letter & Word Finder</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input placeholder="ENTER LETTERS (E.G., RETAINS?)" value={letters} onChange={(e) => setLetters(e.target.value.toUpperCase())} className="flex-1 text-lg p-6 font-mono tracking-widest uppercase" onKeyPress={(e) => e.key === 'Enter' && handleSolve()} disabled={loading} />
                <Button id="solve-button" onClick={handleSolve} disabled={loading && wordSet.size === 0} className="px-8 py-6 text-lg bg-gradient-primary hover:opacity-90 transition-all duration-300">
                  {loading ? <><LoaderCircle className="h-5 w-5 mr-2 animate-spin" /> Solving...</> : <><Search className="h-5 w-5 mr-2" /> Solve</>}
                </Button>
              </div>
              <Collapsible>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Search Type</Label>
                    <Button variant={allowPartial ? "default" : "outline"} onClick={() => setAllowPartial(!allowPartial)} className="w-full">{allowPartial ? "Anagrams" : "Exact Match"}</Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Min Length</Label>
                    <Select value={minLength?.toString() || ""} onValueChange={(v) => setMinLength(v ? parseInt(v) : null)}>
                      <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>{Array.from({length: 14}, (_, i) => i + 2).map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Length</Label>
                    <Select value={maxLength?.toString() || ""} onValueChange={(v) => setMaxLength(v ? parseInt(v) : null)}>
                      <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>{Array.from({length: 14}, (_, i) => i + 2).map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Advanced</Label>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" className="w-full"><Filter className="mr-2 h-4 w-4" /> More Filters</Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                <CollapsibleContent className="mt-6 space-y-6 border-t pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Starts With</Label><Input placeholder="E.G., PRE" value={startsWith} onChange={e => setStartsWith(e.target.value.toUpperCase())} className="uppercase"/></div>
                    <div className="space-y-2"><Label>Ends With</Label><Input placeholder="E.G., ING" value={endsWith} onChange={e => setEndsWith(e.target.value.toUpperCase())} className="uppercase"/></div>
                    <div className="space-y-2"><Label>Contains Substring</Label><Input placeholder="E.G., ZY" value={contains} onChange={e => setContains(e.target.value.toUpperCase())} className="uppercase"/></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contains All These Letters</Label>
                    <Input placeholder="E.G., XYZ" value={containsAll} onChange={e => setContainsAll(e.target.value.toUpperCase())} className="uppercase"/>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center space-x-2"><Switch id="q-no-u" checked={qWithoutU} onCheckedChange={setQWithoutU} /><Label htmlFor="q-no-u">Q without U</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="vowel-heavy" checked={isVowelHeavy} onCheckedChange={setIsVowelHeavy} /><Label htmlFor="vowel-heavy">Vowel-Heavy</Label></div>
                    <div className="flex items-center space-x-2"><Switch id="no-vowels" checked={noVowels} onCheckedChange={setNoVowels} /><Label htmlFor="no-vowels">No Vowels</Label></div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <div className="pt-6 border-t">
                <Label className="text-sm font-medium mb-2 block">Quick Length Filters</Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleQuickLengthFilter(2)}>2 Letters</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickLengthFilter(3)}>3 Letters</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickLengthFilter(7)}>Bingo-7</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickLengthFilter(8)}>Bingo-8</Button>
                </div>
              </div>
              {results.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-6 border-t">
                  <Button onClick={saveToCardbox} variant="outline"><Save className="mr-2 h-4 w-4" /> Save to Cardbox</Button>
                  <Button onClick={exportAsTxt} variant="outline"><FileText className="mr-2 h-4 w-4" /> Export TXT</Button>
                  <Button onClick={exportAsPdf} variant="outline"><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
                  <Button onClick={() => setShowSavePrompt(true)} variant="outline">📁 Save as Quiz Deck</Button>
                  {showSavePrompt && (
                    <div className="flex gap-2 w-full pt-2">
                      <Input placeholder="Enter deck name" value={deckName} onChange={(e) => setDeckName(e.target.value)} className="flex-grow" />
                      <Button onClick={saveAsQuizDeck} variant="default">Save Deck</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          {results.length > 0 && (
            <Card className="max-w-7xl mx-auto border shadow-elegant animate-fade-in">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <CardTitle>Results ({results.length} words found)</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-normal">Sort:</Label>
                    <Button size="sm" variant="ghost" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-1" /> : <SortDesc className="h-4 w-4 mr-1" />}
                      {sortOrder === 'asc' ? 'Length (Asc)' : 'Length (Desc)'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                  {results.map((word, index) => {
                    const available = (letters || "").toUpperCase().replace(/[^A-Z?.]/g, "");
                    const used = new Map();
                    for (const c of available) if (c !== '?' && c !== '.') used.set(c, (used.get(c) || 0) + 1);
                    const highlighted = word.toUpperCase().split("").map((char, i) => {
                      if (used.has(char) && used.get(char) > 0) {
                        used.set(char, used.get(char) - 1);
                        return <span key={i}>{char}</span>;
                      } else {
                        return <span key={i} className="text-pink-500 font-bold">{char}</span>;
                      }
                    });
                    return (
                      <button key={index} onClick={() => handleWordClick(word)} className="border border-primary/20 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 text-center font-mono font-semibold hover:scale-105 transition-transform duration-200 hover:shadow-md hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary">
                        <div className="text-lg tracking-wider">{highlighted}</div>
                        <div className="text-xs text-muted-foreground mt-1">{word.length} letters</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          {!loading && results.length === 0 && (letters.trim() || startsWith.trim() || endsWith.trim() || contains.trim()) && (
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