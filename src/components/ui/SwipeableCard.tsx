import React, { useState, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
  disabled?: boolean;
  threshold?: number;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className,
  disabled = false,
  threshold = 100
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const scale = useTransform(x, [-200, -100, 0, 100, 200], [0.8, 0.9, 1, 0.9, 0.8]);

  const handleDragStart = () => {
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (disabled) return;

    setIsDragging(false);
    const { offset } = info;

    // Check if swipe distance exceeds threshold
    if (Math.abs(offset.x) > threshold || Math.abs(offset.y) > threshold) {
      if (Math.abs(offset.x) > Math.abs(offset.y)) {
        // Horizontal swipe
        if (offset.x > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (offset.x < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (offset.y > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (offset.y < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    // Reset position
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={cn(
        "relative touch-manipulation",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      style={{
        x,
        y,
        rotate,
        opacity,
        scale
      }}
      drag={disabled ? false : true}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      {children}
      
      {/* Swipe indicators */}
      {isDragging && !disabled && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Left swipe indicator */}
          {onSwipeLeft && (
            <motion.div
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold"
              style={{
                opacity: useTransform(x, [-200, -100], [1, 0])
              }}
            >
              ←
            </motion.div>
          )}
          
          {/* Right swipe indicator */}
          {onSwipeRight && (
            <motion.div
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold"
              style={{
                opacity: useTransform(x, [100, 200], [0, 1])
              }}
            >
              →
            </motion.div>
          )}
          
          {/* Up swipe indicator */}
          {onSwipeUp && (
            <motion.div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-semibold"
              style={{
                opacity: useTransform(y, [-200, -100], [1, 0])
              }}
            >
              ↑
            </motion.div>
          )}
          
          {/* Down swipe indicator */}
          {onSwipeDown && (
            <motion.div
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-semibold"
              style={{
                opacity: useTransform(y, [100, 200], [0, 1])
              }}
            >
              ↓
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SwipeableCard;
