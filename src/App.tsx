import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { SessionProvider } from '@/context/SessionContext';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { usePageLoadTime } from '@/hooks/use-performance-monitor';

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
import StudyDeck from '@/pages/StudyDeck';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import TournamentAdjudicator from '@/pages/TournamentAdjudicator';
import SocialFeed from '@/pages/SocialFeed';
import FriendsPage from '@/pages/FriendsPage';
import CommunityEvents from '@/pages/CommunityEvents';
import DatabaseTest from '@/components/DatabaseTest';
import BlogPage from '@/pages/BlogPage';
import AnnouncementsPage from '@/pages/AnnouncementsPage';
import LekkiScrabbleClassics from '@/pages/LekkiScrabbleClassics';

// --- NEW: Import Leaderboard and Public Decks Pages ---
// // import LeaderboardPage from '@/pages/LeaderboardPage'; // Assuming path: src/pages/LeaderboardPage.tsx
// // // import PublicDecksPage from '@/pages/PublicDecksPage'; // Assuming path: src/pages/PublicDecksPage.tsx
// --- END NEW IMPORTS ---


function App() {
  usePageLoadTime(); // Track page load performance
  
  return (
    <ErrorBoundary>
      <Router>
        <LanguageProvider>
          <ThemeProvider>
            <SessionProvider>
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
                  <Route path="/social" element={<SocialFeed />} />
                  <Route path="/friends" element={<FriendsPage />} />
                  <Route path="/events" element={<CommunityEvents />} />
                  <Route path="/db-test" element={<DatabaseTest />} />
                  
                  {/* --- Blog Routes --- */}
                  <Route path="/blog" element={<BlogPage />} />
                  
                  {/* --- Announcements Routes --- */}
                  <Route path="/announcements" element={<AnnouncementsPage />} />
                  
                  {/* --- Tournament Routes --- */}
                  <Route path="/lekki-scrabble-classics" element={<LekkiScrabbleClassics />} />
                  
                  {/* --- END NEW --- */}

                  {/* --- Study Routes --- */}
                  <Route path="/study-deck" element={<StudyDeck />} />
                  <Route path="/study-deck/:deckId" element={<StudyDeck />} />

                  {/* Alias routes */}
                  <Route path="/judge" element={<WordJudge />} />
                  <Route path="/anagram" element={<AnagramSolver />} />
                  <Route path="/pattern" element={<PatternMatcher />} />
                  <Route path="/quiz" element={<QuizMode />} /> {/* This route also handles deckId param for public quizzes */}
                </Route>
              </Routes>
              </AuthProvider>
              <Toaster />
            </SessionProvider>
          </ThemeProvider>
        </LanguageProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;