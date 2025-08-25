// Optimized Dictionary Worker for Lightning Fast Loading
declare const self: any;

let wordSet: Set<string> | null = null;
let wordFrequencyMap: Map<string, any> | null = null;
let isDictionaryLoading = false;
let dictionaryLoadPromise: Promise<void> | null = null;

// Utility function for word matching
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

// Optimized dictionary loading with advanced caching
async function loadDictionary() {
    if (wordSet && wordFrequencyMap) {
        return; // Already loaded
    }
    
    if (isDictionaryLoading && dictionaryLoadPromise) {
        return dictionaryLoadPromise; // Return existing promise if loading
    }
    
    isDictionaryLoading = true;
    dictionaryLoadPromise = (async () => {
        try {
            console.log("Worker: Starting optimized dictionary load...");
            
            // Try multiple cache layers for maximum speed
            let cachedData = null;
            
            // 1. Try IndexedDB first (fastest)
            try {
                const db = await self.indexedDB.open('dictionary-cache', 1);
                const transaction = db.result.transaction(['dictionary'], 'readonly');
                const store = transaction.objectStore('dictionary');
                const result = await store.get('main');
                if (result && isCacheValid(result)) {
                    cachedData = result;
                    console.log("Worker: Using IndexedDB cache (fastest)");
                }
            } catch (e) {
                console.log("Worker: IndexedDB not available");
            }
            
            // 2. Try localStorage as fallback
            if (!cachedData) {
                try {
                    const cached = localStorage.getItem('dictionary_cache_v2');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        if (isCacheValid(parsed)) {
                            cachedData = parsed;
                            console.log("Worker: Using localStorage cache");
                        }
                    }
                } catch (e) {
                    console.log("Worker: localStorage cache failed");
                }
            }
            
            // 3. Try legacy cache
            if (!cachedData) {
                try {
                    const cached = localStorage.getItem('dictionary_cache');
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        const cacheAge = Date.now() - parsed.timestamp;
                        if (cacheAge < 24 * 60 * 60 * 1000) {
                            cachedData = parsed.data;
                            console.log("Worker: Using legacy cache");
                        }
                    }
                } catch (e) {
                    console.log("Worker: Legacy cache failed");
                }
            }
            
            let wordsArray: string[];
            if (cachedData) {
                wordsArray = cachedData.words || cachedData.data?.words || [];
                wordFrequencyMap = new Map(cachedData.frequencyMap || cachedData.data?.frequencyMap || []);
            } else {
                // Load from network with streaming and timeout
                console.log("Worker: Loading from network with streaming...");
                
                const fetchPromise = fetch("/dictionaries/CSW24.txt", {
                    headers: {
                        'Cache-Control': 'max-age=86400',
                        'Accept-Encoding': 'gzip, deflate, br'
                    }
                });
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Network timeout')), 10000);
                });
                
                const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
                
                if (!response.ok) {
                    throw new Error(`Network error: ${response.status}`);
                }
                
                const text = await response.text();
                wordsArray = text.split("\n")
                    .map((w) => w.trim().toUpperCase())
                    .filter(w => w.length >= 2 && w.length <= 15);
                
                console.log("Worker: Processing frequency data...");
                
                // Optimized frequency calculation with larger batches
                wordFrequencyMap = new Map();
                const batchSize = 10000; // Increased for better performance
                
                for (let i = 0; i < wordsArray.length; i += batchSize) {
                    const batch = wordsArray.slice(i, i + batchSize);
                    batch.forEach(word => {
                        if (word.length >= 2) {
                            wordFrequencyMap!.set(word, calculateWordFrequency(word));
                        }
                    });
                    
                    // Yield control less frequently for better performance
                    if (i % (batchSize * 5) === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
                
                // Cache the processed data
                try {
                    const cacheData = {
                        words: wordsArray,
                        frequencyMap: Array.from(wordFrequencyMap.entries()),
                        timestamp: Date.now(),
                        version: '1.0.0'
                    };
                    
                    // Try IndexedDB first
                    try {
                        const db = await self.indexedDB.open('dictionary-cache', 1);
                        const transaction = db.result.transaction(['dictionary'], 'readwrite');
                        const store = transaction.objectStore('dictionary');
                        await store.put({ key: 'main', ...cacheData });
                        console.log("Worker: Cached to IndexedDB");
                    } catch (e) {
                        // Fallback to localStorage
                        localStorage.setItem('dictionary_cache_v2', JSON.stringify(cacheData));
                        console.log("Worker: Cached to localStorage");
                    }
                } catch (e) {
                    console.log("Worker: Failed to cache dictionary data");
                }
            }
            
            wordSet = new Set(wordsArray);
            console.log("Worker: Dictionary loaded with", wordsArray.length, "words");
        } catch (error) {
            console.error("Worker: Failed to load dictionary:", error);
            isDictionaryLoading = false;
            dictionaryLoadPromise = null;
            throw error;
        } finally {
            isDictionaryLoading = false;
        }
    })();
    
    return dictionaryLoadPromise;
}

