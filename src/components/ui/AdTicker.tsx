import React from "react";
import { motion } from "framer-motion";

const adTexts = [
  "This Saturday in Ajegunle! Don't miss the NSF & PANASA-rated BSP Scrabble Championship on July 26th.",
  "The countdown to Kenya begins! The PANASA President's Cup 'Triumvirate Showdown' is set for Aug 14-17 in Nairobi.",
  "Calling all young champions! Register for the 2nd Africa Youth Scrabble Championship in Kenya, Aug 14-17.",
  "Final call for Scrabble players in Nigeria! Compete for official rating points at the BSP Championship this weekend in Ajegunle.",
  "A unique team challenge awaits! The 'Triumvirate Showdown' brings a new format to the PANASA President's Cup this August.",
  "U-15 and U-19 categories are open for the AYSC in Kenya. Let's showcase the future of African Scrabble!",
];

export const AdTicker = () => {
  return (
    <div className="bg-primary/10 text-primary w-full flex items-center overflow-hidden rounded-lg border border-primary/20 h-[52px]">
      <motion.div
        className="flex items-center whitespace-nowrap"
        animate={{
          x: ["0%", "-100%"],
        }}
        transition={{
          ease: "linear",
          duration: 120, // <-- Increased duration for a slower scroll
          repeat: Infinity,
        }}
      >
        {/* Render the list of ads twice for a seamless loop */}
        {adTexts.map((text, index) => (
          <div key={`a-${index}`} className="flex items-center">
            <span className="px-12 font-medium text-sm text-center">{text}</span>
            <div className="h-5 w-px bg-primary/20 shrink-0"></div>
          </div>
        ))}
        {adTexts.map((text, index) => (
          <div key={`b-${index}`} className="flex items-center">
            <span className="px-12 font-medium text-sm text-center">{text}</span>
            <div className="h-5 w-px bg-primary/20 shrink-0"></div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};