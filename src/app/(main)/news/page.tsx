import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "News & Updates | Buy Ghana Lands",
  description: "Stay updated with the latest news, market insights, and updates from Buy Ghana Lands.",
};

const newsArticles = [
  {
    id: 1,
    title: "New Verification Partnership with Ghana Lands Commission",
    excerpt: "We're excited to announce our official partnership with the Ghana Lands Commission to provide faster and more reliable land verification services.",
    date: "2026-01-20",
    category: "Partnership",
    readTime: "3 min read",
  },
  {
    id: 2,
    title: "Land Prices in Greater Accra: 2026 Market Report",
    excerpt: "Our comprehensive analysis of land prices across Greater Accra reveals interesting trends for buyers and investors.",
    date: "2026-01-15",
    category: "Market Insights",
    readTime: "5 min read",
  },
  {
    id: 3,
    title: "How to Avoid Land Fraud: A Complete Guide",
    excerpt: "Learn the essential steps to protect yourself from land fraud when buying property in Ghana.",
    date: "2026-01-10",
    category: "Guide",
    readTime: "7 min read",
  },
  {
    id: 4,
    title: "Escrow Protection Now Available for All Transactions",
    excerpt: "We've expanded our escrow protection service to cover all land transactions on our platform.",
    date: "2026-01-05",
    category: "Product Update",
    readTime: "2 min read",
  },
  {
    id: 5,
    title: "Top 5 Regions for Land Investment in 2026",
    excerpt: "Discover which regions in Ghana offer the best opportunities for land investment this year.",
    date: "2025-12-28",
    category: "Market Insights",
    readTime: "6 min read",
  },
  {
    id: 6,
    title: "Understanding Customary Land Tenure in Ghana",
    excerpt: "A detailed explanation of customary land tenure and what it means for land buyers.",
    date: "2025-12-20",
    category: "Education",
    readTime: "8 min read",
  },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-emerald-900 py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-emerald-700" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            News & Updates
          </h1>
          <p className="mt-4 text-xl text-emerald-100 max-w-2xl">
            Stay informed with the latest news, market insights, and platform updates from Buy Ghana Lands.
          </p>
        </div>
      </div>

      {/* News Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {newsArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{article.category}</Badge>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.readTime}
                  </span>
                </div>
                <CardTitle className="text-lg leading-tight hover:text-emerald-600 transition-colors">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(article.date)}
                  </span>
                  <span className="text-emerald-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                    Read more
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-12 text-center">
          <p className="text-gray-500">
            More articles coming soon. Subscribe to our newsletter to stay updated!
          </p>
        </div>
      </div>
    </div>
  );
}
