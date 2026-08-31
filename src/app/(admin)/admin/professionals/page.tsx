"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Briefcase, Search, Eye } from "lucide-react";

interface Professional {
  id: string;
  professionalType: string;
  companyName: string | null;
  licenseStatus: string;
  isActive: boolean;
  yearsExperience: number | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string; phone: string; accountStatus: string };
  _count: { services: number; bookings: number; reviewsReceived: number };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ filter });
        if (type) params.set("type", type);
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/professionals?${params}`);
        if (res.ok) {
          const data = await res.json();
          setProfessionals(data.professionals || []);
        }
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [filter, type, search]);

  const filters = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
    { key: "unverified", label: "Unverified" },
    { key: "verified", label: "Verified" },
  ];

  const types = ["SURVEYOR", "LAWYER", "VALUER", "ARCHITECT", "ENGINEER", "PLANNER"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Professionals</h1>
        <p className="text-sm text-gray-500 mt-1">Manage professional service providers</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm"
              onClick={() => setFilter(f.key)} className={filter === f.key ? "bg-[#1a3a2f]" : ""}>{f.label}</Button>
          ))}
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]">
          <option value="">All Types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" />
            </div>
          ) : professionals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Briefcase className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No professionals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-600">License</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Services</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Bookings</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {professionals.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.user.fullName}</p>
                        <p className="text-xs text-gray-500">{p.companyName || p.user.phone}</p>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline">{p.professionalType}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={
                          p.licenseStatus === "VERIFIED" ? "bg-green-50" :
                          p.licenseStatus === "REJECTED" ? "bg-red-50" : "bg-amber-50"
                        }>{p.licenseStatus}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{p._count.services}</td>
                      <td className="px-4 py-3 text-center">{p._count.bookings}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={p.isActive ? "bg-green-50" : "bg-gray-50"}>
                          {p.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/professionals/${p.id}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-3 w-3" /> View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
