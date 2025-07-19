// Scrabble tile values and utilities
export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

export function calculateWordScore(word: string): number {
  return word.toUpperCase().split('').reduce((total, letter) => {
    return total + (LETTER_VALUES[letter] || 0);
  }, 0);
}

export function getLetterBreakdown(word: string) {
  return word.toUpperCase().split('').map(letter => ({
    letter,
    value: LETTER_VALUES[letter] || 0,
    difficulty: getLetterDifficulty(LETTER_VALUES[letter] || 0)
  }));
}

export function getLetterDifficulty(value: number): 'easy' | 'medium' | 'hard' | 'extreme' {
  if (value >= 8) return 'extreme';
  if (value >= 4) return 'hard';
  if (value >= 2) return 'medium';
  return 'easy';
}

export function findHooks(word: string, dictionary: Set<string>): { front: string[], back: string[] } {
  const front: string[] = [];
  const back: string[] = [];
  
  // Front hooks - adding letters to the beginning
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const newWord = letter + word;
    if (dictionary.has(newWord)) {
      front.push(letter);
    }
  }
  
  // Back hooks - adding letters to the end
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const newWord = word + letter;
    if (dictionary.has(newWord)) {
      back.push(letter);
    }
  }
  
  return { front, back };
}

export function findAnagrams(word: string, dictionary: Set<string>): string[] {
  const letters = word.toUpperCase().split('').sort();
  const anagrams: string[] = [];
  
  for (const dictWord of dictionary) {
    if (dictWord.length === word.length && dictWord !== word.toUpperCase()) {
      const dictLetters = dictWord.split('').sort();
      if (letters.join('') === dictLetters.join('')) {
        anagrams.push(dictWord);
      }
    }
  }
  
  return anagrams.slice(0, 20); // Limit to 20 anagrams
}