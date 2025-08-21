import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { CheckCircle, TrendingUp, Target, Flame, BookOpen, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

// Helper function to calculate word score
const letterScores: { [key: string]: number } = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

const calculateWordScore = (word: string) => {
  return word.split('').reduce((acc, letter) => acc + (letterScores[letter] || 0), 0);
};

// Word of the Day Component
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
    <div className="text-center space-y-2">
      <p className="text-2xl sm:text-3xl font-bold text-primary uppercase tracking-wider">
        {wordData.word}
      </p>
      <p className="text-sm text-muted-foreground">Points: {wordData.points}</p>
    </div>
  );
};

// Quick Action Card Component
const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  to, 
  gradient 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  to: string; 
  gradient: string; 
}) => (
  <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 theme-transition">
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`p-2.5 sm:p-3 rounded-lg ${gradient} text-white flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base mb-2 text-foreground leading-tight">{title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{description}</p>
          <Button asChild size="sm" variant="outline" className="w-full h-10 sm:h-9 sm:w-auto">
            <Link to={to} className="flex items-center justify-center gap-2">
              Start
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Stat Card Component with theme-aware colors
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  iconColor, 
  textColor, 
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  gradient: string; 
  iconColor: string; 
  textColor: string; 
  subtitle: string; 
}) => (
  <Card className={`${gradient} theme-transition`}>
    <CardContent className="p-4 sm:p-6 text-center space-y-2 sm:space-y-3">
      <div className="flex items-center justify-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <p className={`text-sm sm:text-base font-medium ${textColor}`}>{title}</p>
      </div>
      <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${textColor}`}>{value}</p>
      <p className={`text-xs sm:text-sm ${textColor} opacity-80`}>{subtitle}</p>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { isDark, colors } = useTheme();
  const isMobile = useIsMobile();

  const [profileName, setProfileName] = useState<string | null>(null);
  const [wordsMastered, setWordsMastered] = useState(0);
  const [quizAccuracy, setQuizAccuracy] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

      try {
        // Fetch Profile Name
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        if (profileData) setProfileName(profileData.username);

        // Fetch Mastered Words Count
        const { data: flashcards } = await supabase
          .from("flashcard_decks")
          .select("words")
          .eq("user_id", user.id);
        if (flashcards) {
          const masteredCount = flashcards.reduce((acc, deck) => acc + (deck.words?.length || 0), 0);
          setWordsMastered(masteredCount);
        }

        // Fetch Quiz Accuracy
        const { data: quizStats } = await supabase
          .from("quiz_results")
          .select("correct, total")
          .eq("user_id", user.id);
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

        // Fetch and Calculate Daily Streak
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
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const displayName = profileName || user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email || "Wordcrafter";

  const quickActions = [
    {
      title: "Word Judge",
      description: "Verify if a word is valid in competitive play",
      icon: CheckCircle,
      to: "/judge",
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: "Anagram Solver",
      description: "Find all possible words from your letters",
      icon: TrendingUp,
      to: "/anagram",
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      title: "Study Mode",
      description: "Practice with flashcards and quizzes",
      icon: BookOpen,
      to: "/quiz",
      gradient: "bg-gradient-to-br from-green-500 to-green-600"
    }
  ];

  // Theme-aware stat card configurations
  const statCards = [
    {
      title: "Words Mastered",
      value: wordsMastered,
      icon: BookOpen,
      gradient: isDark 
        ? "bg-gradient-to-br from-success/20 to-success/10 border-success/30" 
        : "bg-gradient-to-br from-success/10 to-success/5 border-success/20",
      iconColor: "text-success",
      textColor: "text-success-foreground",
      subtitle: "Keep going! 🌟"
    },
    {
      title: "Daily Streak",
      value: dailyStreak,
      icon: Flame,
      gradient: isDark 
        ? "bg-gradient-to-br from-warning/20 to-warning/10 border-warning/30" 
        : "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20",
      iconColor: "text-warning",
      textColor: "text-warning-foreground",
      subtitle: "Stay consistent! 🔥"
    },
    {
      title: "Quiz Accuracy",
      value: `${quizAccuracy}%`,
      icon: Target,
      gradient: isDark 
        ? "bg-gradient-to-br from-info/20 to-info/10 border-info/30" 
        : "bg-gradient-to-br from-info/10 to-info/5 border-info/20",
      iconColor: "text-info",
      textColor: "text-info-foreground",
      subtitle: "Aim higher! 🎯"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-7xl">
        
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3 sm:space-y-4"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
            Ready to expand your word power today?
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {statCards.map((stat, index) => (
            <motion.div 
              key={stat.title}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
              className={index === 2 ? "sm:col-span-2 lg:col-span-1" : ""}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Word of the Day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 theme-transition">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl text-foreground">
                <CheckCircle className="w-5 h-5 text-primary" />
                Word of the Day
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <WordOfTheDay wordSet={wordSet} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="space-y-4"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-center sm:text-left text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              >
                <QuickActionCard {...action} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}