import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  hoverLift?: boolean;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  hoverLift = false,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-emerald-950/[0.06] bg-white",
        "transition-shadow duration-300",
        hoverLift && "hover:shadow-[0_12px_32px_-16px_rgba(11,31,23,0.16)]",
        className
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-emerald-950/[0.05] px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-base font-semibold text-emerald-950">{title}</h2>
            )}
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
