// src/workers/dictionaryWorker.ts

// Declare self as DedicatedWorkerGlobalScope for web workers
declare const self: DedicatedWorkerGlobalScope;

let wordSet: Set<string> | null = null; // Store the dictionary in the worker
let wordFrequencyMap: Map<string, any> | null = null; // Store frequency data

// Utility function (copied from AnagramSolver)
function canMakeWord(word: string, availableLetters: string): boolean {
    if (!word || !availableLetters) return false;
    
    const letterCount = new Map<string, number>();
    let blanks = 0;
    for (const letter of (availableLetters || '').toUpperCase()) {
      if (letter === '?' || letter === '.') blanks++;
      else letterCount.set(letter, (letterCount.get(letter) || 0) + 1);
    }
    for (const letter of (word || '').toUpperCase()) {
      const count = letterCount.get(letter) || 0;
      if (count > 0) letterCount.set(letter, count - 1);
      else if (blanks > 0) blanks--;
      else return false;
    }
    return true;
}

// Word frequency calculation (simplified for worker)
function calculateWordFrequency(word: string) {
    const length = word.length;
    let frequency = 50;
    let gameFrequency = 30;
    
    // Length-based adjustments
    if (length <= 4) {
        frequency += 30;
        gameFrequency += 40;
    } else if (length <= 6) {
        frequency += 20;
        gameFrequency += 20;
    } else if (length >= 12) {
        frequency -= 30;
        gameFrequency -= 20;
    }
    
    // High-value letters reduce frequency
    const highValueLetters = (word.match(/[JQXZ]/g) || []).length;
    frequency -= highValueLetters * 20;
    
    // Vowel density
    const vowels = (word.match(/[AEIOU]/g) || []).length;
    const vowelRatio = vowels / length;
    if (vowelRatio > 0.6 || vowelRatio < 0.2) {
        frequency -= 15;
    }
    
    frequency = Math.max(1, Math.min(100, frequency));
    gameFrequency = Math.max(1, Math.min(100, gameFrequency));
    
    let difficulty: string;
    if (frequency >= 70) difficulty = 'common';
    else if (frequency >= 50) difficulty = 'uncommon';
    else if (frequency >= 25) difficulty = 'rare';
    else difficulty = 'expert';
    
    return { frequency, gameFrequency, difficulty };
}

