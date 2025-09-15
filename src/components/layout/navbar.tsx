import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, Home, Search, Zap, BookOpen, User, Settings, Gamepad2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const navLinks = [
    { path: "/dashboard", label: "Dashboard", icon: Home, shortLabel: "Home" },
    { path: "/quiz", label: "Study", icon: BookOpen, shortLabel: "Study" },
    { path: "/judge", label: "Word Judge", icon: Search, shortLabel: "Judge" },
    { path: "/anagram", label: "Anagram Solver", icon: Zap, shortLabel: "Anagram" },
    { path: "/pattern", label: "Pattern Matcher", icon: BookOpen, shortLabel: "Pattern" },
  ];





  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-3 z-50 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between max-w-7xl mx-auto relative">
        
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary tracking-tight hover:opacity-90 transition-opacity py-2 px-2"
            onClick={(e) => {
              console.log('Logo clicked - allowing navigation');
            }}
          >
            <span className="text-base sm:text-lg lg:text-xl text-foreground">WordSmith</span>
            <span className="border border-primary text-primary text-xs font-semibold rounded-full px-2 py-0.5 bg-primary/10">
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

      </div>
    </nav>
  );
}