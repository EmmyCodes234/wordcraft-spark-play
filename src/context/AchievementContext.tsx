import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Star, 
  Crown, 
  Zap, 
  Target, 
  Flame, 
  Award, 
  Medal,
  TrendingUp,
  Clock,
  BookOpen,
  Gamepad2
} from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'racing' | 'words' | 'streaks' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (stats: UserStats) => boolean;
  reward: {
    xp: number;
    title?: string;
    badge?: string;
  };
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface UserStats {
  totalWords: number;
  rareWords: number;
  bestStreak: number;
  currentStreak: number;
  totalScore: number;
  averageRank: number;
  perfectRounds: number;
  achievementsUnlocked: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Word Achievements
  {
    id: 'word_finder',
    name: 'Word Finder',
    description: 'Find 100 words across all races',
    icon: BookOpen,
    category: 'words',
    rarity: 'common',
    condition: (stats) => stats.totalWords >= 100,
    reward: { xp: 300 }
  },
  {
    id: 'lexicon_master',
    name: 'Lexicon Master',
    description: 'Find 1000 words across all races',
    icon: Star,
    category: 'words',
    rarity: 'epic',
    condition: (stats) => stats.totalWords >= 1000,
    reward: { xp: 2500, title: 'Lexicon Master' }
  },
  {
    id: 'rare_hunter',
    name: 'Rare Hunter',
    description: 'Find 50 rare words',
    icon: Target,
    category: 'words',
    rarity: 'rare',
    condition: (stats) => stats.rareWords >= 50,
    reward: { xp: 800, title: 'Rare Hunter' }
  },
  
  // Streak Achievements
  {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Achieve a 5-word streak',
    icon: Flame,
    category: 'streaks',
    rarity: 'common',
    condition: (stats) => stats.bestStreak >= 5,
    reward: { xp: 150 }
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Achieve a 20-word streak',
    icon: Flame,
    category: 'streaks',
    rarity: 'epic',
    condition: (stats) => stats.bestStreak >= 20,
    reward: { xp: 1000, title: 'Streak Master' }
  },
  
  // Speed Achievements
  // Removed race-related speed achievements
  
  // Special Achievements
  {
    id: 'perfect_round',
    name: 'Perfect Round',
    description: 'Complete a round finding all possible words',
    icon: Award,
    category: 'special',
    rarity: 'epic',
    condition: (stats) => stats.perfectRounds >= 1,
    reward: { xp: 1200, title: 'Perfectionist' }
  },
  {
    id: 'achievement_hunter',
    name: 'Achievement Hunter',
    description: 'Unlock 10 achievements',
    icon: Star,
    category: 'special',
    rarity: 'rare',
    condition: (stats) => stats.achievementsUnlocked >= 10,
    reward: { xp: 1000, title: 'Achievement Hunter' }
  }
];

interface AchievementContextType {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  userStats: UserStats;
  unlockedAchievements: Achievement[];
  checkAchievements: (newStats: Partial<UserStats>) => Promise<Achievement[]>;
  updateStats: (statUpdates: Partial<UserStats>) => Promise<void>;
  getProgress: (achievementId: string) => number;
  isUnlocked: (achievementId: string) => boolean;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalWords: 0,
    rareWords: 0,
    bestStreak: 0,
    currentStreak: 0,
    totalScore: 0,
    averageRank: 0,
    perfectRounds: 0,
    achievementsUnlocked: 0
  });
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  // Load user achievements and stats
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;

      try {
        // Load achievements
        const { data: achievements } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', user.id);

        if (achievements) {
          setUserAchievements(achievements);
        }

        // Load stats
        const { data: stats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (stats) {
          setUserStats({
            totalWords: stats.total_words || 0,
            rareWords: stats.rare_words || 0,
            bestStreak: stats.best_streak || 0,
            currentStreak: stats.current_streak || 0,
            totalScore: stats.total_score || 0,
            averageRank: stats.average_rank || 0,
            perfectRounds: stats.perfect_rounds || 0,
            achievementsUnlocked: achievements?.length || 0
          });
        }
      } catch (error) {
        console.error('Error loading user achievements:', error);
      }
    };

    loadUserData();
  }, [user?.id]);

  const checkAchievements = async (newStats: Partial<UserStats>): Promise<Achievement[]> => {
    if (!user?.id) return [];

    const updatedStats = { ...userStats, ...newStats };
    const newlyUnlockedAchievements: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      const isAlreadyUnlocked = userAchievements.some(ua => ua.achievementId === achievement.id);
      
      if (!isAlreadyUnlocked && achievement.condition(updatedStats)) {
        newlyUnlockedAchievements.push(achievement);
        
        // Save to database
        try {
          await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
              unlocked_at: new Date().toISOString(),
              progress: achievement.maxProgress || 100
            });
        } catch (error) {
          console.error('Error saving achievement:', error);
        }
      }
    }

    if (newlyUnlockedAchievements.length > 0) {
      setNewlyUnlocked(newlyUnlockedAchievements);
      
      // Show achievement notifications
      newlyUnlockedAchievements.forEach(achievement => {
        toast({
          title: "🏆 Achievement Unlocked!",
          description: `${achievement.name}: ${achievement.description}`,
          variant: "default",
        });
      });

      // Auto-hide after 5 seconds
      setTimeout(() => setNewlyUnlocked([]), 5000);
    }

    return newlyUnlockedAchievements;
  };

  const updateStats = async (statUpdates: Partial<UserStats>) => {
    if (!user?.id) return;

    const newStats = { ...userStats, ...statUpdates };
    setUserStats(newStats);

    // Save to database
    try {
      await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          total_words: newStats.totalWords,
          rare_words: newStats.rareWords,
          best_streak: newStats.bestStreak,
          current_streak: newStats.currentStreak,
          total_score: newStats.totalScore,
          average_rank: newStats.averageRank,
          perfect_rounds: newStats.perfectRounds,
          achievements_unlocked: newStats.achievementsUnlocked
        }, { onConflict: 'user_id' });

      // Check for new achievements
      await checkAchievements(statUpdates);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const getProgress = (achievementId: string): number => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return 0;

    const userAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
    if (userAchievement) return 100;

    // Calculate progress based on current stats
    if (achievement.maxProgress) {
      // For progressive achievements, calculate percentage
      return Math.min(100, (achievement.progress || 0) / achievement.maxProgress * 100);
    }

    return 0;
  };

  const isUnlocked = (achievementId: string): boolean => {
    return userAchievements.some(ua => ua.achievementId === achievementId);
  };

  const unlockedAchievements = ACHIEVEMENTS.filter(a => isUnlocked(a.id));

  return (
    <AchievementContext.Provider value={{
      achievements: ACHIEVEMENTS,
      userAchievements,
      userStats,
      unlockedAchievements,
      checkAchievements,
      updateStats,
      getProgress,
      isUnlocked
    }}>
      {children}
      
      {/* Achievement Notification Overlay */}
      <AnimatePresence>
        {newlyUnlocked.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ delay: index * 0.2 }}
            className="fixed bottom-4 right-4 z-[100] max-w-sm"
          >
            <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <achievement.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm">🏆 Achievement Unlocked!</h4>
                      <Badge variant="outline" className={`text-xs ${
                        achievement.rarity === 'legendary' ? 'border-yellow-500 text-yellow-600' :
                        achievement.rarity === 'epic' ? 'border-purple-500 text-purple-600' :
                        achievement.rarity === 'rare' ? 'border-blue-500 text-blue-600' :
                        'border-green-500 text-green-600'
                      }`}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="font-semibold text-primary">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs text-primary font-medium">+{achievement.reward.xp} XP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};