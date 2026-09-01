import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { prisma, withDbRetry } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  MapPin,
  Star,
  CheckCircle,
  Briefcase,
  Clock,
  Shield,
  Compass,
  Scale,
  PenTool,
  HardHat,
  Calculator,
  ClipboardList,
  ChevronLeft,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const professionalConfig: Record<string, { icon: any; label: string; description: string }> = {
  SURVEYOR: { icon: Compass, label: "Surveyor", description: "Land surveys & boundary demarcation" },
  LAWYER: { icon: Scale, label: "Lawyer", description: "Legal documentation & title search" },
  ARCHITECT: { icon: PenTool, label: "Architect", description: "Building design & planning" },
  ENGINEER: { icon: HardHat, label: "Engineer", description: "Structural assessment & engineering" },
  PLANNER: { icon: ClipboardList, label: "Planner", description: "Town planning consultation" },
  VALUER: { icon: Calculator, label: "Valuer", description: "Property valuation services" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

async function getProfessional(id: string) {
  try {
    const professional = await withDbRetry(() =>
      prisma.professionalProfile.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              email: true,
              phone: true,
              createdAt: true,
            },
          },
          services: {
            where: { isPublished: true },
            orderBy: { createdAt: "asc" },
          },
          reviewsReceived: {
            include: {
              reviewer: {
                select: { id: true, fullName: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: {
            select: { bookings: true, reviewsReceived: true },
          },
        },
      })
    );

    if (!professional) return null;

    const avgRating =
      professional.reviewsReceived.length > 0
        ? professional.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) /
          professional.reviewsReceived.length
        : 0;

    return {
      id: professional.id,
      professionalType: professional.professionalType,
      bio: professional.bio,
      companyName: professional.companyName,
      yearsExperience: professional.yearsExperience,
      serviceRegions: professional.serviceRegions,
      baseLocation: professional.baseLocation,
      licenseNumber: professional.licenseNumber,
      licenseBody: professional.licenseBody,
      licenseStatus: professional.licenseStatus,
      portfolioUrl: professional.portfolioUrl,
      isActive: professional.isActive,
      createdAt: professional.createdAt.toISOString(),
      user: {
        id: professional.user.id,
        fullName: professional.user.fullName,
        avatarUrl: professional.user.avatarUrl,
        email: professional.user.email,
        phone: professional.user.phone,
        memberSince: professional.user.createdAt.toISOString(),
      },
      services: professional.services.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        priceGhs: s.priceGhs != null ? s.priceGhs.toString() : null,
        priceModel: s.priceModel,
        turnaroundDays: s.turnaroundDays,
      })),
      reviews: professional.reviewsReceived.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        reviewer: {
          id: r.reviewer.id,
          fullName: r.reviewer.fullName,
          avatarUrl: r.reviewer.avatarUrl,
        },
      })),
      avgRating,
      reviewCount: professional._count.reviewsReceived,
      bookingCount: professional._count.bookings,
    };
  } catch (error) {
    console.error("Error fetching professional:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const professional = await getProfessional(id);
  if (!professional) {
    return { title: "Professional not found | Buy Ghana Lands" };
  }
  return {
    title: `${professional.user.fullName} — ${professionalConfig[professional.professionalType]?.label ?? "Professional"} | Buy Ghana Lands`,
    description:
      professional.bio?.slice(0, 160) ??
      `${professional.user.fullName} is a verified ${professionalConfig[professional.professionalType]?.label ?? "professional"} on Buy Ghana Lands.`,
  };
}

export default async function ProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [professional, session] = await Promise.all([getProfessional(id), auth()]);

  if (!professional) {
    notFound();
  }

  const config = professionalConfig[professional.professionalType] ?? {
    icon: Briefcase,
    label: "Professional",
    description: "Professional services",
  };
  const TypeIcon = config.icon;
  const isVerified = professional.licenseStatus === "VERIFIED";
  const avatar = professional.user.avatarUrl || null;
  const isOwnProfile = session?.user?.id === professional.user.id;

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      {/* Back link */}
      <div className="border-b border-emerald-950/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/professionals"
            className="inline-flex items-center text-sm font-medium text-gray-600 transition-colors hover:text-emerald-700"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Professionals
          </Link>
        </div>
      </div>

      {/* Hero header */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0">
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              fill
              priority
              className="object-cover opacity-30 scale-105"
              sizes="100vw"
            />
          ) : (
            <div className="h-full w-full bg-emerald-900" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f2] via-transparent to-black/20" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-8 md:flex-row md:items-end">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border-4 border-white/90 bg-white shadow-2xl md:h-40 md:w-40">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={professional.user.fullName}
                    width={160}
                    height={160}
                    className="h-full w-full object-cover"
                />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-50 font-display text-3xl font-semibold text-emerald-700">
                    {getInitials(professional.user.fullName)}
                  </div>
                )}
              </div>
              {isVerified && (
                <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300 backdrop-blur-sm">
                <TypeIcon className="h-3.5 w-3.5" />
                {config.label}
              </div>
              <h1 className="font-display mt-4 text-4xl font-semibold leading-tight text-white text-shadow-hero sm:text-5xl">
                {professional.user.fullName}
              </h1>
              {professional.companyName && (
                <p className="mt-2 flex items-center gap-2 text-lg text-white/85 text-shadow-soft">
                  <Building2 className="h-5 w-5 text-amber-300" />
                  {professional.companyName}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                {professional.baseLocation && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-amber-300" />
                    {professional.baseLocation}
                  </span>
                )}
                {professional.yearsExperience != null && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-300" />
                    {professional.yearsExperience}+ years experience
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-amber-300" />
                  Member since {formatDate(professional.user.memberSince)}
                </span>
              </div>
            </div>

            {/* Rating badge */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(professional.avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/30"
                    }`}
                  />
                ))}
              </div>
              <p className="font-display mt-2 text-3xl font-semibold text-white">
                {professional.avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-white/70">
                {professional.reviewCount} review{professional.reviewCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="space-y-8 lg:col-span-2">
            {/* About */}
            <section className="rounded-3xl border border-emerald-950/10 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="font-display text-2xl font-semibold text-emerald-950">
                About {professional.user.fullName.split(" ")[0]}
              </h2>
              {professional.bio ? (
                <p className="mt-4 whitespace-pre-wrap leading-relaxed text-gray-600">
                  {professional.bio}
                </p>
              ) : (
                <p className="mt-4 italic text-gray-400">
                  No bio provided yet.
                </p>
              )}

              {professional.serviceRegions.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <p className="mb-3 text-sm font-medium text-gray-500">Service regions</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.serviceRegions.map((region) => (
                      <span
                        key={region}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                      >
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Services */}
            <section className="rounded-3xl border border-emerald-950/10 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="font-display text-2xl font-semibold text-emerald-950">
                Services offered
              </h2>
              {professional.services.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {professional.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-5 transition-colors hover:border-emerald-300 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-950">{service.title}</h3>
                        {service.description && (
                          <p className="mt-1 text-sm text-gray-600">{service.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                          {service.turnaroundDays && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {service.turnaroundDays} day turnaround
                            </span>
                          )}
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
                            {service.priceModel === "FIXED" ? "Fixed price" : "Custom quote"}
                          </span>
                        </div>
                      </div>
                      {service.priceGhs && (
                        <div className="text-right">
                          <p className="font-display text-xl font-semibold text-emerald-700">
                            {formatPrice(service.priceGhs)}
                          </p>
                          <p className="text-xs text-gray-500">GHS</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 italic text-gray-400">
                  No services published yet.
                </p>
              )}
            </section>

            {/* Reviews */}
            <section className="rounded-3xl border border-emerald-950/10 bg-white p-7 shadow-sm sm:p-9">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-emerald-950">
                  Reviews
                </h2>
                <span className="text-sm text-gray-500">
                  {professional.reviewCount} total
                </span>
              </div>

              {professional.reviews.length > 0 ? (
                <div className="mt-6 space-y-5">
                  {professional.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-100 pb-5 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                          {review.reviewer.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-emerald-950">
                            {review.reviewer.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 italic text-gray-400">
                  No reviews yet. Be the first to leave a review after working with{" "}
                  {professional.user.fullName.split(" ")[0]}.
                </p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact / CTA */}
            <section className="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold text-emerald-950">
                Get in touch
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Interested in working with {professional.user.fullName.split(" ")[0]}? Reach out
                to start a project.
              </p>

              {isOwnProfile ? (
                <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-center text-sm text-emerald-700">
                  This is your professional profile.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {session?.user && professional.user.phone && (
                    <a
                      href={`tel:${professional.user.phone}`}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-sm transition-colors hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <Phone className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-emerald-950">
                        {professional.user.phone}
                      </span>
                    </a>
                  )}
                  {session?.user && professional.user.email && (
                    <a
                      href={`mailto:${professional.user.email}`}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-sm transition-colors hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <Mail className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-emerald-950">
                        Email
                      </span>
                    </a>
                  )}
                  {!session?.user && (
                    <Link
                      href="/auth/login"
                      className="block rounded-xl bg-amber-400 px-5 py-3 text-center font-semibold text-emerald-950 transition-colors hover:bg-amber-300"
                    >
                      Log in to contact
                    </Link>
                  )}
                  {session?.user && (
                    <Link
                      href={`/professionals?contact=${professional.id}`}
                      className="block rounded-xl bg-emerald-700 px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-emerald-800"
                    >
                      Request a service
                      <ArrowRight className="ml-1 inline h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* Credentials */}
            <section className="rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold text-emerald-950">
                Credentials
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">License status</dt>
                  <dd
                    className={`inline-flex items-center gap-1.5 font-medium ${
                      isVerified ? "text-emerald-700" : "text-gray-600"
                    }`}
                  >
                    {isVerified && <Shield className="h-4 w-4" />}
                    {professional.licenseStatus.charAt(0) +
                      professional.licenseStatus.slice(1).toLowerCase()}
                  </dd>
                </div>
                {professional.licenseNumber && (
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500">License number</dt>
                    <dd className="font-medium text-emerald-950">
                      {professional.licenseNumber}
                    </dd>
                  </div>
                )}
                {professional.licenseBody && (
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500">Issuing body</dt>
                    <dd className="font-medium text-emerald-950">
                      {professional.licenseBody}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Completed bookings</dt>
                  <dd className="font-medium text-emerald-950">
                    {professional.bookingCount}
                  </dd>
                </div>
                {professional.portfolioUrl && (
                  <div className="pt-2">
                    <a
                      href={professional.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline"
                    >
                      View portfolio
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </dl>
            </section>

            {/* Safety tips */}
            <section className="rounded-3xl bg-emerald-950 p-6 text-white">
              <h3 className="font-display text-lg font-semibold">Working safely</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-emerald-100">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                  Always confirm scope and price before paying
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                  Use our escrow service for large projects
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                  Verify license numbers with the issuing body
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                  Keep all communication on-platform
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
