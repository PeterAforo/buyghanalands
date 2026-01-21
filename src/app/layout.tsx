import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { GsapProvider, LenisProvider } from "@/components/motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Buy Ghana Lands - Secure Land Transactions in Ghana",
  description:
    "Ghana's trusted platform for secure land transactions. Verified listings, protected payments, and professional services for buyers and sellers.",
  keywords: [
    "Ghana land",
    "buy land Ghana",
    "land for sale Ghana",
    "Ghana property",
    "land verification",
    "escrow Ghana",
  ],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en">
        <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
          <SessionProvider>
            <GsapProvider>
              <LenisProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </LenisProvider>
            </GsapProvider>
          </SessionProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
