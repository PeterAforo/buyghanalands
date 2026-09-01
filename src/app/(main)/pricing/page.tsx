import { Metadata } from "next";
import { PageHero, Eyebrow } from "@/components/marketing/page-hero";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPageContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Pricing | Buy Ghana Lands",
  description: "Transparent fees for secure land transactions on Buy Ghana Lands.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const content = await getPageContent("pricing");
  const hero = content.hero || {};
  const plans = content.plans || [];
  const verification = content.verification || {};

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      <PageHero
        image="/images/african-nature-scenery-with-road-trees.jpg"
        eyebrow="Transparent pricing"
        title={hero.title || "Pricing"}
        subtitle={hero.subtitle || "Transparent fees for secure land transactions"}
      />

      {plans.length === 0 ? (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900">No pricing plans available yet</h2>
            <p className="mt-2 text-gray-600">Pricing plans will appear here once configured.</p>
          </div>
        </section>
      ) : (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              {plans.map((plan: any, index: number) => (
                <div
                  key={index}
                  className="rounded-3xl border border-emerald-950/10 bg-white p-8 shadow-md transition-all hover:shadow-xl lg:p-10"
                >
                  <h3 className="font-display text-2xl font-semibold text-emerald-950">
                    {plan.title}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-semibold text-emerald-700">
                      {plan.price}
                    </span>
                    {plan.unit && <span className="text-sm text-gray-500">{plan.unit}</span>}
                  </div>
                  <ul className="mt-8 space-y-3">
                    {(plan.features || []).map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
                          <Check className="h-4 w-4 text-emerald-700" />
                        </span>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/register" className="mt-8 block">
                    <Button
                      className="w-full rounded-xl bg-emerald-700 font-semibold text-white hover:bg-emerald-800"
                      size="lg"
                    >
                      Get started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            {verification.title && (
              <div className="mt-12 rounded-3xl bg-emerald-950 p-8 text-center lg:p-12">
                <h3 className="font-display text-2xl font-semibold text-white">
                  {verification.title}
                </h3>
                <p className="mx-auto mt-4 max-w-2xl text-emerald-50/85">
                  {verification.body}
                </p>
                {verification.contactNote && (
                  <p className="mt-4 text-sm text-amber-300">{verification.contactNote}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
