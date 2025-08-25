import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/context/SessionContext";
import { XPBadge } from "@/components/ui/xp-badge";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Star, 
  AlertCircle, 
  Target,
  Edit3,
  Save,
  X,
  Trash2
} from "lucide-react";

// Simplified interface to match current database schema
interface StudyWord {
  id: string;
  user_id: string;
  words: string[];
  created_at: string;
}

// Local state for tracking study progress (not persisted to DB)
interface WordProgress {
  [wordId: string]: {
    status: "new" | "learning" | "reviewing" | "mastered" | "difficult";
    notes?: string;
    last_reviewed?: string;
    review_count: number;
  };
}

const statusConfig = {
  new: { label: "New", icon: BookOpen, color: "bg-gray-500", xp: 0 },
  learning: { label: "Learning", icon: Clock, color: "bg-blue-500", xp: 5 },
  reviewing: { label: "Reviewing", icon: AlertCircle, color: "bg-yellow-500", xp: 10 },
  mastered: { label: "Mastered", icon: CheckCircle, color: "bg-green-500", xp: 20 },
  difficult: { label: "Difficult", icon: Target, color: "bg-red-500", xp: 15 },
};

export default function StudyDeckSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { session, setSession } = useSession();
  const [deck, setDeck] = useState<StudyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  
  // Local progress tracking (not persisted to DB due to schema limitations)
  const [wordProgress, setWordProgress] = useState<WordProgress>({});

  useEffect(() => {
    if (!user) return;
    fetchDeck();
  }, [user]);

  const fetchDeck = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cardbox")
      .select("id, user_id, words, created_at")
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
      // Initialize progress for new words
      const newProgress: WordProgress = {};
      data?.forEach(item => {
        if (!wordProgress[item.id]) {
          newProgress[item.id] = {
            status: "new",
            review_count: 0
          };
        }
      });
      setWordProgress(prev => ({ ...prev, ...newProgress }));
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: WordProgress[string]["status"]) => {
    const progress = wordProgress[id];
    if (!progress) return;

    const statusConf = statusConfig[newStatus];
    const xpEarned = statusConf.xp;

    // Update local progress (not persisted to DB due to schema limitations)
    setWordProgress(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: newStatus,
        last_reviewed: new Date().toISOString(),
        review_count: (prev[id]?.review_count || 0) + 1
      }
    }));
    
    setSession(prev => ({
      ...prev,
      total_studied: (prev.total_studied || 0) + 1,
      correct_answers: newStatus === 'mastered' ? (prev.correct_answers || 0) + 1 : (prev.correct_answers || 0),
      xp_earned: (prev.xp_earned || 0) + xpEarned
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
  };

  const updateNotes = async (id: string, notes: string) => {
    // Update local progress (not persisted to DB due to schema limitations)
    setWordProgress(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        notes
      }
    }));
    
    setEditingNote(null);
    toast({
      title: "Notes Saved",
      description: "Your notes have been saved successfully."
    });
  };

  const deleteDeck = async (id: string) => {
    const { error } = await supabase
      .from("cardbox")
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id);

    if (error) {
      console.error("Failed to delete deck:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete deck. Please try again.",
        variant: "destructive"
      });
    } else {
      setDeck(prev => prev.filter(deck => deck.id !== id));
      // Remove from local progress tracking
      setWordProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[id];
        return newProgress;
      });
      toast({
        title: "Deck Deleted",
        description: "Deck has been deleted successfully."
      });
    }
  };

  const getStatusCounts = () => {
    return {
      new: Object.values(wordProgress).filter(w => w.status === 'new').length,
      learning: Object.values(wordProgress).filter(w => w.status === 'learning').length,
      reviewing: Object.values(wordProgress).filter(w => w.status === 'reviewing').length,
      mastered: Object.values(wordProgress).filter(w => w.status === 'mastered').length,
      difficult: Object.values(wordProgress).filter(w => w.status === 'difficult').length,
    };
  };

  const getProgressPercentage = () => {
    const total = Object.keys(wordProgress).length;
    if (total === 0) return 0;
    const mastered = Object.values(wordProgress).filter(w => w.status === 'mastered').length;
    return Math.round((mastered / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const progressPercentage = getProgressPercentage();

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Study Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {statusCounts.mastered} of {Object.keys(wordProgress).length} words mastered
          </div>

          {/* Status Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Status Breakdown</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusCounts).map(([status, count]) => {
                const config = statusConfig[status as keyof typeof statusConfig];
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${config.color}`} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Words</h3>
        {deck.map((entry) => {
          const progress = wordProgress[entry.id] || { status: 'new', review_count: 0 };
          const config = statusConfig[progress.status];
          
          return (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={config.color}>
                        {config.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {entry.words.length} words
                      </span>
                    </div>
                    
                                         <div className="flex items-center justify-between mb-2">
                       <div className="text-sm text-muted-foreground">
                         Added: {new Date(entry.created_at).toLocaleDateString()}
                       </div>
                       <Button
                         size="sm"
                         variant="ghost"
                         className="text-destructive hover:text-destructive"
                         onClick={() => deleteDeck(entry.id)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>

                    {/* Notes Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Personal Notes</span>
                        {editingNote === entry.id ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateNotes(entry.id, noteText)}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNote(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingNote(entry.id);
                              setNoteText(progress.notes || "");
                            }}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      
                      {editingNote === entry.id ? (
                        <Textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add your notes, mnemonics, or tips..."
                          className="min-h-[80px]"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                          {progress.notes || "No notes yet. Click edit to add some!"}
                        </div>
                      )}
                    </div>

                    {/* Status Actions */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {Object.entries(statusConfig).map(([status, conf]) => {
                        const StatusIcon = conf.icon;
                        const isActive = progress.status === status;
                        
                        return (
                          <Button
                            key={status}
                            size="sm"
                            variant={isActive ? "default" : "outline"}
                            onClick={() => updateStatus(entry.id, status as WordProgress[string]["status"])}
                            className={`${isActive ? conf.color : ""}`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {conf.label}
                          </Button>
                        );
                      })}
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      <div>Reviewed {progress.review_count} times</div>
                      {progress.last_reviewed && (
                        <div>Last: {new Date(progress.last_reviewed).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Schema Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Note: Limited Functionality</p>
              <p>
                Due to database schema limitations, study progress (status, notes, review counts) 
                is stored locally and will be reset when you refresh the page. 
                To enable full functionality, the database schema needs to be updated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}