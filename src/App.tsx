import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/navbar";
import Landing from "./pages/Landing";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import WordLookup from "./pages/WordLookup";
import WordJudge from "./pages/WordJudge";
import AnagramSolver from "./pages/AnagramSolver";
import PatternMatcher from "./pages/PatternMatcher";
import QuizMode from "./pages/QuizMode";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import StudyDeck from "./pages/StudyDeck";
import Flashcards from "./pages/Flashcards";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import CreateChallenge from "./pages/CreateChallenge";
import ChallengePlay from "./pages/ChallengePlay";
import DailyPuzzle from "./pages/DailyPuzzle";

const queryClient = new QueryClient();

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Navbar />

            {/* Responsive page container */}
            <div className="min-h-screen w-full px-4 sm:px-6 md:px-8 py-4">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/lookup" element={<ProtectedRoute element={<WordLookup />} />} />
                <Route path="/judge" element={<ProtectedRoute element={<WordJudge />} />} />
                <Route path="/anagram" element={<ProtectedRoute element={<AnagramSolver />} />} />
                <Route path="/pattern" element={<ProtectedRoute element={<PatternMatcher />} />} />
                <Route path="/quiz" element={<ProtectedRoute element={<QuizMode />} />} />
                <Route path="/flashcards" element={<ProtectedRoute element={<Flashcards />} />} />
                <Route path="/study/:deckId" element={<ProtectedRoute element={<StudyDeck />} />} />
                <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
                <Route path="/create-challenge" element={<ProtectedRoute element={<CreateChallenge />} />} />
                <Route path="/play-challenge/:id" element={<ProtectedRoute element={<ChallengePlay />} />} />
                <Route path="/daily" element={<ProtectedRoute element={<DailyPuzzle />} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>

            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
