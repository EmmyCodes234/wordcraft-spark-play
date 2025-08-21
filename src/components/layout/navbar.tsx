import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, Home, Search, Zap, BookOpen, User, Settings, Gamepad2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: Home, shortLabel: "Home" },
    { path: "/quiz", label: "Study", icon: BookOpen, shortLabel: "Study" },
    { path: "/judge", label: "Word Judge", icon: Search, shortLabel: "Judge" },
    { path: "/anagram", label: "Anagram Solver", icon: Zap, shortLabel: "Anagram" },
    { path: "/pattern", label: "Pattern Matcher", icon: BookOpen, shortLabel: "Pattern" },
  ];

  const toggleMobile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Hamburger menu clicked, current state:', mobileOpen);
    setMobileOpen(prev => {
      console.log('Setting mobile menu to:', !prev);
      return !prev;
    });
  };
  
  const closeMobile = () => {
    console.log('Closing mobile menu');
    setMobileOpen(false);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    console.log('Route changed, closing mobile menu');
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const navbar = document.querySelector('nav');
      const mobileMenuButton = document.querySelector('[aria-label="Toggle menu"]');
      
      if (mobileOpen && navbar && !navbar.contains(target) && !mobileMenuButton?.contains(target)) {
        console.log('Clicked outside navbar, closing mobile menu');
        closeMobile();
      }
    };

    if (mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      // Focus trap for accessibility
      const firstLink = document.querySelector('[role="dialog"] a') as HTMLElement;
      if (firstLink) {
        firstLink.focus();
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        closeMobile();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-3 z-50 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto relative">
        
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary tracking-tight hover:opacity-90 transition-opacity py-2 px-2"
            onClick={(e) => {
              // Only prevent default if mobile menu is open to avoid conflicts
              if (mobileOpen) {
                console.log('Logo clicked while menu open - preventing navigation');
                e.preventDefault();
                closeMobile();
                return;
              }
              console.log('Logo clicked - allowing navigation');
            }}
          >
            <span className="text-base sm:text-lg lg:text-xl text-gray-900">WordSmith</span>
            <span className="hidden sm:inline border border-gray-300 text-gray-600 text-xs font-semibold rounded-full px-2 py-0.5">
              BETA
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {user && navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path) && link.path !== "/" || 
                           (location.pathname === "/" && link.path === "/");
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop User Actions */}
        <div className="hidden lg:flex items-center space-x-2">
          {user && (
            <>
              <Link
                to="/profile"
                className={cn(
                  "flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200",
                  location.pathname === "/profile"
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <Link
                to="/settings"
                className={cn(
                  "flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200",
                  location.pathname === "/settings"
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        {user && (
          <button
            onClick={toggleMobile}
            className="lg:hidden p-3 rounded-lg hover:bg-gray-100 transition-colors relative z-50 min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            type="button"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {user && (
        <>
          {/* Backdrop */}
          <div 
            className={cn(
              "lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-300",
              mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Backdrop clicked - closing menu');
              closeMobile();
            }}
            aria-hidden="true"
          />
          
          {/* Mobile Menu */}
          <div 
            className={cn(
              "lg:hidden fixed top-[64px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 max-h-[calc(100vh-64px)] overflow-y-auto transition-all duration-300 ease-out",
              mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
            onClick={(e) => {
              // Prevent clicks inside the menu from bubbling up to the backdrop
              e.stopPropagation();
            }}
          >
            <div className="px-4 py-4 space-y-2 max-w-7xl mx-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path) && link.path !== "/" || 
                               (location.pathname === "/" && link.path === "/");
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-3 text-base font-medium py-4 px-4 rounded-lg transition-all duration-200 min-h-[48px]",
                      isActive
                        ? "text-primary bg-primary/10 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">{link.label}</span>
                  </Link>
                );
              })}
              
              <div className="border-t border-border/50 pt-4 mt-4">
                <Link
                  to="/profile"
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-3 text-base font-medium py-4 px-4 rounded-lg transition-all duration-200 min-h-[48px]",
                    location.pathname === "/profile"
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">Profile</span>
                </Link>
                
                <Link
                  to="/settings"
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-3 text-base font-medium py-4 px-4 rounded-lg transition-all duration-200 min-h-[48px]",
                    location.pathname === "/settings"
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">Settings</span>
                </Link>
                
                <button
                  onClick={() => {
                    handleLogout();
                    closeMobile();
                  }}
                  className="w-full flex items-center gap-3 text-base font-medium py-4 px-4 rounded-lg text-destructive hover:bg-destructive/10 transition-all duration-200 min-h-[48px]"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}