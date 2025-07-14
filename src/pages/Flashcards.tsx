import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { RotateCcw, CheckCircle, RefreshCcw } from "lucide-react";
import "@/index.css"; // Ensure this includes flip card styles

export default function Flashcards() {
  const { user } = useAuth();
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const fetchCardbox = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("cardbox")
        .select("words")
        .eq("user_id", user.id)
        .single();
      if (error) {
        console.error("Error fetching cardbox:", error);
      } else if (data) {
        setWords(data.words || []);
      }
      setIsLoading(false);
    };

    fetchCardbox();
  }, [user]);

  const markAs = (type: "mastered" | "learning") => {
    setFlipped(true);
    setTimeout(() => {
      setStatus((prev) => [...prev, type]);
      setCompleted((prev) => [...prev, words[currentIndex]]);
      setCurrentIndex((prev) => prev + 1);
      setFlipped(false);
    }, 500);
  };

  const resetDeck = () => {
    setCurrentIndex(0);
    setCompleted([]);
    setStatus([]);
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-lg">Loading your flashcards...</div>;
  }

  if (!words.length) {
    return <div className="text-center mt-20 text-lg">Your cardbox is empty. Add words to start practicing!</div>;
  }

  if (currentIndex >= words.length) {
    return (
      <div className="text-center space-y-6 mt-12">
        <h2 className="text-3xl font-bold">🎉 Great job! You finished all cards.</h2>
        <Button onClick={resetDeck} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Restart
        </Button>
        <div className="mt-6 text-left max-w-md mx-auto border rounded-lg p-4 bg-card shadow-card">
          <h3 className="text-xl font-semibold mb-3">Revision Summary</h3>
          {completed.map((word, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1 border-b last:border-b-0"
            >
              <span className="font-medium">{word}</span>
              <span
                className={status[i] === "mastered" ? "text-green-600" : "text-yellow-500"}
              >
                {status[i] === "mastered" ? "Mastered" : "Learning"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center mt-12 space-y-6">
      <h2 className="text-lg text-muted-foreground">
        Card {currentIndex + 1} of {words.length}
      </h2>

      <div className={`flip-card w-full max-w-sm h-52 ${flipped ? "flipped" : ""}`}>
        <div className="flip-card-inner">
          <div className="flip-card-front flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-green-100 to-green-50 text-green-900 border shadow-glow rounded-xl transition-transform duration-500 ease-smooth">
            {words[currentIndex]}
          </div>
          <div className="flip-card-back flex items-center justify-center text-2xl font-semibold bg-green-500 text-white border shadow-glow rounded-xl transition-transform duration-500 ease-smooth">
            ✔️ Mastered!
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => markAs("mastered")}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 px-5 py-2 rounded-md transition-all duration-300"
        >
          <CheckCircle className="h-5 w-5" />
          Mastered
        </Button>
        <Button
          onClick={() => markAs("learning")}
          variant="outline"
          className="flex items-center gap-1 px-5 py-2 rounded-md transition-all duration-300"
        >
          <RefreshCcw className="h-5 w-5" />
          Learning
        </Button>
      </div>
    </div>
  );
}
