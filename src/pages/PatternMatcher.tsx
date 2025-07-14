import React, { useContext, useState } from "react";
import DictionaryContext from "@/context/DictionaryContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

  export default function PatternMatcher() {
  const dictionary = useContext(DictionaryContext);
  const [pattern, setPattern] = useState("");
  const [sort, setSort] = useState("length-desc");
  const [matches, setMatches] = useState<string[]>([]);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMatch = () => {
    if (!pattern.trim() || !dictionary) return;
    setIsLoading(true);

    const regexPattern = "^" + pattern.toUpperCase().replace(/\?/g, ".").replace(/\*/g, ".*") + "$";
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

    setTimeout(() => {
      setMatches(results);
      setIsLoading(false);
    }, 500);
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
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">Pattern Matcher</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Use ? for single wildcards and * for multiple.</p>
      </div>

      <Card className="max-w-3xl mx-auto border-2 border-primary/20 shadow-elegant">
        <CardContent className="p-6 space-y-6">
          <Input
            placeholder="e.g., A??LE"
            value={pattern}
            onChange={(e) => setPattern(e.target.value.toUpperCase())}
            className="text-xl h-14"
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
              disabled={isLoading}
              className="flex-grow bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Match
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <Card className="max-w-3xl mx-auto border shadow-card">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {matches.map((word, index) => {
                const isExpanded = expandedWord === word;
                const hooks = getHooks(word);
                const anagrams = getAnagrams(word);

                return (
                  <div key={index} className="space-y-2">
                    <Button
                      onClick={() => setExpandedWord(isExpanded ? null : word)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {word}
                      {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                    </Button>
                    {isExpanded && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Front hooks: {hooks.front.join(", ") || "."}</p>
                        <p className="text-sm text-muted-foreground">Back hooks: {hooks.back.join(", ") || "."}</p>
                        <p className="text-sm text-muted-foreground">Anagrams: {anagrams.join(", ") || "0"}</p>
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
  );
}
