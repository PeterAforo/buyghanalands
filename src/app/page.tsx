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
  Banknote,
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
  { value: 98, label: "Transaction completion rate", suffix: "%" },
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
  label 
}: { 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  label: string;
}) {
  const countRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion || !countRef.current) {
      if (countRef.current) {
        countRef.current.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
      }
      return;
    }

    const el = countRef.current;
    const obj = { value: 0 };

    const tween = gsap.to(obj, {
      value: value,
      duration: 2,
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
  }, [value, prefix, suffix]);

  return (
    <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <p className="text-4xl md:text-5xl font-bold text-emerald-600">
        <span ref={countRef}>{prefix}0{suffix}</span>
      </p>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{label}</p>
    </div>
  );
}

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion || !mainRef.current) {
      // Make all elements visible immediately for reduced motion
      const revealElements = mainRef.current?.querySelectorAll("[data-reveal]");
      revealElements?.forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
      });
      return;
    }

    const ctx = gsap.context(() => {
      // Animate elements with data-reveal attribute
      const revealElements = mainRef.current?.querySelectorAll("[data-reveal]");
      
      revealElements?.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 24, opacity: 0 },
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

      // Animate grouped elements with stagger
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
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.1,
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
      <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white overflow-hidden">
        <div className="absolute inset-0 hero-texture" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
                Buy Verified Land in Ghana —{" "}
                <span className="text-emerald-400">With Confidence</span>
              </h1>
              <p className="mt-6 text-lg text-emerald-100/90 leading-relaxed">
                Secure escrow payments, Lands Commission verification, and trusted 
                professionals — whether you&apos;re in Ghana or abroad.
              </p>
              
              {/* CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
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
              </div>
              
              <div className="mt-6">
                <Link 
                  href="/professionals" 
                  className="inline-flex items-center text-emerald-300 hover:text-emerald-200 text-sm font-medium transition-colors"
                >
                  Talk to a Land Expert
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Column - Visual placeholder */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-3xl" />
                <div className="absolute inset-4 border-2 border-emerald-400/30 rounded-2xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-24 h-24 text-emerald-400/40" />
                </div>
              </div>
            </div>
          </div>

          {/* Trust Bar */}
          <div className="mt-16 pt-8 border-t border-emerald-700/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustBarItems.map((item) => (
                <div 
                  key={item.label} 
                  className="flex items-center gap-3 text-emerald-100/80"
                >
                  <item.icon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat) => (
              <StatCounter
                key={stat.label}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                label={stat.label}
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
      <section className="bg-gray-50 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto" data-reveal>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three simple steps to secure land ownership
            </p>
          </div>
          
          <div className="mt-16 relative">
            {/* Connection line - desktop only */}
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-emerald-200" />
            
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <div 
                  key={step.number} 
                  data-reveal-group="steps"
                  className="relative text-center"
                >
                  <div className="mx-auto h-20 w-20 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg relative z-10">
                    {step.number}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Reassurance line */}
            <div className="mt-12 text-center" data-reveal>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-6 py-3 rounded-full text-sm font-medium">
                <Shield className="h-4 w-4" />
                Buyer approval is mandatory before any payment release.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-emerald-950 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center" data-reveal>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              What Buyers Say
            </h2>
            <p className="mt-4 text-lg text-emerald-200">
              Trusted by Ghanaians at home and abroad
            </p>
          </div>
          
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                data-reveal-group="testimonials"
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mt-4 text-gray-700 leading-relaxed">
                  &ldquo;{testimonial.quote.split(testimonial.highlight)[0]}
                  <strong className="text-emerald-700">{testimonial.highlight}</strong>
                  {testimonial.quote.split(testimonial.highlight)[1]}&rdquo;
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        {testimonial.role}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
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
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto" data-reveal>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
              Ready to Secure Your Land the Right Way?
            </h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
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
          </div>
        </div>
      </section>
    </div>
  );
}
