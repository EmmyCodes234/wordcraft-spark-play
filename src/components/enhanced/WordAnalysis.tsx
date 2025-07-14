import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DifficultyHeatmap } from '@/components/ui/difficulty-heatmap';
import { LetterTile } from '@/components/ui/letter-tile';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Link, Hash } from 'lucide-react';
import { getLetterBreakdown, findHooks, findAnagrams } from '@/lib/scrabbleUtils';

interface WordAnalysisProps {
  words: string[];
  dictionary: Set<string>;
  animated?: boolean;
}

export function WordAnalysis({ words, dictionary, animated = false }: WordAnalysisProps) {
  const analysisData = words.map(word => {
    const letterBreakdown = getLetterBreakdown(word);
    const totalScore = letterBreakdown.reduce((sum, letter) => sum + letter.value, 0);
    const hooks = findHooks(word, dictionary);
    const anagrams = findAnagrams(word, dictionary);
    
    return {
      word,
      letterBreakdown,
      totalScore,
      hooks,
      anagrams
    };
  });

  const totalPlayScore = analysisData.reduce((sum, data) => sum + data.totalScore, 0);

  return (
    <div className="space-y-6">
      {/* Overall Play Summary */}
      <Card className="border border-success/20 bg-gradient-card shadow-glow-success">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-success">Play Analysis</CardTitle>
            <Badge className="bg-gradient-success text-success-foreground text-lg px-4 py-2">
              {totalPlayScore} total points
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{words.length}</div>
              <div className="text-sm text-muted-foreground">Words Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(totalPlayScore / words.length)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Points/Word</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {words.some(w => w.length >= 7) ? '🎯' : '📚'}
              </div>
              <div className="text-sm text-muted-foreground">
                {words.some(w => w.length >= 7) ? 'Bingo Potential!' : 'Good Play'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Word Analysis */}
      {analysisData.map((data, index) => (
        <div key={data.word} className="space-y-4">
          <Card className="border shadow-word-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold tracking-wide">
                  {data.word}
                </CardTitle>
                <Badge variant="outline" className="text-base">
                  {data.totalScore} points
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Letter Breakdown */}
              <DifficultyHeatmap
                letters={data.letterBreakdown}
                totalScore={data.totalScore}
                animated={animated}
                showLegend={index === 0} // Only show legend for first word
              />

              {/* Word Extensions & Anagrams */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hooks */}
                {(data.hooks.front.length > 0 || data.hooks.back.length > 0) && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Link className="h-5 w-5" />
                        Word Extensions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data.hooks.front.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Front Hooks ({data.hooks.front.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {data.hooks.front.map(letter => (
                                <LetterTile
                                key={letter}
                                letter={letter}
                                value={1}
                                variant="highlighted"
                                size="sm"
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Add these letters before "{data.word}"
                          </p>
                        </div>
                      )}
                      
                      {data.hooks.back.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Back Hooks ({data.hooks.back.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {data.hooks.back.map(letter => (
                              <LetterTile
                                key={letter}
                                letter={letter}
                                value={1}
                                variant="highlighted"
                                size="sm"
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Add these letters after "{data.word}"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Anagrams */}
                {data.anagrams.length > 0 && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Anagrams ({data.anagrams.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {data.anagrams.map(anagram => (
                          <Badge key={anagram} variant="secondary" className="justify-center">
                            {anagram}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Other words using the same letters
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
          
          {index < analysisData.length - 1 && <Separator className="my-6" />}
        </div>
      ))}
    </div>
  );
}