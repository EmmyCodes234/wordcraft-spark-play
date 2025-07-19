import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { XPBadge } from "@/components/ui/xp-badge";
import { 
  Check, X, Star, Loader, Brain, Target, Clock, 
  TrendingUp, BookOpen, Edit3, Save, Plus
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { calculateWordScore } from "@/lib/scrabbleUtils";
import { cn } from "@/lib/utils";

interface StudyWord {
  id: number;
  word: string;
  status: "new" | "learning" | "reviewing" | "mastered" | "difficult";
  notes?: string;
  last_reviewed?: string;
  review_count: number;
  success_rate: number;
  created_at: string;
}

interface StudySession {
  total_studied: number;
  correct_answers: number;
  xp_earned: number;
  time_spent: number;
}

const statusConfig = {
  new: { 
    color: 'bg-new/20 text-new border-new/30', 
    label: 'New', 
    icon: Plus,
    gradient: 'bg-gradient-subtle',
    xp: 5
  },
  learning: { 
    color: 'bg-learning/20 text-learning border-learning/30', 
    label: 'Learning', 
    icon: Brain,
    gradient: 'bg-gradient-quiz',
    xp: 10
  },
  reviewing: { 
    color: 'bg-warning/20 text-warning border-warning/30', 
    label: 'Reviewing', 
    icon: Clock,
    gradient: 'bg-gradient-xp',
    xp: 15
  },
  mastered: { 
    color: 'bg-mastered/20 text-mastered border-mastered/30', 
    label: 'Mastered', 
    icon: Check,
    gradient: 'bg-gradient-success',
    xp: 25
  },
  difficult: { 
    color: 'bg-difficult/20 text-difficult border-difficult/30', 
    label: 'Difficult', 
    icon: Target,
    gradient: 'bg-gradient-streak',
    xp: 30
  }
};

export default function StudyDeckSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deck, setDeck] = useState<StudyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [session, setSession] = useState<StudySession>({
    total_studied: 0,
    correct_answers: 0,
    xp_earned: 0,
    time_spent: 0
  });

  useEffect(() => {
    if (!user) return;
    fetchDeck();
  }, [user]);

  const fetchDeck = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cardbox")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading deck:", error);
      toast({
        title: "Load Failed",
        description: "Failed to load your study deck.",
        variant: "destructive"
      });
    } else {
      setDeck(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: number, newStatus: StudyWord["status"]) => {
    const word = deck.find(w => w.id === id);
    if (!word) return;

    const statusConf = statusConfig[newStatus];
    const xpEarned = statusConf.xp;

    const { error } = await supabase
      .from("cardbox")
      .update({ 
        status: newStatus,
        last_reviewed: new Date().toISOString(),
        review_count: word.review_count + 1
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update word status.",
        variant: "destructive"
      });
    } else {
      setDeck((prev) =>
        prev.map((w) => w.id === id ? { 
          ...w, 
          status: newStatus,
          last_reviewed: new Date().toISOString(),
          review_count: w.review_count + 1
        } : w)
      );
      
      setSession(prev => ({
        ...prev,
        total_studied: prev.total_studied + 1,
        correct_answers: newStatus === 'mastered' ? prev.correct_answers + 1 : prev.correct_answers,
        xp_earned: prev.xp_earned + xpEarned
      }));

      toast({
        title: "Status Updated! 🎉",
        description: (
          <div className="flex items-center gap-2">
            <span>Word marked as {statusConf.label}</span>
            <XPBadge type="xp" value={xpEarned} size="sm" />
          </div>
        )
      });
    }
  };

  const updateNotes = async (id: number, notes: string) => {
    const { error } = await supabase
      .from("cardbox")
      .update({ notes })
      .eq("id", id);

    if (error) {
      console.error("Failed to update notes:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save notes.",
        variant: "destructive"
      });
    } else {
      setDeck((prev) =>
        prev.map((w) => w.id === id ? { ...w, notes } : w)
      );
      setEditingNote(null);
      toast({
        title: "Notes Saved",
        description: "Your notes have been saved successfully."
      });
    }
  };

  const removeWord = async (id: number) => {
    const { error } = await supabase
      .from("cardbox")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to remove word:", error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove word from deck.",
        variant: "destructive"
      });
    } else {
      setDeck((prev) => prev.filter((w) => w.id !== id));
      toast({
        title: "Word Removed",
        description: "Word has been removed from your study deck."
      });
    }
  };

  const getStatusCounts = () => {
    return {
      new: deck.filter(w => w.status === 'new').length,
      learning: deck.filter(w => w.status === 'learning').length,
      reviewing: deck.filter(w => w.status === 'reviewing').length,
      mastered: deck.filter(w => w.status === 'mastered').length,
      difficult: deck.filter(w => w.status === 'difficult').length,
    };
  };

  const getOverallProgress = () => {
    const total = deck.length;
    const mastered = deck.filter(w => w.status === 'mastered').length;
    return total ? (mastered / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const progress = getOverallProgress();

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header with Session Stats */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Study Deck
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Master your vocabulary with our spaced repetition system. Track progress and build your word knowledge systematically.
        </p>
        
        {session.total_studied > 0 && (
          <div className="flex justify-center gap-4">
            <XPBadge type="xp" value={session.xp_earned} label="XP earned" size="lg" glowing />
            <Badge variant="outline" className="text-lg px-4 py-2">
              {session.total_studied} words studied
            </Badge>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border shadow-card col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{Math.round(progress)}%</div>
              <div className="text-sm text-muted-foreground">Mastered</div>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="text-center text-sm text-muted-foreground">
              {statusCounts.mastered} of {deck.length} words mastered
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const config = statusConfig[status as keyof typeof statusConfig];
              const Icon = config.icon;
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="capitalize">{config.label}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Word Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deck.map((entry) => {
          const config = statusConfig[entry.status];
          const Icon = config.icon;
          const wordScore = calculateWordScore(entry.word);
          
          return (
            <Card 
              key={entry.id} 
              className={cn(
                "border shadow-word-card transition-all duration-300 hover:scale-[1.02] hover:shadow-float",
                config.color
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold tracking-wider">
                      {entry.word}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {wordScore} pts
                    </Badge>
                  </div>
                  <Badge className={cn("capitalize", config.color)}>
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Notes Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Personal Notes</span>
                    {editingNote === entry.id ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateNotes(entry.id, noteText)}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingNote(entry.id);
                          setNoteText(entry.notes || "");
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {editingNote === entry.id ? (
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add your notes, mnemonics, or tips..."
                      className="text-sm"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded min-h-[60px]">
                      {entry.notes || "No notes yet. Click edit to add some!"}
                    </p>
                  )}
                </div>

                {/* Status Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusConfig).map(([status, conf]) => {
                    const StatusIcon = conf.icon;
                    const isActive = entry.status === status;
                    
                    return (
                      <Button
                        key={status}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStatus(entry.id, status as StudyWord["status"])}
                        className={cn(
                          "text-xs",
                          isActive && conf.gradient
                        )}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {conf.label}
                      </Button>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Reviewed {entry.review_count} times</div>
                  {entry.last_reviewed && (
                    <div>Last: {new Date(entry.last_reviewed).toLocaleDateString()}</div>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeWord(entry.id)}
                  className="w-full"
                >
                  Remove from Deck
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {deck.length === 0 && (
        <Card className="border shadow-card">
          <CardContent className="p-12 text-center space-y-4">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto" />
            <h3 className="text-2xl font-bold">Your Study Deck is Empty</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start building your vocabulary by saving words from the Word Judge, Anagram Solver, or Pattern Matcher!
            </p>
            <Button className="bg-gradient-primary hover:opacity-90">
              Explore Word Tools
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}