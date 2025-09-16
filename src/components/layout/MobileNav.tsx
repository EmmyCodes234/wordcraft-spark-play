import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
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
  Settings,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { colors } = useTheme();
  const { user } = useAuth();

  // Load unread notifications count
  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (error) {
          console.error('Error loading unread count:', error);
          return;
        }

        setUnreadCount(data?.length || 0);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    loadUnreadCount();

    // Set up real-time subscription for unread count
    const channel = supabase
      .channel(`mobile-nav-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        },
        () => {
          loadUnreadCount(); // Reload count when notifications change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
      {/* Mobile Notification Bell + Hamburger Menu */}
      <div className="lg:hidden fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Notification Bell */}
        {user && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/notifications')}
            className="mobile-haptic text-white p-3 rounded-2xl shadow-lg relative"
            style={{ backgroundColor: colors.primary }}
            animate={unreadCount > 0 ? { 
              scale: [1, 1.05, 1],
              transition: { 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              } 
            } : {}}
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center font-bold"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.div>
            )}
          </motion.button>
        )}
        
        {/* Hamburger Menu Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="mobile-haptic text-white p-3 rounded-2xl shadow-lg"
          style={{ backgroundColor: colors.primary }}
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
                            ? "text-white"
                            : "text-gray-700 hover:text-black hover:bg-gray-100"
                        )}
                        style={{
                          backgroundColor: active ? colors.primary : 'transparent'
                        }}
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
