import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DataRowProps {
  href?: string;
  thumbnail?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Consistent list-row styling for dashboard lists (listings, offers, activity, etc).
 */
export function DataRow({
  href,
  thumbnail,
  title,
  subtitle,
  meta,
  right,
  className,
  onClick,
}: DataRowProps) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl px-3 py-3 transition-colors",
        (href || onClick) && "hover:bg-emerald-50/60 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {thumbnail && <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">{thumbnail}</div>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-emerald-950">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>}
        {meta && <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">{meta}</div>}
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
