"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1000,
  formatValue = (v) => `GHS ${v.toLocaleString()}`,
  className,
}: PriceRangeSliderProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const rangeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const getPercent = (val: number) => ((val - min) / (max - min)) * 100;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue[1] - step);
    const newValue: [number, number] = [newMin, localValue[1]];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue[0] + step);
    const newValue: [number, number] = [localValue[0], newMax];
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{formatValue(localValue[0])}</span>
        <span className="text-gray-400">—</span>
        <span className="font-medium text-gray-700">{formatValue(localValue[1])}</span>
      </div>
      
      <div className="relative h-2" ref={rangeRef}>
        <div className="absolute inset-0 rounded-full bg-gray-200" />
        <div
          className="absolute h-full rounded-full bg-green-500"
          style={{
            left: `${getPercent(localValue[0])}%`,
            right: `${100 - getPercent(localValue[1])}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={handleMinChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: localValue[0] > max - 100 ? 5 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 4 }}
        />
        <div
          className="absolute w-5 h-5 bg-white border-2 border-green-500 rounded-full shadow-md -translate-y-1/2 top-1/2 cursor-grab"
          style={{ left: `calc(${getPercent(localValue[0])}% - 10px)` }}
        />
        <div
          className="absolute w-5 h-5 bg-white border-2 border-green-500 rounded-full shadow-md -translate-y-1/2 top-1/2 cursor-grab"
          style={{ left: `calc(${getPercent(localValue[1])}% - 10px)` }}
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
          <input
            type="number"
            value={localValue[0]}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val >= min && val < localValue[1]) {
                const newValue: [number, number] = [val, localValue[1]];
                setLocalValue(newValue);
                onChange(newValue);
              }
            }}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
          <input
            type="number"
            value={localValue[1]}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val <= max && val > localValue[0]) {
                const newValue: [number, number] = [localValue[0], val];
                setLocalValue(newValue);
                onChange(newValue);
              }
            }}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
    </div>
  );
}

export { PriceRangeSlider };
