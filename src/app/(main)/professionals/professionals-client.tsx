"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Star,
  CheckCircle,
  Briefcase,
  Search,
  Loader2,
  Phone,
  Mail,
  MessageCircle,
  Award,
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
  Sparkles,
  TrendingUp,
  Building2,
  Globe,
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

const professionalConfig: Record<
  string,
  { icon: any; color: string; bgColor: string; gradient: string; description: string }
> = {
  SURVEYOR: {
    icon: Compass,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    gradient: "from-blue-500 to-blue-600",
    description: "Land surveys & boundary demarcation",
  },
  LAWYER: {
    icon: Scale,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    gradient: "from-purple-500 to-purple-600",
    description: "Legal documentation & title search",
  },
  ARCHITECT: {
    icon: PenTool,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    gradient: "from-pink-500 to-pink-600",
    description: "Building design & planning",
  },
  ENGINEER: {
    icon: HardHat,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    gradient: "from-orange-500 to-orange-600",
    description: "Structural assessment & engineering",
  },
  PLANNER: {
    icon: ClipboardList,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    gradient: "from-teal-500 to-teal-600",
    description: "Town planning consultation",
  },
  VALUER: {
    icon: Calculator,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    gradient: "from-emerald-500 to-emerald-600",
    description: "Property valuation services",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
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

  // Stats
  const totalProfessionals = professionals.length;
  const verifiedCount = professionals.filter((p) => p.licenseStatus === "VERIFIED").length;
  const avgRating =
    professionals.length > 0
      ? (professionals.reduce((acc, p) => acc + p.avgRating, 0) / professionals.length).toFixed(1)
      : "0";

  // Filter professionals
  const filteredProfessionals = professionals.filter((p) => {
    if (verifiedOnly && p.licenseStatus !== "VERIFIED") return false;
    if (locationFilter && !p.baseLocation?.toLowerCase().includes(locationFilter.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Floating Icons */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-16 h-16 bg-blue-500/20 rounded-2xl rotate-12 blur-sm" />
          <div className="absolute top-40 right-20 w-20 h-20 bg-purple-500/20 rounded-2xl -rotate-12 blur-sm" />
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-emerald-500/20 rounded-2xl rotate-45 blur-sm" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span className="text-white/90 text-sm font-medium">
                Trusted by 1000+ property buyers
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Find Expert
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Professionals
              </span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
              Connect with verified surveyors, lawyers, architects, engineers, and more. Get expert
              help for your land purchase and construction projects in Ghana.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, specialty, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 h-auto bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-2xl shadow-lg transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </div>

      {/* Professional Type Cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {professionalTypes.map((type) => {
            const config = professionalConfig[type.value] || {
              icon: Briefcase,
              color: "text-gray-600",
              bgColor: "bg-gray-50",
              gradient: "from-gray-500 to-gray-600",
              description: "Professional services",
            };
            const Icon = config.icon;
            const isSelected = selectedType === type.value;
            const count = professionals.filter((p) => p.professionalType === type.value).length;

            return (
              <button
                key={type.value}
                onClick={() => handleTypeFilter(type.value)}
                className={`group relative p-4 rounded-2xl transition-all duration-300 ${
                  isSelected
                    ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg scale-105`
                    : "bg-white hover:shadow-lg hover:-translate-y-1 border border-gray-100"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto transition-colors ${
                    isSelected ? "bg-white/20" : config.bgColor
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isSelected ? "text-white" : config.color}`} />
                </div>
                <p
                  className={`font-semibold text-sm ${isSelected ? "text-white" : "text-gray-900"}`}
                >
                  {type.label}
                </p>
                <p
                  className={`text-xs mt-1 ${isSelected ? "text-white/80" : "text-gray-500"}`}
                >
                  {count} available
                </p>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Stats Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalProfessionals}</p>
                  <p className="text-sm text-gray-500">Professionals</p>
                </div>
              </div>
              <div className="h-12 w-px bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{verifiedCount}</p>
                  <p className="text-sm text-gray-500">Verified</p>
                </div>
              </div>
              <div className="h-12 w-px bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
                  <p className="text-sm text-gray-500">Avg Rating</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`rounded-xl ${showFilters ? "bg-emerald-50 border-emerald-200 text-emerald-700" : ""}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              {(selectedType || searchQuery || verifiedOnly || locationFilter) && (
                <Button variant="ghost" onClick={clearFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Additional Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-6 mt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location
                    </label>
                    <Input
                      placeholder="Filter by location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={verifiedOnly}
                          onChange={(e) => setVerifiedOnly(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
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

      {/* Professionals Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading professionals...</p>
            </div>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Briefcase className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No professionals found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {selectedType || searchQuery || verifiedOnly || locationFilter
                ? "Try adjusting your filters to see more results"
                : "Professional profiles will appear here once registered"}
            </p>
            {(selectedType || searchQuery || verifiedOnly || locationFilter) && (
              <Button onClick={clearFilters} variant="outline" className="rounded-xl">
                Clear Filters
              </Button>
            )}
          </motion.div>
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

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Are You a Professional?</h2>
          <p className="text-emerald-100 max-w-2xl mx-auto mb-8">
            Join our network of trusted professionals and connect with clients looking for your
            expertise. Get verified and start receiving inquiries today.
          </p>
          <Link href="/auth/register?type=professional">
            <Button className="bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl px-8 py-3 h-auto font-semibold">
              Register as Professional
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  const config = professionalConfig[professional.professionalType] || {
    icon: Briefcase,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    gradient: "from-gray-500 to-gray-600",
    description: "Professional services",
  };
  const Icon = config.icon;

  return (
    <Link href={`/professionals/${professional.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-0 shadow-md rounded-2xl">
        {/* Header with gradient */}
        <div className={`h-24 bg-gradient-to-br ${config.gradient} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
          {/* Verification Badge */}
          {professional.licenseStatus === "VERIFIED" && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-0">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5 -mt-10 relative">
          {/* Avatar */}
          <div className="flex items-end gap-4 mb-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                {professional.user.avatarUrl ? (
                  <Image
                    src={professional.user.avatarUrl}
                    alt={professional.user.fullName}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-8 w-8 ${config.color}`} />
                  </div>
                )}
              </div>
              {professional.licenseStatus === "VERIFIED" && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                {professional.user.fullName}
              </h3>
              <p className={`text-sm font-medium ${config.color}`}>
                {professional.professionalType.charAt(0) +
                  professional.professionalType.slice(1).toLowerCase()}
              </p>
            </div>
          </div>

          {/* Company */}
          {professional.companyName && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <Building2 className="h-4 w-4 text-gray-400" />
              {professional.companyName}
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            {professional.avgRating > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(professional.avgRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {professional.avgRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">({professional.reviewCount} reviews)</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">No reviews yet</span>
            )}
          </div>

          {/* Location & Experience */}
          <div className="flex flex-wrap gap-3 mb-4">
            {professional.baseLocation && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-emerald-500" />
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
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {professional.services.slice(0, 3).map((service) => (
                  <Badge
                    key={service.id}
                    variant="secondary"
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {service.title}
                  </Badge>
                ))}
                {professional.services.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                    +{professional.services.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              className="w-full justify-between text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl"
            >
              View Profile
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
