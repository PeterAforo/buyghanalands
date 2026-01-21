import Link from "next/link";
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Shield, Clock } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
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

  return (
    <footer className="dark-section" style={{ backgroundColor: 'var(--c-dark-bg)' }}>
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand & Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8" style={{ color: 'var(--c-brand-accent)' }} />
              <span className="text-xl font-bold" style={{ color: 'var(--c-dark-text)' }}>Buy Ghana Lands</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--c-dark-muted)' }}>
              Ghana&apos;s trusted platform for secure land transactions. Verified listings,
              escrow-protected payments, and professional services for buyers and sellers.
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
                <span className="text-sm" style={{ color: 'var(--c-dark-muted)' }}>+233 XX XXX XXXX</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--c-brand-accent)' }} />
                <span className="text-sm" style={{ color: 'var(--c-dark-muted)' }}>Mon - Fri: 9:00 AM - 5:00 PM GMT</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex space-x-4">
              <a href="#" className="transition-colors" style={{ color: 'var(--c-dark-muted)' }} aria-label="Facebook">
                <Facebook className="h-5 w-5 hover:opacity-80" />
              </a>
              <a href="#" className="transition-colors" style={{ color: 'var(--c-dark-muted)' }} aria-label="Twitter">
                <Twitter className="h-5 w-5 hover:opacity-80" />
              </a>
              <a href="#" className="transition-colors" style={{ color: 'var(--c-dark-muted)' }} aria-label="Instagram">
                <Instagram className="h-5 w-5 hover:opacity-80" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--c-dark-text)', letterSpacing: 'var(--ls-caps)' }}>
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
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

          {/* Services Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--c-dark-text)', letterSpacing: 'var(--ls-caps)' }}>
              Services
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
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

          {/* Trust & Compliance Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--c-dark-text)', letterSpacing: 'var(--ls-caps)' }}>
              <Shield className="h-4 w-4" style={{ color: 'var(--c-brand-accent)' }} />
              Trust & Compliance
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.trustCompliance.map((link) => (
                <li key={link.name}>
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm" style={{ color: 'var(--c-dark-subtle)' }}>
              © {currentYear} Buy Ghana Lands Ltd. All rights reserved.
            </p>
            <p className="text-sm" style={{ color: 'var(--c-dark-subtle)' }}>
              Built with trust for the Ghanaian diaspora and local buyers.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
