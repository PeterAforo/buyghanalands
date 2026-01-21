"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";

// Register ScrollTrigger plugin once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface GsapProviderProps {
  children: React.ReactNode;
}

export function GsapProvider({ children }: GsapProviderProps) {
  const pathname = usePathname();
  const isInitialized = useRef(false);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Disable all GSAP animations for reduced motion
      gsap.globalTimeline.timeScale(0);
      return;
    }

    if (!isInitialized.current) {
      isInitialized.current = true;
    }

    // Cleanup ScrollTrigger instances on route change
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [pathname]);

  // Refresh ScrollTrigger after route changes
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!prefersReducedMotion) {
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [pathname]);

  return <>{children}</>;
}
