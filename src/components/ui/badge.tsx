import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "blue" | "green";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      destructive: "bg-destructive text-destructive-foreground",
      outline: "border border-input bg-background",
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
