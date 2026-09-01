import { Metadata } from "next";
import Link from "next/link";
import { PageHero, Eyebrow } from "@/components/marketing/page-hero";
import { SupportFaq } from "@/components/marketing/support-faq";
import {
  HelpCircle,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";
import { getIcon } from "@/lib/icon-map";

export const metadata: Metadata = {
  title: "Support Center | Buy Ghana Lands",
  description:
    "Find answers, browse help categories, and reach out to our support team for help with buying, selling, and verifying land in Ghana.",
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const [dbCategories, dbFaqs, contactOptionsSetting] = await withDbRetry(() =>
    Promise.all([
      prisma.supportCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.faqItem.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.siteSetting.findUnique({
        where: { key: "page.support.contactOptions" },
      }),
    ])
  );

  const categories = serializeForJson(dbCategories).map((c: any) => ({
    icon: c.icon || "HelpCircle",
    title: c.title,
    description: c.description || "",
    href: c.href || `/support/${c.slug}`,
  }));

  const faqs = serializeForJson(dbFaqs).map((f: any) => ({
    question: f.question,
    answer: f.answer,
  }));

  let contactOptions: any[] = [];
  if (contactOptionsSetting) {
    try {
      contactOptions = JSON.parse(contactOptionsSetting.value);
    } catch {
      contactOptions = [];
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      <PageHero
        image="/images/african-nature-scenery-with-road-trees.jpg"
        eyebrow="Support center"
        title={
          <>
            How can we
            <br />
            <span className="italic text-amber-300">help you today?</span>
          </>
        }
        subtitle="Find quick answers, explore help topics, or reach out to our team — we're here to make your land journey smooth."
      />

      {/* Categories */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <Eyebrow tone="green">Browse by topic</Eyebrow>
            <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
              Help categories
            </h2>
            <p className="mt-3 text-gray-600">
              Pick a category to dive into detailed guides and step-by-step instructions.
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No support categories yet</h3>
              <p className="mt-2 text-gray-600">Support categories will appear here once configured.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(({ icon, title, description, href }) => {
                const Icon = getIcon(icon);
                return (
                  <Link
                    key={title}
                    href={href}
                    className="group flex flex-col rounded-3xl border border-emerald-950/10 bg-white p-7 transition-all hover:-translate-y-1 hover:border-emerald-600/40 hover:shadow-xl"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-700 group-hover:text-amber-300">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-display mt-5 text-xl font-semibold text-emerald-950">
                      {title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                      {description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                      Explore
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-emerald-950/[0.03] py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="flex justify-center">
              <Eyebrow tone="green">Quick answers</Eyebrow>
            </div>
            <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-gray-600">
              Search our most common questions — chances are your answer is here.
            </p>
          </div>
          {faqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No FAQs available yet</h3>
              <p className="mt-2 text-gray-600">Frequently asked questions will appear here once configured.</p>
            </div>
          ) : (
            <SupportFaq faqs={faqs} />
          )}
        </div>
      </section>

      {/* Contact options */}
      {contactOptions.length > 0 && (
        <section className="py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <div className="flex justify-center">
                <Eyebrow tone="green">Still need help?</Eyebrow>
              </div>
              <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                Talk to our team
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-gray-600">
                Our support specialists are ready to help with anything you need.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {contactOptions.map(({ icon, title, description, action, href }: any) => {
                const Icon = getIcon(icon || "MessageSquare");
                const inner = (
                  <div className="group flex flex-col items-center rounded-3xl border border-emerald-950/10 bg-white p-8 text-center transition-all hover:-translate-y-1 hover:border-emerald-600/40 hover:shadow-xl">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-700 group-hover:text-amber-300">
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-display mt-5 text-xl font-semibold text-emerald-950">
                      {title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm text-gray-600">{description}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 font-medium text-emerald-700">
                      {action}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                );
                return href && href !== "#" ? (
                  <Link key={title} href={href}>{inner}</Link>
                ) : (
                  <div key={title}>{inner}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
