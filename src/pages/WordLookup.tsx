import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

const WordLookup = () => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ valid: boolean; words: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());

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

  const handleAnalyze = () => {
    if (!input.trim() || wordSet.size === 0) return;

    setLoading(true);
    setResult(null);

    const words = input.trim().split(/\s+/).map((w) => w.toUpperCase());

    const allValid = words.every((word) => wordSet.has(word));

    setTimeout(() => {
      setResult({ valid: allValid, words });
      setLoading(false);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="max-w-2xl w-full p-8 border rounded-lg shadow-lg bg-gray-50 relative overflow-hidden">
        <h1 className="text-4xl font-bold text-center mb-4">Word Judge</h1>
        <p className="text-center text-gray-600 mb-6">
          Enter words separated by spaces. Check if they’re acceptable in CSW24.
        </p>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., CAT DOG QUIZ"
          className="w-full p-4 text-lg border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleAnalyze}
          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white text-lg font-semibold py-3 rounded transition"
          disabled={loading || wordSet.size === 0}
        >
          {loading ? "Analyzing..." : "Judge Play"}
        </button>

        {result && (
          <div
            className={`mt-10 w-full flex flex-col items-center justify-center rounded-lg p-8 transform transition-all duration-500 ${
              result.valid
                ? "bg-green-50 border-green-500 border shadow-glow-success"
                : "bg-red-50 border-red-500 border shadow-glow"
            }`}
          >
            <div
              className={`absolute top-0 left-0 h-2 w-full transition-colors ${
                result.valid ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-800 tracking-wide text-center break-words">
              {result.words.join(" ")}
            </span>
            {result.valid ? (
              <>
                <CheckCircle className="h-20 w-20 text-green-600 mb-4 animate-bounce" />
                <p className="text-green-700 text-2xl font-bold">YES, the play is VALID</p>
              </>
            ) : (
              <>
                <XCircle className="h-20 w-20 text-red-600 mb-4 animate-pulse" />
                <p className="text-red-700 text-2xl font-bold">NO, the play is NOT ACCEPTABLE</p>
              </>
            )}
            <p className="mt-4 text-gray-500 text-sm">Lexicon: CSW24</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordLookup;
