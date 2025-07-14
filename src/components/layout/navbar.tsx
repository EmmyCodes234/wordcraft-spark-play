import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/lookup", label: "Word Lookup" },
    { path: "/anagram", label: "Anagram Solver" },
    { path: "/pattern", label: "Pattern Matcher" },
    { path: "/quiz", label: "Quiz Mode" },
    { path: "/flashcards", label: "Flashcards" },
    { path: "/profile", label: "Profile" },
    { path: "/settings", label: "Settings" }
  ];

  return (
    <nav className="bg-background border-b border-border px-6 py-3 flex items-center justify-between shadow-md sticky top-0 z-50">
      <Link to="/" className="text-2xl font-extrabold text-primary tracking-tight hover:opacity-90 transition">
        WordSmith
      </Link>

      {user ? (
        <div className="flex flex-wrap gap-3 items-center justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium px-3 py-1 rounded hover:bg-primary/10 transition-all",
                location.pathname === link.path ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={logout}
            className="ml-2 px-3 py-1 text-sm font-medium bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link
            to="/login"
            className="text-sm font-medium px-3 py-1 rounded hover:bg-primary/10 transition-all"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition"
          >
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
}
