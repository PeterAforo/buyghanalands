"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/search/hero-search";
import { getIcon } from "@/lib/icon-map";
import {
  ArrowRight,
  ArrowUpRight,
  Star,
  ShieldCheck,
  Heart,
  MapPin,
  ChevronRight,
  Quote,
  Shield,
} from "lucide-react";

interface HomepageData {
  heroContent: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    backgroundImages: string[];
  } | null;
  stats: {
    id: string;
    label: string;
    value: string;
    prefix: string | null;
    suffix: string | null;
    icon: string | null;
  }[];
  steps: {
    id: string;
    icon: string;
    title: string;
    description: string;
  }[];
  landTypes: {
    id: string;
    type: string;
    label: string;
    icon: string;
    count: number;
  }[];
  professionals: {
    id: string;
    type: string;
    label: string;
    icon: string;
    description: string | null;
  }[];
  regions: {
    id: string;
    name: string;
    count: number;
    image: string | null;
  }[];
  testimonials: {
    id: string;
    name: string;
    role: string;
    country: string;
    quote: string;
    rating: number;
  }[];
  trustBarItems: {
    id: string;
    icon: string;
    label: string;
  }[];
  featuredListings: {
    id: string;
    title: string;
    price: string;
    location: string;
    size: string;
    image: string | null;
    verified?: boolean;
  }[];
}

