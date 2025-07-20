// File: src/pages/Signup.tsx

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Success! Please check your email to confirm your account.");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[#111111] text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <span>WordSmith</span>
            <span className="border border-gray-600 text-gray-400 text-xs font-semibold rounded-full px-2 py-0.5">BETA</span>
          </Link>
        </div>

        <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-white mb-6">Create an Account</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-gray-900 border-gray-700 text-base"
              required
            />
            <Input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-gray-900 border-gray-700 text-base"
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg font-semibold bg-gradient-primary"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          {message && (
            <p className={`text-center text-sm mt-4 ${message.includes("failed") || message.includes("Error") ? "text-red-400" : "text-green-400"}`}>
              {message}
            </p>
          )}

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}