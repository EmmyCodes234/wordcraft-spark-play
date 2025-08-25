// Shared Dictionary Service for Lightning Fast Loading
import { openDB, DBSchema } from 'idb';

interface DictionaryCache {
  words: string[];
  frequencyMap: [string, any][];
  timestamp: number;
  version: string;
}

interface DictionaryDB extends DBSchema {
  dictionary: {
    key: string;
    value: DictionaryCache;
  };
}

class DictionaryService {
  private static instance: DictionaryService;
  private worker: Worker | null = null;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;
  private db: IDBDatabase | null = null;
  private readonly CACHE_VERSION = '1.0.0';
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor() {
    this.initDB();
  }

  static getInstance(): DictionaryService {
    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  private async initDB() {
    try {
      this.db = await openDB<DictionaryDB>('dictionary-cache', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('dictionary')) {
            db.createObjectStore('dictionary', { keyPath: 'key' });
          }
        },
      });
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage');
    }
  }

  private async getCachedDictionary(): Promise<DictionaryCache | null> {
    try {
      if (this.db) {
        const cached = await this.db.get('dictionary', 'main');
        if (cached && this.isCacheValid(cached)) {
          console.log('DictionaryService: Using IndexedDB cache');
          return cached;
        }
      } else {
        // Fallback to localStorage
        const cached = localStorage.getItem('dictionary_cache_v2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (this.isCacheValid(parsed)) {
            console.log('DictionaryService: Using localStorage cache');
            return parsed;
          }
        }
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }
    return null;
  }

  private async setCachedDictionary(data: DictionaryCache) {
    try {
      if (this.db) {
        await this.db.put('dictionary', { key: 'main', ...data });
      } else {
        localStorage.setItem('dictionary_cache_v2', JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Failed to cache dictionary:', error);
    }
  }

  private isCacheValid(cache: DictionaryCache): boolean {
    const age = Date.now() - cache.timestamp;
    return age < this.CACHE_DURATION && cache.version === this.CACHE_VERSION;
  }

  private async loadDictionaryFromNetwork(): Promise<{ words: string[], frequencyMap: Map<string, any> }> {
    console.log('DictionaryService: Loading from network...');
    
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use fetch with streaming for better performance
        const response = await fetch('/dictionaries/CSW24.txt', {
          headers: {
            'Cache-Control': 'public, max-age=86400',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dictionary: ${response.status}`);
        }

        const text = await response.text();
        const words = text.split('\n')
          .map(w => w.trim().toUpperCase())
          .filter(w => w.length >= 2 && w.length <= 15);

        // Process frequency data in chunks for better performance
        const frequencyMap = new Map<string, any>();
        const chunkSize = 5000;
        
        for (let i = 0; i < words.length; i += chunkSize) {
          const chunk = words.slice(i, i + chunkSize);
          chunk.forEach(word => {
            frequencyMap.set(word, this.calculateWordFrequency(word));
          });
          
          // Yield control every few chunks to prevent blocking
          if (i % (chunkSize * 10) === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        return { words, frequencyMap };
      } catch (error) {
        lastError = error as Error;
        console.warn(`DictionaryService: Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError || new Error('Failed to load dictionary after all retries');
  }

  private calculateWordFrequency(word: string) {
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

  async loadDictionary(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        // Try cache first
        const cached = await this.getCachedDictionary();
        if (cached) {
          this.isLoaded = true;
          return;
        }

        // Load from network with timeout
        const networkPromise = this.loadDictionaryFromNetwork();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 10000);
        });

        const { words, frequencyMap } = await Promise.race([networkPromise, timeoutPromise]) as any;
        
        // Cache the data
        const cacheData: DictionaryCache = {
          words,
          frequencyMap: Array.from(frequencyMap.entries()),
          timestamp: Date.now(),
          version: this.CACHE_VERSION
        };
        
        await this.setCachedDictionary(cacheData);
        this.isLoaded = true;
        
        console.log(`DictionaryService: Loaded ${words.length} words successfully`);
      } catch (error) {
        console.error('DictionaryService: Failed to load dictionary:', error);
        this.isLoaded = false;
        this.loadPromise = null;
        throw error;
      }
    })();

    return this.loadPromise;
  }

  async getWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = new Worker(new URL('../workers/dictionaryWorker.ts', import.meta.url));
    }
    return this.worker;
  }

  async preloadDictionary(): Promise<void> {
    // Start loading dictionary in background
    this.loadDictionary().catch(console.error);
  }

  isDictionaryLoaded(): boolean {
    return this.isLoaded;
  }

  async getCachedWords(): Promise<string[]> {
    const cached = await this.getCachedDictionary();
    return cached?.words || [];
  }

  async getCachedFrequencyMap(): Promise<Map<string, any>> {
    const cached = await this.getCachedDictionary();
    if (cached?.frequencyMap) {
      return new Map(cached.frequencyMap);
    }
    return new Map();
  }
}

// Export singleton instance
export const dictionaryService = DictionaryService.getInstance();

// Preload dictionary on module load
dictionaryService.preloadDictionary();
