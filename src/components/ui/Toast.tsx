import * as ToastPrimitive from "@radix-ui/react-toast";

import type { Toast as ToastType } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 9v4m0 4h.01M10.29 3.86l-8.1 14c-.6 1.04.15 2.14 1.21 2.14h16.2c1.06 0 1.81-1.1 1.21-2.14l-8.1-14c-.6-1.04-1.82-1.04-2.42 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4m0-4h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const iconMap = {
  success: { icon: CheckIcon, bg: "bg-success-dim", fg: "text-green" },
  error: { icon: XIcon, bg: "bg-error-dim", fg: "text-red" },
  warning: { icon: AlertIcon, bg: "bg-orange-500/15", fg: "text-orange" },
  info: { icon: InfoIcon, bg: "bg-blue-500/15", fg: "text-blue-500" },
} as const;

interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { icon: Icon, bg, fg } = iconMap[toast.type];

  return (
    <ToastPrimitive.Root
      type={toast.duration === 0 ? "foreground" : "background"}
      onOpenChange={(open) => { if (!open) onDismiss(toast.id); }}
      // Radix's Root defaults to role="status"/aria-live="off" and announces
      // through its own offscreen region. Notifications here are transient and
      // action-bearing, so expose the toast itself as an assertive live region.
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-lg",
        "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-right-full",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-right-full",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
        "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform",
        "data-[swipe=end]:animate-out data-[swipe=end]:fade-out data-[swipe=end]:slide-out-to-right-full",
      )}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", bg)}>
        <Icon className={cn("h-4 w-4", fg)} />
      </div>
      <div className="flex-1 min-w-0">
        <ToastPrimitive.Title className="text-[13px] font-semibold text-ink">
          {toast.title}
        </ToastPrimitive.Title>
        {toast.message && (
          <ToastPrimitive.Description className="mt-0.5 text-[12px] text-ink-3 leading-relaxed">
            {toast.message}
          </ToastPrimitive.Description>
        )}
        {toast.action && (
          <ToastPrimitive.Action
            altText={toast.action.label}
            onClick={toast.action.onClick}
            className="mt-2 text-[11px] font-semibold text-ink hover:text-ink-2 underline-offset-2 underline transition-colors"
          >
            {toast.action.label}
          </ToastPrimitive.Action>
        )}
      </div>
      <ToastPrimitive.Close
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
        aria-label={`Dismiss ${toast.type} notification`}
      >
        <XIcon className="h-3.5 w-3.5" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
      <ToastPrimitive.Viewport
        className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 w-full max-w-[420px] outline-none"
      />
    </ToastPrimitive.Provider>
  );
}
