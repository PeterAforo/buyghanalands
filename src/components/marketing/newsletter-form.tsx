"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle } from "lucide-react";

export function NewsletterForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const dark = variant === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Thank you for subscribing!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div
        className={`flex items-center justify-center gap-2 rounded-xl px-5 py-4 ${
          dark ? "bg-white/10 text-amber-200" : "bg-emerald-50 text-emerald-700"
        }`}
      >
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className={`flex-1 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-300 ${
            dark
              ? "border border-white/20 bg-white/10 text-white placeholder:text-white/50"
              : "border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
          }`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 font-semibold text-emerald-950 shadow-lg shadow-amber-400/25 transition-all hover:bg-amber-300 disabled:opacity-70"
        >
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Subscribe
              <Send className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
      {status === "error" && (
        <p className={`mt-2 text-sm ${dark ? "text-red-300" : "text-red-600"}`}>{message}</p>
      )}
    </form>
  );
}
