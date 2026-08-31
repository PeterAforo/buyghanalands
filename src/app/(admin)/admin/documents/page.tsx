"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Download, Shield } from "lucide-react";

interface Document {
  id: string;
  type: string;
  url: string;
  accessPolicy: string;
  fileSize: number | null;
  mimeType: string | null;
  virusScanStatus: string | null;
  checksum: string | null;
  createdAt: string;
  owner: { id: true; fullName: string } | null;
  listing: { id: true; title: string } | null;
  transaction: { id: string } | null;
  _count: { accessLogs: number; verifications: number };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const virusColors: Record<string, string> = {
  CLEAN: "bg-green-100 text-green-700",
  INFECTED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [accessPolicy, setAccessPolicy] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (type) params.set("type", type);
        if (accessPolicy) params.set("accessPolicy", accessPolicy);
        const res = await fetch(`/api/admin/documents?${params}`);
        if (res.ok) setDocuments(await res.json());
      } catch { } finally { setLoading(false); }
    }
    load();
  }, [type, accessPolicy]);

  const docTypes = ["TITLE_DEED", "ID_CARD", "PERMIT", "CONTRACT", "SURVEY_PLAN", "LAND_CERTIFICATE", "PROOF_OF_PAYMENT", "OTHER"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500 mt-1">View uploaded documents and access logs</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]">
          <option value="">All Types</option>
          {docTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
        <select value={accessPolicy} onChange={(e) => setAccessPolicy(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2f]">
          <option value="">All Access Policies</option>
          <option value="PUBLIC">Public</option>
          <option value="VERIFIED_BUYERS">Verified Buyers</option>
          <option value="TRANSACTION_PARTIES">Transaction Parties</option>
          <option value="ADMIN_ONLY">Admin Only</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" /></div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Owner</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Linked</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Size</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Access</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Virus Scan</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Logs</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3"><Badge variant="outline">{d.type.replace(/_/g, " ")}</Badge></td>
                      <td className="px-4 py-3 text-sm">{d.owner?.fullName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {d.listing ? `Listing: ${d.listing.title}` : d.transaction ? `Transaction` : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">{formatBytes(d.fileSize)}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{d.accessPolicy.replace(/_/g, " ")}</Badge></td>
                      <td className="px-4 py-3">
                        {d.virusScanStatus && <Badge variant="outline" className={virusColors[d.virusScanStatus] || ""}>{d.virusScanStatus}</Badge>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">{d._count.accessLogs}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(d.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <a href={d.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1"><Download className="h-3 w-3" /> View</Button>
                        </a>
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
