import React from "react";
import { motion } from "framer-motion";

const adTexts = [
  "Welcome to our platform! Stay tuned for updates and announcements.",
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