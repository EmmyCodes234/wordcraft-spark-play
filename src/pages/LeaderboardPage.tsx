// src/pages/LeaderboardPage.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuizResult {
  user_id: string;
  correct: number;
  total: number;
  accuracy: number;
  created_at: string;
  profiles: { // Frontend expects this structure after manual join
    username: string;
  } | null;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Debugging log to confirm useEffect is running
    console.log("LeaderboardPage: useEffect is running!"); 

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      // Debugging log to confirm fetch function starts
      console.log("LeaderboardPage: fetchLeaderboard is starting!"); 

      try {
        // --- Client-Side Join Fix: Step 1 - Fetch quiz results without profile join ---
        const { data: quizResultsData, error: fetchError } = await supabase
          .from('quiz_results')
          .select(`
            user_id,
            correct,
            total,
            accuracy,
            created_at
          `)
          .order('accuracy', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(50); // Still limit to top N for efficiency

        console.log("LeaderboardPage: First fetch (quizResultsData) result:", quizResultsData, "error:", fetchError); 

        if (fetchError) {
          console.error("LeaderboardPage: Error fetching leaderboard (main query):", fetchError);
          setError("Failed to load leaderboard. Please try again.");
          setLoading(false);
          return;
        }

        if (!quizResultsData || quizResultsData.length === 0) {
          setLeaderboardData([]);
          setLoading(false);
          console.log("LeaderboardPage: No quiz results data found."); 
          return;
        }

        // --- Client-Side Join Fix: Step 2 - Fetch associated profiles separately ---
        const uniqueUserIds = [...new Set(quizResultsData.map(result => result.user_id))];
        console.log("LeaderboardPage: Unique User IDs for profile fetch:", uniqueUserIds); 

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', uniqueUserIds);

        console.log("LeaderboardPage: Second fetch (profilesData) result:", profilesData, "error:", profilesError); 

        if (profilesError) {
          console.error("LeaderboardPage: Error fetching profiles for leaderboard:", profilesError);
          // Continue with anonymous names if profiles can't be fetched
        }

        const profileMap = new Map<string, string>();
        profilesData?.forEach(profile => profileMap.set(profile.id, profile.username));

        // --- Client-Side Join Fix: Step 3 - Manually merge profile data into quiz results ---
        const mergedQuizResults = quizResultsData.map(result => ({
          ...result,
          profiles: {
            username: profileMap.get(result.user_id) || 'Anonymous' // Fallback to Anonymous
          }
        }));

        // Apply the aggregation logic (highest score per user)
        const userHighestScores = new Map<string, QuizResult>();
        mergedQuizResults.forEach(result => {
            const userId = result.user_id;
            if (!userHighestScores.has(userId) || result.accuracy > userHighestScores.get(userId)!.accuracy) {
                userHighestScores.set(userId, result);
            }
        });
        
        const finalLeaderboard = Array.from(userHighestScores.values())
            .sort((a, b) => b.accuracy - a.accuracy || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setLeaderboardData(finalLeaderboard || []);
        setLoading(false);
        console.log("LeaderboardPage: Leaderboard data set, loading false. Total entries:", (finalLeaderboard || []).length); 

      } catch (err) {
        console.error("LeaderboardPage: Uncaught error in fetchLeaderboard:", err);
        setError("An unexpected error occurred. Check console for details.");
        setLoading(false);
      }
    };

    const handler = setTimeout(() => { // Debounce search term input to avoid excessive API calls
        fetchLeaderboard();
    }, 300); // Debounce by 300ms

    return () => clearTimeout(handler);

  }, []); // Only fetch on mount and not on searchTerm change for simplicity

  return (
    <div className="min-h-screen bg-gradient-subtle dark:bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <Trophy className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Leaderboard</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">See how you stack up against other WordSmiths!</p>
        </div>

        <Card className="max-w-4xl mx-auto border shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Top Quiz Performers
              {loading && <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {!loading && leaderboardData.length === 0 && !error && (
              <p className="text-muted-foreground text-center">No quiz results yet. Be the first to appear!</p>
            )}
            <div className="space-y-4">
              {leaderboardData.map((result, index) => (
                <div 
                  key={result.user_id} 
                  className={`flex items-center justify-between p-3 border rounded-lg ${user && result.user_id === user.id ? 'bg-primary/20 border-primary' : 'bg-secondary/20'}`}
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={
                        index === 0 ? "default" : 
                        index === 1 ? "secondary" : 
                        index === 2 ? "outline" : 
                        "outline"
                      } 
                      className={`min-w-[30px] justify-center text-lg font-bold ${
                        index === 0 ? "bg-yellow-500 text-yellow-900" : 
                        index === 1 ? "bg-gray-400 text-gray-900" :     
                        index === 2 ? "bg-orange-600 text-white" :       
                        ""
                      }`}
                    >
                      {index + 1}
                    </Badge>
                    <span className="font-semibold text-lg">{result.profiles?.username || "Anonymous"}</span>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-gradient-primary text-primary-foreground text-base">
                      {result.accuracy}% Accuracy
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">{result.correct}/{result.total} words</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}