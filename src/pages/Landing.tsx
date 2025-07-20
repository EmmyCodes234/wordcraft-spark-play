import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Star, Search, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

// Animation variants for the main headline
const headlineVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const wordVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

export default function Landing() {
  const { user } = useAuth();
  const headline = "Master the Lexicon. Dominate the Board.";

  return (
    <div className="bg-[#111111] text-gray-100">
      {/* --- Hero Section --- */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 overflow-hidden">
        
        <div className="absolute inset-0 z-0 opacity-10">
            <div 
                className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem]"
                style={{
                    maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)"
                }}
            ></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary mb-6"
            >
              <span>WordSmith</span>
              <span className="border border-gray-600 text-gray-400 text-xs font-semibold rounded-full px-2 py-0.5">
                BETA
              </span>
            </motion.div>

            <motion.h1
              variants={headlineVariants}
              initial="hidden"
              animate="visible"
              // --- RESPONSIVE: Font size adjusts for different screens ---
              className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter leading-tight [text-shadow:0_0_20px_theme(colors.primary/30%)]"
            >
              {headline.split(" ").map((word, index) => (
                <motion.span key={index} variants={wordVariants} className="inline-block mr-3 sm:mr-4">
                  {word === "Lexicon." || word === "Board." ? <span className="text-primary">{word}</span> : word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              // --- RESPONSIVE: Text size adjusts ---
              className="mt-6 max-w-2xl text-base md:text-lg text-gray-400"
            >
              Your ultimate companion for competitive word games. Train, explore, and master the dictionary like never before.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              // --- RESPONSIVE: Buttons stack on mobile, side-by-side on desktop ---
              className="mt-10 w-full flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {user ? (
                <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-primary text-lg px-8 py-6 group">
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-primary text-lg px-8 py-6 group">
                    <Link to="/signup">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-gray-700 bg-transparent hover:bg-gray-800 hover:text-white">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </motion.div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800 hover:-translate-y-2 transition-transform duration-300">
              <Star className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Build Your Lexicon</h3>
              <p className="text-gray-400">Save challenging words to your personal Cardbox and use our spaced-repetition system to achieve total mastery.</p>
            </div>
            <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800 hover:-translate-y-2 transition-transform duration-300">
              <Search className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Powerful Lookup</h3>
              <p className="text-gray-400">Instantly verify words, solve complex anagrams, and find high-scoring plays with our intelligent search tools.</p>
            </div>
            <div className="bg-[#1a1a1a] p-8 rounded-xl border border-gray-800 hover:-translate-y-2 transition-transform duration-300">
              <Zap className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Gamified Quizzes</h3>
              <p className="text-gray-400">Turn learning into a game. Challenge yourself with dynamic quizzes crafted from your saved words and track your progress.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Final CTA Section --- */}
      <section className="py-24 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold">Ready to Elevate Your Game?</h2>
          <p className="mt-4 text-base md:text-lg text-gray-400">Start your journey to word mastery today. It's free to get started.</p>
          <Button asChild size="lg" className="bg-gradient-primary text-lg mt-8 px-10 py-7 group">
            <Link to="/signup">
                Create Your Account
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </section>
      
      <footer className="w-full text-center py-8 border-t border-gray-800">
        <p className="text-gray-500">© 2025 WordSmith. All rights reserved.</p>
      </footer>
    </div>
  );
}