import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Star, Brain, Target, Zap } from 'lucide-react';
import { getEnhancedWordFrequency } from '@/data/wordFrequency';

interface ProbabilityHintModalProps {
  isOpen: boolean;
  onClose: () => void;
  alphagram: string;
  minProbability: number;
  maxProbability: number;
  onGetHint: (words: string[]) => void;
}

export function ProbabilityHintModal({
  isOpen,
  onClose,
  alphagram,
  minProbability,
  maxProbability,
  onGetHint
}: ProbabilityHintModalProps) {
  const [hintWords, setHintWords] = useState<string[]>([]);
  const [filteredWords, setFilteredWords] = useState<string[]>([]);
  const [currentMinProb, setCurrentMinProb] = useState(minProbability);
  const [currentMaxProb, setCurrentMaxProb] = useState(maxProbability);
  const [isLoading, setIsLoading] = useState(false);

  // Generate sample words for the alphagram (in a real app, this would query a dictionary)
  const generateWordsForAlphagram = (alphagram: string): string[] => {
    const sampleWords = [
      'STAR', 'RATS', 'ARTS', 'TARS', 'SART', 'RATS', 'ARTS', 'TARS',
      'STAR', 'RATS', 'ARTS', 'TARS', 'SART', 'RATS', 'ARTS', 'TARS'
    ];
    
    // Filter to only include words that are valid anagrams
    return sampleWords.filter(word => {
      const sortedWord = word.split('').sort().join('');
      const sortedAlphagram = alphagram.split('').sort().join('');
      return sortedWord === sortedAlphagram;
    });
  };

  useEffect(() => {
    if (isOpen && alphagram) {
      setIsLoading(true);
      
      // Generate words for the alphagram
      const allWords = generateWordsForAlphagram(alphagram);
      
      // Filter by probability range
      const filtered = allWords.filter(word => {
        const frequency = getEnhancedWordFrequency(word);
        return frequency.frequency >= currentMinProb && frequency.frequency <= currentMaxProb;
      });
      
      setFilteredWords(filtered);
      setIsLoading(false);
    }
  }, [isOpen, alphagram, currentMinProb, currentMaxProb]);

  const handleGetHint = () => {
    // Select a subset of words as hints
    const selectedHints = filteredWords.slice(0, 4);
    setHintWords(selectedHints);
    onGetHint(selectedHints);
    onClose();
  };

  const getFrequencyColor = (frequency: number) => {
    if (frequency < 30) return 'text-red-600';
    if (frequency < 50) return 'text-orange-600';
    if (frequency < 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getFrequencyLabel = (frequency: number) => {
    if (frequency < 30) return 'Rare';
    if (frequency < 50) return 'Uncommon';
    if (frequency < 70) return 'Common';
    return 'Very Common';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Probability-Based Hints
          </DialogTitle>
          <DialogDescription>
            Find words within your specified frequency range for: <strong>{alphagram}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Probability Range Slider */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Frequency Range</span>
                  <Badge variant="outline">
                    {currentMinProb}% - {currentMaxProb}%
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Slider
                    value={[currentMinProb, currentMaxProb]}
                    onValueChange={(value) => {
                      setCurrentMinProb(value[0]);
                      setCurrentMaxProb(value[1]);
                    }}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Rare</span>
                    <span>Uncommon</span>
                    <span>Common</span>
                    <span>Very Common</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Words */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Available Words</h3>
                <Badge variant="outline">{filteredWords.length} words</Badge>
              </div>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Finding words...</p>
                </div>
              ) : filteredWords.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No words found in this frequency range</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting the frequency range
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredWords.slice(0, 12).map((word, index) => {
                    const frequency = getEnhancedWordFrequency(word);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border"
                      >
                        <span className="font-medium">{word}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getFrequencyColor(frequency.frequency)}`}
                        >
                          {getFrequencyLabel(frequency.frequency)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleGetHint}
              disabled={filteredWords.length === 0}
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-2" />
              Get Hint ({Math.min(4, filteredWords.length)} words)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 