import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  variant = 'default',
  className 
}: StatCardProps) {
  const variants = {
    default: 'border-border',
    primary: 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10',
    success: 'border-success/20 bg-gradient-to-br from-success/5 to-success/10',
    warning: 'border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10'
  };

  const iconColors = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning'
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-elegant hover:scale-105",
      variants[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          {Icon && (
            <div className={cn(
              "p-2 rounded-lg",
              variant === 'primary' && "bg-primary/10",
              variant === 'success' && "bg-success/10",
              variant === 'warning' && "bg-warning/10",
              variant === 'default' && "bg-muted"
            )}>
              <Icon className={cn("h-6 w-6", iconColors[variant])} />
            </div>
          )}
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}