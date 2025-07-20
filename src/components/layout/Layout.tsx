// File: src/components/layout/Layout.tsx

import React from "react";
import { Outlet } from "react-router-dom";
// The import path now correctly uses lowercase "navbar" to match your filename
import Navbar from "@/components/layout/navbar"; 
import { AdTicker } from "@/components/ui/AdTicker";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50">
        <Navbar />
        <AdTicker />
      </header>
      <main className="flex-grow">
        {/* The Outlet component will render the current page (e.g., Dashboard, Profile, etc.) */}
        <Outlet />
      </main>
    </div>
  );
}