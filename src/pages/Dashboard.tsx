// File: src/pages/Dashboard.tsx

import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// --- NEW: Helper function to calculate word score ---
const letterScores: { [key: string]: number } = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};
const calculateWordScore = (word: string) => {
  return word.split('').reduce((acc, letter) => acc + (letterScores[letter] || 0), 0);
};

// --- Word of the Day Component (Updated to be Dynamic) ---
const WordOfTheDay = ({ wordSet }: { wordSet: Set<string> }) => {
  const [wordData, setWordData] = useState({ word: "LOADING...", points: 0 });

  useEffect(() => {
    if (wordSet.size === 0) return;

    const eligibleWords = Array.from(wordSet).filter(
      w => w.length >= 7 && w.length <= 15
    );

    if (eligibleWords.length === 0) {
      setWordData({ word: "NO WORD FOUND", points: 0 });
      return;
    }

    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const wordIndex = (today.getFullYear() * 366 + dayOfYear) % eligibleWords.length;
    
    const dailyWord = eligibleWords[wordIndex];
    const score = calculateWordScore(dailyWord);

    setWordData({ word: dailyWord, points: score });

  }, [wordSet]);

  return (
    <>
      <p className="text-3xl font-bold text-primary uppercase tracking-wider">
        {wordData.word}
      </p>
      <p className="text-muted-foreground">Points: {wordData.points}</p>
    </>
  );
};

// --- Main Dashboard Component ---
export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const [profileName, setProfileName] = useState<string | null>(null);
  const [wordsMastered, setWordsMastered] = useState(0);
  const [quizAccuracy, setQuizAccuracy] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    // --- NEW: Dictionary is now fetched on the dashboard ---
    const fetchDictionary = async () => {
        try {
            const response = await fetch("/dictionaries/CSW24.txt");
            const text = await response.text();
            const wordsArray = text.split("\n").map((w) => w.trim().toUpperCase());
            setWordSet(new Set(wordsArray));
        } catch (error) {
            console.error("Failed to load dictionary:", error);
        }
    };
    fetchDictionary();

    const fetchDashboardData = async () => {
      if (!user) return;

      // --- Fetch Profile Name ---
      const { data: profileData } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      if (profileData) setProfileName(profileData.username);

      // --- Fetch Mastered Words Count ---
      const { data: flashcards } = await supabase.from("flashcard_decks").select("words").eq("user_id", user.id);
      if (flashcards) {
        const masteredCount = flashcards.reduce((acc, deck) => acc + (deck.words?.length || 0), 0);
        setWordsMastered(masteredCount);
      }

      // --- Fetch Quiz Accuracy ---
      const { data: quizStats } = await supabase.from("quiz_results").select("correct, total").eq("user_id", user.id);
      if (quizStats) {
        let totalCorrect = 0;
        let totalQuestions = 0;
        quizStats.forEach(q => {
          totalCorrect += q.correct || 0;
          totalQuestions += q.total || 0;
        });
        const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        setQuizAccuracy(accuracy);
      }

      // --- Fetch and Calculate Daily Streak ---
      const { data: activityDates } = await supabase
        .from("quiz_results")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (activityDates) {
        const uniqueDates = [...new Set(activityDates.map(a => new Date(a.created_at).toDateString()))].map(d => new Date(d));
        let streak = 0;
        if (uniqueDates.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (uniqueDates[0].getTime() === today.getTime() || uniqueDates[0].getTime() === yesterday.getTime()) {
            streak = 1;
            for (let i = 1; i < uniqueDates.length; i++) {
              const expectedPreviousDay = new Date(uniqueDates[i-1]);
              expectedPreviousDay.setDate(expectedPreviousDay.getDate() - 1);
              if (uniqueDates[i].getTime() === expectedPreviousDay.getTime()) {
                streak++;
              } else {
                break;
              }
            }
          }
        }
        setDailyStreak(streak);
      }
    };
    fetchDashboardData();
  }, [user]);

  const displayName = profileName || user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email || "Wordcrafter";

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold">
          Welcome back, {displayName}! 👋
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ready to expand your word power today?
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-lg font-medium text-green-800 dark:text-green-300">Words Mastered</p>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">{wordsMastered}</p>
              <p className="text-sm text-green-700 dark:text-green-500">Keep going! 🌟</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-lg font-medium text-yellow-800 dark:text-yellow-300">Daily Streak</p>
              <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{dailyStreak}</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500">Stay consistent! 🔥</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-lg font-medium text-blue-800 dark:text-blue-300">Quiz Accuracy</p>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{quizAccuracy}%</p>
              <p className="text-sm text-blue-700 dark:text-blue-500">Aim higher! 🎯</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card className="bg-card text-card-foreground">
          <CardContent className="p-6 space-y-3 text-center">
            <div className="flex justify-center items-center gap-2">
              <CheckCircle className="text-primary" />
              <p className="text-lg font-medium">Word of the Day</p>
            </div>
            {/* --- Pass the loaded dictionary as a prop --- */}
            <WordOfTheDay wordSet={wordSet} />
            {/* The "Study This Word" button has been removed */}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}