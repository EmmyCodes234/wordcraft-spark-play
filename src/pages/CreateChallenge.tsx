import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Copy } from "lucide-react";

export default function CreateChallenge() {
  const { user } = useAuth();
  const [letters, setLetters] = useState("");
  const [type, setType] = useState("anagram");
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [challengeLink, setChallengeLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!user) {
      alert("Please log in to create a challenge.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("shared_challenges")
      .insert([
        {
          user_id: user.id,
          type,
          data: {
            letters: letters.toUpperCase(),
            description,
          },
        },
      ])
      .select();

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Failed to create challenge.");
      return;
    }

    if (data && data[0]) {
      const id = data[0].id;
      const link = `${window.location.origin}/challenge/${id}`;
      setChallengeLink(link);
      // Optionally, navigate directly if you want:
      // navigate(`/challenge/${id}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-center">Create Shareable Challenge</h1>

      <Textarea
        placeholder="Description for your challenge (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />

      <Input
        placeholder="Enter your letters (e.g., CLOVERS)"
        value={letters}
        onChange={(e) => setLetters(e.target.value.toUpperCase())}
      />

      <div className="space-y-2">
        <label className="font-medium">Challenge Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="anagram">Anagram Challenge</option>
          {/* You can add more types later */}
        </select>
      </div>

      <Button onClick={handleCreate} disabled={loading} className="w-full h-12 text-lg">
        {loading ? "Creating..." : "Create & Share"}
      </Button>

      {challengeLink && (
        <div className="mt-6 p-4 border rounded-lg bg-muted/20 shadow space-y-2">
          <p className="font-medium mb-1">Challenge created! Share this link:</p>
          <div className="flex gap-2">
            <Input value={challengeLink} readOnly className="flex-1" />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(challengeLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-1" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
