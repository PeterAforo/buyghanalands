"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import {
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  Globe,
  Scale,
  BadgeCheck,
  MapPin,
  Users,
  ShieldCheck,
  Banknote,
  Search,
  FileCheck,
  Handshake,
  Home as HomeIcon,
  Building2,
  Factory,
  Wheat,
  Layers,
  Compass,
  PenTool,
  HardHat,
  Calculator,
  ClipboardList,
  ChevronRight,
  Heart,
} from "lucide-react";
import { HeroSearch } from "@/components/search/hero-search";
import { Badge } from "@/components/ui/badge";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const stats = [
  { value: 1000, label: "Active Listings", suffix: "+", icon: MapPin },
  { value: 500, label: "Verified Sellers", suffix: "+", icon: ShieldCheck },
  { value: 50, label: "GHS Transacted", prefix: "₵", suffix: "M+", icon: Banknote },
  { value: 2500, label: "Happy Users", suffix: "+", icon: Users },
];

const steps = [
  {
    icon: Search,
    title: "Browse & Search",
    description: "Explore verified land listings across all 16 regions of Ghana with detailed information.",
  },
  {
    icon: FileCheck,
    title: "Verify Documents",
    description: "Review land documents, verification status, and request professional verification.",
  },
  {
    icon: Handshake,
    title: "Make an Offer",
    description: "Negotiate directly with sellers through our secure messaging platform.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Escrow",
    description: "Complete your transaction safely with escrow protection and milestone payments.",
  },
];

const landTypes = [
  { type: "RESIDENTIAL", label: "Residential", icon: HomeIcon, color: "bg-blue-50 text-blue-600 border-blue-100", count: 342 },
  { type: "COMMERCIAL", label: "Commercial", icon: Building2, color: "bg-purple-50 text-purple-600 border-purple-100", count: 156 },
  { type: "INDUSTRIAL", label: "Industrial", icon: Factory, color: "bg-orange-50 text-orange-600 border-orange-100", count: 89 },
  { type: "AGRICULTURAL", label: "Agricultural", icon: Wheat, color: "bg-green-50 text-green-600 border-green-100", count: 234 },
  { type: "MIXED", label: "Mixed Use", icon: Layers, color: "bg-amber-50 text-amber-600 border-amber-100", count: 78 },
];

const professionals = [
  { type: "SURVEYOR", label: "Surveyors", icon: Compass, description: "Land surveys & boundary demarcation" },
  { type: "LAWYER", label: "Lawyers", icon: Scale, description: "Legal documentation & title search" },
  { type: "ARCHITECT", label: "Architects", icon: PenTool, description: "Building design & planning" },
  { type: "ENGINEER", label: "Engineers", icon: HardHat, description: "Structural assessment" },
  { type: "VALUER", label: "Valuers", icon: Calculator, description: "Property valuation" },
  { type: "PLANNER", label: "Planners", icon: ClipboardList, description: "Town planning consultation" },
];

const regions = [
  { name: "Greater Accra", count: 245 },
  { name: "Ashanti", count: 189 },
  { name: "Western", count: 134 },
  { name: "Central", count: 98 },
  { name: "Eastern", count: 112 },
  { name: "Northern", count: 67 },
  { name: "Volta", count: 78 },
  { name: "Brong-Ahafo", count: 56 },
];

const testimonials = [
  {
    name: "Kwame Asante",
    role: "Diaspora Buyer",
    country: "UK",
    quote: "The escrow process gave me peace of mind and reduced my fear of land fraud.",
    rating: 5,
  },
  {
    name: "Ama Serwaa",
    role: "Developer",
    country: "Ghana",
    quote: "Verification and documentation workflow made transactions transparent and faster.",
    rating: 5,
  },
  {
    name: "Kofi Mensah",
    role: "First-time Buyer",
    country: "USA",
    quote: "As someone buying from abroad, the professional network connected me with trusted lawyers.",
    rating: 5,
  },
];

