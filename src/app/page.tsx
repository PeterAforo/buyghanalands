"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import {
  Shield,
  CheckCircle,
  Users,
  FileCheck,
  ArrowRight,
  Star,
  Globe,
  Scale,
  BadgeCheck,
  Lock,
  MapPin,
} from "lucide-react";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    icon: BadgeCheck,
    title: "Verified Listings",
    benefit: "Every listing is reviewed and validated before publication.",
    microProof: "Lands Commission & document checks applied.",
  },
  {
    icon: Lock,
    title: "Protected Payments",
    benefit: "Escrow-backed transactions reduce fraud risk and increase buyer confidence.",
    microProof: "Funds released only upon agreed milestones.",
  },
  {
    icon: FileCheck,
    title: "Document Vault",
    benefit: "Store and share land documents securely with controlled access.",
    microProof: "Encrypted storage and audit-friendly access.",
  },
  {
    icon: Users,
    title: "Professional Network",
    benefit: "Connect with vetted lawyers, surveyors, architects, and agents.",
    microProof: "Verified profiles with service categories.",
  },
];

const stats = [
  { value: 1000, label: "Verified land listings across Ghana", suffix: "+" },
  { value: 50, label: "Transactions secured through escrow", prefix: "GH₵", suffix: "M+" },
  { value: 500, label: "Successful buyers (local & diaspora)", suffix: "+" },
  { value: 0, label: "Escrow-related payment losses", suffix: "", isZeroHighlight: true },
];

const steps = [
  {
    number: "01",
    title: "Find Verified Land",
    description: "Browse approved listings with documentation and clear location details.",
  },
  {
    number: "02",
    title: "Make a Secure Offer",
    description: "Negotiate safely while payments are protected through escrow.",
  },
  {
    number: "03",
    title: "Complete & Transfer Safely",
    description: "Verify documents and finalize transfer with professional support.",
  },
];

const testimonials = [
  {
    name: "Kwame Asante",
    role: "Diaspora Buyer",
    country: "UK",
    quote: "The escrow process gave me peace of mind and reduced my fear of land fraud.",
    highlight: "peace of mind",
    rating: 5,
  },
  {
    name: "Ama Serwaa",
    role: "Developer",
    country: "Ghana",
    quote: "Verification and documentation workflow made transactions transparent and faster.",
    highlight: "transparent and faster",
    rating: 5,
  },
  {
    name: "Kofi Mensah",
    role: "First-time Buyer",
    country: "USA",
    quote: "As someone buying from abroad, the professional network connected me with trusted lawyers.",
    highlight: "trusted lawyers",
    rating: 5,
  },
];

const trustBarItems = [
  { icon: BadgeCheck, label: "Lands Commission Verified" },
  { icon: Shield, label: "Escrow-Protected Payments" },
  { icon: Globe, label: "Diaspora-Friendly" },
  { icon: Scale, label: "Legal & Professional Network" },
];

