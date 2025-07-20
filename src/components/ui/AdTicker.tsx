import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";

// Updated ad texts with official tournament information as of July 20, 2025
const adTexts = [
  "This Saturday in Ajegunle! Don't miss the NSF & PANASA-rated BSP Scrabble Championship on July 26th.",
  "The countdown to Kenya begins! The PANASA President's Cup 'Triumvirate Showdown' is set for Aug 14-17 in Nairobi.",
  "Calling all young champions! Register for the 2nd Africa Youth Scrabble Championship in Kenya, Aug 14-17.",
  "Final call for Scrabble players in Nigeria! Compete for official rating points at the BSP Championship this weekend in Ajegunle.",
  "A unique team challenge awaits! The 'Triumvirate Showdown' brings a new format to the PANASA President's Cup this August.",
  "U-15 and U-19 categories are open for the AYSC in Kenya. Let's showcase the future of African Scrabble!",
];

export const AdTicker = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % adTexts.length);
    }, 5000); // Change ad every 5 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  return (
    // The "w-full" class has been removed from this div to allow for centering.
    <div className="bg-primary/10 text-primary px-4 py-3 flex items-center justify-center gap-3 overflow-hidden rounded-lg border border-primary/20">
      <Trophy className="h-5 w-5 flex-shrink-0" />
      <div className="h-6 relative w-full flex items-center">
        <AnimatePresence>
          <motion.div
            key={index} // The key is crucial for AnimatePresence to detect changes
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -25, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            // Text is now always centered
            className="absolute w-full text-center"
          >
            <p className="font-medium text-sm">{adTexts[index]}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};