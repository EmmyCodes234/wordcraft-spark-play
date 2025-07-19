import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Word of the Day component
const WordOfTheDay = () => {
  const [wordData, setWordData] = useState({ word: "QUIXOTIC", points: 26 });

  useEffect(() => {
    const getDailyWord = () => {
      const words = [
        { word: "QUIXOTIC", points: 26 },
        { word: "ZEPHYR", points: 23 },
        { word: "FJORD", points: 18 },
        { word: "WALTZ", points: 17 },
        { word: "JUXTAPOSE", points: 27 },
        { word: "RHYTHM", points: 17 },
        { word: "SPHINX", points: 18 }
      ];
      
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const wordIndex = dayOfYear % words.length;
      
      setWordData(words[wordIndex]);
    };

    getDailyWord();
  }, []);

  return (
    <>
      <p className="text-3xl font-bold text-green-600 uppercase tracking-wider">
        {wordData.word}
      </p>
      <p className="text-gray-500">Points: {wordData.points}</p>
    </>
  );
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfileName(data.username);
        } else if (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const displayName =
    profileName ||
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.email;

  const [wordsMastered, setWordsMastered] = useState(0);
  const [counting, setCounting] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const mastered = 1247;
      setWordsMastered(mastered);

      let current = 0;
      const interval = setInterval(() => {
        current += Math.ceil(mastered / 40);
        if (current >= mastered) {
          current = mastered;
          clearInterval(interval);
        }
        setCounting(current);
      }, 30);
    };

    fetchStats();
  }, []);

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
        <p className="text-gray-600 max-w-2xl mx-auto">
          Ready to expand your word power today?
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-md border-none">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-lg font-medium">Words Mastered</p>
              <p className="text-4xl font-bold text-green-600">{counting}</p>
              <p className="text-sm text-gray-500">Keep going! 🌟</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-md border-none">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-lg font-medium">Daily Streak</p>
              <p className="text-2xl font-bold">Coming soon</p>
              <p className="text-sm text-gray-500">Stay consistent! 🔥</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-md border-none">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-lg font-medium">Quiz Accuracy</p>
              <p className="text-2xl font-bold">Coming soon</p>
              <p className="text-sm text-gray-500">Aim higher! 🎯</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card className="bg-white shadow-md border border-gray-200">
          <CardContent className="p-6 space-y-3 text-center">
            <div className="flex justify-center items-center gap-2">
              <CheckCircle className="text-green-500" />
              <p className="text-lg font-medium">Word of the Day</p>
            </div>
            <WordOfTheDay />
            <Button className="mt-2">Study This Word</Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="bg-white shadow-md border border-gray-200">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-medium mb-2">Recent Words</p>
            <p className="text-gray-500">No words added yet. Start studying!</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
