import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Check, ArrowLeft } from 'lucide-react'; // --- MODIFIED: Added ArrowLeft ---

export default function DeckOptionsPage() {
  const { deckId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deckName, setDeckName] = useState('');
  const [newCardsPerDay, setNewCardsPerDay] = useState(20);
  const [maxReviewsPerDay, setMaxReviewsPerDay] = useState(200);
  const [learningSteps, setLearningSteps] = useState('1 10');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      if (!user || !deckId) return;

      const { data: deckData } = await supabase
        .from('flashcard_decks')
        .select('name')
        .eq('id', deckId)
        .single();
      if (deckData) setDeckName(deckData.name);

      const { data, error } = await supabase
        .from('deck_options')
        .select('*')
        .eq('deck_id', deckId)
        .single();

      if (data) {
        setNewCardsPerDay(data.new_cards_per_day);
        setMaxReviewsPerDay(data.max_reviews_per_day);
        setLearningSteps(data.learning_steps_minutes);
      } else if (error && error.code !== 'PGRST116') {
        console.error("Error fetching deck options:", error);
      }
      setIsLoading(false);
    };
    fetchOptions();
  }, [deckId, user]);

  const handleSave = async () => {
    if (!user || !deckId) return;
    setIsSaving(true);

    const updates = {
      user_id: user.id,
      deck_id: deckId,
      new_cards_per_day: newCardsPerDay,
      max_reviews_per_day: maxReviewsPerDay,
      learning_steps_minutes: learningSteps,
      updated_at: new Date().toISOString(),
    };
    
    const { error } = await supabase.from('deck_options').upsert(updates, {
      onConflict: 'deck_id',
    });

    setIsSaving(false);
    if (error) {
      alert("Error saving settings: " + error.message);
    } else {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        {/* --- MODIFIED: Added a flex container and back button --- */}
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Deck Options: {deckName}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-muted-foreground">Configure the learning settings for this deck.</p>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Daily Limits</h3>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="new-cards">New Cards / Day</Label>
              <Input id="new-cards" type="number" value={newCardsPerDay} onChange={(e) => setNewCardsPerDay(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">The maximum number of new cards to introduce in a day.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-reviews">Max Reviews / Day</Label>
              <Input id="max-reviews" type="number" value={maxReviewsPerDay} onChange={(e) => setMaxReviewsPerDay(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">The maximum number of review cards to study in a day.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">New Cards</h3>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="learning-steps">Learning Steps (in minutes)</Label>
              <Input id="learning-steps" type="text" value={learningSteps} onChange={(e) => setLearningSteps(e.target.value)} />
              <p className="text-xs text-muted-foreground">A space-separated list of intervals. E.g., '1 10' means a new card is shown again in 1m, then 10m if you press 'Good'.</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {showSuccess ? <Check className="mr-2 h-4 w-4" /> : null}
              {isSaving ? "Saving..." : (showSuccess ? "Saved!" : "Save Settings")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}