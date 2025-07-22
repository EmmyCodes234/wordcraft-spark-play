// src/pages/PublicDecksPage.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Award, BrainCircuit, Search, Share2, Loader2, FilePlus2 } from "lucide-react";

function getWordsFromDeck(deckWords: string | string[] | null | undefined): string[] {
    if (typeof deckWords === 'string') {
        return deckWords ? deckWords.split(',') : [];
    }
    if (Array.isArray(deckWords)) {
        return deckWords;
    }
    return [];
}

interface PublicDeck {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  profiles: { // Frontend expects this structure after manual join
    username: string;
  } | null;
}

export default function PublicDecksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [publicDecks, setPublicDecks] = useState<PublicDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Debugging log to confirm useEffect is running
    console.log("PublicDecksPage: useEffect is running!"); 

    const fetchPublicDecks = async () => {
      setLoading(true);
      setError(null);
      // Debugging log to confirm fetch function starts
      console.log("PublicDecksPage: fetchPublicDecks is starting!"); 

      try {
        // --- Client-Side Join Fix: Step 1 - Fetch decks without profile join ---
        let query = supabase
          .from('flashcard_decks')
          .select(`
            id,
            name,
            description,
            user_id,
            created_at,
            is_public
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.ilike('name', `%${searchTerm}%`);
        }

        const { data: decksData, error: fetchError } = await query;
        console.log("PublicDecksPage: First fetch (decksData) result:", decksData, "error:", fetchError); 

        if (fetchError) {
          console.error("PublicDecksPage: Error fetching public decks (main query):", fetchError);
          setError("Failed to load public decks. Please try again.");
          setLoading(false);
          return;
        }

        if (!decksData || decksData.length === 0) {
          setPublicDecks([]);
          setLoading(false);
          console.log("PublicDecksPage: No decks data found."); 
          return;
        }

        // --- Client-Side Join Fix: Step 2 - Fetch associated profiles separately ---
        const uniqueUserIds = [...new Set(decksData.map(deck => deck.user_id))];
        console.log("PublicDecksPage: Unique User IDs for profile fetch:", uniqueUserIds); 

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', uniqueUserIds);

        console.log("PublicDecksPage: Second fetch (profilesData) result:", profilesData, "error:", profilesError); 

        if (profilesError) {
          console.error("PublicDecksPage: Error fetching profiles for public decks:", profilesError);
          // Continue with anonymous names if profiles can't be fetched
        }

        const profileMap = new Map<string, string>();
        profilesData?.forEach(profile => profileMap.set(profile.id, profile.username));

        // --- Client-Side Join Fix: Step 3 - Manually merge profile data into decks ---
        const mergedDecks = decksData.map(deck => ({
          ...deck,
          profiles: {
            username: profileMap.get(deck.user_id) || 'Anonymous' // Fallback to Anonymous
          }
        }));

        setPublicDecks(mergedDecks as PublicDeck[] || []);
        setLoading(false);
        console.log("PublicDecksPage: Decks set, loading false. Total decks:", (mergedDecks as PublicDeck[]).length); 

      } catch (err) {
        console.error("PublicDecksPage: Uncaught error in fetchPublicDecks:", err);
        setError("An unexpected error occurred. Check console for details.");
        setLoading(false);
      }
    };

    const handler = setTimeout(() => {
        fetchPublicDecks();
    }, 300);

    return () => clearTimeout(handler);

  }, [searchTerm]);

  const handleAddDeckToMyCollection = async (deck: PublicDeck) => {
    if (!user) {
      alert("Please log in to save decks to your collection.");
      return;
    }

    const { data: deckData, error: fetchWordsError } = await supabase
      .from('flashcard_decks')
      .select('words')
      .eq('id', deck.id)
      .single();

    if (fetchWordsError || !deckData) {
        console.error("Error fetching full words for deck:", fetchWordsError);
        alert("Failed to save deck: could not retrieve full deck content.");
        return;
    }

    const wordsToSave = getWordsFromDeck(deckData.words);

    const { error: insertError } = await supabase.from("flashcard_decks").insert([
      {
        user_id: user.id,
        profile_id: user.id, // Assuming user.id is same as profile.id for consistency
        name: `${deck.name} (Copy)`,
        words: wordsToSave,
        is_public: false,
        description: `Copied from "${deck.name}" by ${deck.profiles?.username || 'a community user'}`
      }
    ]);

    if (insertError) {
      console.error("Error saving public deck copy:", insertError);
      if (insertError.code === '23505') {
          alert(`You already have a deck named "${deck.name} (Copy)".`);
      } else {
          alert("Failed to save deck copy. Please try again.");
      }
    } else {
      alert(`"${deck.name}" added to your collection!`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle dark:bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <Share2 className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">Community Decks</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Browse and play quiz decks shared by other users!</p>
        </div>

        <Card className="max-w-4xl mx-auto border shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" /> Browse Decks
              {loading && <Loader2 className="ml-2 h-5 w-5 animate-spin text-primary" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search deck names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-gray-900 border-gray-700 text-base"
              disabled={loading}
            />
            {error && <p className="text-red-500 text-center">{error}</p>}
            {!loading && publicDecks.length === 0 && !error && (
              <p className="text-muted-foreground text-center py-4">No public decks found. Be the first to share one!</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {publicDecks.map(deck => (
                <Card key={deck.id} className="flex flex-col justify-between">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base truncate">{deck.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">by {deck.profiles?.username || 'Anonymous'}</p>
                    {deck.description && <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{deck.description}</p>}
                  </CardHeader>
                  <CardContent className="flex-grow p-4 pt-0 text-xs text-muted-foreground">
                    Contains words
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                    <Button
                      className="w-full h-10"
                      variant="outline"
                      onClick={() => navigate(`/quiz?deckId=${deck.id}`)}
                    >
                      <Award className="mr-2 h-4 w-4" /> Play Quiz
                    </Button>
                    {user && user.id !== deck.user_id && (
                      <Button
                        className="w-full h-10"
                        variant="secondary"
                        onClick={() => handleAddDeckToMyCollection(deck)}
                      >
                        <FilePlus2 className="mr-2 h-4 w-4" /> Add to My Decks
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}