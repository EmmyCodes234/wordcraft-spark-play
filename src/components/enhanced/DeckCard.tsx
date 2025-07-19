import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder } from "lucide-react";

export function DeckCard({ deck, onSelect }: { deck: any; onSelect: () => void }) {
  const wordCount = deck.words?.length || 0;

  return (
    <Card
      onClick={onSelect}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-green-500"
    >
      <CardHeader className="flex flex-row items-center gap-3">
        <Folder className="text-yellow-500" />
        <CardTitle className="text-green-700">{deck.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>{wordCount} words</p>
        <p className="text-xs">Tap to start</p>
      </CardContent>
    </Card>
  );
}
