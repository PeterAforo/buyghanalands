"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Shield, Clock, Send, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface FooterData {
  brand?: { description?: string; imageUrl?: string; htmlContent?: string }[];
  links?: { title?: string; links?: { name: string; href: string }[] }[];
  contact?: { description?: string; htmlContent?: string }[];
  newsletter?: { title?: string; description?: string }[];
  bottom?: { htmlContent?: string; description?: string }[];
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "success" | "error">("idle");
  const [footerData, setFooterData] = useState<FooterData | null>(null);

  useEffect(() => {
    fetch("/api/cms/footer")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setFooterData(data))
      .catch(() => {});
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    setSubscribeStatus("idle");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }
      setSubscribeStatus("success");
      setEmail("");
    } catch {
      setSubscribeStatus("error");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Default links (used as fallback when CMS has no data)
  const defaultLinks = {
    company: [
      { name: "About Us", href: "/about" },
      { name: "How It Works", href: "/how-it-works" },
      { name: "Pricing", href: "/pricing" },
      { name: "Contact", href: "/contact" },
    ],
    services: [
      { name: "Buy Land", href: "/listings" },
      { name: "Sell Land", href: "/listings/create" },
      { name: "Verification", href: "/verification" },
      { name: "Professionals", href: "/professionals" },
    ],
    trustCompliance: [
      { name: "Escrow Policy", href: "/escrow-policy" },
      { name: "Verification Process", href: "/verification" },
      { name: "Dispute Resolution", href: "/disputes" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  };

  // Use CMS data if available, otherwise defaults
  const cmsLinkSections = footerData?.links || [];
  const hasCmsLinks = cmsLinkSections.length > 0;

  // Get link sections — either from CMS or defaults
  const linkSections = hasCmsLinks
    ? cmsLinkSections.map((s) => ({ title: s.title || "", links: s.links || [] }))
    : [
        { title: "Company", links: defaultLinks.company },
        { title: "Services", links: defaultLinks.services },
        { title: "Trust & Compliance", links: defaultLinks.trustCompliance },
      ];

  const brandDescription = footerData?.brand?.[0]?.description ||
    "Ghana's trusted platform for secure land transactions. Verified listings, escrow-protected payments, and professional services for buyers and sellers.";
  const newsletterTitle = footerData?.newsletter?.[0]?.title || "Stay Updated on New Listings";
  const newsletterDesc = footerData?.newsletter?.[0]?.description ||
    "Subscribe to receive alerts for new land listings, market updates, and exclusive offers.";
  const bottomText = footerData?.bottom?.[0]?.htmlContent ||
    `<p>© ${currentYear} Buy Ghana Lands Ltd. All rights reserved.</p><p>Built with trust for the Ghanaian diaspora and local buyers.</p>`;

  return (
    <footer className="dark-section" style={{ backgroundColor: 'var(--c-dark-bg)' }} role="contentinfo">
      {/* Newsletter Subscription */}
      <div className="border-b" style={{ borderColor: 'var(--c-dark-border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="lg:max-w-xl">
              <h3 className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                {newsletterTitle}
              </h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--c-dark-muted)' }}>
                {newsletterDesc}
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 lg:min-w-[400px]">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white text-base placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubscribing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Subscribe
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
          {subscribeStatus === "success" && (
            <p className="mt-4 text-emerald-400 text-sm">
              ✓ Thank you for subscribing! You&apos;ll receive updates on new listings.
            </p>
          )}
          {subscribeStatus === "error" && (
            <p className="mt-4 text-red-400 text-sm">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand & Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <Logo size={32} />
              <span className="text-xl font-bold" style={{ color: 'var(--c-dark-text)' }}>Buy Ghana Lands</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--c-dark-muted)' }}>
              {brandDescription}
            </p>
            
            {/* Company Details */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--c-brand-accent)' }} />
                <div className="text-sm">
                  <p className="font-medium" style={{ color: 'var(--c-dark-text)' }}>Buy Ghana Lands Ltd.</p>
                  <p style={{ color: 'var(--c-dark-muted)' }}>Accra, Ghana</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--c-brand-accent)' }} />
                <span className="text-sm" style={{ color: 'var(--c-dark-muted)' }}>support@buyghanalands.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--c-brand-accent)' }} />
                <span className="text-sm" style={{ color: 'var(--c-dark-muted)' }}>+233 30 123 4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--c-brand-accent)' }} />
                <span className="text-sm" style={{ color: 'var(--c-dark-muted)' }}>Mon - Fri: 9:00 AM - 5:00 PM GMT</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex space-x-4">
              <a href="https://facebook.com/buyghanalands" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--c-dark-muted)' }} aria-label="Facebook">
                <Facebook className="h-5 w-5 hover:opacity-80" />
              </a>
              <a href="https://twitter.com/buyghanalands" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--c-dark-muted)' }} aria-label="Twitter">
                <Twitter className="h-5 w-5 hover:opacity-80" />
              </a>
              <a href="https://instagram.com/buyghanalands" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--c-dark-muted)' }} aria-label="Instagram">
                <Instagram className="h-5 w-5 hover:opacity-80" />
              </a>
            </div>
          </div>

          {/* Dynamic Link Sections */}
          {linkSections.slice(0, 2).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--c-dark-text)', letterSpacing: 'var(--ls-caps)' }}>
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:opacity-80"
                      style={{ color: 'var(--c-dark-muted)' }}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Trust & Compliance (last section, spans 2 cols) */}
          <div className="lg:col-span-2">
            {linkSections[2] && (
              <>
                <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--c-dark-text)', letterSpacing: 'var(--ls-caps)' }}>
                  <Shield className="h-4 w-4" style={{ color: 'var(--c-brand-accent)' }} />
                  {linkSections[2].title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {linkSections[2].links.map((link, idx) => (
                    <li key={idx}>
                      <Link
                        href={link.href}
                        className="text-sm transition-colors hover:opacity-80"
                        style={{ color: 'var(--c-dark-muted)' }}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            
            {/* Trust Badge */}
            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--c-dark-surface)', border: '1px solid var(--c-dark-border)', borderRadius: 'var(--radius-card)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--c-dark-muted)' }}>
                All transactions are protected through our escrow system. 
                Funds are only released upon buyer approval and verification of agreed conditions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: '1px solid var(--c-dark-border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div
            className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm"
            style={{ color: 'var(--c-dark-subtle)' }}
            dangerouslySetInnerHTML={{ __html: bottomText }}
          />
        </div>
      </div>
    </footer>
  );
}
