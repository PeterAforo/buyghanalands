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
  Plus,
  Trash2,
  X,
  Lock,
} from "lucide-react";

type SettingValue = {
  value: string;
  description: string;
  isEncrypted: boolean;
};

type SettingsData = Record<string, Record<string, SettingValue>>;

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  smtp: { label: "Email (SMTP)", icon: Mail, color: "text-blue-600 bg-blue-50" },
  payment: { label: "Payment", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
  sms: { label: "SMS", icon: MessageSquare, color: "text-purple-600 bg-purple-50" },
  storage: { label: "Storage", icon: HardDrive, color: "text-orange-600 bg-orange-50" },
  maps: { label: "Maps", icon: Map, color: "text-cyan-600 bg-cyan-50" },
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsEncrypted, setNewIsEncrypted] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleAddSetting = async () => {
    if (!newKey.trim()) return;
    
    const formattedKey = newKey.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
    
    // Add to local state
    setSettings((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [formattedKey]: {
          value: newValue,
          description: newDescription || `Custom ${activeTab} setting`,
          isEncrypted: newIsEncrypted,
        },
      },
    }));

    // Reset modal
    setNewKey("");
    setNewValue("");
    setNewDescription("");
    setNewIsEncrypted(false);
    setShowAddModal(false);
  };

  const handleDeleteSetting = async (key: string) => {
    setDeleting(key);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: activeTab, key }),
      });

      if (response.ok) {
        setSettings((prev) => {
          const newCategorySettings = { ...prev[activeTab] };
          delete newCategorySettings[key];
          return { ...prev, [activeTab]: newCategorySettings };
        });
      } else {
        setError("Failed to delete setting");
      }
    } catch (err) {
      console.error("Failed to delete setting:", err);
      setError("Failed to delete setting");
    } finally {
      setDeleting(null);
    }
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
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
            </div>

            <div className="p-5 space-y-4">
              {Object.entries(currentCategory).map(([key, setting]) => (
                <div key={key} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      {key.replace(/_/g, " ")}
                      {setting.isEncrypted && <Lock className="h-3 w-3 text-gray-400" />}
                    </label>
                    <button
                      onClick={() => handleDeleteSetting(key)}
                      disabled={deleting === key}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      title="Delete this setting"
                    >
                      {deleting === key ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  </div>
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
                  <p className="text-sm">No settings configured</p>
                  <p className="text-xs mt-1">Click "Add" to add a new API configuration</p>
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

      {/* Add Setting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1a3a2f]">Add New Setting</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Key Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g., FLUTTERWAVE_SECRET_KEY"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f] focus:border-transparent"
                />
                <p className="text-[10px] text-gray-400 mt-1">Will be formatted as uppercase with underscores</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Value</label>
                <input
                  type={newIsEncrypted ? "password" : "text"}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter the value"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of this setting"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f] focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isEncrypted"
                  checked={newIsEncrypted}
                  onChange={(e) => setNewIsEncrypted(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#1a3a2f] focus:ring-[#1a3a2f]"
                />
                <label htmlFor="isEncrypted" className="text-xs text-gray-700">
                  <span className="font-medium">Encrypt this value</span>
                  <span className="text-gray-400 ml-1">(for passwords, API keys, secrets)</span>
                </label>
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSetting}
                disabled={!newKey.trim()}
                className="px-4 py-2 text-xs font-medium bg-[#1a3a2f] text-white rounded-lg hover:bg-[#2a4a3f] transition-colors disabled:opacity-50"
              >
                Add Setting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
