import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./navbar";
import { AdTicker } from "@/components/ui/AdTicker";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/20 shadow-sm">
        <Navbar />
        <AdTicker />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="min-h-[calc(100vh-120px)] w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}