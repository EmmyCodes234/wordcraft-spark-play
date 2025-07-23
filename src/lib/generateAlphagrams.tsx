import { supabase } from '@/lib/supabaseClient';

export default async function generateAlphagrams(raceType: string, count = 20): Promise<string[]> {
  const lengthMap: Record<string, number> = {
    threes: 3,
    fours: 4,
    fives: 5,
    sixes: 6,
    sevens: 7,
    eights: 8,
    nines: 9,
  };

  const wordLength = lengthMap[raceType];

  if (!wordLength) throw new Error('Invalid race type');

  const { data, error } = await supabase.rpc('get_random_alphagrams_by_length', {
    word_length: wordLength,
    limit_count: count,
  });

  if (error) {
    console.error('Failed to generate alphagrams:', error);
    return [];
  }

  return data || [];
}
