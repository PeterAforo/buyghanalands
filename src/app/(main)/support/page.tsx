import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  MessageCircle, 
  FileText, 
  Shield, 
  CreditCard, 
  Users,
  ChevronRight,
  Mail,
  Phone,
  Search
} from "lucide-react";

export const metadata: Metadata = {
  title: "Support Center | Buy Ghana Lands",
  description: "Get help with your land transactions, account issues, and more. Browse FAQs or contact our support team.",
};

const supportCategories = [
  {
    title: "Getting Started",
    description: "Learn how to create an account, browse listings, and make your first purchase.",
    icon: HelpCircle,
    href: "/support/getting-started",
  },
  {
    title: "Buying Land",
    description: "Everything you need to know about purchasing land on our platform.",
    icon: Search,
    href: "/support/buying",
  },
  {
    title: "Selling Land",
    description: "How to list your land, set prices, and manage inquiries.",
    icon: FileText,
    href: "/support/selling",
  },
  {
    title: "Verification & Documents",
    description: "Understanding our verification process and required documents.",
    icon: Shield,
    href: "/support/verification",
  },
  {
    title: "Payments & Escrow",
    description: "How our secure payment and escrow system works.",
    icon: CreditCard,
    href: "/support/payments",
  },
  {
    title: "Account & Profile",
    description: "Managing your account settings, KYC, and profile information.",
    icon: Users,
    href: "/support/account",
  },
];

const faqs = [
  {
    question: "How does the escrow system work?",
    answer: "Our escrow system holds the buyer's payment securely until all conditions of the sale are met. Once the buyer confirms receipt of all documents and is satisfied, the funds are released to the seller.",
  },
  {
    question: "What documents do I need to sell land?",
    answer: "You'll need proof of ownership (land title, deed, or allocation letter), site plan, and valid identification. Additional documents may be required depending on the land type and location.",
  },
  {
    question: "How long does verification take?",
    answer: "Basic verification takes 24-48 hours. Full verification with Lands Commission checks can take 5-10 business days depending on the region.",
  },
  {
    question: "Can I buy land from abroad?",
    answer: "Yes! Our platform is designed to be diaspora-friendly. You can browse, verify, and purchase land from anywhere in the world with our secure online process.",
  },
  {
    question: "What fees does Buy Ghana Lands charge?",
    answer: "We charge a small transaction fee on successful sales. Listing is free. See our pricing page for detailed fee information.",
  },
  {
    question: "How do I report a suspicious listing?",
    answer: "Click the 'Report' button on any listing page, or contact our support team directly. We take fraud prevention seriously and investigate all reports.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-emerald-900 py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-emerald-700" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            How can we help you?
          </h1>
          <p className="mt-4 text-xl text-emerald-100 max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team.
          </p>
          
          {/* Search Box */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white shadow-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Support Categories */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse by Topic</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {supportCategories.map((category) => (
            <Card key={category.title} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                  <category.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {category.title}
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg p-6 hover:border-emerald-300 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-emerald-50 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Still need help?</h2>
            <p className="mt-2 text-gray-600">Our support team is here to assist you.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600 mb-4">Chat with our support team in real-time.</p>
              <Button variant="outline" className="w-full">Start Chat</Button>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-sm text-gray-600 mb-4">Get a response within 24 hours.</p>
              <Link href="mailto:support@buyghanalands.com">
                <Button variant="outline" className="w-full">Send Email</Button>
              </Link>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-sm text-gray-600 mb-4">Mon-Fri, 9am-5pm GMT</p>
              <Link href="tel:+233000000000">
                <Button variant="outline" className="w-full">Call Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
