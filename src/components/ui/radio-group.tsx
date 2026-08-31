"use client";

import { createContext, useContext, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  name?: string;
}

export function RadioGroup({
  value,
  onValueChange,
  children,
  className,
  name,
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div className={cn("grid gap-2", className)} role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps {
  value: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function RadioGroupItem({
  value,
  className,
  disabled = false,
  id,
}: RadioGroupItemProps) {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error("RadioGroupItem must be used within a RadioGroup");
  }
  const checked = ctx.value === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      id={id}
      name={ctx.name}
      value={value}
      disabled={disabled}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "border-emerald-600"
          : "border-gray-300 hover:border-emerald-500",
        className
      )}
    >
      {checked && <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />}
    </button>
  );
}

interface RadioGroupOptionProps {
  value: string;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function RadioGroupOption({
  value,
  label,
  disabled,
  className,
}: RadioGroupOptionProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 text-sm text-gray-700 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <RadioGroupItem value={value} disabled={disabled} />
      {label}
    </label>
  );
}
