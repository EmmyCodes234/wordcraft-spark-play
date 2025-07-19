import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/judge", label: "Word Judge" },
    { path: "/anagram", label: "Anagram Solver" },
    { path: "/pattern", label: "Pattern Matcher" },
    { path: "/quiz", label: "Quiz Mode" },
    { path: "/flashcards", label: "Flashcards" },
    { path: "/profile", label: "Profile" },
    { path: "/settings", label: "Settings" },
  ];

  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="bg-background border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <Link
        to="/"
        className="text-xl sm:text-2xl font-extrabold text-primary tracking-tight hover:opacity-90 transition"
      >
        WordSmith
      </Link>

      <div className="sm:hidden">
        <button onClick={toggleMobile}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="hidden sm:flex flex-wrap gap-3 items-center">
        {user &&
          navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium px-3 py-1 rounded hover:bg-primary/10 transition-all",
                location.pathname === link.path
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
      </div>

      {mobileOpen && (
        <div className="absolute top-full left-0 w-full bg-background border-t shadow-md sm:hidden z-40 px-4 py-2 space-y-2">
          {user &&
            navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMobile}
                className={cn(
                  "block text-sm font-medium py-2 border-b border-border",
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
        </div>
      )}
    </nav>
  );
}
