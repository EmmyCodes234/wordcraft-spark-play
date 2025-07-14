import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X, Star, Loader } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

interface StudyWord {
  id: number;
  word: string;
  status: "reviewing" | "mastered" | "difficult";
}

export default function StudyDeck() {
  const { user } = useAuth();
  const [deck, setDeck] = useState<StudyWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDeck = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("cardbox")
        .select("id, word, status")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error loading deck:", error);
      } else {
        setDeck(data || []);
      }
      setLoading(false);
    };

    fetchDeck();
  }, [user]);

  const updateStatus = async (id: number, newStatus: StudyWord["status"]) => {
    const { error } = await supabase
      .from("cardbox")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Failed to update status:", error);
    } else {
      setDeck((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
      );
    }
  };

  const removeWord = async (id: number) => {
    const { error } = await supabase
      .from("cardbox")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to remove word:", error);
    } else {
      setDeck((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const masteredCount = deck.filter((w) => w.status === "mastered").length;
  const progress = deck.length ? (masteredCount / deck.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          My Study Deck
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Track your saved words and monitor your progress toward mastery.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto border shadow-card">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-4" />
          <p className="text-center mt-2 text-sm text-muted-foreground">
            {Math.round(progress)}% mastered
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deck.map((entry) => (
          <Card key={entry.id} className="border shadow-card transition hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="font-mono">{entry.word}</span>
                <Badge variant="outline" className="capitalize text-xs">
                  {entry.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={entry.status === "mastered" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus(entry.id, "mastered")}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mastered
                </Button>
                <Button
                  variant={entry.status === "reviewing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus(entry.id, "reviewing")}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Reviewing
                </Button>
                <Button
                  variant={entry.status === "difficult" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateStatus(entry.id, "difficult")}
                >
                  <X className="h-4 w-4 mr-1" />
                  Difficult
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeWord(entry.id)}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {deck.length === 0 && !loading && (
        <p className="text-center text-muted-foreground">
          Your study deck is empty. Start adding some words!
        </p>
      )}
    </div>
  );
}
