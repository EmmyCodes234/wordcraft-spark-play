import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  BookOpen, 
  User,
  Menu,
  X,
  Search, 
  Zap, 
  BookOpen as PatternIcon,
  Users,
  Calendar,
  Trophy,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileNav = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: Home,
      type: 'main'
    },
    {
      path: '/quiz',
      label: 'Study',
      icon: BookOpen,
      type: 'main'
    },
    {
      path: '/judge',
      label: 'Word Judge',
      icon: Search,
      type: 'main'
    },
    {
      path: '/anagram',
      label: 'Anagram Solver',
      icon: Zap,
      type: 'main'
    },
    {
      path: '/pattern',
      label: 'Pattern Matcher',
      icon: PatternIcon,
      type: 'main'
    },
    {
      path: '/announcements',
      label: 'Announcements',
      icon: Calendar,
      type: 'main'
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: User,
      type: 'main'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      type: 'main'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) && path !== "/" || 
           (location.pathname === "/" && path === "/dashboard");
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="mobile-haptic bg-green-600 text-white p-3 rounded-2xl shadow-lg"
        >
          <motion.div
            animate={{ rotate: isMenuOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 z-50 lg:hidden shadow-2xl"
            >
              <div className="p-6 pt-20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-black">Navigation</h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="mobile-haptic p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "mobile-haptic flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                          active
                            ? "bg-green-600 text-white"
                            : "text-gray-700 hover:text-black hover:bg-gray-100"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                        {active && (
                          <motion.div
                            layoutId="mobile-menu-indicator"
                            className="ml-auto w-2 h-2 bg-white rounded-full"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
