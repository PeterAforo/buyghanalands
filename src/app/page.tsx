import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  MapPin,
  CheckCircle,
  Users,
  FileCheck,
  Banknote,
  ArrowRight,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Listings",
    description:
      "Every listing goes through our verification process. Get peace of mind with platform-reviewed and Lands Commission verified properties.",
  },
  {
    icon: Banknote,
    title: "Protected Payments",
    description:
      "Your money is held securely until all conditions are met. Our escrow-style protection ensures safe transactions.",
  },
  {
    icon: FileCheck,
    title: "Document Vault",
    description:
      "Secure storage for all transaction documents. Access indentures, site plans, and certificates anytime.",
  },
  {
    icon: Users,
    title: "Professional Network",
    description:
      "Connect with verified surveyors, lawyers, and architects. Get expert help for your land purchase.",
  },
];

const stats = [
  { value: "1,000+", label: "Verified Listings" },
  { value: "GH₵50M+", label: "Transactions Protected" },
  { value: "500+", label: "Happy Buyers" },
  { value: "98%", label: "Success Rate" },
];

const testimonials = [
  {
    name: "Kwame Asante",
    role: "Diaspora Buyer, UK",
    content:
      "Finally, a platform I can trust to buy land in Ghana from abroad. The verification process gave me confidence.",
    rating: 5,
  },
  {
    name: "Ama Serwaa",
    role: "Property Developer",
    content:
      "The escrow protection and professional network have transformed how I do business. Highly recommended!",
    rating: 5,
  },
  {
    name: "Kofi Mensah",
    role: "First-time Buyer",
    content:
      "I was scared of land fraud, but Buy Ghana Lands made the process transparent and secure.",
    rating: 5,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Buy Land in Ghana with{" "}
              <span className="text-emerald-400">Confidence</span>
            </h1>
            <p className="mt-6 text-lg text-emerald-100 sm:text-xl">
              Ghana&apos;s trusted platform for secure land transactions. Verified
              listings, protected payments, and professional services — whether
              you&apos;re in Accra or abroad.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/listings">
                <Button size="lg" className="w-full sm:w-auto bg-white text-emerald-900 hover:bg-emerald-50">
                  Browse Listings
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/listings/create">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white text-white hover:bg-white/10"
                >
                  List Your Land
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Verified Sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Escrow Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Diaspora Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-emerald-600">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Why Choose Buy Ghana Lands?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              We&apos;ve built the most trusted platform for land transactions in
              Ghana, with features designed to protect both buyers and sellers.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Simple, secure, and transparent land transactions
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600">
                1
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Find Your Land
              </h3>
              <p className="mt-2 text-gray-600">
                Browse verified listings with detailed information, photos, and
                location maps. Filter by region, price, and verification status.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600">
                2
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Make an Offer
              </h3>
              <p className="mt-2 text-gray-600">
                Negotiate directly with sellers. Once agreed, your payment is
                protected in escrow until all conditions are met.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600">
                3
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">
                Complete Securely
              </h3>
              <p className="mt-2 text-gray-600">
                Verify documents, complete due diligence, and finalize the
                transaction. Funds are released only when you&apos;re satisfied.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-emerald-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Trusted by Ghanaians Worldwide
            </h2>
            <p className="mt-4 text-lg text-emerald-200">
              See what our customers are saying
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mt-4 text-gray-600">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="mt-6">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to Find Your Land?
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of Ghanaians who trust Buy Ghana Lands for secure
            property transactions.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
