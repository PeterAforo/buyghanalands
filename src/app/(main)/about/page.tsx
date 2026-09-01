import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PageHero, Eyebrow } from "@/components/marketing/page-hero";
import { ArrowRight } from "lucide-react";
import { getPageContent } from "@/lib/cms";
import { getIcon } from "@/lib/icon-map";

export const metadata: Metadata = {
  title: "About Us | Buy Ghana Lands",
  description:
    "Learn about Buy Ghana Lands — Ghana's trusted platform for secure, transparent, fraud-free land transactions.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const content = await getPageContent("about");

  const hero = content.hero || {};
  const stats = content.stats || [];
  const story = content.story || {};
  const values = content.values || [];
  const cta = content.cta || {};

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      <PageHero
        image={hero.image || "/images/african-nature-scenery-with-road-trees.jpg"}
        eyebrow={hero.eyebrow || "Our story"}
        title={
          hero.title ? (
            <span dangerouslySetInnerHTML={{ __html: hero.title }} />
          ) : (
            <>
              Building trust into
              <br />
              <span className="italic text-amber-300">every land deal</span>
            </>
          )
        }
        subtitle={hero.subtitle || ""}
      />

      {/* Stats band */}
      {stats.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat: any, index: number) => (
                <div key={index} className="text-center">
                  <p className="font-display text-4xl font-semibold text-emerald-700 lg:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Story */}
      {story.heading && (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                {story.image ? (
                  <Image
                    src={story.image}
                    alt={story.heading}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-emerald-100" />
                )}
              </div>
              <div>
                <Eyebrow tone="green">{story.eyebrow || "Why we exist"}</Eyebrow>
                <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                  {story.heading}
                </h2>
                {(story.paragraphs || []).map((para: string, i: number) => (
                  <p key={i} className="mt-5 text-lg leading-relaxed text-gray-600">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Values */}
      {values.length > 0 && (
        <section className="bg-emerald-950/[0.03] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-14 text-center">
              <div className="flex justify-center">
                <Eyebrow tone="green">What drives us</Eyebrow>
              </div>
              <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                Our values
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {values.map((value: any, index: number) => {
                const Icon = getIcon(value.icon || "Target");
                return (
                  <div
                    key={index}
                    className="rounded-3xl border border-emerald-950/10 bg-white p-8 transition-all hover:shadow-lg"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-display mt-5 text-xl font-semibold text-emerald-950">
                      {value.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{value.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {cta.heading && (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem]">
              {cta.image && (
                <Image
                  src={cta.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/85 to-emerald-950/55" />
              <div className="relative z-10 px-8 py-16 md:px-16 md:py-24">
                <div className="max-w-2xl">
                  <Eyebrow>Your land, secured</Eyebrow>
                  <h2 className="font-display mt-5 text-3xl font-semibold leading-tight text-white text-shadow-soft sm:text-4xl lg:text-5xl">
                    {cta.heading}
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-emerald-50/90 text-shadow-soft">
                    {cta.text}
                  </p>
                  <div className="mt-9">
                    <Link href="/auth/register">
                      <Button
                        size="lg"
                        className="h-13 gap-2 rounded-xl bg-amber-400 px-8 font-semibold text-emerald-950 hover:bg-amber-300"
                      >
                        Get started free
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
