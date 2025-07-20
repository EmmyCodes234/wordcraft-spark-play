// File: src/pages/Login.tsx

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("Login failed! Please check your credentials.");
    } else {
      setMessage("Login successful! Redirecting...");
      navigate("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#111111] text-gray-100 flex flex-col items-center justify-center p-4">
      {/* Animated Background Grid */}
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
          <h2 className="text-2xl font-bold text-center text-white mb-6">Welcome Back</h2>

          <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="••••••••"
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
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {message && (
            <p className={`text-center text-sm mt-4 ${message.includes("failed") ? "text-red-400" : "text-green-400"}`}>
              {message}
            </p>
          )}

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;