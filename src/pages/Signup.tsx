import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email to confirm your account!");
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <Card className="w-full max-w-md shadow border border-primary/20">
        <CardContent className="space-y-6 p-6">
          <h2 className="text-3xl font-bold text-center">Create an Account</h2>
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-lg border focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 text-lg border focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Button
            onClick={handleSignup}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
          {message && <p className="text-center text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
