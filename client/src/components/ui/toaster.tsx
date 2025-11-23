import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border border-border bg-card text-card-foreground shadow-lg",
            toast.variant === "destructive" ? "border-destructive/50 bg-destructive text-destructive-foreground" : "",
          )}
        >
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="space-y-1 flex-1">
              {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
              {toast.description ? <p className="text-sm text-muted-foreground">{toast.description}</p> : null}
              {toast.action ? <div className="pt-1">{toast.action}</div> : null}
            </div>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