// Stats Counter Component
function StatCounter({ 
  value, 
  prefix = "", 
  suffix = "", 
  label,
  isZeroHighlight = false,
}: { 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  label: string;
  isZeroHighlight?: boolean;
}) {
  const countRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion || !countRef.current || isZeroHighlight) {
      if (countRef.current) {
        countRef.current.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
      }
      return;
    }

    const el = countRef.current;
    const obj = { value: 0 };

    const tween = gsap.to(obj, {
      value: value,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
        onEnter: () => {
          if (!hasAnimated.current) {
            hasAnimated.current = true;
          }
        },
      },
      onUpdate: () => {
        el.textContent = `${prefix}${Math.round(obj.value).toLocaleString()}${suffix}`;
      },
    });

    return () => {
      tween.kill();
    };
  }, [value, prefix, suffix, isZeroHighlight]);

  return (
    <div 
      className={`text-center p-6 rounded-2xl border transition-shadow ${
        isZeroHighlight 
          ? "bg-emerald-50 border-emerald-200 shadow-sm" 
          : "bg-white border-gray-100 shadow-sm"
      }`}
      data-card-hover
    >
      <p className={`text-4xl md:text-5xl font-bold ${isZeroHighlight ? "text-emerald-600" : "text-emerald-600"}`}>
        <span ref={countRef} data-countup>{prefix}{value}{suffix}</span>
      </p>
      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{label}</p>
    </div>
  );
}

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion || !mainRef.current) {
      // Make all elements visible immediately for reduced motion
      const allAnimatedElements = mainRef.current?.querySelectorAll(
        "[data-reveal], [data-hero-headline], [data-hero-sub], [data-hero-ctas] > *, [data-trust-item], [data-how-step], [data-reveal-group] > *"
      );
      allAnimatedElements?.forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
      });
      return;
    }

    const ctx = gsap.context(() => {
      // Hero entrance animations
      gsap.fromTo(
        "[data-hero-headline]",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "expo.out" }
      );

      gsap.fromTo(
        "[data-hero-sub]",
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", delay: 0.12 }
      );

      gsap.fromTo(
        "[data-hero-ctas] > *",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.52, ease: "power2.out", stagger: 0.09, delay: 0.22 }
      );

      gsap.fromTo(
        "[data-trust-item]",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.52, ease: "power2.out", stagger: 0.08, delay: 0.34 }
      );

      gsap.fromTo(
        "[data-assurance]",
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.52, ease: "power2.out", delay: 0.44 }
      );

      // Hero visual pulse animation
      if (heroVisualRef.current) {
        const pin = heroVisualRef.current.querySelector("[data-pin]");
        const scan = heroVisualRef.current.querySelector("[data-scan]");

        if (pin) {
          gsap.to(pin, {
            scale: 1.04,
            opacity: 1,
            duration: 0.9,
            ease: "power2.out",
            yoyo: true,
            repeat: -1,
          });
        }

        if (scan) {
          gsap.fromTo(
            scan,
            { xPercent: -120, opacity: 0 },
            { xPercent: 120, opacity: 0.22, duration: 2.2, ease: "power1.inOut", repeat: -1 }
          );
        }
      }

      // Section reveal animations
      const revealElements = mainRef.current?.querySelectorAll("[data-reveal]");
      revealElements?.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // How It Works line draw
      gsap.fromTo(
        "[data-how-line]",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "[data-how-line]",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      // How It Works steps
      gsap.fromTo(
        "[data-how-step]",
        { y: 12, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          ease: "power2.out",
          stagger: 0.14,
          scrollTrigger: {
            trigger: "[data-how-step]",
            start: "top 82%",
            toggleActions: "play none none none",
          },
        }
      );

      // Grouped elements with stagger
      const groups = mainRef.current?.querySelectorAll("[data-reveal-group]");
      const groupMap = new Map<string, Element[]>();

      groups?.forEach((el) => {
        const groupName = el.getAttribute("data-reveal-group");
        if (groupName) {
          if (!groupMap.has(groupName)) {
            groupMap.set(groupName, []);
          }
          groupMap.get(groupName)!.push(el);
        }
      });

      groupMap.forEach((elements) => {
        gsap.fromTo(
          elements,
          { y: 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.11,
            scrollTrigger: {
              trigger: elements[0],
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={mainRef} className="flex flex-col">
      {/* Hero Section */}
      <section className="relative dark-section overflow-hidden" style={{ backgroundColor: 'var(--c-dark-bg)' }}>
        <div className="absolute inset-0 hero-texture" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <div className="max-w-xl">
              <h1 
                data-hero-headline
                className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
                style={{ color: 'var(--c-dark-text)' }}
              >
                Buy Verified Land in Ghana —{" "}
                <span style={{ color: 'var(--c-brand-accent)' }}>With Confidence</span>
              </h1>
              <p 
                data-hero-sub
                className="mt-6 text-lg leading-relaxed"
                style={{ color: 'var(--c-dark-muted)' }}
              >
                Secure escrow payments, Lands Commission verification, and trusted 
                professionals — whether you&apos;re in Ghana or abroad.
              </p>
              
              {/* CTAs */}
              <div data-hero-ctas className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link href="/listings">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-white text-emerald-900 hover:bg-emerald-50 font-semibold px-8 h-12"
                  >
                    Browse Verified Lands
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/listings/create">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-white/80 text-white hover:bg-white/10 font-medium px-8 h-12"
                  >
                    List Land for Sale
                  </Button>
                </Link>
                <Link 
                  href="/professionals" 
                  className="hidden sm:inline-flex items-center text-sm font-medium transition-colors px-4"
                  style={{ color: 'var(--c-brand-accent)' }}
                >
                  Talk to a Land Expert
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              
              {/* Micro-reassurance */}
              <div className="mt-6" data-assurance>
                <Shield className="h-4 w-4" style={{ color: 'var(--c-brand-accent)' }} />
                <span style={{ color: 'var(--c-dark-muted)' }}>No payment is released without your approval.</span>
              </div>
            </div>

            {/* Right Column - Visual Box */}
            <div className="hidden lg:flex items-center justify-center" ref={heroVisualRef} data-hero-visual>
              <div className="relative w-full max-w-md aspect-square hero-visual-box">
                {/* Scan line overlay */}
                <div data-scan />
                
                {/* Grid pattern is in CSS ::before */}
                
                {/* Center pin with pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    data-pin 
                    className="relative flex items-center justify-center"
                  >
                    <div 
                      className="absolute w-32 h-32 rounded-full opacity-20"
                      style={{ backgroundColor: 'var(--c-brand-accent)' }}
                    />
                    <div 
                      className="absolute w-24 h-24 rounded-full opacity-30"
                      style={{ backgroundColor: 'var(--c-brand-accent)' }}
                    />
                    <MapPin className="w-16 h-16 relative z-10" style={{ color: 'var(--c-brand-accent)' }} />
                  </div>
                </div>
                
                {/* Corner badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--c-dark-surface)', color: 'var(--c-dark-text)' }}>
                  <BadgeCheck className="h-3.5 w-3.5" style={{ color: 'var(--c-brand-accent)' }} />
                  Verified
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--c-dark-surface)', color: 'var(--c-dark-text)' }}>
                  <Shield className="h-3.5 w-3.5" style={{ color: 'var(--c-brand-accent)' }} />
                  Protected
                </div>
              </div>
            </div>
          </div>

          {/* Trust Bar */}
          <div className="mt-16 pt-8 border-t" style={{ borderColor: 'var(--c-dark-border)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustBarItems.map((item) => (
                <div 
                  key={item.label}
                  data-trust-item
                  className="flex items-center gap-3"
                  style={{ color: 'var(--c-dark-muted)' }}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--c-brand-accent)' }} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: 'var(--c-neutral-surface-alt)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat) => (
              <StatCounter
                key={stat.label}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                label={stat.label}
                isZeroHighlight={(stat as typeof stats[number] & { isZeroHighlight?: boolean }).isZeroHighlight}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto" data-reveal>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Why Choose Buy Ghana Lands?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built for trust, designed for security, made for Ghanaians everywhere.
            </p>
          </div>
          
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                data-reveal-group="features"
                className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors border border-gray-100"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {feature.benefit}
                </p>
                <p className="mt-3 text-xs text-emerald-700 font-medium">
                  {feature.microProof}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-24" style={{ backgroundColor: 'var(--c-neutral-surface-alt)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto" data-reveal>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: 'var(--c-neutral-ink)' }}>
              How It Works
            </h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--c-neutral-ink-soft)' }}>
              Three simple steps to secure land ownership
            </p>
          </div>
          
          <div className="mt-16 relative">
            {/* Connection line - desktop only */}
            <div 
              data-how-line
              className="hidden md:block absolute top-10 left-[16%] right-[16%] h-0.5"
              style={{ backgroundColor: 'var(--c-brand-primary-soft)', transformOrigin: 'left center' }}
            />
            
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <div 
                  key={step.number} 
                  data-how-step
                  className="relative text-center"
                >
                  {/* Step node dot */}
                  <div className="hidden md:block absolute top-10 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-20" style={{ backgroundColor: 'var(--c-brand-primary)' }} />
                  
                  <div 
                    className="mx-auto h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg relative z-10"
                    style={{ backgroundColor: 'var(--c-brand-primary)' }}
                  >
                    {step.number}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold" style={{ color: 'var(--c-neutral-ink)' }}>
                    {step.title}
                  </h3>
                  <p className="mt-3 leading-relaxed" style={{ color: 'var(--c-neutral-ink-soft)' }}>
                    {step.description}
                  </p>
                  {/* Step 3 micro-reassurance */}
                  {index === 2 && (
                    <p className="mt-2 text-xs font-medium" style={{ color: 'var(--c-brand-primary)' }}>
                      Funds released only after verification and buyer confirmation.
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {/* Reassurance line */}
            <div className="mt-12 text-center" data-reveal>
              <div 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'var(--c-brand-primary-soft)', color: 'var(--c-brand-primary)' }}
              >
                <Shield className="h-4 w-4" />
                Buyer approval is mandatory before any payment release.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="dark-section py-20 lg:py-24" style={{ backgroundColor: 'var(--c-dark-bg)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center" data-reveal>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: 'var(--c-dark-text)' }}>
              What Buyers Say
            </h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--c-dark-muted)' }}>
              Trusted by Ghanaians at home and abroad
            </p>
          </div>
          
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                data-reveal-group="testimonials"
                data-card-hover
                className="bg-white rounded-2xl p-6 shadow-lg"
                style={{ borderRadius: 'var(--radius-card)' }}
              >
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mt-4 leading-relaxed" style={{ color: 'var(--c-neutral-ink-soft)' }}>
                  &ldquo;{testimonial.quote.split(testimonial.highlight)[0]}
                  <strong style={{ color: 'var(--c-brand-primary)' }}>{testimonial.highlight}</strong>
                  {testimonial.quote.split(testimonial.highlight)[1]}&rdquo;
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--c-neutral-ink)' }}>{testimonial.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: 'var(--c-brand-primary-soft)', color: 'var(--c-brand-primary)' }}
                      >
                        {testimonial.role}
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--c-neutral-ink-soft)' }}>
                        <Globe className="h-3 w-3" />
                        {testimonial.country}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="light-section py-20 lg:py-24" style={{ backgroundColor: 'var(--c-neutral-surface)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto" data-reveal>
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl" style={{ color: 'var(--c-neutral-ink)' }}>
              Ready to Secure Your Land the Right Way?
            </h2>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: 'var(--c-neutral-ink-soft)' }}>
              Join buyers who use verified listings and escrow protection for 
              fraud-free land transactions.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="px-8 h-12 font-semibold">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="px-8 h-12">
                  Learn How It Works
                </Button>
              </Link>
            </div>
            {/* Micro-reassurance */}
            <div className="mt-6" data-assurance>
              <CheckCircle className="h-4 w-4" style={{ color: 'var(--c-brand-primary)' }} />
              <span style={{ color: 'var(--c-neutral-ink-soft)' }}>Escrow protection included on eligible transactions.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
