import { Metadata } from "next";
import Image from "next/image";
import { PageHero, Eyebrow } from "@/components/marketing/page-hero";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { Calendar, ArrowRight, Clock, ArrowUpRight, FileText } from "lucide-react";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

export const metadata: Metadata = {
  title: "News & Updates | Buy Ghana Lands",
  description:
    "Stay updated with the latest news, market insights, and updates from Buy Ghana Lands.",
};

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function NewsPage() {
  const dbArticles = await withDbRetry(() =>
    prisma.newsArticle.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 12,
    })
  );

  const articles = serializeForJson(dbArticles).map((a: any) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt || "",
    publishedAt: new Date(a.publishedAt || a.createdAt),
    category: a.category,
    readTime: a.readTime,
    coverImage: a.coverImage || null,
    isFeatured: a.isFeatured,
  }));

  const featured = articles.find((a: any) => a.isFeatured) || articles[0];
  const rest = featured ? articles.filter((a: any) => a.id !== featured.id) : [];

  return (
    <div className="min-h-screen bg-[#faf8f2]">
      <PageHero
        image="/images/nature-moldova-vale-with-flowing-river-slopes-with-sparse-vegetation.jpg"
        eyebrow="News & insights"
        title={
          <>
            Stories from Ghana&apos;s
            <br />
            <span className="italic text-amber-300">land market</span>
          </>
        }
        subtitle="Market reports, buyer guides, and platform updates to help you make smarter land decisions."
      />

      {articles.length === 0 ? (
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-2xl font-semibold text-emerald-950">No articles published yet</h2>
            <p className="mt-2 text-gray-600">Check back soon for the latest news and insights.</p>
          </div>
        </section>
      ) : (
        <>
          {/* Featured article */}
          {featured && (
            <section className="py-16 lg:py-20">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="group grid cursor-pointer overflow-hidden rounded-3xl bg-white shadow-md transition-all hover:shadow-2xl lg:grid-cols-2">
                  <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto">
                    {featured.coverImage ? (
                      <Image
                        src={featured.coverImage}
                        alt={featured.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-emerald-100">
                        <FileText className="h-12 w-12 text-emerald-400" />
                      </div>
                    )}
                    <div className="absolute left-5 top-5 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-emerald-950">
                      Featured
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-8 lg:p-12">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {featured.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {featured.readTime} min read
                      </span>
                    </div>
                    <h2 className="font-display mt-4 text-2xl font-semibold text-emerald-950 transition-colors group-hover:text-emerald-700 sm:text-3xl">
                      {featured.title}
                    </h2>
                    <p className="mt-4 leading-relaxed text-gray-600">{featured.excerpt}</p>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(featured.publishedAt)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        Read article
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Article grid */}
          {rest.length > 0 && (
            <section className="pb-20 lg:pb-28">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                  <Eyebrow tone="green">Latest articles</Eyebrow>
                  <h2 className="font-display mt-4 text-3xl font-semibold text-emerald-950">
                    More from the blog
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rest.map((article: any) => (
                    <article
                      key={article.id}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {article.coverImage ? (
                          <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-emerald-100">
                            <FileText className="h-10 w-10 text-emerald-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-emerald-700 backdrop-blur-sm">
                          {article.category}
                        </div>
                        <div className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-gray-600 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {article.readTime} min read
                        </span>
                        <h3 className="font-display mt-2 text-lg font-semibold leading-snug text-emerald-950 transition-colors group-hover:text-emerald-700">
                          {article.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 flex-1 text-sm text-gray-600">
                          {article.excerpt}
                        </p>
                        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(article.publishedAt)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                            Read more
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Newsletter */}
      <section className="pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-emerald-950">
            <div className="absolute inset-0">
              <Image
                src="/images/african-nature-scenery-with-road-trees.jpg"
                alt=""
                fill
                className="object-cover opacity-25"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/50" />
            <div className="relative z-10 px-8 py-14 md:px-16 md:py-16">
              <div className="max-w-2xl">
                <Eyebrow>Stay in the loop</Eyebrow>
                <h2 className="font-display mt-5 text-3xl font-semibold text-white text-shadow-soft sm:text-4xl">
                  Get market insights in your inbox
                </h2>
                <p className="mt-4 text-lg text-white/85 text-shadow-soft">
                  Subscribe for monthly reports, buyer guides, and the newest verified listings.
                </p>
                <div className="mt-8 max-w-lg">
                  <NewsletterForm variant="dark" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
