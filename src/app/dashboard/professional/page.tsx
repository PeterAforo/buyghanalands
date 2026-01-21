"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Star,
  Calendar,
  DollarSign,
  Users,
  Settings,
  Plus,
  ArrowLeft,
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
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Professional Dashboard</h1>
          </div>
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
        </div>

        {/* Profile Overview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                  {profile.companyName || session.user.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {profile.professionalType} • {profile.yearsExperience || 0} years experience
                </CardDescription>
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
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
                <p className="text-sm text-gray-500">{profile.reviewsReceived.length} reviews</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{profile.bookings.length}</p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{profile.services.length}</p>
                <p className="text-sm text-gray-500">Services</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{profile.serviceRegions.length}</p>
                <p className="text-sm text-gray-500">Regions Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Bookings</CardTitle>
              <CardDescription>Service requests awaiting your action</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingBookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending bookings</p>
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
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Services</CardTitle>
                  <CardDescription>Services you offer to clients</CardDescription>
                </div>
                <Link href="/dashboard/professional/services">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {profile.services.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No services added yet</p>
                  <Link href="/dashboard/professional/services">
                    <Button>Add Your First Service</Button>
                  </Link>
                </div>
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
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>What clients are saying about you</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.reviewsReceived.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
