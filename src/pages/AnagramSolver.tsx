import React, { useContext, useState } from "react";
import { DictionaryContext } from "../App";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronDown, ChevronUp, SortAsc, SortDesc, FileText, Download, Save } from "lucide-react";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

export default function AnagramSolver() {
  const dictionary = useContext(DictionaryContext);
  const { user } = useAuth();

  const [letters, setLetters] = useState("");
  const [startsWith, setStartsWith] = useState("");
  const [endsWith, setEndsWith] = useState("");
  const [wordLength, setWordLength] = useState<number | null>(null);
  const [tileFilter, setTileFilter] = useState<number | null>(null);
  const [qWithoutU, setQWithoutU] = useState(false);
  const [vowelHeavy, setVowelHeavy] = useState(false);
  const [consHeavy, setConsHeavy] = useState(false);
  const [bingo7, setBingo7] = useState(false);
  const [bingo8, setBingo8] = useState(false);
  const [matches, setMatches] = useState<string[]>([]);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortLongFirst, setSortLongFirst] = useState(true);

  const letterValues: { [key: string]: number } = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2,
    H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, N: 1,
    O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1,
    V: 4, W: 4, X: 8, Y: 4, Z: 10
  };

  const handleSolve = () => {
    if (!dictionary) return;
    setIsLoading(true);

    let blanks = (letters.match(/[?.]/g) || []).length;
    let cleanedLetters = letters.replace(/[?.]/g, "").toUpperCase();

    if (bingo7) blanks += 1;
    if (bingo8) blanks += 2;

    const sortedInput = cleanedLetters.split("").sort().join("");

    let results: string[] = [];
    dictionary.forEach(word => {
      if (startsWith && !word.startsWith(startsWith.toUpperCase())) return;
      if (endsWith && !word.endsWith(endsWith.toUpperCase())) return;
      if (wordLength && word.length !== wordLength) return;
      if (bingo7 && word.length !== 7) return;
      if (bingo8 && word.length !== 8) return;

      if (letters.trim() || bingo7 || bingo8) {
        if (word.length > sortedInput.length + blanks) return;
        if (!canFormWord(word, sortedInput, blanks)) return;
      }

      if (qWithoutU && (!word.includes("Q") || word.includes("QU"))) return;
      if (vowelHeavy && !isVowelHeavy(word)) return;
      if (consHeavy && !isConsonantHeavy(word)) return;
      if (tileFilter && !isWithinTileLimit(word, tileFilter)) return;

      results.push(word);
    });

    results.sort((a, b) => {
      if (sortLongFirst) return b.length - a.length || a.localeCompare(b);
      else return a.length - b.length || a.localeCompare(b);
    });

    setTimeout(() => {
      setMatches(results);
      setIsLoading(false);
    }, 500);
  };

  const canFormWord = (word: string, input: string, blanks: number) => {
    const inputArr = input.split("");
    let usedBlanks = blanks;

    for (const char of word) {
      const idx = inputArr.indexOf(char);
      if (idx !== -1) {
        inputArr.splice(idx, 1);
      } else if (usedBlanks > 0) {
        usedBlanks--;
      } else {
        return false;
      }
    }
    return true;
  };

  const isVowelHeavy = (word: string) => {
    const vowels = word.match(/[AEIOU]/g) || [];
    return vowels.length / word.length >= 0.6;
  };

  const isConsonantHeavy = (word: string) => {
    const consonants = word.match(/[^AEIOU]/g) || [];
    return consonants.length / word.length >= 0.6;
  };

  const isWithinTileLimit = (word: string, maxPoint: number) => {
    return word.split("").every((char) => letterValues[char] <= maxPoint);
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

  const exportToTxt = () => {
    const blob = new Blob([matches.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anagram-words.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Anagram Solver Results", 10, 10);
    matches.forEach((word, i) => {
      doc.text(word, 10, 20 + i * 7);
    });
    doc.save("anagram-words.pdf");
  };

  const saveToCardbox = async () => {
    if (!user) {
      alert("Please log in to save words to your cardbox.");
      return;
    }

    const { error } = await supabase
      .from("cardbox")
      .insert([{ user_id: user.id, words: matches }]);

    if (error) {
      console.error("Error saving to cardbox:", error);
      alert("Failed to save words. Please try again.");
    } else {
      alert("Words saved to your cardbox!");
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-green-600">Anagram Solver</h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">Advanced filters for Scrabble mastery!</p>
      </div>

      <Card className="max-w-3xl mx-auto border-2 border-green-300 shadow-lg">
        <CardContent className="p-6 space-y-4">

          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <Button variant="default" onClick={exportToTxt}>
              <FileText className="h-4 w-4 mr-1" />
              Export TXT
            </Button>
            <Button variant="default" onClick={exportToPdf}>
              <Download className="h-4 w-4 mr-1" />
              Export PDF
            </Button>
            <Button variant="default" onClick={saveToCardbox}>
              <Save className="h-4 w-4 mr-1" />
              Save to Cardbox
            </Button>
            <Button
              variant="default"
              onClick={() => setSortLongFirst(!sortLongFirst)}
            >
              {sortLongFirst ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
              {sortLongFirst ? "Longer first" : "Shorter first"}
            </Button>
          </div>

          <Input
            placeholder="Enter letters (optional)"
            value={letters}
            onChange={(e) => setLetters(e.target.value.toUpperCase())}
            className="text-xl h-14"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Starts with (optional)"
              value={startsWith}
              onChange={(e) => setStartsWith(e.target.value.toUpperCase())}
            />
            <Input
              placeholder="Ends with (optional)"
              value={endsWith}
              onChange={(e) => setEndsWith(e.target.value.toUpperCase())}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <select
              className="border p-2 rounded"
              value={wordLength ?? ""}
              onChange={(e) => setWordLength(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Word Length (optional)</option>
              {Array.from({ length: 14 }, (_, i) => i + 2).map(n => (
                <option key={n} value={n}>{n} letters</option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={tileFilter ?? ""}
              onChange={(e) => setTileFilter(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Tile Frequency (optional)</option>
              {[1, 2, 3, 4, 5, 8, 10].map(n => (
                <option key={n} value={n}>Max {n}-point tiles</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <Button variant={qWithoutU ? "default" : "outline"} onClick={() => setQWithoutU(!qWithoutU)}>Q without U</Button>
            <Button variant={vowelHeavy ? "default" : "outline"} onClick={() => setVowelHeavy(!vowelHeavy)}>Vowel heavy</Button>
            <Button variant={consHeavy ? "default" : "outline"} onClick={() => setConsHeavy(!consHeavy)}>Consonant heavy</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            <div className="flex items-center space-x-2">
              <Checkbox checked={bingo7} onCheckedChange={(v) => { setBingo7(!!v); setBingo8(false); }} />
              <span>Bingo 7</span>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={bingo8} onCheckedChange={(v) => { setBingo8(!!v); setBingo7(false); }} />
              <span>Bingo 8</span>
            </div>
          </div>

          <Button onClick={handleSolve} disabled={isLoading} className="w-full mt-4 h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white">
            {isLoading ? (
              <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Solve
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <Card className="max-w-4xl mx-auto mt-6 border shadow-lg">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-2xl font-bold text-green-600">Found {matches.length} words</h2>

            <div className="space-y-2">
              {matches.map((word) => {
                const isOpen = expandedWord === word;
                const hooks = isOpen ? getHooks(word) : { front: [], back: [] };
                const anagrams = isOpen ? getAnagrams(word) : [];
                return (
                  <div key={word} className="border rounded-lg shadow-sm bg-gray-50 hover:bg-green-50 transition cursor-pointer">
                    <div
                      onClick={() => setExpandedWord(isOpen ? null : word)}
                      className="flex justify-between items-center p-3 font-mono text-lg font-bold"
                    >
                      <span>{word}</span>
                      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                    {isOpen && (
                      <div className="p-3 space-y-2 text-sm bg-green-50">
                        <div>
                          <strong>Front Hooks:</strong> {hooks.front.length ? hooks.front.join(", ") : "None"}
                        </div>
                        <div>
                          <strong>Back Hooks:</strong> {hooks.back.length ? hooks.back.join(", ") : "None"}
                        </div>
                        <div>
                          <strong>Anagrams:</strong> {anagrams.length ? anagrams.join(", ") : "None"}
                        </div>
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
