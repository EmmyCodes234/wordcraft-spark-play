import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const adTexts = [
  "🏆 Lekki Scrabble Classics 2025 - Peninsula Hotel & Towers, Lekki - September 27-28, 2025",
  "🎯 Sharpen your skills with our advanced word tools and prepare for tournament success!",
  "📚 Master the dictionary with our comprehensive Anagram Solver and Pattern Matcher",
  "🌟 Join the community and connect with fellow Scrabble enthusiasts",
];

export const AdTicker = () => {
  const isMobile = useIsMobile();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-primary w-full flex items-center overflow-hidden border-b border-blue-200 h-10 sm:h-12 transition-colors duration-300">
      <motion.div
        className="flex items-center whitespace-nowrap"
        animate={{
          x: ["0%", "-100%"],
        }}
        transition={{
          ease: "linear",
          duration: isMobile ? 25 : 50, // Slightly slower for better readability
          repeat: Infinity,
        }}
      >
        {adTexts.map((text, index) => (
          <div key={`a-${index}`} className="flex items-center">
            <span className="px-6 sm:px-12 font-medium text-xs sm:text-sm text-center text-black hover:text-gray-800 transition-colors">
              {text}
            </span>
            <div className="h-3 sm:h-4 w-px bg-blue-400 shrink-0"></div>
          </div>
        ))}
        {adTexts.map((text, index) => (
          <div key={`b-${index}`} className="flex items-center">
            <span className="px-4 sm:px-12 font-medium text-xs sm:text-sm text-center text-black hover:text-gray-800 transition-colors">
              {text}
            </span>
            <div className="h-3 sm:h-4 w-px bg-blue-400 shrink-0"></div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};