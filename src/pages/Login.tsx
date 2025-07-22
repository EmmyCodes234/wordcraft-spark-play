// File: src/pages/Login.tsx

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login: React.FC = () => {
  const [view, setView] = useState<'sign_in' | 'forgot_password'>('sign_in');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage("Login failed! Please check your credentials.");
    } else {
      setMessage("Login successful! Redirecting...");
      navigate("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      setMessage(`Error signing in with Google: ${error.message}`);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    if (error) {
      setMessage("Error sending reset link. Please try again.");
    } else {
      setMessage("Password reset link sent! Please check your email.");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#111111] text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem]"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <span>WordSmith</span>
            <span className="border border-gray-600 text-gray-400 text-xs font-semibold rounded-full px-2 py-0.5">BETA</span>
          </Link>
        </div>

        <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800 shadow-2xl">
          {view === 'sign_in' ? (
            <>
              <h2 className="text-2xl font-bold text-center text-white mb-6">Welcome Back</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-gray-900 border-gray-700 text-base" required />
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-gray-900 border-gray-700 text-base" required />
                <div className="text-right">
                  <button type="button" onClick={() => { setView('forgot_password'); setMessage(''); }} className="text-sm font-medium text-primary hover:underline">
                    Forgot Password?
                  </button>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-semibold bg-gradient-primary">
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>

              {/* --- Google Sign-in Section --- */}
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
                {loading ? "Signing in..." : "Sign in with Google"}
              </Button>
              {/* --- End Google Sign-in Section --- */}

              <p className="text-center text-sm text-gray-400 mt-6">
                Don't have an account?{" "}
                <Link to="/signup" className="font-medium text-primary hover:underline">Sign Up</Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center text-white mb-6">Reset Password</h2>
              <p className="text-center text-sm text-gray-400 mb-4">Enter your email and we'll send you a link to reset your password.</p>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-gray-900 border-gray-700 text-base" required />
                <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-semibold bg-gradient-primary">
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
              <p className="text-center text-sm text-gray-400 mt-6">
                Remember your password?{" "}
                <button onClick={() => { setView('sign_in'); setMessage(''); }} className="font-medium text-primary hover:underline">Back to Login</button>
              </p>
            </>
          )}
          {message && (<p className={`text-center text-sm mt-4 ${message.includes("failed") || message.includes("Error") ? "text-red-400" : "text-green-400"}`}>{message}</p>)}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;