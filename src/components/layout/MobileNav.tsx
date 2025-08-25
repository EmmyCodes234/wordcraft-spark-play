import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  BookOpen, 
  Gamepad2, 
  User,
  ChevronDown,
  Search, 
  Zap, 
  BookOpen as PatternIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileNav = () => {
  const location = useLocation();
  const [gamesExpanded, setGamesExpanded] = useState(false);

  const navItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: Home,
      shortLabel: 'Home',
      type: 'main'
    },
    {
      path: '/quiz',
      label: 'Study',
      icon: BookOpen,
      shortLabel: 'Study',
      type: 'main'
    },
    {
      path: '/games',
      label: 'Games',
      icon: Gamepad2,
      shortLabel: 'Games',
      type: 'dropdown',
      children: [
        { path: '/judge', label: 'Word Judge', icon: Search },
        { path: '/anagram', label: 'Anagram Solver', icon: Zap },
        { path: '/pattern', label: 'Pattern Matcher', icon: PatternIcon }
      ]
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: User,
      shortLabel: 'Profile',
      type: 'main'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) && path !== "/" || 
           (location.pathname === "/" && path === "/dashboard");
  };

  const isGamesActive = () => {
    return location.pathname.startsWith('/judge') || 
           location.pathname.startsWith('/anagram') || 
           location.pathname.startsWith('/pattern');
  };

  return (
    <>
      <nav className="lg:hidden mobile-nav">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.type === 'dropdown' ? isGamesActive() : isActive(item.path);
            
            if (item.type === 'dropdown') {
              return (
                <div key={item.path} className="relative">
                  <button
                    onClick={() => setGamesExpanded(!gamesExpanded)}
                    className={cn(
                      "mobile-haptic flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-200",
                      "min-h-[56px] min-w-[56px]",
                      active 
                        ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.1 }}
                      className="flex items-center gap-1"
                    >
                      <Icon className="w-6 h-6" />
                      <ChevronDown 
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          gamesExpanded && "rotate-180"
                        )} 
                      />
                    </motion.div>
                    <span className="text-xs font-medium leading-tight">
                      {item.shortLabel}
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {gamesExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 mobile-card p-2 min-w-[200px]"
                      >
                        {item.children?.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.path);
                          
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={() => setGamesExpanded(false)}
                              className={cn(
                                "mobile-haptic flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm",
                                childActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              )}
                            >
                              <ChildIcon className="w-4 h-4" />
                              {child.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "mobile-haptic flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-200",
                  "min-h-[56px] min-w-[56px]",
                  active 
                    ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.1 }}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <span className="text-xs font-medium leading-tight">
                  {item.shortLabel}
                </span>
                {active && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-1 w-1 h-1 bg-primary-foreground rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Backdrop for dropdown */}
      <AnimatePresence>
        {gamesExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setGamesExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
