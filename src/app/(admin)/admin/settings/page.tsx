"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ChevronRight,
  Mail,
  CreditCard,
  MessageSquare,
  HardDrive,
  Map,
  Bell,
  Settings,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type SettingValue = {
  value: string;
  description: string;
  isEncrypted: boolean;
};

type SettingsData = Record<string, Record<string, SettingValue>>;

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  smtp: { label: "Email (SMTP)", icon: Mail, color: "text-blue-600 bg-blue-50" },
  payment: { label: "Payment (Paystack)", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
  sms: { label: "SMS (mNotify)", icon: MessageSquare, color: "text-purple-600 bg-purple-50" },
  storage: { label: "Storage (S3/R2)", icon: HardDrive, color: "text-orange-600 bg-orange-50" },
  maps: { label: "Maps (Mapbox)", icon: Map, color: "text-cyan-600 bg-cyan-50" },
  notifications: { label: "Push Notifications", icon: Bell, color: "text-yellow-600 bg-yellow-50" },
  platform: { label: "Platform Settings", icon: Settings, color: "text-gray-600 bg-gray-100" },
};

export default function AdminSettingsPage() {
  const { data: session, status: authStatus } = useSession();
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("smtp");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchSettings();
    }
  }, [session]);

  const handleSave = async (category: string) => {
    setSaving(category);
    setError(null);
    try {
      const categorySettings: Record<string, string> = {};
      for (const [key, val] of Object.entries(settings[category] || {})) {
        categorySettings[key] = val.value;
      }

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, settings: categorySettings }),
      });

      if (response.ok) {
        setSaved(category);
        setTimeout(() => setSaved(null), 3000);
      } else {
        setError("Failed to save settings");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings");
    } finally {
      setSaving(null);
    }
  };

  const updateSetting = (category: string, key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: { ...prev[category][key], value },
      },
    }));
  };

  const togglePassword = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a3a2f]" />
      </div>
    );
  }

  const currentCategory = settings[activeTab] || {};
  const config = CATEGORY_CONFIG[activeTab];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Link href="/admin" className="hover:text-[#1a3a2f]">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#1a3a2f]">Settings</span>
          </div>
          <h1 className="text-lg font-semibold text-[#1a3a2f]">API Configuration</h1>
          <p className="text-xs text-gray-400 mt-0.5">Configure all external service integrations</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex gap-4">
        {/* Sidebar Tabs */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-2">
            {Object.entries(CATEGORY_CONFIG).map(([key, { label, icon: Icon, color }]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === key
                    ? "bg-[#1a3a2f] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeTab === key ? "bg-white/20" : color}`}>
                  <Icon className={`h-3.5 w-3.5 ${activeTab === key ? "text-white" : ""}`} />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings Form */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <config.icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#1a3a2f]">{config.label}</h2>
                  <p className="text-[10px] text-gray-400">Configure {config.label.toLowerCase()} settings</p>
                </div>
              </div>
              <button
                onClick={() => handleSave(activeTab)}
                disabled={saving === activeTab}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  saved === activeTab
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-[#1a3a2f] text-white hover:bg-[#2a4a3f]"
                } disabled:opacity-50`}
              >
                {saving === activeTab ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved === activeTab ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saved === activeTab ? "Saved!" : "Save"}
              </button>
            </div>

            <div className="p-5 space-y-4">
              {Object.entries(currentCategory).map(([key, setting]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {key.replace(/_/g, " ")}
                  </label>
                  <div className="relative">
                    <input
                      type={setting.isEncrypted && !showPasswords[key] ? "password" : "text"}
                      value={setting.value}
                      onChange={(e) => updateSetting(activeTab, key, e.target.value)}
                      placeholder={setting.description}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f] focus:border-transparent pr-10"
                    />
                    {setting.isEncrypted && (
                      <button
                        type="button"
                        onClick={() => togglePassword(key)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords[key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{setting.description}</p>
                </div>
              ))}

              {Object.keys(currentCategory).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No settings available</p>
                </div>
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Sensitive values (passwords, API keys) are encrypted before storage. 
              After saving, they will be displayed as "••••••••". To update, enter a new value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
