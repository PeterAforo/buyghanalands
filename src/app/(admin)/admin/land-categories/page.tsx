"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Home,
  Building2,
  Factory,
  Tractor,
  Layers,
  Loader2,
  X,
  Save,
} from "lucide-react";

interface LandCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  landType: string;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { listings: number };
}

const landTypeOptions = [
  { value: "RESIDENTIAL", label: "Residential", icon: Home },
  { value: "COMMERCIAL", label: "Commercial", icon: Building2 },
  { value: "INDUSTRIAL", label: "Industrial", icon: Factory },
  { value: "AGRICULTURAL", label: "Agricultural", icon: Tractor },
  { value: "MIXED", label: "Mixed Use", icon: Layers },
];

const landTypeDescriptions: Record<string, string> = {
  RESIDENTIAL: "Land zoned for housing, apartments, and residential developments",
  COMMERCIAL: "Land for shops, offices, hotels, and business establishments",
  INDUSTRIAL: "Land for factories, warehouses, and manufacturing facilities",
  AGRICULTURAL: "Farmland for crops, livestock, and agricultural activities",
  MIXED: "Land that can be used for multiple purposes",
};

function getLandTypeIcon(landType: string) {
  const option = landTypeOptions.find((o) => o.value === landType);
  return option?.icon || Layers;
}

export default function LandCategoriesPage() {
  const [categories, setCategories] = useState<LandCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    landType: "RESIDENTIAL",
    isActive: true,
    sortOrder: 0,
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/land-categories");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      landType: "RESIDENTIAL",
      isActive: true,
      sortOrder: 0,
    });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const handleEdit = (category: LandCategory) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      landType: category.landType,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/admin/land-categories/${editingId}`
        : "/api/admin/land-categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      await fetchCategories();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/admin/land-categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      await fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Group categories by land type
  const groupedCategories = landTypeOptions.map((type) => ({
    ...type,
    categories: categories.filter((c) => c.landType === type.value),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Land Categories</h1>
          <p className="text-gray-600 mt-1">
            Manage land categories and their descriptions for listings
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? "Edit Category" : "Add New Category"}</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Category Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Serviced Plots, Farmland, Warehouse Land"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Land Type *</label>
                  <select
                    value={formData.landType}
                    onChange={(e) => setFormData({ ...formData, landType: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    {landTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this category means and what type of land it includes..."
                  className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Sort Order</label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Active (visible to users)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingId ? "Update Category" : "Create Category"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories by Land Type */}
      <div className="space-y-6">
        {groupedCategories.map((group) => {
          const Icon = group.icon;
          return (
            <Card key={group.value}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{group.label} Lands</CardTitle>
                    <p className="text-sm text-gray-500">{landTypeDescriptions[group.value]}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {group.categories.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">
                    No categories defined yet.{" "}
                    <button
                      onClick={() => {
                        setFormData({ ...formData, landType: group.value });
                        setShowForm(true);
                      }}
                      className="text-emerald-600 hover:underline"
                    >
                      Add one
                    </button>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {group.categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.name}</span>
                            {!category.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            <Badge variant="outline">{category._count.listings} listings</Badge>
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
