"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  User,
  LogOut,
  Home,
  Search,
  Plus,
  Briefcase,
  Info,
  Newspaper,
  Mail,
  HelpCircle,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Browse Lands", href: "/listings", icon: Search, testId: "nav-listings" },
    { name: "Professionals", href: "/professionals", icon: Briefcase, testId: "nav-professionals" },
    { name: "About", href: "/about", icon: Info, testId: undefined },
    { name: "News", href: "/news", icon: Newspaper, testId: undefined },
    { name: "Contact", href: "/contact", icon: Mail, testId: undefined },
    { name: "Support", href: "/support", icon: HelpCircle, testId: undefined },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" data-testid="nav-home" className="flex items-center space-x-2" aria-label="Buy Ghana Lands home">
              <Logo size={32} />
              <span className="text-xl font-bold text-gray-900">
                Buy Ghana Lands
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6" role="menubar">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-md"
                role="menuitem"
                data-testid={item.testId ?? `nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {status === "loading" ? (
              <div className="h-10 w-24 bg-gray-100 animate-pulse rounded-md" aria-hidden="true" />
            ) : session ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-md"
                  data-testid="nav-dashboard"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span>{session.user.name || "Dashboard"}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" data-testid="nav-login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/register" data-testid="nav-register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="p-3 text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200" id="mobile-menu" role="menu">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  onClick={() => setMobileMenuOpen(false)}
                  role="menuitem"
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {session ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Home className="h-5 w-5" aria-hidden="true" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <LogOut className="h-5 w-5" aria-hidden="true" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block px-3 py-2 text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
