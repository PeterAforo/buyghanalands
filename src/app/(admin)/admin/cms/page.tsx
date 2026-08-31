"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Newspaper, HelpCircle, FolderTree, BarChart3, Settings, FileText, Plus, Trash2, Save, X } from "lucide-react";

type Tab = "news" | "faqs" | "supportCategories" | "homepageStats" | "pageContent" | "siteSettings";

interface CmsData {
  newsArticles: any[];
  supportCategories: any[];
  faqItems: any[];
  homepageStats: any[];
  siteSettings: any[];
}

export default function CmsPage() {
  const [data, setData] = useState<CmsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms");
      if (res.ok) setData(await res.json());
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(entityType: string, id: string | undefined, payload: any) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, id, data: payload }),
      });
      if (res.ok) {
        setEditing(null);
        await load();
      }
    } catch { } finally { setSaving(false); }
  }

  async function remove(entityType: string, id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch(`/api/admin/cms?entityType=${entityType}&id=${id}`, { method: "DELETE" });
      await load();
    } catch { }
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "news", label: "News Articles", icon: Newspaper },
    { key: "faqs", label: "FAQs", icon: HelpCircle },
    { key: "supportCategories", label: "Support Categories", icon: FolderTree },
    { key: "homepageStats", label: "Homepage Stats", icon: BarChart3 },
    { key: "pageContent", label: "Page Content", icon: FileText },
    { key: "siteSettings", label: "Site Settings", icon: Settings },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Website CMS</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all page content, news, FAQs, and site settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b pb-2">
        {tabs.map((t) => (
          <Button key={t.key} variant={activeTab === t.key ? "default" : "ghost"} size="sm"
            onClick={() => { setActiveTab(t.key); setEditing(null); }}
            className={activeTab === t.key ? "bg-[#1a3a2f] gap-2" : "gap-2"}>
            <t.icon className="h-4 w-4" /> {t.label}
          </Button>
        ))}
      </div>

      {/* News Articles */}
      {activeTab === "news" && (
        <NewsTab articles={data?.newsArticles || []} editing={editing} setEditing={setEditing}
          save={save} remove={remove} saving={saving} />
      )}

      {/* FAQs */}
      {activeTab === "faqs" && (
        <FaqsTab items={data?.faqItems || []} editing={editing} setEditing={setEditing}
          save={save} remove={remove} saving={saving} />
      )}

      {/* Support Categories */}
      {activeTab === "supportCategories" && (
        <SupportCategoriesTab categories={data?.supportCategories || []} editing={editing} setEditing={setEditing}
          save={save} remove={remove} saving={saving} />
      )}

      {/* Homepage Stats */}
      {activeTab === "homepageStats" && (
        <HomepageStatsTab stats={data?.homepageStats || []} editing={editing} setEditing={setEditing}
          save={save} remove={remove} saving={saving} />
      )}

      {/* Page Content */}
      {activeTab === "pageContent" && (
        <PageContentTab settings={data?.siteSettings || []} save={save} saving={saving} />
      )}

      {/* Site Settings */}
      {activeTab === "siteSettings" && (
        <SiteSettingsTab settings={data?.siteSettings || []} editing={editing} setEditing={setEditing}
          save={save} remove={remove} saving={saving} />
      )}
    </div>
  );
}

