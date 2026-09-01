import { Metadata } from "next";
import Link from "next/link";
import { PageHero, Eyebrow } from "@/components/marketing/page-hero";
import { ContactForm } from "@/components/marketing/contact-form";
import { MessageCircle } from "lucide-react";
import { getPageContent } from "@/lib/cms";
import { getIcon } from "@/lib/icon-map";

export const metadata: Metadata = {
  title: "Contact Us | Buy Ghana Lands",
  description:
    "Get in touch with Buy Ghana Lands. We're here to help with any questions about secure land transactions in Ghana.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const content = await getPageContent("contact");
  const hero = content.hero || {};
  const channels = content.channels || [];

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      <PageHero
        image={hero.image || "/images/cheerful-woman-with-laptop-grass.jpg"}
        eyebrow={hero.eyebrow || "We're here to help"}
        title={
          hero.title ? (
            <span dangerouslySetInnerHTML={{ __html: hero.title }} />
          ) : (
            <>
              Let&apos;s talk about
              <br />
              your <span className="italic text-amber-300">land journey</span>
            </>
          )
        }
        subtitle={hero.subtitle || ""}
      />

      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
            {/* Contact channels */}
            <div className="lg:col-span-2">
              <Eyebrow tone="green">Reach us</Eyebrow>
              <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950">
                Get in touch
              </h2>
              <p className="mt-3 text-gray-600">
                Pick whichever channel works best for you — we&apos;re quick to respond.
              </p>

              {channels.length === 0 ? (
                <p className="mt-8 text-gray-500">Contact channels will appear here once configured.</p>
              ) : (
                <div className="mt-8 space-y-4">
                  {channels.map((channel: any, index: number) => {
                    const Icon = getIcon(channel.icon || "Mail");
                    const inner = (
                      <div className="flex items-start gap-4 rounded-2xl border border-emerald-950/10 bg-white p-5 transition-all hover:border-emerald-600/40 hover:shadow-lg">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">{channel.title}</p>
                          <p className="font-semibold text-emerald-950">{channel.value}</p>
                          <p className="mt-0.5 text-sm text-gray-500">{channel.note}</p>
                        </div>
                      </div>
                    );
                    return channel.href ? (
                      <Link key={index} href={channel.href} className="block">
                        {inner}
                      </Link>
                    ) : (
                      <div key={index}>{inner}</div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-700 p-5 text-white">
                <MessageCircle className="h-6 w-6 flex-shrink-0 text-amber-300" />
                <div>
                  <p className="font-semibold">Prefer instant answers?</p>
                  <p className="text-sm text-emerald-100">
                    Browse our{" "}
                    <Link href="/support" className="font-medium text-amber-300 underline">
                      Support Center
                    </Link>{" "}
                    for common questions.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              <Eyebrow tone="green">Send a message</Eyebrow>
              <h2 className="font-display mb-6 mt-4 text-3xl font-semibold text-emerald-950">
                Drop us a line
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
