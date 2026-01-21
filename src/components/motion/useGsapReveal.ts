"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface UseGsapRevealOptions {
  y?: number;
  duration?: number;
  ease?: string;
  stagger?: number;
  start?: string;
}

export function useGsapReveal(options: UseGsapRevealOptions = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const {
    y = 24,
    duration = 0.7,
    ease = "power2.out",
    stagger = 0.1,
    start = "top 85%",
  } = options;

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || !containerRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      // Find all elements with data-reveal attribute
      const revealElements = containerRef.current?.querySelectorAll("[data-reveal]");
      
      if (!revealElements || revealElements.length === 0) return;

      // Group elements by data-reveal-group if present
      const groups = new Map<string, Element[]>();
      const standalone: Element[] = [];

      revealElements.forEach((el) => {
        const group = el.getAttribute("data-reveal-group");
        if (group) {
          if (!groups.has(group)) {
            groups.set(group, []);
          }
          groups.get(group)!.push(el);
        } else {
          standalone.push(el);
        }
      });

      // Animate standalone elements
      standalone.forEach((el) => {
        gsap.fromTo(
          el,
          { y, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration,
            ease,
            scrollTrigger: {
              trigger: el,
              start,
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Animate grouped elements with stagger
      groups.forEach((elements) => {
        gsap.fromTo(
          elements,
          { y, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration,
            ease,
            stagger,
            scrollTrigger: {
              trigger: elements[0],
              start,
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, [y, duration, ease, stagger, start]);

  return containerRef;
}

// Hook for counting up numbers
export function useCountUp(
  targetValue: number,
  options: {
    duration?: number;
    start?: string;
    prefix?: string;
    suffix?: string;
  } = {}
) {
  const elementRef = useRef<HTMLElement>(null);
  const { duration = 2, start = "top 85%", prefix = "", suffix = "" } = options;

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || !elementRef.current) {
      // Set final value immediately for reduced motion
      if (elementRef.current) {
        elementRef.current.textContent = `${prefix}${targetValue.toLocaleString()}${suffix}`;
      }
      return;
    }

    const el = elementRef.current;
    const obj = { value: 0 };

    const tween = gsap.to(obj, {
      value: targetValue,
      duration,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: "play none none none",
      },
      onUpdate: () => {
        el.textContent = `${prefix}${Math.round(obj.value).toLocaleString()}${suffix}`;
      },
    });

    return () => {
      tween.kill();
    };
  }, [targetValue, duration, start, prefix, suffix]);

  return elementRef;
}
