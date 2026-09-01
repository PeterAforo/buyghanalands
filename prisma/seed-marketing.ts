import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding marketing content...");

  // ─── HeroContent ───────────────────────────────────────────────
  await prisma.heroContent.upsert({
    where: { id: "hero-main" },
    update: {},
    create: {
      id: "hero-main",
      eyebrow: "Ghana's trusted land marketplace",
      headline: "Own Ghanaian land without the fear of fraud.",
      subheadline:
        "Verified titles, escrow-protected payments, and a network of trusted surveyors and lawyers — whether you're buying from Accra or abroad.",
      backgroundImages: JSON.stringify([
        "/images/african-nature-scenery-with-road-trees.jpg",
        "/images/nature-moldova-vale-with-flowing-river-slopes-with-sparse-vegetation.jpg",
      ]),
      isActive: true,
    },
  });
  console.log("Seeded hero content");

  // ─── Homepage Stats ────────────────────────────────────────────
  const stats = [
    { label: "Verified listings", value: "1000", prefix: "", suffix: "+", icon: "MapPin", displayOrder: 1 },
    { label: "Trusted sellers", value: "500", prefix: "", suffix: "+", icon: "ShieldCheck", displayOrder: 2 },
    { label: "Transacted safely", value: "50", prefix: "₵", suffix: "M+", icon: "Banknote", displayOrder: 3 },
    { label: "Buyers served", value: "2500", prefix: "", suffix: "+", icon: "Users", displayOrder: 4 },
  ];
  for (const stat of stats) {
    await prisma.homepageStat.upsert({
      where: { id: `stat-${stat.displayOrder}` },
      update: stat,
      create: { id: `stat-${stat.displayOrder}`, ...stat },
    });
  }
  console.log(`Seeded ${stats.length} homepage stats`);

  // ─── Homepage Steps ────────────────────────────────────────────
  const steps = [
    { icon: "Search", title: "Browse & search", description: "Explore verified listings across all 16 regions with maps, documents, and history.", sortOrder: 1 },
    { icon: "FileCheck", title: "Verify documents", description: "Review title status and commission professional verification before you commit.", sortOrder: 2 },
    { icon: "Handshake", title: "Make an offer", description: "Negotiate directly with sellers through secure, recorded messaging.", sortOrder: 3 },
    { icon: "ShieldCheck", title: "Close in escrow", description: "Funds stay protected until milestones are met — release only when you're satisfied.", sortOrder: 4 },
  ];
  for (const step of steps) {
    await prisma.homepageStep.upsert({
      where: { id: `step-${step.sortOrder}` },
      update: step,
      create: { id: `step-${step.sortOrder}`, ...step },
    });
  }
  console.log(`Seeded ${steps.length} homepage steps`);

  // ─── Homepage Land Types ───────────────────────────────────────
  const landTypes = [
    { type: "RESIDENTIAL", label: "Residential", icon: "Home", count: 342, sortOrder: 1 },
    { type: "COMMERCIAL", label: "Commercial", icon: "Building2", count: 156, sortOrder: 2 },
    { type: "INDUSTRIAL", label: "Industrial", icon: "Factory", count: 89, sortOrder: 3 },
    { type: "AGRICULTURAL", label: "Agricultural", icon: "Wheat", count: 234, sortOrder: 4 },
    { type: "MIXED", label: "Mixed use", icon: "Layers", count: 78, sortOrder: 5 },
  ];
  for (const lt of landTypes) {
    await prisma.homepageLandType.upsert({
      where: { id: `landtype-${lt.sortOrder}` },
      update: lt,
      create: { id: `landtype-${lt.sortOrder}`, ...lt },
    });
  }
  console.log(`Seeded ${landTypes.length} homepage land types`);

  // ─── Homepage Professionals ────────────────────────────────────
  const professionals = [
    { type: "SURVEYOR", label: "Surveyors", icon: "Compass", description: "Boundary surveys & site plans", sortOrder: 1 },
    { type: "LAWYER", label: "Lawyers", icon: "Scale", description: "Title search & legal transfer", sortOrder: 2 },
    { type: "ARCHITECT", label: "Architects", icon: "PenTool", description: "Building design & planning", sortOrder: 3 },
    { type: "ENGINEER", label: "Engineers", icon: "HardHat", description: "Structural assessment", sortOrder: 4 },
    { type: "VALUER", label: "Valuers", icon: "Calculator", description: "Independent valuation", sortOrder: 5 },
    { type: "PLANNER", label: "Planners", icon: "ClipboardList", description: "Town planning consultation", sortOrder: 6 },
  ];
  for (const prof of professionals) {
    await prisma.homepageProfessional.upsert({
      where: { id: `prof-${prof.sortOrder}` },
      update: prof,
      create: { id: `prof-${prof.sortOrder}`, ...prof },
    });
  }
  console.log(`Seeded ${professionals.length} homepage professionals`);

  // ─── Homepage Regions ──────────────────────────────────────────
  const regions = [
    { name: "Greater Accra", count: 245, image: "/images/african-nature-scenery-with-road-trees.jpg", sortOrder: 1 },
    { name: "Ashanti", count: 189, image: "/images/nature-moldova-vale-with-flowing-river-slopes-with-sparse-vegetation.jpg", sortOrder: 2 },
    { name: "Western", count: 134, image: "/images/african-nature-scenery-with-road-trees.jpg", sortOrder: 3 },
    { name: "Central", count: 98, image: "/images/nature-moldova-vale-with-flowing-river-slopes-with-sparse-vegetation.jpg", sortOrder: 4 },
    { name: "Eastern", count: 112, image: "/images/african-nature-scenery-with-road-trees.jpg", sortOrder: 5 },
    { name: "Northern", count: 67, image: "/images/nature-moldova-vale-with-flowing-river-slopes-with-sparse-vegetation.jpg", sortOrder: 6 },
    { name: "Volta", count: 78, image: "/images/african-nature-scenery-with-road-trees.jpg", sortOrder: 7 },
    { name: "Bono", count: 56, image: "/images/nature-moldova-vale-with-flowing-river-slopes-with-sparse-vegetation.jpg", sortOrder: 8 },
  ];
  for (const region of regions) {
    await prisma.homepageRegion.upsert({
      where: { id: `region-${region.sortOrder}` },
      update: region,
      create: { id: `region-${region.sortOrder}`, ...region },
    });
  }
  console.log(`Seeded ${regions.length} homepage regions`);

  // ─── Testimonials ──────────────────────────────────────────────
  const testimonials = [
    { name: "Kwame Asante", role: "Diaspora buyer", country: "United Kingdom", quote: "The escrow process gave me peace of mind. Buying land from London finally felt safe.", rating: 5, sortOrder: 1 },
    { name: "Ama Serwaa", role: "Property developer", country: "Ghana", quote: "Verification and documentation made every transaction transparent — and far faster.", rating: 5, sortOrder: 2 },
    { name: "Kofi Mensah", role: "First-time buyer", country: "United States", quote: "The professional network connected me with a trusted lawyer within a day.", rating: 5, sortOrder: 3 },
  ];
  for (const t of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: `testimonial-${t.sortOrder}` },
      update: t,
      create: { id: `testimonial-${t.sortOrder}`, ...t },
    });
  }
  console.log(`Seeded ${testimonials.length} testimonials`);

  // ─── Trust Bar Items ───────────────────────────────────────────
  const trustBarItems = [
    { icon: "BadgeCheck", label: "Lands Commission verified", sortOrder: 1 },
    { icon: "Shield", label: "Escrow-protected payments", sortOrder: 2 },
    { icon: "Globe", label: "Diaspora-friendly", sortOrder: 3 },
    { icon: "Scale", label: "Legal & professional network", sortOrder: 4 },
  ];
  for (const item of trustBarItems) {
    await prisma.trustBarItem.upsert({
      where: { id: `trust-${item.sortOrder}` },
      update: item,
      create: { id: `trust-${item.sortOrder}`, ...item },
    });
  }
  console.log(`Seeded ${trustBarItems.length} trust bar items`);

  // ─── News Articles ─────────────────────────────────────────────
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

  // ─── Support Categories ────────────────────────────────────────
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

  // ─── FAQs ──────────────────────────────────────────────────────
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

  // ─── Page Content (SiteSetting JSON) ───────────────────────────
  const pageContents: { key: string; content: any }[] = [
    // About page
    {
      key: "page.about.hero",
      content: {
        image: "/images/african-nature-scenery-with-road-trees.jpg",
        eyebrow: "Our story",
        title: "Building trust into every land deal",
        subtitle: "Buy Ghana Lands brings transparency, security and trust to land transactions — connecting buyers with verified sellers through escrow protection and professional verification.",
      },
    },
    {
      key: "page.about.stats",
      content: [
        { value: "1,000+", label: "Verified listings" },
        { value: "500+", label: "Trusted sellers" },
        { value: "₵50M+", label: "Transacted safely" },
        { value: "16", label: "Regions covered" },
      ],
    },
    {
      key: "page.about.story",
      content: {
        image: "/images/african-american-woman-looking-map.jpg",
        eyebrow: "Why we exist",
        heading: "Land ownership should never be a gamble",
        paragraphs: [
          "For too many Ghanaians — especially those buying from abroad — acquiring land has meant navigating double sales, forged documents and costly litigation.",
          "We built Buy Ghana Lands to change that. By combining verified listings, a network of licensed professionals, and escrow-protected payments, we make it possible to buy land with total peace of mind.",
        ],
      },
    },
    {
      key: "page.about.values",
      content: [
        { icon: "Target", title: "Our Mission", body: "To eliminate land fraud and make property transactions in Ghana safe, transparent, and accessible to everyone — at home and in the diaspora." },
        { icon: "Shield", title: "Our Promise", body: "Every transaction is protected by our escrow system, and every listing can be verified by licensed professionals before money changes hands." },
        { icon: "Users", title: "Our Team", body: "A dedicated team of technology and real-estate professionals committed to transforming Ghana's property market for good." },
        { icon: "MapPin", title: "Our Reach", body: "Operating across all 16 regions of Ghana, connecting verified buyers and sellers nationwide with confidence." },
      ],
    },
    {
      key: "page.about.cta",
      content: {
        image: "/images/cheerful-woman-with-laptop-grass.jpg",
        heading: "Ready to buy land the safe way?",
        text: "Join thousands of buyers using verified listings and escrow protection across Ghana.",
      },
    },
    // How It Works page
    {
      key: "page.how-it-works.hero",
      content: { title: "How It Works", subtitle: "A simple, secure process for buying land in Ghana" },
    },
    {
      key: "page.how-it-works.steps",
      content: [
        { icon: "Search", title: "1. Find Your Land", description: "Browse verified listings across all regions of Ghana. Filter by location, size, price, and land type to find your perfect property." },
        { icon: "FileCheck", title: "2. Verify the Property", description: "Request professional verification from licensed surveyors and lawyers. Get comprehensive reports on land ownership and documentation." },
        { icon: "Shield", title: "3. Secure Transaction", description: "Use our escrow service to protect your payment. Funds are only released when all conditions are met and verified." },
        { icon: "Key", title: "4. Complete Transfer", description: "Finalize the transaction with proper documentation. We guide you through the entire transfer process." },
      ],
    },
    // Pricing page
    {
      key: "page.pricing.hero",
      content: { title: "Pricing", subtitle: "Transparent fees for secure land transactions" },
    },
    {
      key: "page.pricing.plans",
      content: [
        { title: "For Buyers", price: "Free", unit: "", features: ["Browse all listings", "Contact sellers", "Make offers", "Escrow protection"] },
        { title: "For Sellers", price: "1.5%", unit: "of transaction value", features: ["List unlimited properties", "Reach verified buyers", "Secure payments", "Transaction support"] },
      ],
    },
    {
      key: "page.pricing.verification",
      content: {
        title: "Verification Services",
        body: "Professional verification services are provided by licensed surveyors and lawyers. Prices vary based on location and scope of verification required.",
        contactNote: "Contact our support team for a quote on verification services.",
      },
    },
    // Terms page
    {
      key: "page.terms.meta",
      content: { title: "Terms of Service", lastUpdated: "January 2026" },
    },
    {
      key: "page.terms.sections",
      content: [
        { heading: "1. Acceptance of Terms", body: "By accessing and using BuyGhanaLands, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service." },
        { heading: "2. Description of Service", body: "BuyGhanaLands is an online marketplace that connects land buyers and sellers in Ghana. We provide a platform for listing land properties, facilitating communication between parties, and offering escrow services for secure transactions." },
        { heading: "3. User Accounts", body: "To use certain features of our service, you must register for an account. You agree to:", listItems: ["Provide accurate and complete information", "Maintain the security of your account credentials", "Notify us immediately of any unauthorized access", "Accept responsibility for all activities under your account"] },
        { heading: "4. Listing Requirements", body: "All property listings must:", listItems: ["Represent real properties that the seller has the right to sell", "Include accurate descriptions and photographs", "Comply with all applicable Ghanaian laws and regulations", "Not contain fraudulent or misleading information"] },
        { heading: "5. Escrow Services", body: "Our escrow service holds funds securely until transaction conditions are met. By using our escrow service, you agree to our escrow terms and understand that:", listItems: ["Funds are held by our licensed escrow partner", "Release of funds is subject to verification requirements", "Platform fees are non-refundable once a transaction is completed"] },
        { heading: "6. Fees and Payments", body: "BuyGhanaLands charges a platform fee of 1.5% on successful transactions. Additional fees may apply for premium services such as verification and professional services." },
        { heading: "7. Dispute Resolution", body: "In case of disputes between buyers and sellers, our support team will review the case and make a determination based on the evidence provided. Our decision is final and binding." },
        { heading: "8. Limitation of Liability", body: "BuyGhanaLands is not responsible for the accuracy of listings, the conduct of users, or the outcome of transactions. We provide a platform service only and are not party to transactions between users." },
        { heading: "9. Termination", body: "We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity." },
        { heading: "10. Contact Us", body: "If you have questions about these Terms of Service, please contact us at support@buyghanalands.com or through our contact page." },
      ],
    },
    // Privacy page
    {
      key: "page.privacy.meta",
      content: { title: "Privacy Policy", lastUpdated: "January 2026" },
    },
    {
      key: "page.privacy.sections",
      content: [
        { heading: "1. Information We Collect", body: "We collect information you provide directly to us, including your name, phone number, email address, and any other information you choose to provide when using our platform." },
        { heading: "2. How We Use Your Information", body: "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions." },
        { heading: "3. Information Sharing", body: "We do not share your personal information with third parties except as described in this policy or with your consent. We may share information with service providers who assist us in operating our platform." },
        { heading: "4. Data Security", body: "We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction." },
        { heading: "5. Contact Us", body: "If you have any questions about this Privacy Policy, please contact us at privacy@buyghanalands.com." },
      ],
    },
    // Escrow Policy page
    {
      key: "page.escrow-policy.hero",
      content: { title: "Escrow Policy", subtitle: "How we protect your money during land transactions" },
    },
    {
      key: "page.escrow-policy.features",
      content: [
        { icon: "Lock", title: "Secure Holding", body: "Funds are held in a secure escrow account until all transaction conditions are met and verified." },
        { icon: "Shield", title: "Buyer Protection", body: "Your payment is protected. If the seller fails to meet conditions, you receive a full refund." },
        { icon: "CheckCircle", title: "Seller Assurance", body: "Sellers are assured of payment once they fulfill all agreed conditions and documentation requirements." },
        { icon: "RefreshCw", title: "Dispute Resolution", body: "In case of disputes, our team mediates to find a fair resolution for both parties." },
      ],
    },
    {
      key: "page.escrow-policy.process",
      content: [
        { number: 1, title: "Offer Accepted", description: "Buyer and seller agree on terms and price" },
        { number: 2, title: "Funds Deposited", description: "Buyer deposits payment into escrow" },
        { number: 3, title: "Verification Period", description: "Minimum 7 days for document verification and due diligence" },
        { number: 4, title: "Funds Released", description: "Upon successful verification, funds are released to seller" },
      ],
    },
    // Verification page
    {
      key: "page.verification.hero",
      content: { title: "Land Verification", subtitle: "Professional verification services to ensure your land purchase is secure" },
    },
    {
      key: "page.verification.services",
      content: [
        { icon: "FileCheck", title: "Document Verification", body: "Our legal experts verify all land documents including indentures, site plans, and title certificates." },
        { icon: "Shield", title: "Ownership Confirmation", body: "We confirm the seller's legal right to sell the property through official records and family documentation." },
        { icon: "Users", title: "Site Inspection", body: "Licensed surveyors physically inspect the land to verify boundaries, size, and any encumbrances." },
        { icon: "Award", title: "Verification Certificate", body: "Receive a comprehensive verification report and certificate for your records and peace of mind." },
      ],
    },
    {
      key: "page.verification.levels",
      content: [
        { level: "0", label: "Unverified", description: "Listing submitted, no verification performed", color: "gray" },
        { level: "1", label: "Documents Uploaded", description: "Seller has uploaded supporting documents", color: "yellow" },
        { level: "2", label: "Platform Reviewed", description: "Our team has reviewed and verified documents", color: "blue" },
        { level: "3", label: "Officially Verified", description: "Verified by licensed professionals with site inspection", color: "emerald" },
      ],
    },
    // Contact page
    {
      key: "page.contact.hero",
      content: {
        image: "/images/cheerful-woman-with-laptop-grass.jpg",
        eyebrow: "We're here to help",
        title: "Let's talk about your land journey",
        subtitle: "Whether you're buying, selling, or verifying — our team is ready to guide you through every step.",
      },
    },
    {
      key: "page.contact.channels",
      content: [
        { icon: "Mail", title: "Email us", value: "support@buyghanalands.com", note: "We respond within 24 hours", href: "mailto:support@buyghanalands.com" },
        { icon: "Phone", title: "Call us", value: "+233 30 000 0000", note: "Mon–Fri, 9am–5pm GMT", href: "tel:+233300000000" },
        { icon: "MapPin", title: "Visit us", value: "Accra, Ghana", note: "By appointment only", href: null },
        { icon: "Clock", title: "Business hours", value: "Monday – Friday", note: "9:00 AM – 5:00 PM GMT", href: null },
      ],
    },
    // Support page contact options
    {
      key: "page.support.contactOptions",
      content: [
        { icon: "MessageSquare", title: "Live chat", description: "Chat with our team in real time during business hours.", action: "Start a chat", href: "#" },
        { icon: "Mail", title: "Email support", description: "Send us a detailed message and we'll reply within 24 hours.", action: "support@buyghanalands.com", href: "mailto:support@buyghanalands.com" },
        { icon: "Phone", title: "Call us", description: "Speak directly with a support representative.", action: "+233 30 000 0000", href: "tel:+233300000000" },
      ],
    },
  ];

  for (const { key, content } of pageContents) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(content), type: "json" },
      create: { key, value: JSON.stringify(content), type: "json" },
    });
  }
  console.log(`Seeded ${pageContents.length} page content sections`);

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
