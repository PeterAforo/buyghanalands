import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PageHero, Eyebrow } from "@/components/marketing/page-hero";
import {
  MapPin,
  Shield,
  Users,
  Target,
  BadgeCheck,
  Handshake,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Buy Ghana Lands",
  description:
    "Learn about Buy Ghana Lands — Ghana's trusted platform for secure, transparent, fraud-free land transactions.",
};

const values = [
  {
    icon: Target,
    title: "Our Mission",
    body: "To eliminate land fraud and make property transactions in Ghana safe, transparent, and accessible to everyone — at home and in the diaspora.",
  },
  {
    icon: Shield,
    title: "Our Promise",
    body: "Every transaction is protected by our escrow system, and every listing can be verified by licensed professionals before money changes hands.",
  },
  {
    icon: Users,
    title: "Our Team",
    body: "A dedicated team of technology and real-estate professionals committed to transforming Ghana's property market for good.",
  },
  {
    icon: MapPin,
    title: "Our Reach",
    body: "Operating across all 16 regions of Ghana, connecting verified buyers and sellers nationwide with confidence.",
  },
];

const stats = [
  { value: "1,000+", label: "Verified listings" },
  { value: "500+", label: "Trusted sellers" },
  { value: "₵50M+", label: "Transacted safely" },
  { value: "16", label: "Regions covered" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf8f2]">
      <PageHero
        image="/images/african-nature-scenery-with-road-trees.jpg"
        eyebrow="Our story"
        title={
          <>
            Building trust into
            <br />
            every <span className="italic text-amber-300">land deal</span>
          </>
        }
        subtitle="Buy Ghana Lands brings transparency, security and trust to land transactions — connecting buyers with verified sellers through escrow protection and professional verification."
      />

      {/* Stats band */}
      <section className="border-b border-emerald-950/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-semibold text-emerald-700 lg:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story with image */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative order-last aspect-[4/3] overflow-hidden rounded-3xl lg:order-first">
              <Image
                src="/images/african-american-woman-looking-map.jpg"
                alt="Reviewing land documents"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <BadgeCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-950">Verified from day one</p>
                    <p className="text-sm text-gray-500">Documents and sellers checked before listing</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Eyebrow tone="green">Why we exist</Eyebrow>
              <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                Land ownership should never be a gamble
              </h2>
              <div className="mt-5 space-y-4 text-lg leading-relaxed text-gray-600">
                <p>
                  For too many Ghanaians — especially those buying from abroad — acquiring land
                  has meant navigating double sales, forged documents and costly litigation.
                </p>
                <p>
                  We built Buy Ghana Lands to change that. By combining verified listings,
                  a network of licensed professionals, and escrow-protected payments, we make
                  it possible to buy land with total peace of mind.
                </p>
              </div>
              <Link href="/listings" className="mt-8 inline-block">
                <Button className="h-12 gap-2 rounded-xl bg-emerald-700 px-6 font-semibold text-white hover:bg-emerald-800">
                  Explore listings
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values grid */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <Eyebrow tone="green">What drives us</Eyebrow>
            <h2 className="font-display mx-auto mt-4 max-w-2xl text-3xl font-semibold text-emerald-950 sm:text-4xl">
              The principles behind the platform
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-3xl border border-emerald-950/10 bg-[#faf8f2] p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display mt-5 text-lg font-semibold text-emerald-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem]">
            <Image
              src="/images/cheerful-woman-with-laptop-grass.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50" />
            <div className="relative z-10 px-8 py-16 text-center md:px-16 md:py-20">
              <Handshake className="mx-auto h-10 w-10 text-amber-300" />
              <h2 className="font-display mx-auto mt-5 max-w-2xl text-3xl font-semibold text-white text-shadow-soft sm:text-4xl">
                Ready to buy land the safe way?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85 text-shadow-soft">
                Join thousands of buyers using verified listings and escrow protection across Ghana.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/auth/register">
                  <Button className="h-13 w-full gap-2 rounded-xl bg-amber-400 px-8 font-semibold text-emerald-950 hover:bg-amber-300 sm:w-auto">
                    Get started free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    className="h-13 w-full rounded-xl border-2 border-white/40 bg-white/5 px-8 font-semibold text-white backdrop-blur-sm hover:bg-white/15 sm:w-auto"
                  >
                    Contact us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
