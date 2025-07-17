import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/lookup", label: "Word Lookup" },
    { path: "/judge", label: "Word Judge" },
    { path: "/anagram", label: "Anagram Solver" },
    { path: "/pattern", label: "Pattern Matcher" },
    { path: "/quiz", label: "Anagram Challenge" },
    { path: "/study-deck", label: "Study Deck" },
    { path: "/profile", label: "Profile" },
    { path: "/settings", label: "Settings" }
  ];

  return (
    <nav className="bg-card border-b border-border elevation-2 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-title-large font-medium text-primary hover:text-primary/80 transition-colors"
          >
            WordSmith
          </Link>

          {/* Navigation Links */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-3 py-2 rounded-lg text-label-medium font-medium transition-colors hover:bg-surface-variant",
                    location.pathname === link.path 
                      ? "bg-primary-container text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && (
          <div className="lg:hidden pb-3">
            <div className="flex flex-wrap gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-label-small font-medium transition-colors",
                    location.pathname === link.path 
                      ? "bg-primary-container text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-variant"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
