// Word frequency and probability data for competitive word games
export interface WordFrequencyData {
  word: string;
  frequency: number;        // 1-100 scale (100 = most common)
  gameFrequency: number;    // Tournament appearance rate (0-100%)
  difficulty: 'common' | 'uncommon' | 'rare' | 'expert';
  scrabbleScore: number;    // Scrabble point value
  length: number;
}

// Common word patterns and their frequencies
export const FREQUENCY_PATTERNS = {
  // High frequency prefixes/suffixes
  highFreq: ['RE', 'UN', 'IN', 'ED', 'ER', 'ING', 'LY', 'EST'],
  mediumFreq: ['PRE', 'DIS', 'OVER', 'OUT', 'TION', 'ABLE', 'MENT'],
  lowFreq: ['ANTI', 'INTER', 'SUPER', 'NESS', 'WARD', 'SHIP']
};

// Calculate word frequency based on patterns and common usage
export function calculateWordFrequency(word: string): WordFrequencyData {
  const length = word.length;
  let frequency = 50; // Base frequency
  let gameFrequency = 30; // Base game frequency
  
  // Length-based frequency adjustments
  if (length <= 4) {
    frequency += 30;
    gameFrequency += 40;
  } else if (length <= 6) {
    frequency += 20;
    gameFrequency += 20;
  } else if (length <= 8) {
    frequency += 10;
    gameFrequency += 10;
  } else if (length >= 12) {
    frequency -= 30;
    gameFrequency -= 20;
  }
  
  // Pattern-based adjustments
  const upperWord = word.toUpperCase();
  
  // Check for common patterns
  FREQUENCY_PATTERNS.highFreq.forEach(pattern => {
    if (upperWord.includes(pattern)) {
      frequency += 15;
      gameFrequency += 10;
    }
  });
  
  FREQUENCY_PATTERNS.mediumFreq.forEach(pattern => {
    if (upperWord.includes(pattern)) {
      frequency += 8;
      gameFrequency += 5;
    }
  });
  
  FREQUENCY_PATTERNS.lowFreq.forEach(pattern => {
    if (upperWord.includes(pattern)) {
      frequency -= 10;
      gameFrequency -= 5;
    }
  });
  
  // Vowel density affects frequency
  const vowels = (upperWord.match(/[AEIOU]/g) || []).length;
  const vowelRatio = vowels / length;
  
  if (vowelRatio > 0.6) {
    frequency -= 15; // Vowel-heavy words are less common
  } else if (vowelRatio < 0.2) {
    frequency -= 20; // Consonant-heavy words are rare
  }
  
  // High-value letters reduce frequency
  const highValueLetters = (upperWord.match(/[JQXZ]/g) || []).length;
  frequency -= highValueLetters * 20;
  gameFrequency -= highValueLetters * 15;
  
  // Calculate Scrabble score
  const letterValues: { [key: string]: number } = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
    N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
  };
  
  const scrabbleScore = upperWord.split('').reduce((sum, letter) => {
    return sum + (letterValues[letter] || 0);
  }, 0);
  
  // Clamp values
  frequency = Math.max(1, Math.min(100, frequency));
  gameFrequency = Math.max(1, Math.min(100, gameFrequency));
  
  // Determine difficulty
  let difficulty: 'common' | 'uncommon' | 'rare' | 'expert';
  if (frequency >= 70) difficulty = 'common';
  else if (frequency >= 50) difficulty = 'uncommon';
  else if (frequency >= 25) difficulty = 'rare';
  else difficulty = 'expert';
  
  return {
    word,
    frequency,
    gameFrequency,
    difficulty,
    scrabbleScore,
    length
  };
}

// Predefined high-frequency words for better accuracy
export const HIGH_FREQUENCY_WORDS = new Set([
  'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE',
  'OUR', 'HAD', 'BY', 'WORD', 'WHAT', 'SAID', 'EACH', 'WHICH', 'SHE', 'DO', 'HOW',
  'THEIR', 'IF', 'WILL', 'UP', 'OTHER', 'ABOUT', 'OUT', 'MANY', 'THEN', 'THEM',
  'THESE', 'SO', 'SOME', 'HER', 'WOULD', 'MAKE', 'LIKE', 'INTO', 'HIM', 'HAS',
  'TWO', 'MORE', 'GO', 'NO', 'WAY', 'COULD', 'MY', 'THAN', 'FIRST', 'BEEN',
  'CALL', 'WHO', 'ITS', 'NOW', 'FIND', 'LONG', 'DOWN', 'DAY', 'DID', 'GET',
  'COME', 'MADE', 'MAY', 'PART'
]);

export const COMMON_GAME_WORDS = new Set([
  'QI', 'XI', 'XU', 'ZA', 'ZO', 'JO', 'KA', 'KI', 'OX', 'EX', 'AX', 'MY',
  'BY', 'OF', 'TO', 'IN', 'IT', 'IS', 'BE', 'AS', 'AT', 'SO', 'WE', 'HE',
  'ON', 'RE', 'OR', 'AN', 'IF', 'DO', 'GO', 'NO', 'UP', 'AM', 'US', 'OH',
  'AH', 'OW', 'OY', 'YE', 'YA', 'YO', 'SH', 'HM', 'UM', 'UH', 'ER', 'EH'
]);

// Enhanced frequency calculation with predefined lists
export function getEnhancedWordFrequency(word: string): WordFrequencyData {
  const baseData = calculateWordFrequency(word);
  const upperWord = word.toUpperCase();
  
  // Boost frequency for known high-frequency words
  if (HIGH_FREQUENCY_WORDS.has(upperWord)) {
    baseData.frequency = Math.min(100, baseData.frequency + 30);
    baseData.gameFrequency = Math.min(100, baseData.gameFrequency + 20);
    baseData.difficulty = 'common';
  }
  
  // Boost frequency for common game words
  if (COMMON_GAME_WORDS.has(upperWord)) {
    baseData.frequency = Math.min(100, baseData.frequency + 25);
    baseData.gameFrequency = Math.min(100, baseData.gameFrequency + 35);
    if (baseData.difficulty === 'expert' || baseData.difficulty === 'rare') {
      baseData.difficulty = 'uncommon';
    }
  }
  
  return baseData;
}