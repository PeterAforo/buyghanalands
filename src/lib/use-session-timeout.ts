"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const {
    timeoutMinutes = 30,
    warningMinutes = 5,
    onWarning,
    onTimeout,
  } = options;

  const { data: session, status } = useSession();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    if (status !== "authenticated") return;

    // Set warning timer
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;
    warningRef.current = setTimeout(() => {
      onWarning?.();
    }, warningMs);

    // Set timeout timer
    const timeoutMs = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(async () => {
      onTimeout?.();
      await signOut({ redirect: false });
      router.push("/auth/login?reason=session_expired");
    }, timeoutMs);
  }, [status, timeoutMinutes, warningMinutes, onWarning, onTimeout, router]);

  // Reset timers on user activity
  useEffect(() => {
    if (status !== "authenticated") return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    
    const handleActivity = () => {
      resetTimers();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetTimers();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [status, resetTimers]);

  // Get remaining time
  const getRemainingTime = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = timeoutMinutes * 60 * 1000 - elapsed;
    return Math.max(0, Math.floor(remaining / 1000));
  }, [timeoutMinutes]);

  return {
    resetTimers,
    getRemainingTime,
    isAuthenticated: status === "authenticated",
  };
}
