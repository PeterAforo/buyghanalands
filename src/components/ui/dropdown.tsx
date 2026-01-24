"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

function useDropdown() {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within a Dropdown provider");
  }
  return context;
}

interface DropdownProps {
  children: React.ReactNode;
}

function Dropdown({ children }: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showChevron?: boolean;
}

function DropdownTrigger({ children, className, showChevron = true, ...props }: DropdownTriggerProps) {
  const { isOpen, setIsOpen } = useDropdown();

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn("flex items-center gap-2", className)}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      {showChevron && (
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      )}
    </button>
  );
}

interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "left" | "right" | "center";
  sideOffset?: number;
}

function DropdownContent({
  children,
  className,
  align = "left",
  sideOffset = 4,
  ...props
}: DropdownContentProps) {
  const { isOpen } = useDropdown();

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute z-50 min-w-[180px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-100",
        align === "left" && "left-0",
        align === "right" && "right-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        className
      )}
      style={{ marginTop: sideOffset }}
      {...props}
    >
      {children}
    </div>
  );
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

function DropdownItem({ children, className, destructive, ...props }: DropdownItemProps) {
  const { setIsOpen } = useDropdown();

  return (
    <button
      className={cn(
        "w-full px-4 py-2 text-left text-sm transition-colors",
        "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
        destructive ? "text-red-600 hover:bg-red-50" : "text-gray-700",
        className
      )}
      onClick={(e) => {
        props.onClick?.(e);
        setIsOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-gray-100", className)} />;
}

function DropdownLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider", className)}>
      {children}
    </div>
  );
}

export { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator, DropdownLabel };
