
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
            <div className="min-h-screen w-full px-4 sm:px-6 md:px-8 py-4">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/judge" element={<ProtectedRoute><WordJudge /></ProtectedRoute>} />
                <Route path="/anagram" element={<ProtectedRoute><AnagramSolver /></ProtectedRoute>} />
                <Route path="/pattern" element={<ProtectedRoute><PatternMatcher /></ProtectedRoute>} />
                <Route path="/quiz" element={<ProtectedRoute><QuizMode /></ProtectedRoute>} />
                <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
                <Route path="/study/:deckId" element={<ProtectedRoute><StudyDeck /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/create-challenge" element={<ProtectedRoute><CreateChallenge /></ProtectedRoute>} />
                <Route path="/play-challenge/:id" element={<ProtectedRoute><ChallengePlay /></ProtectedRoute>} />
                <Route path="/daily" element={<ProtectedRoute><DailyPuzzle /></ProtectedRoute>} />
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
