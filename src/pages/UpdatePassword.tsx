// File: src/pages/UpdatePassword.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase adds the recovery token in the URL hash
    // This effect handles the session creation from the token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMessage('You can now set a new password.');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setMessage("Error updating password. Please try again.");
    } else {
      setMessage("Password updated successfully! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard"), 2000);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#111111] text-gray-100 flex items-center justify-center p-4">
       <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-white mb-6">Set a New Password</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your new password"
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
              {loading ? "Saving..." : "Update Password"}
            </Button>
          </form>
          {message && (<p className={`text-center text-sm mt-4 ${message.includes("Error") ? "text-red-400" : "text-green-400"}`}>{message}</p>)}
        </div>
      </motion.div>
    </div>
  );
}