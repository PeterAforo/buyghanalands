import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#faf8f2] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="font-display text-8xl font-bold text-emerald-950 sm:text-9xl">
            404
          </h1>
        </div>
        <h2 className="font-display text-2xl font-semibold text-emerald-950 mb-3">
          Page not found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            <Home className="h-5 w-5" />
            Go home
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-950/15 bg-white px-6 py-3 font-semibold text-emerald-700 transition-colors hover:border-emerald-600/40"
          >
            <Search className="h-5 w-5" />
            Browse listings
          </Link>
        </div>
      </div>
    </div>
  );
}
