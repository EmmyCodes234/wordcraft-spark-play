import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XPBadge } from '@/components/ui/xp-badge';
import { BookPlus, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface SaveToStudyDeckProps {
  words: string[];
  onSaved?: () => void;
}

export function SaveToStudyDeck({ words, onSaved }: SaveToStudyDeckProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to save words to your study deck.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      // First, check which words are already in the deck
      const { data: existingWords } = await supabase
        .from('cardbox')
        .select('word')
        .eq('user_id', user.id)
        .in('word', words);

      const existingWordsList = existingWords?.map(w => w.word) || [];
      const newWords = words.filter(word => !existingWordsList.includes(word.toUpperCase()));

      if (newWords.length === 0) {
        toast({
          title: "Already Saved",
          description: "All these words are already in your study deck!",
          variant: "default"
        });
        setSaving(false);
        return;
      }

      // Save new words
      const wordsToInsert = newWords.map(word => ({
        user_id: user.id,
        word: word.toUpperCase(),
        status: 'new' as const
      }));

      const { error } = await supabase
        .from('cardbox')
        .insert(wordsToInsert);

      if (error) throw error;

      setSaved(true);
      
      toast({
        title: "Words Saved! 🎉",
        description: (
          <div className="flex items-center gap-2">
            <span>Added {newWords.length} word{newWords.length > 1 ? 's' : ''} to your study deck</span>
            <XPBadge type="xp" value={newWords.length * 10} size="sm" />
          </div>
        )
      });

      onSaved?.();

      // Reset saved state after animation
      setTimeout(() => setSaved(false), 2000);

    } catch (error) {
      console.error('Error saving words:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save words to your study deck. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (words.length === 0) return null;

  return (
    <Card className="border border-primary/20 bg-gradient-subtle">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BookPlus className="h-5 w-5 text-primary" />
              <span className="font-medium">Save to Study Deck</span>
            </div>
            <div className="flex gap-1">
              {words.map(word => (
                <Badge key={word} variant="secondary" className="text-xs">
                  {word}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <XPBadge 
              type="xp" 
              value={words.length * 10} 
              label="XP"
              size="sm" 
              glowing
            />
            
            <Button
              onClick={handleSave}
              disabled={saving || saved}
              className={`transition-all duration-300 ${
                saved 
                  ? 'bg-success hover:bg-success text-success-foreground animate-pulse-glow' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : saving ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookPlus className="h-4 w-4 mr-2" />
                  Save Words
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}