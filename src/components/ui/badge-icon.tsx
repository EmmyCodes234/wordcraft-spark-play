import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface BadgeIconProps {
  icon: LucideIcon;
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BadgeIcon({ 
  icon: Icon, 
  label, 
  variant = 'default', 
  size = 'md',
  className 
}: BadgeIconProps) {
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      variant={variant as any} 
      className={cn(
        "flex items-center gap-1.5 font-medium transition-all duration-200",
        sizes[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {label}
    </Badge>
  );
}