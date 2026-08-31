import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding marketing content...");

  // Homepage stats
  const stats = [
    { label: "Verified Listings", value: "1,200+", description: "Curated, verified land parcels across Ghana", icon: "MapPin", displayOrder: 1 },
    { label: "Happy Buyers", value: "850+", description: "Successful land transactions completed", icon: "Users", displayOrder: 2 },
    { label: "Land Regions", value: "16", description: "Regions covered across the country", icon: "Globe", displayOrder: 3 },
    { label: "Escrow Protected", value: "100%", description: "Every transaction secured by escrow", icon: "Shield", displayOrder: 4 },
  ];

  for (const stat of stats) {
    await prisma.homepageStat.upsert({
      where: { id: `stat-${stat.displayOrder}` },
      update: stat,
      create: { id: `stat-${stat.displayOrder}`, ...stat },
    });
  }
  console.log(`Seeded ${stats.length} homepage stats`);

  // News articles
  const articles = [
    {
      slug: "land-ownership-guide-ghana-2024",
      title: "Complete Guide to Land Ownership in Ghana (2024)",
      excerpt: "Everything you need to know about buying, registering, and securing land in Ghana — from due diligence to title registration.",
      content: "Land ownership in Ghana is governed by multiple legal frameworks...",
      coverImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80",
      category: "Guides",
      author: "Buy Ghana Lands Team",
      readTime: 12,
      isPublished: true,
      isFeatured: true,
      publishedAt: new Date("2024-09-15"),
    },
    {
      slug: "understanding-land-title-registration",
      title: "Understanding Land Title Registration in Ghana",
      excerpt: "A step-by-step walkthrough of the Lands Commission process and what documents you need.",
      content: "Land title registration is the legal process of recording ownership...",
      coverImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80",
      category: "Education",
      author: "Legal Team",
      readTime: 8,
      isPublished: true,
      isFeatured: false,
      publishedAt: new Date("2024-08-20"),
    },
    {
      slug: "avoiding-land-fraud-ghana",
      title: "How to Avoid Land Fraud in Ghana: 10 Red Flags",
      excerpt: "Protect yourself from common land scams with these practical warning signs and verification steps.",
      content: "Land fraud remains a significant concern in Ghana...",
      coverImage: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80",
      category: "Safety",
      author: "Fraud Prevention Team",
      readTime: 6,
      isPublished: true,
      isFeatured: false,
      publishedAt: new Date("2024-07-10"),
    },
  ];

  for (const article of articles) {
    await prisma.newsArticle.upsert({
      where: { slug: article.slug },
      update: article,
      create: article,
    });
  }
  console.log(`Seeded ${articles.length} news articles`);

  // Support categories
  const supportCategories = [
    { slug: "getting-started", title: "Getting Started", description: "New to Buy Ghana Lands? Learn the basics.", icon: "Rocket", href: "/support/getting-started", displayOrder: 1 },
    { slug: "buying-land", title: "Buying Land", description: "Search, verify, and purchase land securely.", icon: "MapPin", href: "/support/buying-land", displayOrder: 2 },
    { slug: "selling-land", title: "Selling Land", description: "List your land and connect with buyers.", icon: "TrendingUp", href: "/support/selling-land", displayOrder: 3 },
    { slug: "payments-escrow", title: "Payments & Escrow", description: "How escrow protects your transactions.", icon: "Shield", href: "/support/payments", displayOrder: 4 },
    { slug: "verification-kyc", title: "Verification & KYC", description: "Identity verification and Ghana Card checks.", icon: "FileCheck", href: "/support/verification", displayOrder: 5 },
    { slug: "disputes", title: "Disputes & Resolution", description: "Filing and resolving transaction disputes.", icon: "AlertTriangle", href: "/support/disputes", displayOrder: 6 },
  ];

  for (const cat of supportCategories) {
    await prisma.supportCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`Seeded ${supportCategories.length} support categories`);

  // FAQs
  const faqs = [
    { question: "How does escrow work on Buy Ghana Lands?", answer: "Escrow holds buyer funds securely until all transaction milestones are met and verified. Funds are only released to the seller once the buyer confirms completion.", category: "Payments & Escrow", displayOrder: 1 },
    { question: "What documents do I need to verify my land listing?", answer: "You need a site plan, indenture/title document, Lands Commission search report, and any relevant permits. Our verification team reviews each submission.", category: "Selling Land", displayOrder: 2 },
    { question: "How long does KYC verification take?", answer: "Automated KYC checks via AWS Rekognition are instant. Manual review of documents typically takes 1–3 business days.", category: "Verification & KYC", displayOrder: 3 },
    { question: "Can I cancel a transaction after payment?", answer: "Yes, you can initiate a dispute and request a refund. Our resolution team reviews each case, and escrow funds remain protected during the process.", category: "Disputes & Resolution", displayOrder: 4 },
    { question: "What regions in Ghana does the platform cover?", answer: "We cover all 16 regions of Ghana, with verified listings in Greater Accra, Ashanti, Western, Eastern, Central, Northern, and more.", category: "Buying Land", displayOrder: 5 },
    { question: "How are professionals verified?", answer: "Professionals submit their license numbers and credentials. We verify these against the relevant Ghanaian regulatory bodies before approval.", category: "Getting Started", displayOrder: 6 },
  ];

  for (const faq of faqs) {
    await prisma.faqItem.upsert({
      where: { id: `faq-${faq.displayOrder}` },
      update: faq,
      create: { id: `faq-${faq.displayOrder}`, ...faq },
    });
  }
  console.log(`Seeded ${faqs.length} FAQs`);

  console.log("Marketing content seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
