// File: /src/components/CreateRaceModal.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, Target, Timer, Crown, Brain, Star, Trophy } from 'lucide-react';

type CreateRaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (options: RaceOptions) => void;
  isCreating: boolean;
};

export type RaceOptions = {
  name: string;
  type: 'sprint' | 'marathon' | 'blitz' | 'custom';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  isPublic: boolean;
  wordLength: string; // 'any' or '5', '6', '7', '8'
  duration: number; // seconds
  maxParticipants: number; // 2-8
  rounds: number;
  probabilityMode: boolean;
  minProbability: number;
  maxProbability: number;
  settings: {
    allowHints: boolean;
    showProgress: boolean;
    enableChat: boolean;
    pointsPerWord: number;
    timeBonus: boolean;
    difficultyMultiplier: number;
    probabilityScoring: boolean;
    bonusForRareWords: boolean;
    streakMultiplier: boolean;
  };
};

const RACE_TYPES = [
  {
    type: 'sprint' as const,
    name: 'Sprint',
    description: 'Quick 3-minute races',
    duration: 180,
    rounds: 8,
    icon: Zap,
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    difficulty: 'medium' as const
  },
  {
    type: 'marathon' as const,
    name: 'Marathon',
    description: 'Extended 10-minute challenges',
    duration: 600,
    rounds: 20,
    icon: Target,
    color: 'bg-gradient-to-r from-blue-400 to-purple-500',
    difficulty: 'hard' as const
  },
  {
    type: 'blitz' as const,
    name: 'Blitz',
    description: 'Lightning fast 1-minute rounds',
    duration: 60,
    rounds: 5,
    icon: Timer,
    color: 'bg-gradient-to-r from-red-400 to-pink-500',
    difficulty: 'easy' as const
  }
];

