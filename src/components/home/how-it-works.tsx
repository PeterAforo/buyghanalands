"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, FileCheck, Handshake, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Browse & Search",
    description: "Explore verified land listings across all 16 regions of Ghana with detailed information and photos.",
  },
  {
    icon: FileCheck,
    title: "Verify Documents",
    description: "Review land documents, verification status, and request professional verification services.",
  },
  {
    icon: Handshake,
    title: "Make an Offer",
    description: "Negotiate directly with sellers and agree on terms through our secure messaging platform.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Escrow",
    description: "Complete your transaction safely with our escrow protection and milestone-based payments.",
  },
];

interface HowItWorksProps {
  className?: string;
}

function HowItWorks({ className }: HowItWorksProps) {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Buy land in Ghana with confidence using our secure, transparent process
          </p>
        </div>

        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-green-200 via-green-400 to-green-200" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Step Number */}
                <div className="relative z-10 inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-50 to-green-100 mb-6">
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <step.icon className="h-12 w-12 text-green-600" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <a
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
          >
            Get Started Today
          </a>
        </div>
      </div>
    </section>
  );
}

export { HowItWorks };
