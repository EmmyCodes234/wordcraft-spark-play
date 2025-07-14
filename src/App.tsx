import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/navbar";
import Landing from "./pages/Landing";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import WordLookup from "./pages/WordLookup";
import AnagramSolver from "./pages/AnagramSolver";
import PatternMatcher from "./pages/PatternMatcher";
import QuizMode from "./pages/QuizMode";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import { AuthProvider } from "./context/AuthContext";
import { CardboxProvider } from "./context/CardboxContext";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/layout/ProtectedRoute";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <CardboxProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Navbar />
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lookup"
                  element={
                    <ProtectedRoute>
                      <Navbar />
                      <WordLookup />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/anagram"
                  element={
                    <ProtectedRoute>
                      <Navbar />
                      <AnagramSolver />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pattern"
                  element={
                    <ProtectedRoute>
                      <Navbar />
                      <PatternMatcher />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quiz"
                  element={
                    <ProtectedRoute>
                      <Navbar />
                      <QuizMode />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Navbar />
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Navbar />
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CardboxProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
