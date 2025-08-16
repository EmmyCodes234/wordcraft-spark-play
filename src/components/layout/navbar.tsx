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
    { path: "/judge", label: "Word Judge", icon: Search, shortLabel: "Judge" },
    { path: "/anagram", label: "Anagram Solver", icon: Zap, shortLabel: "Anagram" },
    { path: "/pattern", label: "Pattern Matcher", icon: BookOpen, shortLabel: "Pattern" },
    { path: "/race-lobby", label: "Word Races", icon: Gamepad2, shortLabel: "Races" },
    { path: "/quiz", label: "Study", icon: BookOpen, shortLabel: "Study" },
    { path: "/profile", label: "Profile", icon: User, shortLabel: "Profile" },
    { path: "/settings", label: "Settings", icon: Settings, shortLabel: "Settings" },
  ];

  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const closeMobile = () => setMobileOpen(false);

  // Close mobile menu when clicking outside or on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="relative bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 sm:px-6 py-3 sm:py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary tracking-tight hover:opacity-90 transition-opacity"
          >
            <span className="text-base sm:text-lg lg:text-xl">WordSmith</span>
            <span className="hidden sm:inline border border-muted-foreground text-muted-foreground text-xs font-semibold rounded-full px-2 py-0.5">
              BETA
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {user && navLinks.slice(0, 5).map((link) => {
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
            className="lg:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileOpen && user && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-lg z-50">
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
      )}
    </nav>
  );
}