// File: /supabase/functions/create-race/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Helper to create an alphagram from a word
function getAlphagram(word: string): string {
  return word.toUpperCase().split("").sort().join("");
}

Deno.serve(async (req) => {
  // This is needed for browser clients to call the function
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase clients
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the user who is making the request
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get the race options from the request body
    const { wordLength, duration, maxParticipants } = await req.json();

    // --- Find a random word that matches the filters ---
    let query = supabaseAdmin.from('words').select('word', { count: 'exact' });

    if (wordLength && wordLength !== 'any') {
      query = query.eq('length', Number(wordLength));
    }

    const { data: words, error: queryError, count } = await query;
    if (queryError || !words || count === 0) {
      throw new Error("No words found matching your criteria.");
    }

    const randomIndex = Math.floor(Math.random() * count);
    const { data: randomWordData, error: randomWordError } = await query.range(randomIndex, randomIndex).single();
    if (randomWordError || !randomWordData) {
      throw new Error("Could not select a random word.");
    }
    
    const alphagram = getAlphagram(randomWordData.word);
    
    // --- Create the new race in the database ---
    const { data: newRace, error: insertError } = await supabaseAdmin
      .from('races')
      .insert({
        creator_id: user.id,
        alphagram: alphagram,
        word_length: wordLength === 'any' ? null : Number(wordLength),
        duration_seconds: duration,
        max_participants: maxParticipants,
        status: 'waiting', // The race starts as 'waiting'
      })
      .select('id')
      .single();

    if (insertError || !newRace) {
      throw new Error("Could not create the race.");
    }

    // Return the ID of the new race
    return new Response(JSON.stringify({ raceId: newRace.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});