self.onmessage = async (event) => {
    // Message to load the dictionary initially
    if (event.data.type === 'loadDictionary') {
        try {
            const response = await fetch("/dictionaries/CSW24.txt");
            const text = await response.text();
            const wordsArray = text.split("\n").map((w) => w.trim().toUpperCase());
            wordSet = new Set(wordsArray);
            
            // Calculate frequency data for all words
            wordFrequencyMap = new Map();
            wordsArray.forEach(word => {
                if (word.length >= 2) {
                    wordFrequencyMap!.set(word, calculateWordFrequency(word));
                }
            });
            
            self.postMessage({ type: 'dictionaryLoaded', wordCount: wordSet.size });

        } catch (error) {
            console.error("Failed to load CSW24 word list in worker:", error);
            self.postMessage({ type: 'error', message: 'Failed to load dictionary' });
        }
    }
    // Message to perform a word search (used by AnagramSolver and PatternMatcher)
    else if (event.data.type === 'searchWords') {
        if (!wordSet) {
            self.postMessage({ type: 'error', message: 'Dictionary not loaded yet.' });
            return;
        }

        const { searchParams, componentId } = event.data;
        const {
            letters, pattern, includeDictionaryWords, selectedLengths,
            startsWith, endsWith, contains, containsAll,
            qWithoutU, isVowelHeavy, noVowels, sortOrder,
            searchType, frequencyFilter, minProbability, maxProbability,
            sortByFrequency
        } = searchParams;

        let filteredWords: string[] = Array.from(wordSet);

        // --- Search Logic from AnagramSolver / PatternMatcher (copied here) ---
        // (This part remains unchanged, just ensuring it's comprehensive in the worker)

        if (searchType === 'anagram') {
            if (letters && letters.trim()) {
                const inputLetters = (letters || '').toUpperCase().replace(/[^A-Z?.]/g, "");
                if (searchParams.allowPartial) {
                  filteredWords = filteredWords.filter((word) => canMakeWord(word, inputLetters));
                } else {
                  const nonBlankLetters = inputLetters.replace(/[?.]/g, '');
                  if (inputLetters.length !== nonBlankLetters.length) {
                    filteredWords = filteredWords.filter(word => word.length === inputLetters.length && canMakeWord(word, inputLetters));
                  } else {
                    const inputSorted = nonBlankLetters.split("").sort().join("");
                    filteredWords = filteredWords.filter((word) => {
                      if (word.length !== inputSorted.length) return false;
                      const wordSorted = word.split("").sort().join("");
                      return wordSorted === inputSorted;
                    });
                  }
                }
            }
        } else if (searchType === 'pattern') {
            if (!letters && !pattern) { filteredWords = []; }

            const availableLetters = letters ? (letters || '').toUpperCase().split("").sort() : [];
            const cleanPattern = pattern ? (pattern || '').toUpperCase() : "";

            let tempFilteredWords: string[] = [];

            for (const word of filteredWords) {
                if (cleanPattern) {
                    if (word.length !== cleanPattern.length) continue;
                    let patternMatch = true;
                    for (let i = 0; i < cleanPattern.length; i++) {
                        if (cleanPattern[i] !== "_" && cleanPattern[i] !== word[i]) {
                            patternMatch = false;
                            break;
                        }
                    }
                    if (!patternMatch) continue;
                }

                if (availableLetters.length > 0) {
                    let tempLetters = [...availableLetters];

                    let patternFitsLetters = true;
                    if (cleanPattern) {
                        let tempLettersForPattern = [...availableLetters];
                        for (let i = 0; i < cleanPattern.length; i++) {
                            const char = cleanPattern[i];
                            if (char !== '_') {
                                const index = tempLettersForPattern.indexOf(char);
                                if (index > -1) {
                                    tempLettersForPattern.splice(index, 1);
                                } else {
                                    patternFitsLetters = false;
                                    break;
                                }
                            }
                        }
                    }
                    if (!patternFitsLetters) continue;

                    let remainingWordChars = [];
                    if (cleanPattern) {
                        for (let i = 0; i < word.length; i++) {
                            if (cleanPattern[i] === '_') {
                                remainingWordChars.push(word[i]);
                            }
                        }
                    } else {
                        remainingWordChars = word.split('');
                    }

                    let tempLettersForRemainingWord = [...availableLetters];
                    if (cleanPattern) {
                        for (let i = 0; i < cleanPattern.length; i++) {
                            if (cleanPattern[i] !== '_') {
                                const idx = tempLettersForRemainingWord.indexOf(cleanPattern[i]);
                                if (idx > -1) {
                                    tempLettersForRemainingWord.splice(idx, 1);
                                }
                            }
                        }
                    }

                    let allCharsAvailable = true;
                    for (const char of remainingWordChars) {
                        const index = tempLettersForRemainingWord.indexOf(char);
                        if (index > -1) {
                            tempLettersForRemainingWord.splice(index, 1);
                        } else {
                            allCharsAvailable = false;
                            break;
                        }
                    }
                    if (!allCharsAvailable) continue;
                }
                tempFilteredWords.push(word);
            }
            filteredWords = tempFilteredWords;
        }
        
        if (selectedLengths && selectedLengths.length > 0) {
            filteredWords = filteredWords.filter(word => selectedLengths.includes(word.length));
        }

        filteredWords = filteredWords.filter((word) => (word.length >= 2 && word.length <= 15));


        if (startsWith) filteredWords = filteredWords.filter(w => w.startsWith((startsWith || '').toUpperCase()));
        if (endsWith) filteredWords = filteredWords.filter(w => w.endsWith((endsWith || '').toUpperCase()));
        if (contains) filteredWords = filteredWords.filter(w => w.includes((contains || '').toUpperCase()));
        if (containsAll) {
          const allChars = (containsAll || '').toUpperCase().split('');
          filteredWords = filteredWords.filter(w => allChars.every(char => w.includes(char)));
        }
        if (qWithoutU) filteredWords = filteredWords.filter(w => w.includes('Q') && !w.includes('U'));
        if (noVowels) filteredWords = filteredWords.filter(w => !/[AEIOU]/.test(w));
        if (isVowelHeavy) {
          filteredWords = filteredWords.filter(w => {
              if (w.length === 0) return false;
              const vowelCount = (w.match(/[AEIOU]/g) || []).length;
              return vowelCount / w.length > 0.6;
          });
        }

        // Apply frequency filters
        if (frequencyFilter && frequencyFilter !== 'all') {
            filteredWords = filteredWords.filter(word => {
                const freq = wordFrequencyMap?.get(word);
                return freq && freq.difficulty === frequencyFilter;
            });
        }

        if (minProbability !== undefined && maxProbability !== undefined) {
            filteredWords = filteredWords.filter(word => {
                const freq = wordFrequencyMap?.get(word);
                if (!freq) return true;
                return freq.frequency >= minProbability && freq.frequency <= maxProbability;
            });
        }

        // Enhanced sorting with frequency
        if (sortByFrequency) {
            filteredWords.sort((a, b) => {
                const freqA = wordFrequencyMap?.get(a)?.frequency || 50;
                const freqB = wordFrequencyMap?.get(b)?.frequency || 50;
                return freqB - freqA; // Higher frequency first
            });
        } else {
            filteredWords.sort((a, b) => sortOrder === "asc" ? 
                (a.length === b.length ? a.localeCompare(b) : a.length - b.length) : 
                (a.length === b.length ? a.localeCompare(b) : b.length - a.length)
            );
        }

        // Add frequency data to results
        const resultsWithFrequency = filteredWords.map(word => ({
            word,
            frequency: wordFrequencyMap?.get(word) || { frequency: 50, difficulty: 'uncommon' }
        }));

        self.postMessage({ type: 'searchResults', results: resultsWithFrequency, componentId });
    }
};