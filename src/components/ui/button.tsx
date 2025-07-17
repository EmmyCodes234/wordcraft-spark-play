import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-label-large font-medium transition-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:elevation-2 active:elevation-1",
        destructive: "bg-destructive text-destructive-foreground hover:elevation-2 active:elevation-1",
        outline: "border border-border bg-card text-card-foreground hover:bg-surface-variant hover:elevation-1",
        secondary: "bg-secondary text-secondary-foreground hover:elevation-2 active:elevation-1",
        ghost: "hover:bg-surface-variant hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        filled: "bg-primary text-primary-foreground hover:elevation-2 active:elevation-1",
        tonal: "bg-secondary-container text-secondary-on-container hover:elevation-2 active:elevation-1",
        elevated: "bg-card text-card-foreground elevation-1 hover:elevation-3 active:elevation-1",
        success: "bg-success text-success-foreground hover:elevation-2 active:elevation-1",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 text-label-medium",
        lg: "h-12 px-8 text-label-large",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
