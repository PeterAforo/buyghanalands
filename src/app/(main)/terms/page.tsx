import { Metadata } from "next";
import { getPageContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Terms of Service | Buy Ghana Lands",
  description: "Read the terms of service for using Buy Ghana Lands platform for land transactions in Ghana.",
};

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const content = await getPageContent("terms");
  const meta = content.meta || {};
  const sections = content.sections || [];

  return (
    <div className="min-h-screen bg-[#faf8f2] py-12 lg:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-emerald-950/10 bg-white p-8 shadow-sm lg:p-12">
          <h1 className="font-display text-3xl font-semibold text-emerald-950 sm:text-4xl">
            {meta.title || "Terms of Service"}
          </h1>
          {meta.lastUpdated && (
            <p className="mt-2 text-sm text-gray-500">Last updated: {meta.lastUpdated}</p>
          )}

          {sections.length === 0 ? (
            <p className="mt-8 text-gray-600">No terms content available yet.</p>
          ) : (
            <div className="mt-8 space-y-8">
              {sections.map((section: any, index: number) => (
                <div key={index}>
                  <h2 className="font-display text-xl font-semibold text-emerald-950">
                    {section.heading}
                  </h2>
                  <p className="mt-3 leading-relaxed text-gray-600">{section.body}</p>
                  {section.listItems && section.listItems.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {section.listItems.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600">
                          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
