import { Metadata } from "next";
import { PageHero, Eyebrow } from "@/components/marketing/page-hero";
import { getPageContent } from "@/lib/cms";
import { getIcon } from "@/lib/icon-map";

export const metadata: Metadata = {
  title: "Escrow Policy | Buy Ghana Lands",
  description: "Learn how our escrow service protects your money during land transactions on Buy Ghana Lands.",
};

export const dynamic = "force-dynamic";

export default async function EscrowPolicyPage() {
  const content = await getPageContent("escrow-policy");
  const hero = content.hero || {};
  const features = content.features || [];
  const process = content.process || [];

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      <PageHero
        image="/images/african-nature-scenery-with-road-trees.jpg"
        eyebrow="Your money, protected"
        title={hero.title || "Escrow Policy"}
        subtitle={hero.subtitle || "How we protect your money during land transactions"}
      />

      {/* Features */}
      {features.length > 0 && (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature: any, index: number) => {
                const Icon = getIcon(feature.icon || "Shield");
                return (
                  <div
                    key={index}
                    className="rounded-3xl border border-emerald-950/10 bg-white p-8 transition-all hover:shadow-lg"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-display mt-5 text-lg font-semibold text-emerald-950">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{feature.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Process */}
      {process.length > 0 && (
        <section className="bg-emerald-950/[0.03] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-14 text-center">
              <div className="flex justify-center">
                <Eyebrow tone="green">Step by step</Eyebrow>
              </div>
              <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                How escrow works
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-4">
              {process.map((step: any, index: number) => (
                <div key={index} className="relative">
                  <div className="rounded-3xl border border-emerald-950/10 bg-white p-8">
                    <span className="font-display text-5xl font-semibold text-emerald-100">
                      {step.number}
                    </span>
                    <h3 className="font-display mt-3 text-lg font-semibold text-emerald-950">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
