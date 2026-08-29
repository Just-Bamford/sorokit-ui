import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TooltipProps {
  /** Tooltip body. Nothing renders when this is empty. */
  content: ReactNode;
  /** The element the tooltip describes. Must accept a ref and spread props. */
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Hover delay in ms before the tooltip opens. Focus always opens instantly. */
  delayDuration?: number;
  /** Extra classes for the tooltip surface. */
  className?: string;
  /** Controlled open state. Omit for the default hover/focus behaviour. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Tooltip — shared wrapper over Radix Tooltip.
 *
 * `NetworkSwitcher`, `SorobanInvokeButton`, and `AccountCard` each hand-rolled
 * their own show/hide state before this existed, which meant three different
 * behaviours for keyboard users. Radix gives focus handling, dismiss-on-Escape,
 * and the `aria-describedby` wiring for free.
 *
 * The provider is included here so a single `<Tooltip>` works standalone;
 * nesting inside an outer provider is supported by Radix and is what you want
 * when several tooltips should share one delay timer.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 200,
  className,
  open,
  onOpenChange,
}: TooltipProps) {
  if (content === null || content === undefined || content === "") {
    return children;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              "z-[9999] max-w-[260px] rounded-lg border border-line bg-surface-2 px-2.5 py-1.5",
              "text-[11px] leading-relaxed text-ink shadow-lg",
              "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out",
              className,
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-[var(--color-line)]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