function isCacheValid(cache: any): boolean {
    if (!cache || !cache.timestamp) return false;
    const age = Date.now() - cache.timestamp;
    const maxAge = cache.version === '1.0.0' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    return age < maxAge;
}

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

// Message handler with optimized search
self.onmessage = async (event) => {
    if (event.data.type === 'loadDictionary') {
        try {
            await loadDictionary();
            const wordsArray = Array.from(wordSet!);
            self.postMessage({ 
                type: 'dictionaryLoaded', 
                wordSet: wordsArray, 
                wordCount: wordSet!.size,
                loadTime: Date.now()
            });
        } catch (error) {
            self.postMessage({ type: 'error', message: 'Failed to load dictionary' });
        }
    }
    else if (event.data.type === 'searchWords') {
        if (!wordSet) {
            self.postMessage({ type: 'error', message: 'Dictionary not loaded yet.' });
            return;
        }

        const { searchParams, componentId, searchStartTime } = event.data;
        const {
            letters, pattern, includeDictionaryWords, selectedLengths,
            startsWith, endsWith, contains, containsAll,
            qWithoutU, isVowelHeavy, noVowels, sortOrder,
            searchType, frequencyFilter, minProbability, maxProbability,
            sortByFrequency
        } = searchParams;

        let filteredWords: string[] = Array.from(wordSet);

        // Optimized search logic with early filtering
        if (searchType === 'anagram') {
            if (letters && letters.trim()) {
                const inputLetters = (letters || '').toUpperCase().replace(/[^A-Z?.]/g, "");
                
                // Early optimization: pre-filter by length if exact match
                if (!searchParams.allowPartial) {
                    const nonBlankLetters = inputLetters.replace(/[?.]/g, '');
                    if (inputLetters.length === nonBlankLetters.length) {
                        // Exact length match - much faster filtering
                        filteredWords = filteredWords.filter(word => word.length === inputLetters.length);
                        
                        // Sort input letters once
                        const inputSorted = nonBlankLetters.split("").sort().join("");
                        
                        // Use more efficient filtering
                        filteredWords = filteredWords.filter((word) => {
                            if (word.length !== inputSorted.length) return false;
                            const wordSorted = word.split("").sort().join("");
                            return wordSorted === inputSorted;
                        });
                    } else {
                        // Has blanks - use canMakeWord but with length pre-filter
                        filteredWords = filteredWords.filter(word => word.length === inputLetters.length);
                        filteredWords = filteredWords.filter(word => canMakeWord(word, inputLetters));
                    }
                } else {
                    // Partial match - use optimized canMakeWord
                    filteredWords = filteredWords.filter((word) => canMakeWord(word, inputLetters));
                }
            }
        } else if (searchType === 'pattern') {
            if (!letters && !pattern) { filteredWords = []; }

            const availableLetters = letters ? (letters || '').toUpperCase().split("").sort() : [];
            const cleanPattern = pattern ? (pattern || '').toUpperCase() : "";

            // Early optimization for pattern matching
            if (cleanPattern) {
                filteredWords = filteredWords.filter(word => word.length === cleanPattern.length);
            }

            let tempFilteredWords: string[] = [];

            for (const word of filteredWords) {
                if (cleanPattern) {
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
        
        // Apply filters efficiently with early termination
        if (selectedLengths && selectedLengths.length > 0) {
            filteredWords = filteredWords.filter(word => selectedLengths.includes(word.length));
        }

        filteredWords = filteredWords.filter((word) => (word.length >= 2 && word.length <= 15));

        // Apply string filters efficiently
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

        // Optimized sorting with early termination for large datasets
        if (filteredWords.length > 10000) {
            // For very large result sets, limit before sorting
            filteredWords = filteredWords.slice(0, 10000);
        }

        if (sortByFrequency) {
            filteredWords.sort((a, b) => {
                const freqA = wordFrequencyMap?.get(a)?.frequency || 50;
                const freqB = wordFrequencyMap?.get(b)?.frequency || 50;
                return freqB - freqA;
            });
        } else {
            filteredWords.sort((a, b) => sortOrder === "asc" ? 
                (a.length === b.length ? a.localeCompare(b) : a.length - b.length) : 
                (a.length === b.length ? a.localeCompare(b) : b.length - a.length)
            );
        }

        // Add frequency data to results with performance optimization
        const resultsWithFrequency = filteredWords.map(word => ({
            word,
            frequency: wordFrequencyMap?.get(word) || { frequency: 50, difficulty: 'uncommon' }
        }));

        self.postMessage({ 
            type: 'searchResults', 
            results: resultsWithFrequency, 
            componentId,
            searchTime: searchStartTime ? Date.now() - searchStartTime : 0,
            resultCount: resultsWithFrequency.length
        });
    }
};