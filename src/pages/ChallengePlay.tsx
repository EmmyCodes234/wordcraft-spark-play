import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChallengePlay() {
  const { id } = useParams();
  const [challenge, setChallenge] = useState<any>(null);
  const [attempt, setAttempt] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchChallenge = async () => {
      const { data, error } = await supabase
        .from("shared_challenges")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setStatus("Challenge not found.");
      } else {
        setChallenge(data);
      }
    };

    fetchChallenge();
  }, [id]);

  const handleSubmit = () => {
    if (!attempt.trim()) return;
    setResults([...results, attempt.toUpperCase()]);
    setAttempt("");
  };

  if (!challenge) {
    return <div className="text-center py-10">{status || "Loading challenge..."}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-center mb-2">Play Challenge</h1>

      {challenge.data.description && (
        <p className="text-center text-muted-foreground mb-4">
          {challenge.data.description}
        </p>
      )}

      <div className="p-4 border rounded text-center text-xl font-mono">
        {challenge.data.letters}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type a word..."
          value={attempt}
          onChange={(e) => setAttempt((e.target.value || '').toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button onClick={handleSubmit}>Submit</Button>
      </div>

      <div className="border p-4 rounded space-y-1">
        <h2 className="font-semibold mb-2">Your words</h2>
        {results.length > 0 ? (
          results.map((w, i) => <div key={i} className="font-mono">{w}</div>)
        ) : (
          <p className="text-muted-foreground">No words yet</p>
        )}
      </div>
    </div>
  );
}
