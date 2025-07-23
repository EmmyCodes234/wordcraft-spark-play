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
import UpdatePassword from '@/pages/UpdatePassword';

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
import DeckOptionsPage from '@/pages/DeckOptionsPage';
import RaceLobby from '@/pages/RaceLobby';
import RaceGame from '@/pages/RaceGame';

// --- NEW: Import Leaderboard and Public Decks Pages ---
import LeaderboardPage from '@/pages/LeaderboardPage'; // Assuming path: src/pages/LeaderboardPage.tsx
import PublicDecksPage from '@/pages/PublicDecksPage'; // Assuming path: src/pages/PublicDecksPage.tsx
// --- END NEW IMPORTS ---


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/update-password" element={<UpdatePassword />} />


          {/* --- Protected Routes --- */}
          {/* These routes will share the Layout and require authentication */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/word-judge" element={<WordJudge />} />
            <Route path="/anagram-solver" element={<AnagramSolver />} />
            <Route path="/pattern-matcher" element={<PatternMatcher />} />
            <Route path="/quiz-mode" element={<QuizMode />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/tournament-adjudicator" element={<TournamentAdjudicator />} />
            
            {/* --- NEW: Social Features Routes --- */}
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/decks/public" element={<PublicDecksPage />} />
            {/* --- END NEW --- */}

            {/* --- SRS & Race Routes --- */}
            <Route path="/flashcards/:deckId" element={<Flashcards />} />
            <Route path="/decks/:deckId/options" element={<DeckOptionsPage />} />
            <Route path="/race-lobby" element={<RaceLobby />} />
            <Route path="/race/:raceId" element={<RaceGame />} />

            {/* Alias routes */}
            <Route path="/judge" element={<WordJudge />} />
            <Route path="/anagram" element={<AnagramSolver />} />
            <Route path="/pattern" element={<PatternMatcher />} />
            <Route path="/quiz" element={<QuizMode />} /> {/* This route also handles deckId param for public quizzes */}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;