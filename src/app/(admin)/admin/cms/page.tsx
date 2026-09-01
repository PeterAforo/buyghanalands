"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WysiwygEditor } from "@/components/admin/wysiwyg-editor";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  Loader2, Newspaper, HelpCircle, FolderTree, BarChart3, Settings, FileText,
  Plus, Trash2, Save, X, Star, ListOrdered, Home, Compass, Map, Shield,
  Image as ImageIcon, Mail, PanelBottom,
} from "lucide-react";

type Tab =
  | "news" | "faqs" | "supportCategories" | "homepageStats" | "pageContent"
  | "siteSettings" | "testimonials" | "homepageSteps" | "landTypes"
  | "professionalTypes" | "regions" | "trustBar" | "heroContent" | "contactMessages" | "footerContent";

interface CmsData {
  newsArticles: any[];
  supportCategories: any[];
  faqItems: any[];
  homepageStats: any[];
  siteSettings: any[];
  testimonials: any[];
  homepageSteps: any[];
  homepageLandTypes: any[];
  homepageProfessionals: any[];
  homepageRegions: any[];
  trustBarItems: any[];
  heroContent: any[];
  contactMessages: any[];
  footerContent: any[];
}

export default function CmsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<CmsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab") as Tab;
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const setTab = (tab: Tab) => {
    setActiveTab(tab);
    router.push(`/admin/cms?tab=${tab}`, { scroll: false });
  };

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
    { key: "heroContent", label: "Hero Content", icon: ImageIcon },
    { key: "pageContent", label: "Page Content", icon: FileText },
    { key: "footerContent", label: "Footer Content", icon: PanelBottom },
    { key: "testimonials", label: "Testimonials", icon: Star },
    { key: "homepageStats", label: "Homepage Stats", icon: BarChart3 },
    { key: "homepageSteps", label: "How It Works Steps", icon: ListOrdered },
    { key: "landTypes", label: "Land Types", icon: Home },
    { key: "professionalTypes", label: "Professionals", icon: Compass },
    { key: "regions", label: "Regions", icon: Map },
    { key: "trustBar", label: "Trust Bar", icon: Shield },
    { key: "faqs", label: "FAQs", icon: HelpCircle },
    { key: "supportCategories", label: "Support Categories", icon: FolderTree },
    { key: "contactMessages", label: "Contact Messages", icon: Mail },
    { key: "siteSettings", label: "Site Settings", icon: Settings },
  ];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-[#1a3a2f]" /></div>;
  }

  const currentTabInfo = tabs.find((t) => t.key === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Website CMS</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all page content, news, FAQs, and site settings</p>
      </div>

      {/* Breadcrumb showing current section */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">CMS</span>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-[#1a3a2f] flex items-center gap-1.5">
          {currentTabInfo && <currentTabInfo.icon className="h-4 w-4" />}
          {currentTabInfo?.label}
        </span>
      </div>

      {/* Horizontal tab bar (still available for quick switching) */}
      <div className="flex gap-2 flex-wrap border-b pb-2">
        {tabs.map((t) => (
          <Button key={t.key} variant={activeTab === t.key ? "default" : "ghost"} size="sm"
            onClick={() => { setTab(t.key); setEditing(null); }}
            className={activeTab === t.key ? "bg-[#1a3a2f] gap-2" : "gap-2"}>
            <t.icon className="h-4 w-4" /> {t.label}
          </Button>
        ))}
      </div>

      {activeTab === "news" && <NewsTab articles={data?.newsArticles || []} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {activeTab === "faqs" && <FaqsTab items={data?.faqItems || []} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {activeTab === "supportCategories" && <SupportCategoriesTab categories={data?.supportCategories || []} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {activeTab === "homepageStats" && <HomepageStatsTab stats={data?.homepageStats || []} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {activeTab === "pageContent" && <PageContentTab settings={data?.siteSettings || []} save={save} saving={saving} />}
      {activeTab === "siteSettings" && <SiteSettingsTab settings={data?.siteSettings || []} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {activeTab === "testimonials" && <SimpleListTab items={data?.testimonials || []} entityType="testimonial" editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} fields={[["name", "Name"], ["role", "Role"], ["country", "Country"], ["quote", "Quote", "textarea"], ["rating", "Rating (1-5)", "number"], ["sortOrder", "Sort Order", "number"], ["isActive", "Active", "checkbox"]]} titleField="name" subtitleField="role" />}
      {activeTab === "homepageSteps" && <SimpleListTab items={data?.homepageSteps || []} entityType="homepageStep" editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} fields={[["icon", "Icon (lucide name)"], ["title", "Title"], ["description", "Description", "textarea"], ["sortOrder", "Sort Order", "number"], ["isActive", "Active", "checkbox"]]} titleField="title" subtitleField="description" />}
      {activeTab === "landTypes" && <SimpleListTab items={data?.homepageLandTypes || []} entityType="homepageLandType" editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} fields={[["type", "Type (e.g. RESIDENTIAL)"], ["label", "Label"], ["icon", "Icon (lucide name)"], ["count", "Count", "number"], ["sortOrder", "Sort Order", "number"], ["isActive", "Active", "checkbox"]]} titleField="label" subtitleField="type" />}
      {activeTab === "professionalTypes" && <SimpleListTab items={data?.homepageProfessionals || []} entityType="homepageProfessional" editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} fields={[["type", "Type (e.g. SURVEYOR)"], ["label", "Label"], ["icon", "Icon (lucide name)"], ["description", "Description"], ["sortOrder", "Sort Order", "number"], ["isActive", "Active", "checkbox"]]} titleField="label" subtitleField="description" />}
      {activeTab === "regions" && <RegionsTab regions={data?.homepageRegions || []} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {activeTab === "trustBar" && <SimpleListTab items={data?.trustBarItems || []} entityType="trustBarItem" editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} fields={[["icon", "Icon (lucide name)"], ["label", "Label"], ["sortOrder", "Sort Order", "number"], ["isActive", "Active", "checkbox"]]} titleField="label" subtitleField="icon" />}
      {activeTab === "heroContent" && <HeroContentTab heroContent={data?.heroContent || []} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {activeTab === "contactMessages" && <ContactMessagesTab messages={data?.contactMessages || []} save={save} remove={remove} />}
      {activeTab === "footerContent" && <FooterContentTab footerContent={data?.footerContent || []} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
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
            <div>
              <label className="text-sm font-medium mb-1 block">Article Content</label>
              <WysiwygEditor
                value={editing.content || ""}
                onChange={(html) => setEditing({ ...editing, content: html })}
                placeholder="Write your article content here..."
                minHeight={300}
              />
            </div>
            <ImageUpload
              value={editing.coverImage || null}
              onChange={(url) => setEditing({ ...editing, coverImage: url })}
              label="Cover Image"
              folder="cms/news"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Category" value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              <Input placeholder="Author" value={editing.author || ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
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
              <div className="flex items-center gap-3">
                {a.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverImage} alt="" className="w-12 h-12 rounded object-cover" />
                )}
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.category} • {a.author || "Unknown"} • {a.isPublished ? "Published" : "Draft"}</p>
                </div>
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
            <div>
              <label className="text-sm font-medium mb-1 block">Answer</label>
              <WysiwygEditor
                value={editing.answer || ""}
                onChange={(html) => setEditing({ ...editing, answer: html })}
                placeholder="Write the answer here..."
                minHeight={120}
              />
            </div>
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
            <Input placeholder="Label (e.g. Verified Listings)" value={editing.label || ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Value" value={editing.value || ""} onChange={(e) => setEditing({ ...editing, value: e.target.value })} />
              <Input placeholder="Prefix (e.g. ₵)" value={editing.prefix || ""} onChange={(e) => setEditing({ ...editing, prefix: e.target.value })} />
              <Input placeholder="Suffix (e.g. +)" value={editing.suffix || ""} onChange={(e) => setEditing({ ...editing, suffix: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Icon (lucide name)" value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
              <Input placeholder="Display Order" type="number" value={editing.displayOrder || 0} onChange={(e) => setEditing({ ...editing, displayOrder: parseInt(e.target.value) || 0 })} />
              <label className="flex items-center gap-2 text-sm self-center"><input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => save("homepageStat", editing.id, editing)} disabled={saving || !editing.label} className="gap-2 bg-[#1a3a2f]">
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
              <div><p className="font-medium text-sm">{s.label}: {s.prefix || ""}{s.value}{s.suffix || ""}</p><p className="text-xs text-gray-500">{s.icon} • Order: {s.displayOrder} • {s.isActive ? "Active" : "Inactive"}</p></div>
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

// --- Generic Simple List Tab (used for testimonials, steps, land types, etc.) ---
function SimpleListTab({ items, entityType, editing, setEditing, save, remove, saving, fields, titleField, subtitleField }: any) {
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({})} className="gap-2 bg-[#1a3a2f]"><Plus className="h-4 w-4" /> New Item</Button>
      {editing && (
        <Card>
          <CardContent className="space-y-3 py-4">
            {fields.map(([key, label, type]: any) => (
              <div key={key}>
                {type === "textarea" ? (
                  <Textarea placeholder={label} rows={3} value={editing[key] || ""} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })} />
                ) : type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing[key] !== false} onChange={(e) => setEditing({ ...editing, [key]: e.target.checked })} /> {label}</label>
                ) : type === "number" ? (
                  <Input placeholder={label} type="number" value={editing[key] ?? ""} onChange={(e) => setEditing({ ...editing, [key]: parseInt(e.target.value) || 0 })} />
                ) : (
                  <Input placeholder={label} value={editing[key] || ""} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })} />
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={() => save(entityType, editing.id, editing)} disabled={saving} className="gap-2 bg-[#1a3a2f]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {items.map((item: any) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm">{item[titleField]}</p>
                <p className="text-xs text-gray-500">{item[subtitleField]} • Order: {item.sortOrder ?? item.displayOrder} • {item.isActive === false ? "Inactive" : "Active"}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(item)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(entityType, item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Regions Tab (with image upload) ---
function RegionsTab({ regions, editing, setEditing, save, remove, saving }: any) {
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({})} className="gap-2 bg-[#1a3a2f]"><Plus className="h-4 w-4" /> New Region</Button>
      {editing && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <Input placeholder="Name" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input placeholder="Count" type="number" value={editing.count || 0} onChange={(e) => setEditing({ ...editing, count: parseInt(e.target.value) || 0 })} />
            <ImageUpload
              value={editing.image || null}
              onChange={(url) => setEditing({ ...editing, image: url })}
              label="Region Image"
              folder="cms/regions"
              aspectRatio="aspect-[16/10]"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Sort Order" type="number" value={editing.sortOrder || 0} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} />
              <label className="flex items-center gap-2 text-sm self-center"><input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => save("homepageRegion", editing.id, editing)} disabled={saving || !editing.name} className="gap-2 bg-[#1a3a2f]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {regions.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {r.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt="" className="w-12 h-12 rounded object-cover" />
                )}
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.count} listings • Order: {r.sortOrder}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(r)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove("homepageRegion", r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Hero Content Tab (with image upload) ---
function HeroContentTab({ heroContent, editing, setEditing, save, remove, saving }: any) {
  const [bgImages, setBgImages] = useState<string[]>([]);

  useEffect(() => {
    if (editing?.backgroundImages) {
      try {
        const parsed = typeof editing.backgroundImages === "string"
          ? JSON.parse(editing.backgroundImages)
          : editing.backgroundImages;
        setBgImages(Array.isArray(parsed) ? parsed : []);
      } catch {
        setBgImages([]);
      }
    } else {
      setBgImages([]);
    }
  }, [editing]);

  function addImage(url: string) {
    const updated = [...bgImages, url];
    setBgImages(updated);
    setEditing({ ...editing, backgroundImages: JSON.stringify(updated) });
  }

  function removeImage(idx: number) {
    const updated = bgImages.filter((_, i) => i !== idx);
    setBgImages(updated);
    setEditing({ ...editing, backgroundImages: JSON.stringify(updated) });
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({ backgroundImages: "[]" })} className="gap-2 bg-[#1a3a2f]"><Plus className="h-4 w-4" /> New Hero Content</Button>
      {editing && (
        <Card>
          <CardHeader><CardTitle>{editing.id ? "Edit Hero Content" : "New Hero Content"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Eyebrow" value={editing.eyebrow || ""} onChange={(e) => setEditing({ ...editing, eyebrow: e.target.value })} />
            <Input placeholder="Headline" value={editing.headline || ""} onChange={(e) => setEditing({ ...editing, headline: e.target.value })} />
            <Textarea placeholder="Subheadline" rows={3} value={editing.subheadline || ""} onChange={(e) => setEditing({ ...editing, subheadline: e.target.value })} />

            {/* Background images upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Background Images</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {bgImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <div className="relative aspect-video rounded-lg overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <ImageUpload
                  value={null}
                  onChange={(url) => url && addImage(url)}
                  label="Add Image"
                  folder="cms/hero"
                  aspectRatio="aspect-video"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            <div className="flex gap-2">
              <Button onClick={() => save("heroContent", editing.id, { ...editing, backgroundImages: JSON.stringify(bgImages) })} disabled={saving || !editing.headline} className="gap-2 bg-[#1a3a2f]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {heroContent.map((h: any) => (
          <Card key={h.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm">{h.eyebrow} — {h.headline}</p>
                <p className="text-xs text-gray-500">{h.isActive ? "Active" : "Inactive"}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing({ ...h, backgroundImages: typeof h.backgroundImages === "string" ? h.backgroundImages : JSON.stringify(h.backgroundImages || []) })}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove("heroContent", h.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Footer Content Tab ---
function FooterContentTab({ footerContent, editing, setEditing, save, remove, saving }: any) {
  const sections = ["brand", "links", "newsletter", "contact", "bottom"];

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({ section: "brand", linksJson: "[]" })} className="gap-2 bg-[#1a3a2f]"><Plus className="h-4 w-4" /> New Footer Section</Button>
      {editing && (
        <Card>
          <CardHeader><CardTitle>{editing.id ? "Edit Footer Section" : "New Footer Section"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select
              value={editing.section || "brand"}
              onChange={(e) => setEditing({ ...editing, section: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {sections.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <Input placeholder="Title (e.g. Company, Services)" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Textarea placeholder="Description (for brand section)" rows={2} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />

            {editing.section === "links" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Links (JSON array: [{"{ \"name\": \"About\", \"href\": \"/about\" }"}])</label>
                <Textarea
                  rows={4}
                  placeholder='[{"name": "About Us", "href": "/about"}, {"name": "Contact", "href": "/contact"}]'
                  value={editing.linksJson || ""}
                  onChange={(e) => setEditing({ ...editing, linksJson: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {(editing.section === "bottom" || editing.section === "brand") && (
              <div>
                <label className="text-sm font-medium mb-1 block">HTML Content</label>
                <WysiwygEditor
                  value={editing.htmlContent || ""}
                  onChange={(html) => setEditing({ ...editing, htmlContent: html })}
                  placeholder="HTML content for this section..."
                  minHeight={100}
                />
              </div>
            )}

            {(editing.section === "brand" || editing.section === "newsletter") && (
              <ImageUpload
                value={editing.imageUrl || null}
                onChange={(url) => setEditing({ ...editing, imageUrl: url })}
                label="Image (optional)"
                folder="cms/footer"
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Sort Order" type="number" value={editing.sortOrder || 0} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} />
              <label className="flex items-center gap-2 text-sm self-center"><input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => save("footerContent", editing.id, editing)} disabled={saving} className="gap-2 bg-[#1a3a2f]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(null)} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {footerContent.map((f: any) => (
          <Card key={f.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm capitalize">{f.section}: {f.title || "(no title)"}</p>
                <p className="text-xs text-gray-500">Order: {f.sortOrder} • {f.isActive ? "Active" : "Inactive"}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing({ ...f, linksJson: typeof f.linksJson === "string" ? f.linksJson : JSON.stringify(f.linksJson || []) })}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove("footerContent", f.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Contact Messages Tab ---
function ContactMessagesTab({ messages, save, remove }: any) {
  const statusColors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    READ: "bg-yellow-100 text-yellow-700",
    RESPONDED: "bg-green-100 text-green-700",
    ARCHIVED: "bg-gray-100 text-gray-700",
  };

  async function updateStatus(id: string, status: string) {
    await save("contactMessage", id, { status });
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">Contact form submissions from the public contact page.</div>
      <div className="space-y-2">
        {messages.length === 0 && (
          <Card><CardContent className="py-8 text-center text-gray-500">No contact messages yet.</CardContent></Card>
        )}
        {messages.map((m: any) => (
          <Card key={m.id}>
            <CardContent className="py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{m.name} <span className="text-gray-400">•</span> <span className="text-gray-500">{m.email}</span></p>
                  <p className="text-xs text-gray-500">{m.subject} • {new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline" className={statusColors[m.status] || statusColors.NEW}>{m.status}</Badge>
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{m.message}</p>
              <div className="flex gap-2">
                {m.status === "NEW" && <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "READ")}>Mark Read</Button>}
                {m.status !== "RESPONDED" && m.status !== "ARCHIVED" && <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "RESPONDED")}>Mark Responded</Button>}
                {m.status !== "ARCHIVED" && <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "ARCHIVED")}>Archive</Button>}
                <Button size="sm" variant="ghost" onClick={() => remove("contactMessage", m.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Page Content Tab (with WYSIWYG) ---
function PageContentTab({ settings, save, saving }: any) {
  const pageKeys = ["about", "contact", "how-it-works", "pricing", "escrow-policy", "terms", "privacy", "verification", "support"];
  const [selectedPage, setSelectedPage] = useState("about");
  const [sectionKey, setSectionKey] = useState("hero");
  const [content, setContent] = useState("");
  const [useHtml, setUseHtml] = useState(true);

  const pageContentSettings = settings.filter((s: any) => s.key.startsWith("page."));
  const currentSetting = pageContentSettings.find((s: any) => s.key === `page.${selectedPage}.${sectionKey}`);

  useEffect(() => {
    if (currentSetting) {
      try {
        const parsed = JSON.parse(currentSetting.value);
        // If it's an object, stringify it; if it's a string (HTML), use directly
        if (typeof parsed === "string") {
          setContent(parsed);
          setUseHtml(true);
        } else {
          setContent(JSON.stringify(parsed, null, 2));
          setUseHtml(false);
        }
      } catch {
        setContent(currentSetting.value);
        setUseHtml(true);
      }
    } else {
      setContent("");
    }
  }, [selectedPage, sectionKey, currentSetting]);

  async function handleSave() {
    let parsed;
    if (useHtml) {
      // Save HTML as a string
      parsed = content;
    } else {
      try { parsed = JSON.parse(content); }
      catch { parsed = content; }
    }
    await save("pageContent", undefined, { pageKey: selectedPage, sectionKey, content: parsed });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-gray-500 mb-3">Edit content for each marketing page. Use the WYSIWYG editor for rich HTML content, or toggle to JSON for structured data.</p>
          <div className="flex gap-2 flex-wrap mb-4">
            {pageKeys.map((k) => (
              <Button key={k} variant={selectedPage === k ? "default" : "outline"} size="sm"
                onClick={() => setSelectedPage(k)} className={selectedPage === k ? "bg-[#1a3a2f]" : ""}>
                {k.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 items-center mb-3">
            <Input placeholder="Section key (e.g. hero, stats, story, values, cta)" value={sectionKey} onChange={(e) => setSectionKey(e.target.value)} className="flex-1" />
            <div className="flex gap-1 border rounded-lg p-0.5">
              <button
                onClick={() => setUseHtml(true)}
                className={`px-3 py-1 text-xs rounded ${useHtml ? "bg-[#1a3a2f] text-white" : "text-gray-600"}`}
              >
                WYSIWYG
              </button>
              <button
                onClick={() => setUseHtml(false)}
                className={`px-3 py-1 text-xs rounded ${!useHtml ? "bg-[#1a3a2f] text-white" : "text-gray-600"}`}
              >
                JSON
              </button>
            </div>
          </div>
          {useHtml ? (
            <WysiwygEditor
              value={content}
              onChange={setContent}
              placeholder="Write your page content here..."
              minHeight={300}
            />
          ) : (
            <Textarea
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`{\n  "title": "...",\n  "subtitle": "..."\n}`}
              className="font-mono text-sm"
            />
          )}
          <Button onClick={handleSave} disabled={saving || !content} className="mt-3 gap-2 bg-[#1a3a2f]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Page Content
          </Button>
        </CardContent>
      </Card>

      {/* Existing sections */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Existing sections for {selectedPage}:</p>
        {pageContentSettings.filter((s: any) => s.key.startsWith(`page.${selectedPage}.`)).map((s: any) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between py-2">
              <p className="text-xs font-mono text-gray-600">{s.key.replace(`page.${selectedPage}.`, "")}</p>
              <Button size="sm" variant="ghost" onClick={() => setSectionKey(s.key.replace(`page.${selectedPage}.`, ""))}>
                Load
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
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
