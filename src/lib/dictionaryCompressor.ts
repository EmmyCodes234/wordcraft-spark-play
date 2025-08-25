// Dictionary Compression for Lightning Fast Loading

export class DictionaryCompressor {
  private static readonly COMMON_PREFIXES = [
    'RE', 'UN', 'IN', 'IM', 'IL', 'IR', 'DIS', 'MIS', 'PRE', 'PRO',
    'EN', 'EM', 'OVER', 'UNDER', 'OUT', 'UP', 'DOWN', 'BACK', 'FORE'
  ];

  private static readonly COMMON_SUFFIXES = [
    'ING', 'ED', 'ER', 'EST', 'LY', 'NESS', 'MENT', 'TION', 'SION',
    'ABLE', 'IBLE', 'FUL', 'LESS', 'ISH', 'OUS', 'AL', 'IC', 'IVE'
  ];

  private static readonly COMMON_WORDS = new Set([
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER',
    'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW',
    'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID',
    'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE', 'WANT', 'WILL', 'WITH'
  ]);

  // Compress dictionary data
  static compress(words: string[]): string {
    const compressed: string[] = [];
    const prefixMap = new Map<string, number>();
    const suffixMap = new Map<string, number>();
    
    // Build prefix and suffix maps
    words.forEach(word => {
      // Check prefixes
      for (const prefix of this.COMMON_PREFIXES) {
        if (word.startsWith(prefix) && word.length > prefix.length) {
          const count = prefixMap.get(prefix) || 0;
          prefixMap.set(prefix, count + 1);
        }
      }
      
      // Check suffixes
      for (const suffix of this.COMMON_SUFFIXES) {
        if (word.endsWith(suffix) && word.length > suffix.length) {
          const count = suffixMap.get(suffix) || 0;
          suffixMap.set(suffix, count + 1);
        }
      }
    });

    // Sort by frequency
    const commonPrefixes = Array.from(prefixMap.entries())
      .filter(([_, count]) => count > 10)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([prefix]) => prefix);

    const commonSuffixes = Array.from(suffixMap.entries())
      .filter(([_, count]) => count > 10)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([suffix]) => suffix);

    // Compress words
    words.forEach(word => {
      if (this.COMMON_WORDS.has(word)) {
        compressed.push(`C${word}`);
      } else {
        let compressedWord = word;
        
        // Try prefix compression
        for (const prefix of commonPrefixes) {
          if (word.startsWith(prefix) && word.length > prefix.length) {
            compressedWord = `P${prefix.length}${word.slice(prefix.length)}`;
            break;
          }
        }
        
        // Try suffix compression
        if (compressedWord === word) {
          for (const suffix of commonSuffixes) {
            if (word.endsWith(suffix) && word.length > suffix.length) {
              compressedWord = `S${suffix.length}${word.slice(0, -suffix.length)}`;
              break;
            }
          }
        }
        
        compressed.push(compressedWord);
      }
    });

    return JSON.stringify({
      prefixes: commonPrefixes,
      suffixes: commonSuffixes,
      words: compressed
    });
  }

  // Decompress dictionary data
  static decompress(compressedData: string): string[] {
    const data = JSON.parse(compressedData);
    const { prefixes, suffixes, words } = data;
    
    return words.map(word => {
      if (word.startsWith('C')) {
        return word.slice(1); // Common word
      } else if (word.startsWith('P')) {
        const prefixLength = parseInt(word.slice(1, 2));
        const prefix = prefixes[prefixLength - 1];
        const rest = word.slice(2);
        return prefix + rest;
      } else if (word.startsWith('S')) {
        const suffixLength = parseInt(word.slice(1, 2));
        const suffix = suffixes[suffixLength - 1];
        const rest = word.slice(2);
        return rest + suffix;
      } else {
        return word; // Uncompressed
      }
    });
  }

  // Get compression ratio
  static getCompressionRatio(original: string[], compressed: string): number {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = compressed.length;
    return (1 - compressedSize / originalSize) * 100;
  }
}

// Utility functions for dictionary optimization
export class DictionaryOptimizer {
  // Create frequency-based word groups
  static createWordGroups(words: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    
    words.forEach(word => {
      const length = word.length.toString();
      if (!groups.has(length)) {
        groups.set(length, []);
      }
      groups.get(length)!.push(word);
    });
    
    return groups;
  }

  // Create prefix tree for faster searching
  static createPrefixTree(words: string[]): Map<string, Set<string>> {
    const tree = new Map<string, Set<string>>();
    
    words.forEach(word => {
      for (let i = 1; i <= word.length; i++) {
        const prefix = word.slice(0, i);
        if (!tree.has(prefix)) {
          tree.set(prefix, new Set());
        }
        tree.get(prefix)!.add(word);
      }
    });
    
    return tree;
  }

  // Optimize word set for memory usage
  static optimizeWordSet(words: string[]): Set<string> {
    // Remove duplicates and sort for better memory layout
    const uniqueWords = [...new Set(words)].sort();
    return new Set(uniqueWords);
  }
}