function Eyebrow({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "green" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${
        tone === "gold" ? "text-amber-500" : "text-emerald-700"
      }`}
    >
      <span className={`h-px w-6 ${tone === "gold" ? "bg-amber-400" : "bg-emerald-500"}`} />
      {children}
    </span>
  );
}

export function HomepageClient({ data }: { data: HomepageData }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heroImages = data.heroContent?.backgroundImages || [];

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const hero = data.heroContent;
  const heroHeadline = hero?.headline || "Own Ghanaian land without the fear of fraud.";

  return (
    <div className="flex flex-col bg-[#faf8f2]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-opacity duration-[1500ms] ${
                index === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image}
                alt="Ghana landscape"
                fill
                className="object-cover scale-105"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/35 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-36 lg:pb-24">
          <div className="max-w-6xl">
            <Eyebrow>{hero?.eyebrow || "Ghana's trusted land marketplace"}</Eyebrow>
            <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white text-shadow-hero sm:text-5xl lg:text-6xl xl:text-7xl">
              {heroHeadline.includes("fear of fraud") ? (
                <>
                  Own Ghanaian land
                  <br />
                  without the{" "}
                  <span className="italic text-amber-300">fear of fraud</span>.
                </>
              ) : (
                heroHeadline
              )}
            </h1>
            <p className="mt-6 max-w-[54rem] text-lg leading-relaxed text-emerald-50/90 text-shadow-soft lg:text-xl">
              {hero?.subheadline || ""}
            </p>
            <div className="mt-10 max-w-6xl">
              <HeroSearch />
            </div>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
              {data.trustBarItems.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <div key={item.id} className="flex items-center gap-2 text-emerald-50/85">
                    <Icon className="h-4.5 w-4.5 text-amber-300" />
                    <span className="text-sm font-medium text-shadow-soft">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats band */}
        <div className="relative border-t border-white/10 bg-black/60 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {data.stats.map((stat) => {
                const Icon = stat.icon ? getIcon(stat.icon) : MapPin;
                const numValue = parseInt(stat.value) || stat.value;
                return (
                  <div key={stat.id} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="h-5 w-5 text-amber-300" />
                    </div>
                    <div>
                      <p className="font-display text-2xl font-semibold text-white lg:text-3xl">
                        {stat.prefix || ""}
                        {typeof numValue === "number" ? numValue.toLocaleString() : numValue}
                        {stat.suffix || ""}
                      </p>
                      <p className="text-xs text-emerald-100/70">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* BROWSE BY LAND TYPE */}
      {data.landTypes.length > 0 && (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <Eyebrow tone="green">Explore</Eyebrow>
                <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                  Find land built for your plans
                </h2>
              </div>
              <p className="max-w-sm text-gray-600 md:text-right">
                From family homes to farmland and factories — start with what you&apos;re building toward.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {data.landTypes.map(({ type, label, icon, count }) => {
                const Icon = getIcon(icon);
                return (
                  <Link
                    key={type}
                    href={`/listings?landType=${type}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-950/10 bg-white p-6 transition-all duration-300 hover:border-emerald-600/40 hover:shadow-xl hover:shadow-emerald-950/5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mt-8">
                      <h3 className="font-semibold text-emerald-950">{label}</h3>
                      <p className="mt-1 text-sm text-gray-500">{count} listings</p>
                    </div>
                    <ArrowUpRight className="absolute right-5 top-5 h-5 w-5 text-gray-300 transition-colors group-hover:text-emerald-600" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED LISTINGS */}
      {data.featuredListings.length > 0 && (
        <section className="bg-emerald-950 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <Eyebrow>Hand-picked</Eyebrow>
                <h2 className="font-display mt-4 text-3xl font-semibold text-white sm:text-4xl">
                  Featured verified listings
                </h2>
              </div>
              <Link
                href="/listings"
                className="hidden items-center gap-2 font-medium text-amber-300 transition-colors hover:text-amber-200 md:flex"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {data.featuredListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group overflow-hidden rounded-3xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="relative aspect-[16/11] overflow-hidden">
                    {listing.image ? (
                      <Image
                        src={listing.image}
                        alt={listing.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-emerald-100">
                        <MapPin className="h-12 w-12 text-emerald-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-emerald-950">
                      <Star className="h-3 w-3 fill-current" />
                      Featured
                    </div>
                    {listing.verified && (
                      <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-emerald-700 backdrop-blur-sm">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </div>
                    )}
                    <button className="absolute bottom-4 right-4 rounded-full bg-white/90 p-2 text-gray-600 backdrop-blur-sm transition-colors hover:text-red-500">
                      <Heart className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{listing.location}</span>
                    </div>
                    <h3 className="font-display mt-2 text-xl font-semibold text-emerald-950 transition-colors group-hover:text-emerald-700">
                      {listing.title}
                    </h3>
                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">
                      <div>
                        <p className="text-xs text-gray-400">Price</p>
                        <p className="font-display text-2xl font-semibold text-emerald-700">
                          ₵{parseInt(listing.price).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Size</p>
                        <p className="font-medium text-emerald-950">{listing.size} acres</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10 text-center md:hidden">
              <Link
                href="/listings"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-medium text-emerald-950"
              >
                View all listings <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* BROWSE BY REGION */}
      {data.regions.length > 0 && (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <Eyebrow tone="green">All 16 regions</Eyebrow>
              <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                Browse land across Ghana
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {data.regions.map((region) => (
                <Link
                  key={region.id}
                  href={`/listings?region=${encodeURIComponent(region.name)}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl md:aspect-[4/3]"
                >
                  {region.image ? (
                    <Image
                      src={region.image}
                      alt={region.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-emerald-800">
                      <MapPin className="h-12 w-12 text-emerald-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/30 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-5">
                    <h3 className="font-display text-xl font-semibold text-white text-shadow-soft transition-colors group-hover:text-amber-300">
                      {region.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{region.count} listings</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/listings"
                className="inline-flex items-center gap-2 font-medium text-emerald-700 transition-colors hover:text-emerald-800"
              >
                View all regions <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      {data.steps.length > 0 && (
        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <Eyebrow tone="green">A safer path to ownership</Eyebrow>
              <h2 className="font-display mx-auto mt-4 max-w-2xl text-3xl font-semibold text-emerald-950 sm:text-4xl">
                Four steps between you and secure land
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-4">
              {data.steps.map((step, index) => {
                const Icon = getIcon(step.icon);
                return (
                  <div key={step.id} className="relative">
                    <div className="flex items-center gap-4">
                      <span className="font-display text-5xl font-semibold text-emerald-100">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-emerald-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-16 text-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="h-13 gap-2 rounded-xl bg-emerald-700 px-8 text-base font-semibold text-white hover:bg-emerald-800"
                >
                  Start your search today
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* PROFESSIONAL SERVICES */}
      {data.professionals.length > 0 && (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="relative order-last aspect-[4/3] overflow-hidden rounded-3xl lg:order-first">
                <Image
                  src="/images/african-american-woman-looking-map.jpg"
                  alt="A professional reviewing land documents"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-950">Every professional is vetted</p>
                      <p className="text-sm text-gray-500">Licences and credentials confirmed before listing</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Eyebrow tone="green">Expert network</Eyebrow>
                <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                  Trusted professionals for every step
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Don&apos;t navigate documents, surveys, or contracts alone. Connect with verified
                  specialists who protect your interests.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {data.professionals.map(({ type, label, icon, description }) => {
                    const Icon = getIcon(icon);
                    return (
                      <Link
                        key={type}
                        href={`/professionals?type=${type}`}
                        className="group rounded-2xl border border-emerald-950/10 bg-white p-4 transition-all hover:border-emerald-600/40 hover:shadow-lg"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-3 font-semibold text-emerald-950">{label}</h3>
                        <p className="mt-0.5 text-xs leading-snug text-gray-500">{description}</p>
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href="/professionals"
                  className="mt-8 inline-flex items-center gap-2 font-medium text-emerald-700 transition-colors hover:text-emerald-800"
                >
                  Explore all professionals <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {data.testimonials.length > 0 && (
        <section className="relative overflow-hidden bg-black py-20 lg:py-28">
          <div className="absolute inset-0">
            <Image
              src="/images/nature-moldova-vale-with-flowing-river-slopes-with-sparse-vegetation.jpg"
              alt=""
              fill
              className="object-cover opacity-60"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/22 via-black/20 to-black/25" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-14 text-center">
              <Eyebrow>Trusted at home and abroad</Eyebrow>
              <h2 className="font-display mx-auto mt-4 max-w-2xl text-3xl font-semibold text-white sm:text-4xl">
                Buyers who slept easier at closing
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {data.testimonials.map((testimonial) => (
                <figure
                  key={testimonial.id}
                  className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
                >
                  <Quote className="h-8 w-8 text-amber-300/70" />
                  <blockquote className="font-display mt-5 flex-1 text-lg italic leading-relaxed text-white">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-300 text-amber-300" />
                    ))}
                  </div>
                  <figcaption className="mt-4 border-t border-white/10 pt-4">
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-emerald-100/70">
                      {testimonial.role}
                      <span className="text-emerald-100/40">•</span>
                      <Shield className="h-3.5 w-3.5" />
                      {testimonial.country}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem]">
            <Image
              src="/images/cheerful-woman-with-laptop-grass.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/85 to-emerald-950/55" />
            <div className="relative z-10 px-8 py-16 md:px-16 md:py-24">
              <div className="max-w-2xl">
                <Eyebrow>Your land, secured</Eyebrow>
                <h2 className="font-display mt-5 text-3xl font-semibold leading-tight text-white text-shadow-soft sm:text-4xl lg:text-5xl">
                  Ready to buy land the safe way?
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-emerald-50/90 text-shadow-soft">
                  Join thousands of buyers using verified listings and escrow protection for
                  fraud-free land transactions across Ghana.
                </p>
                <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                  <Link href="/auth/register">
                    <Button
                      size="lg"
                      className="h-13 w-full gap-2 rounded-xl bg-amber-400 px-8 font-semibold text-emerald-950 hover:bg-amber-300 sm:w-auto"
                    >
                      Get started free
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/listings">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-13 w-full rounded-xl border-2 border-white/40 bg-white/5 px-8 font-semibold text-white backdrop-blur-sm hover:bg-white/15 sm:w-auto"
                    >
                      Browse listings
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 flex items-center gap-2 text-emerald-50/80">
                  <Shield className="h-5 w-5 text-amber-300" />
                  <span className="text-sm text-shadow-soft">
                    Escrow protection included on all eligible transactions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