const trustBarItems = [
  { icon: BadgeCheck, label: "Lands Commission Verified" },
  { icon: Shield, label: "Escrow-Protected Payments" },
  { icon: Globe, label: "Diaspora-Friendly" },
  { icon: Scale, label: "Legal & Professional Network" },
];

const featuredListings = [
  {
    id: "1",
    title: "Prime Residential Plot in East Legon",
    price: 850000,
    location: "East Legon, Greater Accra",
    size: 0.5,
    image: "/images/african-nature-scenery-with-road-trees.jpg",
    verificationLevel: "LEVEL_2_PLATFORM_REVIEWED",
  },
  {
    id: "2",
    title: "Commercial Land Near Tema Motorway",
    price: 1200000,
    location: "Tema, Greater Accra",
    size: 1.2,
    image: "/images/nature-moldova-vale-with-flowing-river-slopes-with-sparse-vegetation.jpg",
    verificationLevel: "LEVEL_2_PLATFORM_REVIEWED",
  },
  {
    id: "3",
    title: "Agricultural Land in Volta Region",
    price: 350000,
    location: "Ho, Volta Region",
    size: 5.0,
    image: "/images/african-nature-scenery-with-road-trees.jpg",
    verificationLevel: "LEVEL_1_DOCS_UPLOADED",
  },
];

