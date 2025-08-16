import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Star, Search, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const headline = "Master the Lexicon. Dominate the Board.";

  return (
    <div className="bg-[#111111] text-gray-100 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 py-8 overflow-hidden">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] sm:bg-[size:2rem_2rem] lg:bg-[size:3rem_3rem]"
            style={{
              maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)"
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-6xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl lg:text-2xl font-bold text-primary mb-6 sm:mb-8"
          >
            <span>WordSmith</span>
            <span className="border border-gray-600 text-gray-400 text-xs font-semibold rounded-full px-2 py-0.5">
              BETA
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={headlineVariants}
            initial="hidden"
            animate="visible"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tighter leading-tight [text-shadow:0_0_20px_theme(colors.primary/30%)] mb-6"
          >
            {headline.split(" ").map((word, index) => (
              <motion.span 
                key={index} 
                variants={wordVariants} 
                className="inline-block mr-2 sm:mr-3 lg:mr-4"
              >
                {word === "Lexicon." || word === "Board." ? (
                  <span className="text-primary">{word}</span>
                ) : (
                  word
                )}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="max-w-2xl text-sm sm:text-base lg:text-lg text-gray-400 mb-8 sm:mb-10 px-4"
          >
            Your ultimate companion for competitive word games. Train, explore, and master the dictionary like never before.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="w-full max-w-md flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            {user ? (
              <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 group">
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 group">
                  <Link to="/signup">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 border-gray-700 bg-transparent hover:bg-gray-800 hover:text-white">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          >
            <motion.div 
              className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl border border-gray-800 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl"
              whileHover={{ scale: isMobile ? 1 : 1.02 }}
            >
              <Star className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-4" />
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3">Build Your Lexicon</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Save challenging words to your personal Cardbox and use our spaced-repetition system to achieve total mastery.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl border border-gray-800 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl"
              whileHover={{ scale: isMobile ? 1 : 1.02 }}
            >
              <Search className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-4" />
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3">Powerful Lookup</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Instantly verify words, solve complex anagrams, and find high-scoring plays with our intelligent search tools.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl border border-gray-800 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl md:col-span-3 lg:col-span-1"
              whileHover={{ scale: isMobile ? 1 : 1.02 }}
            >
              <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-4" />
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3">Gamified Quizzes</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Turn learning into a game. Challenge yourself with dynamic quizzes crafted from your saved words and track your progress.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6">
            Ready to Elevate Your Game?
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Start your journey to word mastery today. It's free to get started.
          </p>
          <Button asChild size="lg" className="bg-gradient-primary text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-6 group">
            <Link to="/signup">
              Create Your Account
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </section>
      
      {/* Footer */}
      <footer className="w-full text-center py-6 sm:py-8 border-t border-gray-800">
        <p className="text-xs sm:text-sm text-gray-500">© 2025 WordSmith. All rights reserved.</p>
      </footer>
    </div>
  );
}