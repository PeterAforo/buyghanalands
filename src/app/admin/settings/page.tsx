"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Settings,
  Bell,
  Shield,
  DollarSign,
  Mail,
  Save,
  Loader2,
} from "lucide-react";

interface PlatformSettings {
  platformFeePercent: number;
  escrowHoldDays: number;
  maxListingImages: number;
  maxDocumentSize: number;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  requirePhoneVerification: boolean;
  requireEmailVerification: boolean;
  autoApproveVerifiedSellers: boolean;
  maintenanceMode: boolean;
}

export default function AdminSettingsPage() {
  const { data: session, status: authStatus } = useSession();
  const [settings, setSettings] = useState<PlatformSettings>({
    platformFeePercent: 2.5,
    escrowHoldDays: 7,
    maxListingImages: 10,
    maxDocumentSize: 10,
    enableEmailNotifications: true,
    enableSmsNotifications: true,
    requirePhoneVerification: true,
    requireEmailVerification: false,
    autoApproveVerifiedSellers: false,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchSettings();
    }
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <CardTitle>Payment Settings</CardTitle>
              </div>
              <CardDescription>Configure payment and escrow settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Platform Fee (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={settings.platformFeePercent}
                    onChange={(e) =>
                      setSettings({ ...settings, platformFeePercent: parseFloat(e.target.value) })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Fee charged on each transaction</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Escrow Hold Days</label>
                  <Input
                    type="number"
                    value={settings.escrowHoldDays}
                    onChange={(e) =>
                      setSettings({ ...settings, escrowHoldDays: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Days to hold funds in escrow</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listing Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <CardTitle>Listing Settings</CardTitle>
              </div>
              <CardDescription>Configure listing upload limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Listing Images</label>
                  <Input
                    type="number"
                    value={settings.maxListingImages}
                    onChange={(e) =>
                      setSettings({ ...settings, maxListingImages: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Document Size (MB)</label>
                  <Input
                    type="number"
                    value={settings.maxDocumentSize}
                    onChange={(e) =>
                      setSettings({ ...settings, maxDocumentSize: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                <CardTitle>Notification Settings</CardTitle>
              </div>
              <CardDescription>Configure notification channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Send notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableEmailNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, enableEmailNotifications: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Send notifications via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableSmsNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, enableSmsNotifications: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                <CardTitle>Security Settings</CardTitle>
              </div>
              <CardDescription>Configure verification and security options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Phone Verification</p>
                  <p className="text-sm text-gray-500">Users must verify phone to list</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requirePhoneVerification}
                  onChange={(e) =>
                    setSettings({ ...settings, requirePhoneVerification: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Email Verification</p>
                  <p className="text-sm text-gray-500">Users must verify email to list</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) =>
                    setSettings({ ...settings, requireEmailVerification: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-approve Verified Sellers</p>
                  <p className="text-sm text-gray-500">Skip moderation for KYC verified sellers</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoApproveVerifiedSellers}
                  onChange={(e) =>
                    setSettings({ ...settings, autoApproveVerifiedSellers: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="font-medium text-red-600">Maintenance Mode</p>
                  <p className="text-sm text-gray-500">Disable public access to the platform</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
