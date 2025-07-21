import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';

// --- Core Layout & Protection ---
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

// --- Public Pages ---
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import UpdatePassword from '@/pages/UpdatePassword'; // <-- Import the new page

// --- Protected Pages ---
import Dashboard from '@/pages/Dashboard';
import WordJudge from '@/pages/WordJudge';
import AnagramSolver from '@/pages/AnagramSolver';
import PatternMatcher from '@/pages/PatternMatcher';
import QuizMode from '@/pages/QuizMode';
import Flashcards from '@/pages/Flashcards';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import TournamentAdjudicator from '@/pages/TournamentAdjudicator';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* --- Public Routes --- */}
          {/* These are visible to everyone */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/update-password" element={<UpdatePassword />} /> {/* <-- Add the new route */}


          {/* --- Protected Routes --- */}
          {/* All pages inside here are protected and wrapped by the Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/word-judge" element={<WordJudge />} />
            <Route path="/anagram-solver" element={<AnagramSolver />} />
            <Route path="/pattern-matcher" element={<PatternMatcher />} />
            <Route path="/quiz-mode" element={<QuizMode />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/tournament-adjudicator" element={<TournamentAdjudicator />} />

            {/* Alias routes */}
            <Route path="/judge" element={<WordJudge />} />
            <Route path="/anagram" element={<AnagramSolver />} />
            <Route path="/pattern" element={<PatternMatcher />} />
            <Route path="/quiz" element={<QuizMode />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;