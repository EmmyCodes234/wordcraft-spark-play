import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const adTexts = [
  "Welcome to our platform! Stay tuned for updates and announcements.",
];

export const AdTicker = () => {
  const isMobile = useIsMobile();

  return (
    <div className="bg-white text-blue-600 w-full flex items-center overflow-hidden border-b border-gray-200 h-10 sm:h-12">
      <motion.div
        className="flex items-center whitespace-nowrap"
        animate={{
          x: ["0%", "-100%"],
        }}
        transition={{
          ease: "linear",
          duration: isMobile ? 60 : 120,
          repeat: Infinity,
        }}
      >
        {adTexts.map((text, index) => (
          <div key={`a-${index}`} className="flex items-center">
            <span className="px-6 sm:px-12 font-medium text-xs sm:text-sm text-center text-blue-600">{text}</span>
            <div className="h-3 sm:h-4 w-px bg-blue-300 shrink-0"></div>
          </div>
        ))}
        {adTexts.map((text, index) => (
          <div key={`b-${index}`} className="flex items-center">
            <span className="px-6 sm:px-12 font-medium text-xs sm:text-sm text-center text-blue-600">{text}</span>
            <div className="h-3 sm:h-4 w-px bg-blue-300 shrink-0"></div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};