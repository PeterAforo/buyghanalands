import { Metadata } from "next";
import { getPageContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Privacy Policy | Buy Ghana Lands",
  description: "Read our privacy policy to understand how we collect, use, and protect your information on Buy Ghana Lands.",
};

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const content = await getPageContent("privacy");
  const meta = content.meta || {};
  const sections = content.sections || [];

  return (
    <div className="min-h-screen bg-[#faf8f2] py-12 lg:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-emerald-950/10 bg-white p-8 shadow-sm lg:p-12">
          <h1 className="font-display text-3xl font-semibold text-emerald-950 sm:text-4xl">
            {meta.title || "Privacy Policy"}
          </h1>
          {meta.lastUpdated && (
            <p className="mt-2 text-sm text-gray-500">Last updated: {meta.lastUpdated}</p>
          )}

          {sections.length === 0 ? (
            <p className="mt-8 text-gray-600">No privacy content available yet.</p>
          ) : (
            <div className="mt-8 space-y-8">
              {sections.map((section: any, index: number) => (
                <div key={index}>
                  <h2 className="font-display text-xl font-semibold text-emerald-950">
                    {section.heading}
                  </h2>
                  <p className="mt-3 leading-relaxed text-gray-600">{section.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
