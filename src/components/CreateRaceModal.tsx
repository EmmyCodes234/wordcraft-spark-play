// File: /src/components/CreateRaceModal.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Loader2 } from 'lucide-react';

type CreateRaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (options: RaceOptions) => void;
  isCreating: boolean;
};

export type RaceOptions = {
  isPublic: boolean;
  wordLength: string; // 'any' or '5', '6', '7', '8'
  duration: number; // 30, 60, 90
  maxParticipants: number; // 2-8
};

export function CreateRaceModal({ isOpen, onClose, onCreate, isCreating }: CreateRaceModalProps) {
  const [options, setOptions] = useState<RaceOptions>({
    isPublic: true,
    wordLength: 'any',
    duration: 60,
    maxParticipants: 8,
  });

  const handleCreateClick = () => {
    onCreate(options);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Race</DialogTitle>
          <DialogDescription>Set the rules for your anagram challenge.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="word-length" className="text-right">Word Length</Label>
            <Select onValueChange={(value) => setOptions(o => ({ ...o, wordLength: value }))} defaultValue="any">
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Select length" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="5">5 Letters</SelectItem>
                <SelectItem value="6">6 Letters</SelectItem>
                <SelectItem value="7">7 Letters</SelectItem>
                <SelectItem value="8">8 Letters</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Duration</Label>
            <ToggleGroup 
              type="single" 
              defaultValue="60"
              className="col-span-3"
              onValueChange={(value) => value && setOptions(o => ({ ...o, duration: Number(value) }))}
            >
              <ToggleGroupItem value="30">30s</ToggleGroupItem>
              <ToggleGroupItem value="60">60s</ToggleGroupItem>
              <ToggleGroupItem value="90">90s</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="max-players" className="text-right">Max Players</Label>
            <Input 
              id="max-players" 
              type="number" 
              min="2" max="8" 
              defaultValue="8"
              className="col-span-3"
              onChange={(e) => setOptions(o => ({ ...o, maxParticipants: Number(e.target.value) }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateClick} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Race
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}