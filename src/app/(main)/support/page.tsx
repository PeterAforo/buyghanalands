import { Metadata } from "next";
import Link from "next/link";
import { PageHero, Eyebrow } from "@/components/marketing/page-hero";
import { SupportFaq } from "@/components/marketing/support-faq";
import {
  Rocket,
  ShoppingCart,
  Tag,
  ShieldCheck,
  CreditCard,
  UserCog,
  MessageSquare,
  Mail,
  Phone,
  ArrowRight,
  HelpCircle,
  FileCheck,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

export const metadata: Metadata = {
  title: "Support Center | Buy Ghana Lands",
  description:
    "Find answers, browse help categories, and reach out to our support team for help with buying, selling, and verifying land in Ghana.",
};

const iconMap: Record<string, React.ElementType> = {
  Rocket,
  ShoppingCart,
  Tag,
  ShieldCheck,
  CreditCard,
  UserCog,
  HelpCircle,
  FileCheck,
  AlertTriangle,
  MapPin,
};

const fallbackCategories = [
  {
    icon: "Rocket",
    title: "Getting Started",
    description: "Account setup, navigation, and your first listing.",
    href: "/support/getting-started",
  },
  {
    icon: "ShoppingCart",
    title: "Buying Land",
    description: "Browse, save, make offers, and complete purchases.",
    href: "/support/buying",
  },
  {
    icon: "Tag",
    title: "Selling Land",
    description: "List your land, manage offers, and receive payouts.",
    href: "/support/selling",
  },
  {
    icon: "ShieldCheck",
    title: "Verification",
    description: "Land verification, KYC, and document checks.",
    href: "/support/verification",
  },
  {
    icon: "CreditCard",
    title: "Payments & Escrow",
    description: "Payment methods, escrow protection, and refunds.",
    href: "/support/payments",
  },
  {
    icon: "UserCog",
    title: "Account & Security",
    description: "Profile, password, and account security settings.",
    href: "/support/account",
  },
];

const fallbackFaqs = [
  {
    question: "How do I create an account on Buy Ghana Lands?",
    answer:
      "Click the 'Sign Up' button in the top navigation, choose whether you're a buyer or seller, and fill in your details. You'll receive a verification email to activate your account. Once verified, you can browse listings, save favorites, and start transactions.",
  },
  {
    question: "How does land verification work?",
    answer:
      "Every listing on Buy Ghana Lands goes through a verification process. We cross-check land documents with the Ghana Lands Commission and perform site visits where required. Verified listings display a green verification badge. We also require KYC verification for all sellers before they can list property.",
  },
  {
    question: "What is escrow and how does it protect me?",
    answer:
      "Escrow is a secure holding service. When you buy land, your payment is held safely by Buy Ghana Lands and only released to the seller once both parties confirm the transaction is complete and the land documents have been transferred. This protects buyers from fraud and sellers from non-payment.",
  },
  {
    question: "Which payment methods are supported?",
    answer:
      "We support mobile money (MTN MoMo, Vodafone Cash, AirtelTigo Money), bank transfers, and major debit/credit cards. All payments are processed through secure, encrypted channels. Seller payouts are issued after escrow release, typically within 2–3 business days.",
  },
  {
    question: "Can I list my land for free?",
    answer:
      "Yes, creating an account and listing land is free. We charge a small service fee only when a transaction is successfully completed through our platform. This fee is clearly displayed before any payment is made.",
  },
  {
    question: "How long does the buying process take?",
    answer:
      "The timeline varies depending on verification, document preparation, and payment processing. On average, a verified land purchase completes within 7–14 days. Our team will guide you through each step and keep you updated throughout.",
  },
  {
    question: "What should I do if I suspect land fraud?",
    answer:
      "Stop all communication with the suspected party immediately and contact our support team at support@buyghanalands.com. Never make payments outside of our platform's escrow system. Our verification team will investigate and take appropriate action.",
  },
  {
    question: "How do I update my account information?",
    answer:
      "Log in to your account, click on your profile picture in the top right, and select 'Settings'. From there you can update your name, contact details, password, and KYC information. Some changes (such as KYC details) may require re-verification.",
  },
];

const contactOptions = [
  {
    icon: MessageSquare,
    title: "Live chat",
    description: "Chat with our team in real time during business hours.",
    action: "Start a chat",
    href: "#",
  },
  {
    icon: Mail,
    title: "Email support",
    description: "Send us a detailed message and we'll reply within 24 hours.",
    action: "support@buyghanalands.com",
    href: "mailto:support@buyghanalands.com",
  },
  {
    icon: Phone,
    title: "Call us",
    description: "Speak directly with a support representative.",
    action: "+233 30 000 0000",
    href: "tel:+233300000000",
  },
];

export default async function SupportPage() {
  let categories = fallbackCategories;
  let faqs: { question: string; answer: string }[] = fallbackFaqs;

  try {
    const [dbCategories, dbFaqs] = await Promise.all([
      withDbRetry(() =>
        prisma.supportCategory.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        })
      ),
      withDbRetry(() =>
        prisma.faqItem.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        })
      ),
    ]);

    if (dbCategories.length > 0) {
      categories = serializeForJson(dbCategories).map((c: any) => ({
        icon: c.icon || "HelpCircle",
        title: c.title,
        description: c.description || "",
        href: c.href || `/support/${c.slug}`,
      }));
    }
    if (dbFaqs.length > 0) {
      faqs = serializeForJson(dbFaqs).map((f: any) => ({
        question: f.question,
        answer: f.answer,
      }));
    }
  } catch {
    // Use fallback content if DB is unavailable
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

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(({ icon, title, description, href }) => {
              const Icon = iconMap[icon] || HelpCircle;
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
          <SupportFaq faqs={faqs} />
        </div>
      </section>

      {/* Contact options */}
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
            {contactOptions.map(({ icon: Icon, title, description, action, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex flex-col items-center rounded-3xl border border-emerald-950/10 bg-white p-8 text-center transition-all hover:-translate-y-1 hover:border-emerald-600/40 hover:shadow-xl"
              >
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
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
