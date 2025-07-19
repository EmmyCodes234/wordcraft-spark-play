
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";

export function SaveToStudyDeck({ word }: { word: string }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deckName, setDeckName] = useState("Default");

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Not logged in", description: "You must be logged in to save words." });
      return;
    }

    setSaving(true);

    try {
      const { data: deck, error } = await supabase
        .from("decks")
        .select("*")
        .eq("name", deckName)
        .eq("user_id", user.id)
        .single();

      let deckId = deck?.id;

      if (!deck) {
        const { data: newDeck, error: deckError } = await supabase
          .from("decks")
          .insert({ name: deckName, user_id: user.id })
          .select()
          .single();

        if (deckError) throw deckError;
        deckId = newDeck.id;
      }

      const { error: insertError } = await supabase.from("deck_words").insert({
        deck_id: deckId,
        word,
      });

      if (insertError) throw insertError;

      toast({ title: "Word saved", description: `"${word}" added to ${deckName}` });
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Error", description: "Could not save the word." });
    }

    setSaving(false);
  };

  return (
    <div className="mt-4 flex gap-3 items-center">
      <input
        className="px-2 py-1 border rounded text-sm"
        value={deckName}
        onChange={(e) => setDeckName(e.target.value)}
        placeholder="Deck name"
      />
      <Button size="sm" disabled={saving} onClick={handleSave}>
        {saving ? "Saving..." : "Save to Deck"}
      </Button>
    </div>
  );
}
