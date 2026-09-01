"use client";

import Link from "next/link";
import { CMS_SECTIONS } from "@/components/admin/cms-sections";

export default function CmsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Website CMS</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage all page content, news, FAQs, and site settings. Select a section below or from the sidebar dropdown.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CMS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.slug}
              href={`/admin/cms/${section.slug}`}
              className="group flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-[#1a3a2f] hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1a3a2f]/5 group-hover:bg-[#c5e063] flex items-center justify-center transition-colors">
                <Icon className="h-6 w-6 text-[#1a3a2f]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 group-hover:text-[#1a3a2f]">
                  {section.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Manage {section.label.toLowerCase()}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
