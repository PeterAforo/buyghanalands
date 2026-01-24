"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Compass, Scale, PenTool, HardHat, Calculator, ClipboardList, ArrowRight } from "lucide-react";

const PROFESSIONAL_TYPES = [
  { type: "SURVEYOR", label: "Surveyors", icon: Compass, description: "Land surveys & boundary demarcation" },
  { type: "LAWYER", label: "Lawyers", icon: Scale, description: "Legal documentation & title search" },
  { type: "ARCHITECT", label: "Architects", icon: PenTool, description: "Building design & planning" },
  { type: "ENGINEER", label: "Engineers", icon: HardHat, description: "Structural assessment" },
  { type: "VALUER", label: "Valuers", icon: Calculator, description: "Property valuation" },
  { type: "PLANNER", label: "Planners", icon: ClipboardList, description: "Town planning consultation" },
];

interface ProfessionalsShowcaseProps {
  className?: string;
}

function ProfessionalsShowcase({ className }: ProfessionalsShowcaseProps) {
  return (
    <section className={cn("py-16 md:py-24 bg-gray-50", className)}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional Services
            </h2>
            <p className="text-lg text-gray-600 max-w-xl">
              Connect with verified professionals to help with your land transaction
            </p>
          </div>
          <Link
            href="/professionals"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            View All Professionals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PROFESSIONAL_TYPES.map(({ type, label, icon: Icon, description }) => (
            <Link
              key={type}
              href={`/professionals?type=${type}`}
              className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                <Icon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export { ProfessionalsShowcase };
