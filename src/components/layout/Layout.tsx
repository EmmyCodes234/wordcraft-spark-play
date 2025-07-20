// File: src/components/layout/Layout.tsx

import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./navbar";
import { AdTicker } from "@/components/ui/AdTicker";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      
      {/* --- The Sticky Header Block --- */}
      {/* Both Navbar and AdTicker are now inside this sticky header. */}
      {/* The `bg-background` class ensures it's opaque and content scrolls cleanly behind it. */}
      <header className="sticky top-0 z-50 bg-background shadow-sm">
        <Navbar />
        <AdTicker />
      </header>

      <main className="flex-grow">
        {/* The Outlet will render your page content (Dashboard, Profile, etc.) */}
        <Outlet />
      </main>
    </div>
  );
}