import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Search, Zap } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 text-center px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Master Words. Dominate Scrabble.
      </h1>
      <p className="text-gray-600 max-w-xl mb-8">
        Your ultimate Scrabble and word mastery companion. Train, explore, and master words like never before.
      </p>
      <button
        onClick={() => navigate("/login")}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300"
      >
        Get Started
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl">
        <div className="bg-white rounded-lg shadow hover:shadow-xl transition p-6 text-left border">
          <Star className="h-8 w-8 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Mastery</h3>
          <p className="text-gray-600 text-sm">
            Save words to your Cardbox and study until you master them completely.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow hover:shadow-xl transition p-6 text-left border">
          <Search className="h-8 w-8 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Powerful Lookup</h3>
          <p className="text-gray-600 text-sm">
            Verify words, analyze patterns, and solve anagrams effortlessly.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow hover:shadow-xl transition p-6 text-left border">
          <Zap className="h-8 w-8 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gamified Quizzes</h3>
          <p className="text-gray-600 text-sm">
            Challenge yourself with dynamic quizzes crafted from your saved words.
          </p>
        </div>
      </div>

      <footer className="mt-20 text-gray-500 text-xs">
        © {new Date().getFullYear()} WordSmith. All rights reserved.
      </footer>
    </main>
  );
};

export default Landing;
