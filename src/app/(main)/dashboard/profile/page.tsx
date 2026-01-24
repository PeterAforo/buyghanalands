"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  FileText,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

interface UserProfile {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  roles: string[];
  kycTier: string;
  accountStatus: string;
  createdAt: string;
  _count: {
    listings: number;
    transactionsAsBuyer: number;
    transactionsAsSeller: number;
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getKycBadge(tier: string) {
  switch (tier) {
    case "TIER_2_GHANA_CARD":
      return { label: "Verified (Ghana Card)", variant: "success" as const, icon: CheckCircle };
    case "TIER_1_ID_UPLOAD":
      return { label: "ID Uploaded", variant: "warning" as const, icon: AlertCircle };
    default:
      return { label: "Unverified", variant: "secondary" as const, icon: AlertCircle };
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status: authStatus, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFormData({
            fullName: data.fullName,
            email: data.email || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        setEditMode(false);
        setMessage({ type: "success", text: "Profile updated successfully" });
        await updateSession();
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Failed to update profile" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Password changed successfully" });
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Failed to change password" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to change password" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard/profile");
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <p className="text-center text-gray-500">Failed to load profile</p>
        </div>
      </div>
    );
  }

  const kycBadge = getKycBadge(profile.kycTier);
  const KycIcon = kycBadge.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="h-10 w-10 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
                <p className="text-gray-500">{profile.phone}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={kycBadge.variant}>
                    <KycIcon className="h-3 w-3 mr-1" />
                    {kycBadge.label}
                  </Badge>
                  {profile.roles.includes("SELLER") && (
                    <Badge variant="outline">Seller</Badge>
                  )}
                </div>
              </div>
              {!editMode && (
                <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              {editMode ? "Update your personal details" : "Your account information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {editMode ? (
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-gray-900">{profile.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-gray-900">{profile.phone}</p>
                <Badge variant="outline" className="text-xs">Verified</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              {editMode ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email address"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{profile.email || "Not provided"}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
              <p className="text-gray-900">{formatDate(profile.createdAt)}</p>
            </div>

            {editMode && (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      fullName: profile.fullName,
                      email: profile.email || "",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Verification */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Identity Verification
            </CardTitle>
            <CardDescription>
              Verify your identity to unlock all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Current Status</p>
                  <Badge variant={kycBadge.variant} className="mt-1">
                    <KycIcon className="h-3 w-3 mr-1" />
                    {kycBadge.label}
                  </Badge>
                </div>
                <Link href="/dashboard/profile/kyc">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    {profile.kycTier === "TIER_0_PHONE_ONLY" ? "Start Verification" : "Update Documents"}
                  </Button>
                </Link>
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Benefits of verification:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Higher transaction limits</li>
                  <li>Verified badge on your listings</li>
                  <li>Increased trust from buyers</li>
                  <li>Priority customer support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              Password & Security
            </CardTitle>
            <CardDescription>
              Manage your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-gray-500">Last changed: Unknown</p>
                </div>
                <Button onClick={() => setShowPasswordForm(true)}>
                  Change Password
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="pl-10 pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="pl-10"
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="pl-10"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleChangePassword} disabled={changingPassword}>
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{profile._count.listings}</p>
                <p className="text-sm text-gray-500">Listings</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{profile._count.transactionsAsBuyer}</p>
                <p className="text-sm text-gray-500">Purchases</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{profile._count.transactionsAsSeller}</p>
                <p className="text-sm text-gray-500">Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
