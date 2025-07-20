import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="relative bg-background border-b border-border px-4 sm:px-6 py-3 grid grid-cols-2 sm:grid-cols-3 items-center shadow-sm">
      
      {/* --- Column 1: Logo (Left Aligned) --- */}
      <div className="justify-self-start">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-primary tracking-tight hover:opacity-90 transition"
        >
          <span>WordSmith</span>
          <span className="border border-muted-foreground text-muted-foreground text-xs font-semibold rounded-full px-2 py-0.5">
            BETA
          </span>
        </Link>
      </div>

      {/* --- Column 2: Centered Links (Desktop Only) --- */}
      <div className="hidden sm:flex items-center justify-self-center gap-x-1">
        {user &&
          navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-md hover:bg-muted transition-colors", // <-- FIX ADDED HERE
                location.pathname.startsWith(link.path)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
      </div>

      {/* --- Column 3: Logout & Mobile Menu (Right Aligned) --- */}
      <div className="justify-self-end flex items-center">
        <div className="hidden sm:flex">
            {user && (
                <button
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium px-3 py-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </button>
            )}
        </div>
        <div className="sm:hidden">
            <button onClick={toggleMobile}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
        </div>
      </div>

      {/* --- Mobile Dropdown Menu --- */}
      {mobileOpen && (
        <div className="col-span-2 sm:hidden absolute top-full left-0 w-full bg-background border-t shadow-lg z-40 p-4 space-y-2">
          {user &&
            navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMobile}
                className={cn(
                  "whitespace-nowrap block text-base font-medium py-2 px-2 rounded-md", // <-- FIX ADDED HERE
                  location.pathname.startsWith(link.path)
                    ? "text-primary bg-muted"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          
          {user && (
            <>
              <div className="border-b border-border pt-2" />
              <button
                onClick={() => {
                  handleLogout();
                  closeMobile();
                }}
                className="w-full flex items-center text-base font-medium py-2 px-2 mt-2 rounded-md text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}