"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import {
  useCmsData,
  CmsLoader,
  SectionHeader,
  CMS_SECTIONS,
  NewsTab,
  FaqsTab,
  SupportCategoriesTab,
  HomepageStatsTab,
  PageContentTab,
  SiteSettingsTab,
  SimpleListTab,
  RegionsTab,
  HeroContentTab,
  FooterContentTab,
  ContactMessagesTab,
} from "@/components/admin/cms-sections";

export default function CmsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  const { data, loading, saving, editing, setEditing, save, remove } = useCmsData();

  const sectionInfo = CMS_SECTIONS.find((s) => s.slug === section);
  if (!sectionInfo) notFound();

  if (loading) return <CmsLoader />;

  const Icon = sectionInfo.icon;
  const d = data!;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <a href="/admin/cms" className="text-gray-400 hover:text-gray-600">CMS</a>
        <span className="text-gray-400">/</span>
        <span className="font-medium text-[#1a3a2f] flex items-center gap-1.5">
          <Icon className="h-4 w-4" />
          {sectionInfo.label}
        </span>
      </div>

      <SectionHeader title={sectionInfo.label} description="Manage content for this section" />

      {section === "news" && <NewsTab articles={d.newsArticles} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {section === "faqs" && <FaqsTab items={d.faqItems} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {section === "support-categories" && <SupportCategoriesTab categories={d.supportCategories} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {section === "stats" && <HomepageStatsTab stats={d.homepageStats} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {section === "page-content" && <PageContentTab settings={d.siteSettings} save={save} saving={saving} />}
      {section === "site-settings" && <SiteSettingsTab settings={d.siteSettings} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {section === "testimonials" && <SimpleListTab items={d.testimonials} entityType="testimonial" editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} fields={[["name", "Name"], ["role", "Role"], ["country", "Country"], ["quote", "Quote", "textarea"], ["rating", "Rating (1-5)", "number"], ["sortOrder", "Sort Order", "number"], ["isActive", "Active", "checkbox"]]} titleField="name" subtitleField="role" />}
      {section === "steps" && <SimpleListTab items={d.homepageSteps} entityType="homepageStep" editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} fields={[["icon", "Icon (lucide name)"], ["title", "Title"], ["description", "Description", "textarea"], ["sortOrder", "Sort Order", "number"], ["isActive", "Active", "checkbox"]]} titleField="title" subtitleField="description" />}
      {section === "land-types" && <SimpleListTab items={d.homepageLandTypes} entityType="homepageLandType" editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} fields={[["type", "Type (e.g. RESIDENTIAL)"], ["label", "Label"], ["icon", "Icon (lucide name)"], ["count", "Count", "number"], ["sortOrder", "Sort Order", "number"], ["isActive", "Active", "checkbox"]]} titleField="label" subtitleField="type" />}
      {section === "professionals" && <SimpleListTab items={d.homepageProfessionals} entityType="homepageProfessional" editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} fields={[["type", "Type (e.g. SURVEYOR)"], ["label", "Label"], ["icon", "Icon (lucide name)"], ["description", "Description"], ["sortOrder", "Sort Order", "number"], ["isActive", "Active", "checkbox"]]} titleField="label" subtitleField="description" />}
      {section === "regions" && <RegionsTab regions={d.homepageRegions} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {section === "trust-bar" && <SimpleListTab items={d.trustBarItems} entityType="trustBarItem" editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} fields={[["icon", "Icon (lucide name)"], ["label", "Label"], ["sortOrder", "Sort Order", "number"], ["isActive", "Active", "checkbox"]]} titleField="label" subtitleField="icon" />}
      {section === "hero" && <HeroContentTab heroContent={d.heroContent} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
      {section === "contact-messages" && <ContactMessagesTab messages={d.contactMessages} save={save} remove={remove} />}
      {section === "footer" && <FooterContentTab footerContent={d.footerContent} editing={editing} setEditing={setEditing} save={save} remove={remove} saving={saving} />}
    </div>
  );
}
