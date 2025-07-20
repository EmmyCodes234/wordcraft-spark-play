import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown, ChevronUp, LoaderCircle } from "lucide-react";

export default function PatternMatcher() {
  const [dictionary, setDictionary] = useState<Set<string>>(new Set());
  const [pattern, setPattern] = useState("");
  const [sort, setSort] = useState("length-desc");
  const [matches, setMatches] = useState<string[]>([]);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const response = await fetch("/dictionaries/CSW24.txt");
        const text = await response.text();
        const wordsArray = text.split("\n").map((w) => w.trim().toUpperCase());
        setDictionary(new Set(wordsArray));
      } catch (error) {
        console.error("Failed to load CSW24 word list:", error);
      }
    };

    fetchWords();
  }, []);

  const handleMatch = () => {
    if (!pattern.trim() || dictionary.size === 0) return;
    setIsLoading(true);
    setExpandedWord(null);

    // Use setTimeout to prevent UI blocking on large dictionary searches
    setTimeout(() => {
      const regexPattern = "^" + pattern.toUpperCase().replace(/\?/g, "[A-Z]").replace(/\*/g, "[A-Z]*") + "$";
      const regex = new RegExp(regexPattern);

      let results: string[] = [];
      dictionary.forEach(word => {
        if (regex.test(word)) {
          results.push(word);
        }
      });

      if (sort === "length-desc") {
        results.sort((a, b) => b.length - a.length);
      } else if (sort === "length-asc") {
        results.sort((a, b) => a.length - b.length);
      } else {
        results.sort();
      }
      
      setMatches(results);
      setIsLoading(false);
    }, 100);
  };

  const getHooks = (word: string) => {
    const front: string[] = [];
    const back: string[] = [];

    for (let c = 65; c <= 90; c++) {
      const letter = String.fromCharCode(c);
      if (dictionary.has(letter + word)) front.push(letter);
      if (dictionary.has(word + letter)) back.push(letter);
    }
    return { front, back };
  };

  const getAnagrams = (word: string) => {
    const sortedWord = word.split("").sort().join("");
    const anagrams: string[] = [];
    dictionary.forEach(dictWord => {
      if (dictWord.length === word.length && dictWord !== word) {
        if (dictWord.split("").sort().join("") === sortedWord) {
          anagrams.push(dictWord);
        }
      }
    });
    return anagrams;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle dark:bg-background">
      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Pattern Matcher</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Use **?** for a single letter wildcard and **\*** for multiple letters.</p>
        </div>

        <Card className="max-w-3xl mx-auto border shadow-elegant">
          <CardContent className="p-6 space-y-6">
            <Input
              // --- UPDATED ---
              placeholder="E.G., A??LE OR S*ING"
              value={pattern}
              onChange={(e) => setPattern(e.target.value.toUpperCase())}
              className="text-xl h-14 text-center font-mono tracking-widest uppercase"
            />
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="length-desc">Length, decreasing</SelectItem>
                  <SelectItem value="length-asc">Length, increasing</SelectItem>
                  <SelectItem value="alpha">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleMatch}
                disabled={isLoading || dictionary.size === 0}
                className="flex-grow bg-gradient-primary h-12 text-lg"
              >
                {isLoading ? (
                  <LoaderCircle className="animate-spin h-6 w-6" />
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Match Pattern
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {matches.length > 0 && (
          <Card className="max-w-3xl mx-auto border shadow-card">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold">Matches ({matches.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {matches.map((word, index) => {
                  const isExpanded = expandedWord === word;
                  const hooks = getHooks(word);
                  const anagrams = getAnagrams(word);

                  return (
                    <div key={index} className="space-y-2">
                      <Button
                        onClick={() => setExpandedWord(isExpanded ? null : word)}
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {word}
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      {isExpanded && (
                        <div className="p-2 border rounded-md bg-muted/50 text-xs space-y-1">
                          <p><strong className="text-muted-foreground">Front hooks:</strong> {hooks.front.join(", ") || "none"}</p>
                          <p><strong className="text-muted-foreground">Back hooks:</strong> {hooks.back.join(", ") || "none"}</p>
                          <p><strong className="text-muted-foreground">Anagrams:</strong> {anagrams.join(", ") || "none"}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}