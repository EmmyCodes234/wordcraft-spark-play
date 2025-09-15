// File: src/pages/Signup.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType('info');

    // Basic validation
    if (!email || !password) {
      setMessage("Please fill in all fields.");
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long.");
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        console.error('Signup error:', error);
        
        // Handle specific error cases
        if (error.message.includes('already registered')) {
          setMessage("This email is already registered. Please try signing in instead.");
        } else if (error.message.includes('Invalid email')) {
          setMessage("Please enter a valid email address.");
        } else if (error.message.includes('Password')) {
          setMessage("Password doesn't meet requirements. Please use at least 6 characters.");
        } else if (error.message.includes('rate limit')) {
          setMessage("Too many attempts. Please wait a moment and try again.");
        } else {
          setMessage(`Signup failed: ${error.message}`);
        }
        setMessageType('error');
      } else {
        if (data.user && !data.user.email_confirmed_at) {
          setMessage("Account created! Please check your email to confirm your account before signing in.");
          setMessageType('success');
        } else {
          setMessage("Account created successfully! Redirecting...");
          setMessageType('success');
          // Let useEffect handle redirect if user is automatically signed in
        }
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
      setMessage("An unexpected error occurred. Please try again.");
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage("");
    setMessageType('info');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        console.error('Google signup error:', error);
        setMessage(`Error signing up with Google: ${error.message}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Unexpected Google signup error:', error);
      setMessage("An unexpected error occurred. Please try again.");
      setMessageType('error');
    } finally {
      setLoading(false);
    }
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

          {/* --- Google Sign-up Section --- */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1a1a1a] px-2 text-gray-400">
                OR
              </span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            // Using bg-gradient-primary for app branding consistency
            // text-primary-foreground should provide good contrast (likely white for a dark gradient)
            className="w-full h-12 text-lg font-semibold bg-gradient-primary text-primary-foreground flex items-center justify-center"
          >
            {/* Google logo SVG (white fill for dark backgrounds) */}
            <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M44.5 20H24V28.5H35.6C34.5 31.9 31 34.2 24 34.2C17.3 34.2 11.8 28.7 11.8 22C11.8 15.3 17.3 9.8 24 9.8C27.5 9.8 30.5 11 32.8 13.1L38.7 7.2C34.7 3.4 29.7 1 24 1C10.7 1 0 10.5 0 22C0 33.5 10.7 43 24 43C36.7 43 45.4 34.7 45.4 21.8C45.4 20.9 45.4 20.4 44.5 20Z" fill="#FFFFFF"/>
            </svg>
            {loading ? "Signing up..." : "Sign up with Google"}
          </Button>
          {/* --- End Google Sign-up Section --- */}

          {message && (
            <div className={`text-center text-sm mt-4 p-3 rounded-lg ${
              messageType === 'error' 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : messageType === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {message}
            </div>
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