const heroBackgroundImages = [
  "/images/african-nature-scenery-with-road-trees.jpg",
  "/images/nature-moldova-vale-with-flowing-river-slopes-with-sparse-vegetation.jpg",
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Hero background image carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroBackgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      const heroHeadline = document.querySelector("[data-hero-headline]");
      if (heroHeadline) {
        gsap.fromTo(
          heroHeadline,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: "expo.out" }
        );
      }

      const heroSub = document.querySelector("[data-hero-sub]");
      if (heroSub) {
        gsap.fromTo(
          heroSub,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", delay: 0.12 }
        );
      }

      const heroCtas = document.querySelectorAll("[data-hero-ctas] > *");
      if (heroCtas.length > 0) {
        gsap.fromTo(
          heroCtas,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.52, ease: "power2.out", stagger: 0.09, delay: 0.22 }
        );
      }

      const trustItems = document.querySelectorAll("[data-trust-item]");
      if (trustItems.length > 0) {
        gsap.fromTo(
          trustItems,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.52, ease: "power2.out", stagger: 0.08, delay: 0.34 }
        );
      }

      // Only animate if element exists
      const assuranceEl = document.querySelector("[data-assurance]");
      if (assuranceEl) {
        gsap.fromTo(
          assuranceEl,
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.52, ease: "power2.out", delay: 0.44 }
        );
      }

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
      const howLine = document.querySelector("[data-how-line]");
      if (howLine) {
        gsap.fromTo(
          howLine,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: howLine,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // How It Works steps
      const howSteps = document.querySelectorAll("[data-how-step]");
      if (howSteps.length > 0) {
        gsap.fromTo(
          howSteps,
          { y: 12, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            ease: "power2.out",
            stagger: 0.14,
            scrollTrigger: {
              trigger: howSteps[0],
              start: "top 82%",
              toggleActions: "play none none none",
            },
          }
        );
      }

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
      {/* Hero Section - Modern Design */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 min-h-[600px] lg:min-h-[700px]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          {heroBackgroundImages.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-30' : 'opacity-0'
              }`}
            >
              <Image
                src={image}
                alt="Ghana landscape"
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/50 via-green-900/70 to-green-900/90" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24">
          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <div data-hero-headline>
              <Badge className="mb-6 bg-green-500/20 text-green-100 border-green-400/30 px-4 py-1.5">
                🇬🇭 Ghana&apos;s Trusted Land Marketplace
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Buy Verified Land in Ghana{" "}
                <span className="text-amber-400">With Confidence</span>
              </h1>
            </div>
            <p 
              data-hero-sub
              className="mt-6 text-lg lg:text-xl text-green-100/80 max-w-2xl mx-auto"
            >
              Secure escrow payments, document verification, and trusted professionals — 
              whether you&apos;re in Ghana or abroad.
            </p>
          </div>

          {/* Search Box */}
          <div className="mt-10 max-w-4xl mx-auto" data-hero-ctas>
            <HeroSearch />
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {trustBarItems.map((item) => (
              <div 
                key={item.label}
                data-trust-item
                className="flex items-center gap-2 text-green-100/70"
              >
                <item.icon className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div 
                key={stat.label}
                className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <stat.icon className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {stat.prefix}{stat.value.toLocaleString()}{stat.suffix}
                </p>
                <p className="text-xs text-green-100/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Land Type Categories */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12" data-reveal>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Browse by Land Type
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Find the perfect land for your needs
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {landTypes.map(({ type, label, icon: Icon, color, count }) => (
              <Link
                key={type}
                href={`/listings?landType=${type}`}
                className={`group flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${color}`}
                data-reveal-group="land-types"
              >
                <div className="p-4 rounded-xl bg-white shadow-sm group-hover:shadow-md transition-shadow">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{label}</h3>
                <p className="text-sm text-gray-500 mt-1">{count} listings</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10" data-reveal>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Featured Listings
              </h2>
              <p className="mt-2 text-lg text-gray-600">
                Hand-picked verified properties
              </p>
            </div>
            <Link 
              href="/listings" 
              className="hidden md:flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
                data-reveal-group="featured"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={listing.image}
                    alt={listing.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
                    <Star className="h-3 w-3 fill-current" />
                    Featured
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-medium rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </div>
                  <button className="absolute bottom-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 transition-colors">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{listing.location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xl font-bold text-green-600">
                      GHS {listing.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">{listing.size} acres</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link 
              href="/listings" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
            >
              View All Listings <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Browse by Region */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12" data-reveal>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Browse by Region
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Explore land across all 16 regions of Ghana
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {regions.map((region) => (
              <Link
                key={region.name}
                href={`/listings?region=${encodeURIComponent(region.name)}`}
                className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-gradient-to-br from-green-600 to-green-800"
                data-reveal-group="regions"
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>{region.count} listings</span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    {region.name}
                  </h3>
                </div>
                <div className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Link 
              href="/listings" 
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              View All Regions <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12" data-reveal>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Buy land in Ghana with confidence using our secure, transparent process
            </p>
          </div>

          <div className="relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-green-200 via-green-400 to-green-200" data-how-line />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative text-center" data-how-step>
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
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
            >
              Get Started Today
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Professional Services */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12" data-reveal>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Professional Services
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-xl">
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
            {professionals.map(({ type, label, icon: Icon, description }) => (
              <Link
                key={type}
                href={`/professionals?type=${type}`}
                className="group bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300"
                data-reveal-group="professionals"
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

      {/* Testimonials */}
      <section className="relative py-20 lg:py-24 overflow-hidden bg-gradient-to-br from-green-900 to-green-800">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/images/african-nature-scenery-with-road-trees.jpg"
            alt="Background"
            fill
            className="object-cover"
          />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12" data-reveal>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              What Our Users Say
            </h2>
            <p className="mt-4 text-lg text-green-100/80">
              Trusted by Ghanaians at home and abroad
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-2xl p-6 shadow-xl"
                data-reveal-group="testimonials"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {testimonial.role}
                    </Badge>
                    <span className="text-sm flex items-center gap-1 text-gray-500">
                      <Globe className="h-3.5 w-3.5" />
                      {testimonial.country}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 to-green-700 p-8 md:p-12 lg:p-16">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10 text-center max-w-3xl mx-auto" data-reveal>
              <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Ready to Secure Your Land?
              </h2>
              <p className="mt-6 text-lg text-green-100/90 leading-relaxed">
                Join thousands of buyers who use verified listings and escrow protection 
                for fraud-free land transactions in Ghana.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="px-8 h-12 bg-white text-green-700 hover:bg-green-50 font-semibold">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/listings">
                  <Button size="lg" variant="outline" className="px-8 h-12 border-2 border-white text-white hover:bg-white/10">
                    Browse Listings
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-2 text-green-100/80">
                <Shield className="h-5 w-5" />
                <span className="text-sm">Escrow protection included on all eligible transactions</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
