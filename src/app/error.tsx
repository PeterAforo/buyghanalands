"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#faf8f2] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-emerald-950 mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-8">
          An unexpected error occurred. Please try again — if the problem persists,
          contact our support team.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-800"
        >
          <RefreshCw className="h-5 w-5" />
          Try again
        </button>
      </div>
    </div>
  );
}
