"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, AlertCircle, FileText, StickyNote, Bell, User, Home, DollarSign, Save } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Workflow {
  id: string;
  propertyTitle: string | null;
  region: string | null;
  district: string | null;
  currentModule: string;
  overallStatus: string;
  overallProgress: number;
  createdAt: string;
  user: { id: string; fullName: string; email: string; phone: string };
  listing: { id: string; title: string; region: string; district: string; priceGhs: string } | null;
  landAcquisition: any;
  preConstruction: any;
  buildingPermit: any;
  construction: any;
  workflowDocuments: { id: string; type: string; url: string; createdAt: string }[];
  workflowNotes: { id: string; content: string; createdAt: string; author: { fullName: string } }[];
  workflowAlerts: { id: string; type: string; message: string; status: string; createdAt: string }[];
  costTracker: { totalEstimatedGhs: string | null; totalActualGhs: string | null } | null;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price: string | number) {
  const num = typeof price === "string" ? parseInt(price) : price;
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 0 }).format(num || 0);
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/workflows/${id}`);
        if (!res.ok) { setError("Failed to load"); return; }
        setWorkflow(await res.json());
      } catch { setError("Failed to load"); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  async function addNote() {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteText: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        // Reload to show the new note
        const reloadRes = await fetch(`/api/admin/workflows/${id}`);
        if (reloadRes.ok) setWorkflow(await reloadRes.json());
      }
    } catch { } finally { setSavingNote(false); }
  }

  async function updateModule(module: string) {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: module }),
      });
      if (res.ok) {
        setWorkflow((prev) => prev ? { ...prev, currentModule: module } : prev);
      }
    } catch { } finally { setUpdatingStatus(false); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" /></div>;
  if (error || !workflow) return (
    <div className="space-y-6">
      <Link href="/admin/workflows"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
      <Card><CardContent className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg font-medium">{error || "Not found"}</p>
      </CardContent></Card>
    </div>
  );

  const modules = [
    { key: "landAcquisition", label: "Land Acquisition", data: workflow.landAcquisition },
    { key: "preConstruction", label: "Pre-Construction", data: workflow.preConstruction },
    { key: "buildingPermit", label: "Building Permit", data: workflow.buildingPermit },
    { key: "construction", label: "Construction", data: workflow.construction },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/workflows"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Workflows</Button></Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{workflow.propertyTitle || workflow.listing?.title || "Untitled Property"}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline">{workflow.currentModule.replace(/_/g, " ")}</Badge>
            <Badge variant="outline">{workflow.overallStatus.replace(/_/g, " ")}</Badge>
            <span className="text-sm text-gray-500">Created {formatDate(workflow.createdAt)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-[#1a3a2f]">{workflow.overallProgress}%</p>
          <p className="text-sm text-gray-500">Overall Progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Module Progress */}
          <Card>
            <CardHeader><CardTitle>Module Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules.map((m) => (
                  <div key={m.key} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm">{m.label}</p>
                      {m.data && <Badge variant="outline">{m.data.status || "N/A"}</Badge>}
                    </div>
                    {m.data?.progress !== undefined && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1a3a2f]" style={{ width: `${m.data.progress}%` }} />
                        </div>
                        <span className="text-xs">{m.data.progress}%</span>
                      </div>
                    )}
                    {!m.data && <p className="text-xs text-gray-400 mt-1">Not started</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          {workflow.workflowDocuments.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Documents ({workflow.workflowDocuments.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workflow.workflowDocuments.map((d) => (
                    <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border rounded-lg p-2 hover:bg-gray-50">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm flex-1">{d.type.replace(/_/g, " ")}</span>
                      <span className="text-xs text-gray-500">{formatDate(d.createdAt)}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {workflow.workflowNotes.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><StickyNote className="h-5 w-5" /> Notes ({workflow.workflowNotes.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflow.workflowNotes.map((n) => (
                    <div key={n.id} className="border-b pb-2 last:border-0">
                      <p className="text-sm">{n.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{n.author.fullName} • {formatDate(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerts */}
          {workflow.workflowAlerts.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Alerts ({workflow.workflowAlerts.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workflow.workflowAlerts.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 border-b pb-2 last:border-0">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{a.message}</p>
                        <p className="text-xs text-gray-500">{a.type} • {formatDate(a.createdAt)}</p>
                      </div>
                      <Badge variant="outline">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Note */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><StickyNote className="h-5 w-5" /> Add Note</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Write a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
              <Button onClick={addNote} disabled={savingNote || !newNote.trim()} className="gap-2 bg-[#1a3a2f]">
                {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Note
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Admin Actions */}
          <Card>
            <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Current Module</label>
                <select
                  value={workflow.currentModule}
                  disabled={updatingStatus}
                  onChange={(e) => updateModule(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-white"
                >
                  <option value="LAND_ACQUISITION">Land Acquisition</option>
                  <option value="PRE_CONSTRUCTION">Pre-Construction</option>
                  <option value="BUILDING_PERMIT">Building Permit</option>
                  <option value="CONSTRUCTION">Construction</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Owner</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link href={`/admin/users/${workflow.user.id}`} className="font-medium text-[#1a3a2f] hover:underline">{workflow.user.fullName}</Link>
              <p className="text-gray-500">{workflow.user.phone}</p>
              <p className="text-gray-500">{workflow.user.email}</p>
            </CardContent>
          </Card>

          {workflow.listing && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Listing</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link href={`/listings/${workflow.listing.id}`} className="font-medium text-[#1a3a2f] hover:underline">{workflow.listing.title}</Link>
                <p className="text-gray-500">{workflow.listing.district}, {workflow.listing.region}</p>
                <p className="text-gray-500">{formatPrice(workflow.listing.priceGhs)}</p>
              </CardContent>
            </Card>
          )}

          {workflow.costTracker && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Cost Tracker</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Estimated</span><span className="font-medium">{formatPrice(workflow.costTracker.totalEstimatedGhs || 0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Actual</span><span className="font-medium">{formatPrice(workflow.costTracker.totalActualGhs || 0)}</span></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
