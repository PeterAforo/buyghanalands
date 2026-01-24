"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallback?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
};

function Avatar({ src, alt, size = "md", fallback, className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);

  const initials = fallback
    ? fallback
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  if (src && !error) {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden bg-gray-100 flex-shrink-0",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <img
          src={src}
          alt={alt || "Avatar"}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium flex-shrink-0",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {initials || <User className="h-1/2 w-1/2" />}
    </div>
  );
}

export { Avatar };
