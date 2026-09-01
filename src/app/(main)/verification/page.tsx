import { Metadata } from "next";
import { PageHero, Eyebrow } from "@/components/marketing/page-hero";
import { getPageContent } from "@/lib/cms";
import { getIcon } from "@/lib/icon-map";

export const metadata: Metadata = {
  title: "Verification | Buy Ghana Lands",
  description: "Professional land verification services to ensure your land purchase is secure in Ghana.",
};

export const dynamic = "force-dynamic";

const levelColors: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700",
  yellow: "bg-yellow-100 text-yellow-700",
  blue: "bg-blue-100 text-blue-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

export default async function VerificationPage() {
  const content = await getPageContent("verification");
  const hero = content.hero || {};
  const services = content.services || [];
  const levels = content.levels || [];

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      <PageHero
        image="/images/african-nature-scenery-with-road-trees.jpg"
        eyebrow="Trust, verified"
        title={hero.title || "Land Verification"}
        subtitle={hero.subtitle || "Professional verification services to ensure your land purchase is secure"}
      />

      {/* Services */}
      {services.length > 0 && (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service: any, index: number) => {
                const Icon = getIcon(service.icon || "FileCheck");
                return (
                  <div
                    key={index}
                    className="rounded-3xl border border-emerald-950/10 bg-white p-8 transition-all hover:shadow-lg"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-display mt-5 text-lg font-semibold text-emerald-950">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{service.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Verification Levels */}
      {levels.length > 0 && (
        <section className="bg-emerald-950/[0.03] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-14 text-center">
              <div className="flex justify-center">
                <Eyebrow tone="green">Trust levels</Eyebrow>
              </div>
              <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                Verification levels
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {levels.map((level: any, index: number) => (
                <div
                  key={index}
                  className="rounded-3xl border border-emerald-950/10 bg-white p-8"
                >
                  <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${levelColors[level.color] || levelColors.gray}`}>
                    Level {level.level}
                  </div>
                  <h3 className="font-display mt-4 text-lg font-semibold text-emerald-950">
                    {level.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {level.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
