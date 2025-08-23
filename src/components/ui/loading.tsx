import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

// Skeleton component for loading states
export const Skeleton = ({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
};

// Dashboard skeleton loader
export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8 max-w-6xl">
        {/* Welcome Section Skeleton */}
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-80 mx-auto" />
          <Skeleton className="h-6 w-64 mx-auto" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6 text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-16 mx-auto" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Word of the Day Skeleton */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center space-y-3">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-12 w-48 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </CardContent>
        </Card>

        {/* Quick Actions Skeleton */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-10 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Card skeleton loader
export const CardSkeleton = ({ 
  className,
  lines = 3,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) => {
  return (
    <Card className={cn("border-0 shadow-sm", className)} {...props}>
      <CardContent className="p-6 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </CardContent>
    </Card>
  );
};

// List skeleton loader
export const ListSkeleton = ({ 
  items = 5,
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { items?: number }) => {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Table skeleton loader
export const TableSkeleton = ({ 
  rows = 5,
  columns = 4,
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { 
  rows?: number; 
  columns?: number; 
}) => {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      <div className="flex gap-3 p-3 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3 p-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Form skeleton loader
export const FormSkeleton = ({ 
  fields = 4,
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { fields?: number }) => {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

// Profile skeleton loader
export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Avatar and name */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center space-y-2">
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Bio */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );
};

// Game skeleton loader
export const GameSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-48 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>
      
      {/* Game area */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center space-y-6">
          <Skeleton className="h-16 w-64 mx-auto" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </CardContent>
      </Card>
      
      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

// Loading spinner component
export const LoadingSpinner = ({ 
  size = "md",
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { 
  size?: "sm" | "md" | "lg" | "xl" 
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
};

// Full page loading component
export const FullPageLoader = ({ 
  message = "Loading...",
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { message?: string }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-background"
      {...props}
    >
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

// Inline loading component
export const InlineLoader = ({ 
  message = "Loading...",
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { message?: string }) => {
  return (
    <div 
      className={cn("flex items-center justify-center gap-2 py-4", className)}
      {...props}
    >
      <LoadingSpinner size="sm" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
};