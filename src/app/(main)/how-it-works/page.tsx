import { Metadata } from "next";
import { PageHero, Eyebrow } from "@/components/marketing/page-hero";
import { getPageContent } from "@/lib/cms";
import { getIcon } from "@/lib/icon-map";

export const metadata: Metadata = {
  title: "How It Works | Buy Ghana Lands",
  description: "Learn how to find, verify, and securely purchase land in Ghana through Buy Ghana Lands.",
};

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const content = await getPageContent("how-it-works");
  const hero = content.hero || {};
  const steps = content.steps || [];

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      <PageHero
        image="/images/african-nature-scenery-with-road-trees.jpg"
        eyebrow="A safer path to ownership"
        title={hero.title || "How It Works"}
        subtitle={hero.subtitle || "A simple, secure process for buying land in Ghana"}
      />

      {steps.length === 0 ? (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">No content available yet</h2>
            <p className="mt-2 text-gray-600">Steps will appear here once configured.</p>
          </div>
        </section>
      ) : (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step: any, index: number) => {
                const Icon = getIcon(step.icon || "Search");
                return (
                  <div key={index} className="relative">
                    <div className="rounded-3xl border border-emerald-950/10 bg-white p-8 transition-all hover:shadow-lg">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className="font-display mt-4 block text-5xl font-semibold text-emerald-100">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      <h3 className="font-display mt-2 text-xl font-semibold text-emerald-950">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-gray-600">
                        {step.description}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 z-10 h-8 w-8 -translate-y-1/2 rounded-full border border-emerald-950/10 bg-white" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
