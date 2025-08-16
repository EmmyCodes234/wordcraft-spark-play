import React from "react";
import { cn } from "@/lib/utils";

interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  label,
  description,
  children,
  className,
  disabled = false
}) => {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 py-2",
      disabled && "opacity-50 pointer-events-none",
      className
    )}>
      <div className="flex-1 min-w-0">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
};

export default SettingItem;