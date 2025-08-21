import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  BookOpen, 
  Search, 
  Zap, 
  User,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: Home,
      shortLabel: 'Home'
    },
    {
      path: '/quiz',
      label: 'Study',
      icon: BookOpen,
      shortLabel: 'Study'
    },
    {
      path: '/judge',
      label: 'Judge',
      icon: Search,
      shortLabel: 'Judge'
    },
    {
      path: '/anagram',
      label: 'Anagram',
      icon: Zap,
      shortLabel: 'Anagram'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      shortLabel: 'Settings'
    }
  ];

  return (
    <nav className="lg:hidden mobile-nav">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path) && item.path !== "/" || 
                         (location.pathname === "/" && item.path === "/dashboard");
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all duration-200 touch-manipulation",
                "min-h-[56px] min-w-[56px]",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg scale-105" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