// --- News Tab ---
function NewsTab({ articles, editing, setEditing, save, remove, saving }: any) {
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({})} className="gap-2 bg-[#1a3a2f]"><Plus className="h-4 w-4" /> New Article</Button>
      {editing && (
        <Card>
          <CardHeader><CardTitle>{editing.id ? "Edit Article" : "New Article"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Title" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input placeholder="Slug" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            <Input placeholder="Excerpt" value={editing.excerpt || ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
            <Textarea placeholder="Content (HTML or text)" rows={6} value={editing.content || ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Category" value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              <Input placeholder="Author" value={editing.author || ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
              <Input placeholder="Cover Image URL" value={editing.coverImage || ""} onChange={(e) => setEditing({ ...editing, coverImage: e.target.value })} />
              <Input placeholder="Read time (min)" type="number" value={editing.readTime || ""} onChange={(e) => setEditing({ ...editing, readTime: parseInt(e.target.value) || 5 })} />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isPublished || false} onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })} /> Published</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isFeatured || false} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} /> Featured</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => save("news", editing.id, editing)} disabled={saving || !editing.title || !editing.slug || !editing.content} className="gap-2 bg-[#1a3a2f]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {articles.map((a: any) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-xs text-gray-500">{a.category} • {a.author || "Unknown"} • {a.isPublished ? "Published" : "Draft"}</p>
              </div>
              <div className="flex gap-2">
                {a.isFeatured && <Badge variant="outline" className="bg-amber-50">Featured</Badge>}
                <Button variant="outline" size="sm" onClick={() => setEditing(a)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove("news", a.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- FAQs Tab ---
function FaqsTab({ items, editing, setEditing, save, remove, saving }: any) {
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({})} className="gap-2 bg-[#1a3a2f]"><Plus className="h-4 w-4" /> New FAQ</Button>
      {editing && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <Input placeholder="Question" value={editing.question || ""} onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
            <Textarea placeholder="Answer" rows={3} value={editing.answer || ""} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Category" value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              <Input placeholder="Display Order" type="number" value={editing.displayOrder || 0} onChange={(e) => setEditing({ ...editing, displayOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            <div className="flex gap-2">
              <Button onClick={() => save("faq", editing.id, editing)} disabled={saving || !editing.question || !editing.answer} className="gap-2 bg-[#1a3a2f]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {items.map((f: any) => (
          <Card key={f.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{f.question}</p>
                <p className="text-xs text-gray-500">{f.category} • Order: {f.displayOrder} • {f.isActive ? "Active" : "Inactive"}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(f)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove("faq", f.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Support Categories Tab ---
function SupportCategoriesTab({ categories, editing, setEditing, save, remove, saving }: any) {
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({})} className="gap-2 bg-[#1a3a2f]"><Plus className="h-4 w-4" /> New Category</Button>
      {editing && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <Input placeholder="Title" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Input placeholder="Slug" value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            <Textarea placeholder="Description" rows={2} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Icon name" value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
              <Input placeholder="Href" value={editing.href || ""} onChange={(e) => setEditing({ ...editing, href: e.target.value })} />
              <Input placeholder="Display Order" type="number" value={editing.displayOrder || 0} onChange={(e) => setEditing({ ...editing, displayOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            <div className="flex gap-2">
              <Button onClick={() => save("supportCategory", editing.id, editing)} disabled={saving || !editing.title || !editing.slug} className="gap-2 bg-[#1a3a2f]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {categories.map((c: any) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-gray-500">{c.icon} • {c.href} • Order: {c.displayOrder}</p></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(c)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove("supportCategory", c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Homepage Stats Tab ---
function HomepageStatsTab({ stats, editing, setEditing, save, remove, saving }: any) {
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({})} className="gap-2 bg-[#1a3a2f]"><Plus className="h-4 w-4" /> New Stat</Button>
      {editing && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <Input placeholder="Label (e.g. Verified listings)" value={editing.label || ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
            <Input placeholder="Value (e.g. 1000+)" value={editing.value || ""} onChange={(e) => setEditing({ ...editing, value: e.target.value })} />
            <Input placeholder="Description" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Icon (lucide name)" value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
              <Input placeholder="Display Order" type="number" value={editing.displayOrder || 0} onChange={(e) => setEditing({ ...editing, displayOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            <div className="flex gap-2">
              <Button onClick={() => save("homepageStat", editing.id, editing)} disabled={saving || !editing.label || !editing.value} className="gap-2 bg-[#1a3a2f]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {stats.map((s: any) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div><p className="font-medium text-sm">{s.label}: {s.value}</p><p className="text-xs text-gray-500">{s.icon} • Order: {s.displayOrder} • {s.isActive ? "Active" : "Inactive"}</p></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(s)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove("homepageStat", s.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Page Content Tab ---
function PageContentTab({ settings, save, saving }: any) {
  const pageKeys = ["homepage", "about", "contact", "howItWorks", "pricing", "escrowPolicy", "terms", "privacy"];
  const [selectedPage, setSelectedPage] = useState("homepage");
  const [content, setContent] = useState("");

  const pageContentSettings = settings.filter((s: any) => s.key.startsWith("page."));
  const currentSetting = pageContentSettings.find((s: any) => s.key === `page.${selectedPage}.content`);

  useEffect(() => {
    if (currentSetting) {
      try { setContent(JSON.stringify(JSON.parse(currentSetting.value), null, 2)); }
      catch { setContent(currentSetting.value); }
    } else {
      setContent("");
    }
  }, [selectedPage, currentSetting]);

  async function handleSave() {
    let parsed;
    try { parsed = JSON.parse(content); }
    catch { parsed = content; }
    await save("pageContent", undefined, { pageKey: selectedPage, sectionKey: "content", content: parsed });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-gray-500 mb-3">Edit structured content for each marketing page. Content is stored as JSON and rendered on the public page with fallback to defaults.</p>
          <div className="flex gap-2 flex-wrap mb-4">
            {pageKeys.map((k) => (
              <Button key={k} variant={selectedPage === k ? "default" : "outline"} size="sm"
                onClick={() => setSelectedPage(k)} className={selectedPage === k ? "bg-[#1a3a2f]" : ""}>
                {k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </Button>
            ))}
          </div>
          <Textarea
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`{\n  "hero": {\n    "headline": "...",\n    "subtext": "..."\n  },\n  "steps": [...]\n}`}
            className="font-mono text-sm"
          />
          <Button onClick={handleSave} disabled={saving || !content} className="mt-3 gap-2 bg-[#1a3a2f]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Page Content
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Site Settings Tab ---
function SiteSettingsTab({ settings, editing, setEditing, save, remove, saving }: any) {
  const nonPageSettings = settings.filter((s: any) => !s.key.startsWith("page."));
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({})} className="gap-2 bg-[#1a3a2f]"><Plus className="h-4 w-4" /> New Setting</Button>
      {editing && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <Input placeholder="Key (e.g. brand.name, contact.email, seo.title)" value={editing.key || ""} onChange={(e) => setEditing({ ...editing, key: e.target.value })} />
            <Textarea placeholder="Value" rows={3} value={editing.value || ""} onChange={(e) => setEditing({ ...editing, value: e.target.value })} />
            <select value={editing.type || "text"} onChange={(e) => setEditing({ ...editing, type: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm">
              <option value="text">Text</option>
              <option value="json">JSON</option>
              <option value="url">URL</option>
              <option value="email">Email</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={() => save("siteSetting", editing.id, editing)} disabled={saving || !editing.key || !editing.value} className="gap-2 bg-[#1a3a2f]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {nonPageSettings.map((s: any) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm font-mono">{s.key}</p>
                <p className="text-xs text-gray-500 truncate">{s.value}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{s.type}</Badge>
                <Button variant="outline" size="sm" onClick={() => setEditing(s)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove("siteSetting", s.key)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
