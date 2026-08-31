"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Star,
  CheckCircle,
  Briefcase,
  Search,
  Loader2,
  Clock,
  Users,
  Shield,
  Compass,
  Scale,
  PenTool,
  HardHat,
  Calculator,
  ClipboardList,
  ChevronRight,
  Filter,
  X,
  Building2,
  ArrowRight,
} from "lucide-react";

interface Professional {
  id: string;
  professionalType: string;
  companyName: string | null;
  baseLocation: string | null;
  licenseStatus: string;
  yearsExperience: number | null;
  avgRating: number;
  reviewCount: number;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  services: { id: string; title: string }[];
}

interface ProfessionalsClientProps {
  initialProfessionals: Professional[];
  professionalTypes: { value: string; label: string }[];
}

const HERO_IMAGE = "/images/african-american-woman-looking-map.jpg";
const CTA_IMAGE = "/images/medium-shot-smiley-man-posing.jpg";

// Deterministic, profession-appropriate demo portrait when no avatar exists
function demoAvatar(id: string, professionalType: string) {
  const prof = professionalType.toLowerCase();
  const known = ["surveyor", "lawyer", "architect", "engineer", "planner", "valuer"];
  const folder = known.includes(prof) ? prof : "surveyor";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return `/images/professionals/${folder}-${(hash % 3) + 1}.jpg`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const professionalConfig: Record<string, { icon: any; description: string }> = {
  SURVEYOR: { icon: Compass, description: "Land surveys & boundary demarcation" },
  LAWYER: { icon: Scale, description: "Legal documentation & title search" },
  ARCHITECT: { icon: PenTool, description: "Building design & planning" },
  ENGINEER: { icon: HardHat, description: "Structural assessment & engineering" },
  PLANNER: { icon: ClipboardList, description: "Town planning consultation" },
  VALUER: { icon: Calculator, description: "Property valuation services" },
};

function typeLabel(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

// Editorial eyebrow label
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
      <span className="h-px w-6 bg-amber-400" />
      {children}
    </span>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function ProfessionalsClient({
  initialProfessionals,
  professionalTypes,
}: ProfessionalsClientProps) {
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals);
  const [selectedType, setSelectedType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const fetchProfessionals = async (type: string, query: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set("category", type);
      if (query) params.set("search", query);
      const res = await fetch(`/api/professionals?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProfessionals(data.professionals || data);
      }
    } catch (error) {
      console.error("Error fetching professionals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeFilter = (type: string) => {
    const newType = type === selectedType ? "" : type;
    setSelectedType(newType);
    fetchProfessionals(newType, searchQuery);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfessionals(selectedType, searchQuery);
  };

  const clearFilters = () => {
    setSelectedType("");
    setSearchQuery("");
    setLocationFilter("");
    setVerifiedOnly(false);
    fetchProfessionals("", "");
  };

  const totalProfessionals = professionals.length;
  const verifiedCount = professionals.filter((p) => p.licenseStatus === "VERIFIED").length;
  const avgRating =
    professionals.length > 0
      ? (professionals.reduce((acc, p) => acc + p.avgRating, 0) / professionals.length).toFixed(1)
      : "0";

  const filteredProfessionals = professionals.filter((p) => {
    if (verifiedOnly && p.licenseStatus !== "VERIFIED") return false;
    if (locationFilter && !p.baseLocation?.toLowerCase().includes(locationFilter.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      {/* ============================================================
          EDITORIAL HERO HEADER
          ============================================================ */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Land professional at work"
            fill
            priority
            className="object-cover scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f2] via-transparent to-black/30" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-24 lg:pt-32 lg:pb-32">
          <div className="max-w-3xl">
            <Eyebrow>Trusted by 1,000+ property buyers</Eyebrow>
            <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white text-shadow-hero sm:text-5xl lg:text-6xl">
              Find expert
              <br />
              <span className="italic text-amber-300">professionals</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 text-shadow-soft">
              Connect with verified surveyors, lawyers, architects, engineers and valuers —
              expert help for your land purchase and construction in Ghana.
            </p>

            <form onSubmit={handleSearch} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, specialty, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-white/95 py-4 pl-12 pr-4 text-gray-900 shadow-xl backdrop-blur-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-8 py-4 font-semibold text-emerald-950 shadow-lg shadow-amber-400/25 transition-all hover:bg-amber-300"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Search
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ============================================================
          PROFESSIONAL TYPE CARDS
          ============================================================ */}
      <div className="relative z-20 mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {professionalTypes.map((type) => {
            const config = professionalConfig[type.value] || {
              icon: Briefcase,
              description: "Professional services",
            };
            const Icon = config.icon;
            const isSelected = selectedType === type.value;
            const count = professionals.filter((p) => p.professionalType === type.value).length;

            return (
              <button
                key={type.value}
                onClick={() => handleTypeFilter(type.value)}
                className={`group rounded-2xl border p-4 text-center transition-all duration-300 ${
                  isSelected
                    ? "border-emerald-700 bg-emerald-700 text-white shadow-xl"
                    : "border-emerald-950/10 bg-white text-emerald-950 hover:-translate-y-1 hover:border-emerald-600/40 hover:shadow-lg"
                }`}
              >
                <div
                  className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                    isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold">{type.label}</p>
                <p className={`mt-1 text-xs ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                  {count} available
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          STATS + FILTER BAR
          ============================================================ */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl border border-emerald-950/10 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6 sm:gap-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                  <Users className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold text-emerald-950">
                    {totalProfessionals}
                  </p>
                  <p className="text-sm text-gray-500">Professionals</p>
                </div>
              </div>
              <div className="hidden h-12 w-px bg-gray-200 sm:block" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                  <Shield className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold text-emerald-950">
                    {verifiedCount}
                  </p>
                  <p className="text-sm text-gray-500">Verified</p>
                </div>
              </div>
              <div className="hidden h-12 w-px bg-gray-200 sm:block" />
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold text-emerald-950">{avgRating}</p>
                  <p className="text-sm text-gray-500">Avg Rating</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  showFilters
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              {(selectedType || searchQuery || verifiedOnly || locationFilter) && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Location</label>
                    <Input
                      placeholder="Filter by location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="group flex cursor-pointer items-center gap-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={verifiedOnly}
                          onChange={(e) => setVerifiedOnly(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-emerald-300"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">Verified only</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ============================================================
          PROFESSIONALS GRID
          ============================================================ */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-emerald-600" />
              <p className="text-gray-500">Loading professionals...</p>
            </div>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <Briefcase className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-emerald-950">
              No professionals found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-gray-600">
              {selectedType || searchQuery || verifiedOnly || locationFilter
                ? "Try adjusting your filters to see more results."
                : "Professional profiles will appear here once registered."}
            </p>
            {(selectedType || searchQuery || verifiedOnly || locationFilter) && (
              <div className="mt-6">
                <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredProfessionals.map((professional) => (
              <motion.div key={professional.id} variants={itemVariants}>
                <ProfessionalCard professional={professional} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ============================================================
          CTA — image-backed
          ============================================================ */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem]">
            <Image src={CTA_IMAGE} alt="" fill className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50" />
            <div className="relative z-10 px-8 py-14 text-center md:px-16 md:py-20">
              <h2 className="font-display mx-auto max-w-2xl text-3xl font-semibold text-white text-shadow-soft sm:text-4xl">
                Are you a professional?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85 text-shadow-soft">
                Join our network of trusted professionals and connect with clients looking for your
                expertise. Get verified and start receiving inquiries today.
              </p>
              <div className="mt-8">
                <Link href="/auth/register?type=professional">
                  <Button className="h-13 gap-2 rounded-xl bg-amber-400 px-8 font-semibold text-emerald-950 hover:bg-amber-300">
                    Register as Professional
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  const isVerified = professional.licenseStatus === "VERIFIED";

  return (
    <Link href={`/professionals/${professional.id}`}>
      <div className="group h-full overflow-hidden rounded-3xl border border-emerald-950/10 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        {/* Editorial header band */}
        <div className="relative h-24 overflow-hidden bg-gradient-to-r from-emerald-900 to-emerald-700">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 right-10 h-20 w-20 rounded-full bg-amber-400/10" />
          {isVerified && (
            <div className="absolute right-3 top-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-emerald-950">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            </div>
          )}
        </div>

        <div className="relative -mt-10 p-5">
          {/* Avatar */}
          <div className="mb-4 flex items-end gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
                <Image
                  src={professional.user.avatarUrl || demoAvatar(professional.id, professional.professionalType)}
                  alt={professional.user.fullName}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-1">
              <h3 className="font-display font-semibold text-emerald-950 transition-colors group-hover:text-emerald-700">
                {professional.user.fullName}
              </h3>
              <p className="text-sm font-medium text-emerald-600">
                {typeLabel(professional.professionalType)}
              </p>
            </div>
          </div>

          {professional.companyName && (
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4 text-gray-400" />
              {professional.companyName}
            </div>
          )}

          {/* Rating */}
          <div className="mb-4 flex items-center gap-3">
            {professional.avgRating > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(professional.avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-emerald-950">
                  {professional.avgRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">({professional.reviewCount} reviews)</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">No reviews yet</span>
            )}
          </div>

          {/* Location & experience */}
          <div className="mb-4 flex flex-wrap gap-3">
            {professional.baseLocation && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-emerald-600" />
                {professional.baseLocation}
              </div>
            )}
            {professional.yearsExperience && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                {professional.yearsExperience}+ years
              </div>
            )}
          </div>

          {/* Services */}
          {professional.services.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-medium text-gray-500">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {professional.services.slice(0, 3).map((service) => (
                  <span
                    key={service.id}
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
                  >
                    {service.title}
                  </span>
                ))}
                {professional.services.length > 3 && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                    +{professional.services.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <span className="flex items-center justify-between text-sm font-medium text-emerald-700">
              View profile
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