export function CreateRaceModal({ isOpen, onClose, onCreate, isCreating }: CreateRaceModalProps) {
  const [selectedType, setSelectedType] = useState<'sprint' | 'marathon' | 'blitz' | 'custom'>('sprint');
  const [options, setOptions] = useState<RaceOptions>({
    name: '',
    type: 'sprint',
    difficulty: 'medium',
    isPublic: true,
    wordLength: 'any',
    duration: 180,
    maxParticipants: 8,
    rounds: 8,
    probabilityMode: false,
    minProbability: 0,
    maxProbability: 100,
    settings: {
      allowHints: false,
      showProgress: true,
      enableChat: true,
      pointsPerWord: 10,
      timeBonus: true,
      difficultyMultiplier: 1,
      probabilityScoring: true,
      bonusForRareWords: true,
      streakMultiplier: true,
    }
  });

  const handleTypeSelect = (type: 'sprint' | 'marathon' | 'blitz' | 'custom') => {
    setSelectedType(type);
    if (type !== 'custom') {
      const raceType = RACE_TYPES.find(rt => rt.type === type);
      if (raceType) {
        setOptions(prev => ({
          ...prev,
          type,
          duration: raceType.duration,
          rounds: raceType.rounds,
          difficulty: raceType.difficulty
        }));
      }
    }
  };

  const handleCreateClick = () => {
    if (!options.name.trim()) {
      options.name = `${options.type.charAt(0).toUpperCase() + options.type.slice(1)} Race`;
    }
    onCreate(options);
  };

  const selectedRaceType = RACE_TYPES.find(rt => rt.type === selectedType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Create a New Race
          </DialogTitle>
          <DialogDescription>
            Set up your anagram challenge with custom rules and probability-based scoring.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Race Name */}
          <div className="grid gap-2">
            <Label htmlFor="race-name">Race Name</Label>
            <Input
              id="race-name"
              placeholder="Enter a creative name for your race..."
              value={options.name}
              onChange={(e) => setOptions(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Race Type Selection */}
          <div className="grid gap-3">
            <Label>Race Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {RACE_TYPES.map((raceType) => {
                const Icon = raceType.icon;
                const isSelected = selectedType === raceType.type;
                
                return (
                  <Card
                    key={raceType.type}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleTypeSelect(raceType.type)}
                  >
                    <CardContent className="p-4 text-center space-y-3">
                      <div className={`w-12 h-12 rounded-full ${raceType.color} flex items-center justify-center mx-auto`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{raceType.name}</h3>
                        <p className="text-xs text-muted-foreground">{raceType.description}</p>
                      </div>
                      <div className="flex justify-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{Math.floor(raceType.duration / 60)}m</Badge>
                        <Badge variant="outline">{raceType.rounds} rounds</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Custom Settings (shown when custom is selected) */}
          {selectedType === 'custom' && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Custom Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="1800"
                      value={options.duration}
                      onChange={(e) => setOptions(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Rounds</Label>
                    <Input
                      type="number"
                      min="3"
                      max="30"
                      value={options.rounds}
                      onChange={(e) => setOptions(prev => ({ ...prev, rounds: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Difficulty and Word Length */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Difficulty</Label>
              <Select 
                value={options.difficulty} 
                onValueChange={(value: 'easy' | 'medium' | 'hard' | 'expert') => 
                  setOptions(prev => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Word Length</Label>
              <Select 
                value={options.wordLength} 
                onValueChange={(value) => setOptions(prev => ({ ...prev, wordLength: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Length</SelectItem>
                  <SelectItem value="4">4 Letters</SelectItem>
                  <SelectItem value="5">5 Letters</SelectItem>
                  <SelectItem value="6">6 Letters</SelectItem>
                  <SelectItem value="7">7 Letters</SelectItem>
                  <SelectItem value="8">8 Letters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Probability Mode */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                Probability Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Enable Probability-Based Scoring</Label>
                  <p className="text-xs text-muted-foreground">
                    Words are scored based on their frequency and rarity
                  </p>
                </div>
                <Switch
                  checked={options.probabilityMode}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, probabilityMode: checked }))}
                />
              </div>
              
              {options.probabilityMode && (
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Label className="text-sm">Probability Range</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={options.minProbability}
                        onChange={(e) => setOptions(prev => ({ ...prev, minProbability: Number(e.target.value) }))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={options.maxProbability}
                        onChange={(e) => setOptions(prev => ({ ...prev, maxProbability: Number(e.target.value) }))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only words within this frequency range will be accepted
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Max Participants</Label>
                  <Input
                    type="number"
                    min="2"
                    max="12"
                    value={options.maxParticipants}
                    onChange={(e) => setOptions(prev => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Points per Word</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={options.settings.pointsPerWord}
                    onChange={(e) => setOptions(prev => ({
                      ...prev,
                      settings: { ...prev.settings, pointsPerWord: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Time Bonus</Label>
                    <p className="text-xs text-muted-foreground">Extra points for faster submissions</p>
                  </div>
                  <Switch
                    checked={options.settings.timeBonus}
                    onCheckedChange={(checked) => setOptions(prev => ({
                      ...prev,
                      settings: { ...prev.settings, timeBonus: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Rare Word Bonus</Label>
                    <p className="text-xs text-muted-foreground">Bonus points for uncommon words</p>
                  </div>
                  <Switch
                    checked={options.settings.bonusForRareWords}
                    onCheckedChange={(checked) => setOptions(prev => ({
                      ...prev,
                      settings: { ...prev.settings, bonusForRareWords: checked }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Streak Multiplier</Label>
                    <p className="text-xs text-muted-foreground">Bonus points for consecutive correct words</p>
                  </div>
                  <Switch
                    checked={options.settings.streakMultiplier}
                    onCheckedChange={(checked) => setOptions(prev => ({
                      ...prev,
                      settings: { ...prev.settings, streakMultiplier: checked }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Setting */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Public Race</Label>
              <p className="text-xs text-muted-foreground">Anyone can join this race</p>
            </div>
            <Switch
              checked={options.isPublic}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, isPublic: checked }))}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreateClick} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Race
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}