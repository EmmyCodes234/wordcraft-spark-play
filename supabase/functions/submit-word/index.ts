// File: /supabase/functions/submit-word/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helper function to get an alphagram
function getAlphagram(word: string): string {
  return word.toUpperCase().split("").sort().join("");
}

Deno.serve(async (req) => {
  // 1. Set up clients for auth and database access
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  // 2. Get user and request body
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { raceId, word } = await req.json();
  const upperWord = word.toUpperCase();

  try {
    // 3. Fetch the current race details
    const { data: race, error: raceError } = await supabaseAdmin
      .from('races')
      .select('alphagram, status, end_time')
      .eq('id', raceId)
      .single();

    if (raceError || !race) throw new Error('Race not found.');

    // 4. Run validation checks
    if (race.status !== 'in_progress') throw new Error('Race is not in progress.');
    if (new Date() > new Date(race.end_time)) throw new Error('Race has finished.');
    if (getAlphagram(upperWord) !== race.alphagram) throw new Error('Word does not match the alphagram.');

    // 5. Check if word is in the dictionary
    const { data: dictWord, error: dictError } = await supabaseAdmin
      .from('words')
      .select('word')
      .eq('word', upperWord)
      .single();

    if (dictError || !dictWord) throw new Error('Invalid word.');

    // 6. Update score (this will broadcast via Realtime)
    // The RLS policy we created ensures a user can only update their own record.
    const { error: updateError } = await supabase
      .rpc('increment_score', { 
        race_id_param: raceId, 
        user_id_param: user.id 
      });

    if (updateError) throw new Error('You may have already submitted this word.');

    return new Response(JSON.stringify({ success: true, word: upperWord }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
});