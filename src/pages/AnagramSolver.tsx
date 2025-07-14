import React, { useContext, useState } from "react";
import { DictionaryContext } from "@/context/DictionaryContext";
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
  const [results, setResults] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [tileFrequency, setTileFrequency] = useState<number | null>(null);
  const [wordLength, setWordLength] = useState<number | null>(null);

  const handleSolve = () => {
    if (!dictionary || !letters.trim()) return;

    let filtered = Array.from(dictionary).filter((word) => {
      const wordChars = word.split("").sort().join("");
      const inputChars = letters.toUpperCase().split("").sort().join("");
      return wordChars === inputChars;
    });

    if (tileFrequency) {
      filtered = filtered.filter((w) => w.length === tileFrequency);
    }

    if (wordLength) {
      filtered = filtered.filter((w) => w.length === wordLength);
    }

    filtered.sort((a, b) => (sortOrder === "asc" ? a.length - b.length : b.length - a.length));

    setResults(filtered);
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
    if (!user) return alert("Please log in to save to cardbox.");
    const { error } = await supabase.from("cardbox").insert([{ words: results, user_id: user.id }]);
    if (error) console.error("Error saving cardbox:", error);
    else alert("Saved to your cardbox!");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-4xl font-bold mb-4">Anagram Solver</h1>
      <div className="flex space-x-2 mb-4">
        <Input
          placeholder="Enter letters..."
          value={letters}
          onChange={(e) => setLetters(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleSolve}>
          <Search className="mr-2 h-4 w-4" /> Solve
        </Button>
      </div>
      <div className="flex space-x-2 mb-4">
        <Button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
          {sortOrder === "asc" ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
          Sort
        </Button>
        <Button onClick={exportAsTxt}>
          <FileText className="mr-2 h-4 w-4" /> Export TXT
        </Button>
        <Button onClick={exportAsPdf}>
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
        <Button onClick={saveToCardbox}>
          <Save className="mr-2 h-4 w-4" /> Save to Cardbox
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-2">Results ({results.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {results.map((word, index) => (
              <div key={index} className="border p-2 rounded bg-muted text-center">
                {word}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
