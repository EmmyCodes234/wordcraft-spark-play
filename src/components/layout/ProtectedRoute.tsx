// File: src/components/layout/ProtectedRoute.tsx

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoaderCircle } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to your specific login page
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}