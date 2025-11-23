import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative", props.className)} {...props}>
      {children}
    </div>
  );
}

export function TooltipContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "absolute -top-10 left-1/2 -translate-x-1/2 rounded-md bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg",
        className,
      )}
      {...props}
    />
  );
}
