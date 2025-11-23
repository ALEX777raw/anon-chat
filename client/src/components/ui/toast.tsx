import * as React from "react";
import { cn } from "@/lib/utils";

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
} & Omit<React.HTMLAttributes<HTMLDivElement>, "title">;

export type ToastActionElement = React.ReactElement;

export function Toast({
  className,
  children,
  variant = "default",
  title: _title,
  description: _description,
  action: _action,
  ...divProps
}: ToastProps & { children?: React.ReactNode }) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-lg p-4",
        variant === "destructive" ? "border-destructive/40 bg-destructive text-destructive-foreground" : "",
        className,
      )}
      {...divProps}
    >
      {children}
    </div>
  );
}

export function ToastTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold leading-none", className)} {...props} />;
}

export function ToastDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-muted-foreground", className)} {...props} />;
}

export function ToastAction({
  className,
  altText,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { altText: string }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        className,
      )}
      aria-label={altText}
      {...props}
    />
  );
}

export function ToastClose({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { altText?: string }) {
  return (
    <button
      className={cn("text-xs text-muted-foreground hover:text-foreground transition-colors", className)}
      aria-label={props.altText || "Close"}
      {...props}
    >
      ✕
    </button>
  );
}
