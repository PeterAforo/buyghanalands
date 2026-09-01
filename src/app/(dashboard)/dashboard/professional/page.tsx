"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionCard, EmptyState, DashboardStatCard } from "@/components/dashboard";
import {
  Briefcase,
  Star,
  Calendar,
  DollarSign,
  Users,
  Settings,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface ProfessionalProfile {
  id: string;
  professionalType: string;
  companyName: string | null;
  bio: string | null;
  licenseNumber: string | null;
  licenseStatus: string;
  yearsExperience: number | null;
  serviceRegions: string[];
  isActive: boolean;
  services: Array<{
    id: string;
    title: string;
    priceGhs: string | null;
    isPublished: boolean;
  }>;
  bookings: Array<{
    id: string;
    status: string;
    scheduledAt: string | null;
    serviceRequest: {
      title: string;
      requester: { fullName: string };
    };
  }>;
  reviewsReceived: Array<{
    rating: number;
    comment: string | null;
  }>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "REQUESTED":
      return { label: "Pending", variant: "warning" as const, icon: Clock };
    case "CONFIRMED":
      return { label: "Confirmed", variant: "default" as const, icon: CheckCircle };
    case "COMPLETED":
      return { label: "Completed", variant: "success" as const, icon: CheckCircle };
    case "CANCELLED":
      return { label: "Cancelled", variant: "destructive" as const, icon: XCircle };
    default:
      return { label: status, variant: "outline" as const, icon: Clock };
  }
}

export default function ProfessionalDashboardPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/professionals/me");
        if (response.status === 404) {
          router.push("/professionals/register");
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError("Failed to load professional profile");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchProfile();
    }
  }, [session, router]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard/professional");
    return null;
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <SectionCard className="w-full max-w-md text-center" bodyClassName="pt-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </SectionCard>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const avgRating = profile.reviewsReceived.length > 0
    ? profile.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / profile.reviewsReceived.length
    : 0;

  const pendingBookings = profile.bookings.filter((b) => b.status === "REQUESTED" || b.status === "CONFIRMED");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Professional Dashboard"
        description="Manage your services, bookings, and professional profile"
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Professional" }]}
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/professional/services">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </Link>
            <Link href="/dashboard/professional/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        }
      />

      {/* Profile Overview */}
      <SectionCard>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-emerald-950">
              <Briefcase className="h-5 w-5 text-emerald-600" />
              {profile.companyName || session.user.name}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {profile.professionalType} • {profile.yearsExperience || 0} years experience
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={profile.licenseStatus === "VERIFIED" ? "success" : "warning"}>
              {profile.licenseStatus === "VERIFIED" ? "Verified" : "Unverified"}
            </Badge>
            <Badge variant={profile.isActive ? "success" : "outline"}>
              {profile.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardStatCard
            label="Rating"
            value={avgRating.toFixed(1)}
            icon={<Star className="h-5 w-5" />}
            accent="gold"
          />
          <DashboardStatCard
            label="Total Bookings"
            value={profile.bookings.length}
            icon={<Calendar className="h-5 w-5" />}
            accent="blue"
          />
          <DashboardStatCard
            label="Services"
            value={profile.services.length}
            icon={<DollarSign className="h-5 w-5" />}
            accent="emerald"
          />
          <DashboardStatCard
            label="Regions Covered"
            value={profile.serviceRegions.length}
            icon={<Users className="h-5 w-5" />}
            accent="purple"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">{profile.reviewsReceived.length} reviews</p>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Bookings */}
        <SectionCard
          title="Pending Bookings"
          description="Service requests awaiting your action"
        >
          {pendingBookings.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-7 w-7" />}
              title="No pending bookings"
              description="You have no service requests awaiting action"
            />
          ) : (
            <div className="space-y-4">
              {pendingBookings.slice(0, 5).map((booking) => {
                const badge = getStatusBadge(booking.status);
                const Icon = badge.icon;
                return (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{booking.serviceRequest.title}</p>
                      <p className="text-sm text-gray-500">
                        Client: {booking.serviceRequest.requester.fullName}
                      </p>
                      {booking.scheduledAt && (
                        <p className="text-sm text-gray-500">
                          Scheduled: {new Date(booking.scheduledAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge variant={badge.variant}>
                      <Icon className="h-3 w-3 mr-1" />
                      {badge.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Services */}
        <SectionCard
          title="Your Services"
          description="Services you offer to clients"
          action={
            <Link href="/dashboard/professional/services">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </Link>
          }
        >
          {profile.services.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-7 w-7" />}
              title="No services added yet"
              description="Start offering your professional services to clients"
              action={{ label: "Add Your First Service", href: "/dashboard/professional/services" }}
            />
          ) : (
            <div className="space-y-3">
              {profile.services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{service.title}</p>
                    {service.priceGhs && (
                      <p className="text-sm text-emerald-600">
                        GH₵ {parseInt(service.priceGhs).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Badge variant={service.isPublished ? "success" : "outline"}>
                    {service.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Recent Reviews */}
        <SectionCard
          className="lg:col-span-2"
          title="Recent Reviews"
          description="What clients are saying about you"
        >
          {profile.reviewsReceived.length === 0 ? (
            <EmptyState
              icon={<Star className="h-7 w-7" />}
              title="No reviews yet"
              description="Client reviews will appear here once you receive them"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.reviewsReceived.slice(0, 4).map((review, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600">{review.comment || "No comment provided"}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
