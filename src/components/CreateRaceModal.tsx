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
      <DialogContent className="sm:max-w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Trophy className="w-5 h-5 text-primary" />
            Create a New Race
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Set up your anagram challenge with custom rules and probability-based scoring.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 sm:gap-6 py-2 sm:py-4 text-gray-900 dark:text-gray-100">
          {/* Race Name */}
          <div className="grid gap-2">
            <Label htmlFor="race-name">Race Name</Label>
            <Input
              id="race-name"
              placeholder="Enter a creative name for your race..."
              value={options.name}
              onChange={(e) => setOptions(prev => ({ ...prev, name: e.target.value }))}
              className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Race Type Selection */}
          <div className="grid gap-3">
            <Label>Race Type</Label>
            <div className="space-y-2">
              {RACE_TYPES.map((raceType) => {
                const Icon = raceType.icon;
                const isSelected = selectedType === raceType.type;
                
                return (
                  <Card
                    key={raceType.type}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
                      isSelected ? 'ring-2 ring-primary bg-primary/10 dark:bg-primary/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleTypeSelect(raceType.type)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${raceType.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{raceType.name}</h3>
                        <p className="text-xs text-muted-foreground">{raceType.description}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Badge variant="outline" className="text-xs">{Math.floor(raceType.duration / 60)}m</Badge>
                        <Badge variant="outline" className="text-xs">{raceType.rounds}r</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Custom Settings (shown when custom is selected) */}
          {selectedType === 'custom' && (
            <Card className="border-dashed bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Custom Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="grid gap-2">
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="1800"
                      value={options.duration}
                      onChange={(e) => setOptions(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
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
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Difficulty and Word Length */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="grid gap-2">
              <Label>Difficulty</Label>
              <Select 
                value={options.difficulty} 
                onValueChange={(value: 'easy' | 'medium' | 'hard' | 'expert') => 
                  setOptions(prev => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                  <SelectItem value="easy" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Easy</SelectItem>
                  <SelectItem value="medium" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Medium</SelectItem>
                  <SelectItem value="hard" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Hard</SelectItem>
                  <SelectItem value="expert" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Word Length</Label>
              <Select 
                value={options.wordLength} 
                onValueChange={(value) => setOptions(prev => ({ ...prev, wordLength: value }))}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Select word length" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                  <SelectItem value="any" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Any Length</SelectItem>
                  <SelectItem value="4" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">4 Letters</SelectItem>
                  <SelectItem value="5" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">5 Letters</SelectItem>
                  <SelectItem value="6" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">6 Letters</SelectItem>
                  <SelectItem value="7" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">7 Letters</SelectItem>
                  <SelectItem value="8" className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">8 Letters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Probability Mode */}
          <Card className="border-primary/20 bg-white dark:bg-gray-800">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                Probability Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-2 rounded border border-primary/30">
                <div>
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Enable Probability-Based Scoring</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Words are scored based on their frequency and rarity
                  </p>
                </div>
                <Switch
                  checked={options.probabilityMode}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, probabilityMode: checked }))}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                />
              </div>
              
              {options.probabilityMode && (
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Label className="text-sm">Probability Range</Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={options.minProbability}
                        onChange={(e) => setOptions(prev => ({ ...prev, minProbability: Number(e.target.value) }))}
                        className="w-16 sm:w-20 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={options.maxProbability}
                        onChange={(e) => setOptions(prev => ({ ...prev, maxProbability: Number(e.target.value) }))}
                        className="w-16 sm:w-20 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
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

          {/* Advanced Settings - Simplified for mobile */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="text-sm">Max Participants</Label>
                <Input
                  type="number"
                  min="2"
                  max="12"
                  value={options.maxParticipants}
                  onChange={(e) => setOptions(prev => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div className="grid gap-2">
                <Label className="text-sm">Points per Word</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={options.settings.pointsPerWord}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    settings: { ...prev.settings, pointsPerWord: Number(e.target.value) }
                  }))}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            
            {/* Bonus Settings - Vertical Layout */}
            <Card className="border-dashed bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Bonus Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-600">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Time Bonus</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Extra points for speed</p>
                  </div>
                  <Switch
                    checked={options.settings.timeBonus}
                    onCheckedChange={(checked) => setOptions(prev => ({
                      ...prev,
                      settings: { ...prev.settings, timeBonus: checked }
                    }))}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-600">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Rare Word Bonus</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Bonus for uncommon words</p>
                  </div>
                  <Switch
                    checked={options.settings.bonusForRareWords}
                    onCheckedChange={(checked) => setOptions(prev => ({
                      ...prev,
                      settings: { ...prev.settings, bonusForRareWords: checked }
                    }))}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-600">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Streak Multiplier</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Bonus for consecutive words</p>
                  </div>
                  <Switch
                    checked={options.settings.streakMultiplier}
                    onCheckedChange={(checked) => setOptions(prev => ({
                      ...prev,
                      settings: { ...prev.settings, streakMultiplier: checked }
                    }))}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-600">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Show Progress</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Display player progress during race</p>
                  </div>
                  <Switch
                    checked={options.settings.showProgress}
                    onCheckedChange={(checked) => setOptions(prev => ({
                      ...prev,
                      settings: { ...prev.settings, showProgress: checked }
                    }))}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-600">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Enable Chat</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Allow players to chat during race</p>
                  </div>
                  <Switch
                    checked={options.settings.enableChat}
                    onCheckedChange={(checked) => setOptions(prev => ({
                      ...prev,
                      settings: { ...prev.settings, enableChat: checked }
                    }))}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Setting */}
          <div className="flex items-center justify-between p-3 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
            <div>
              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Public Race</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400">Anyone can join this race</p>
            </div>
            <Switch
              checked={options.isPublic}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, isPublic: checked }))}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
            />
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isCreating} className="w-full sm:w-auto order-2 sm:order-1">
            Cancel
          </Button>
          <Button onClick={handleCreateClick} disabled={isCreating} className="w-full sm:w-auto order-1 sm:order-2">
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Race
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}