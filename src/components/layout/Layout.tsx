import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./navbar";
import MobileNav from "./MobileNav";
import { AdTicker } from "@/components/ui/AdTicker";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors duration-300">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm transition-colors duration-300">
        <Navbar />
        <AdTicker />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="min-h-[calc(100vh-120px)] w-full pb-20 lg:pb-4">
          <Outlet />
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}