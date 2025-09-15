import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

const MobileSearchInput: React.FC<MobileSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  onSearch,
  onClear,
  className,
  autoFocus = false,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && value.trim()) {
      onSearch(value.trim());
    }
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure the component is mounted
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  return (
    <motion.div
      className={cn(
        "relative w-full",
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "mobile-search w-full px-4",
              "focus:ring-2 focus:ring-primary focus:border-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isFocused && "border-primary shadow-lg"
            )}
          />
        </div>

        {/* Search Button (for mobile) */}
        {onSearch && (
          <motion.button
            type="submit"
            className={cn(
              "mobile-button absolute right-2 top-1/2 transform -translate-y-1/2",
              "bg-primary text-primary-foreground px-4 py-2 rounded-xl",
              "font-semibold text-sm",
              "hover:bg-primary/90 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={disabled || !value.trim()}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            Search
          </motion.button>
        )}
      </form>

      {/* Focus indicator */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileSearchInput;
