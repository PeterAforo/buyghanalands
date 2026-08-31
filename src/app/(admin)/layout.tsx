import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel - Buy Ghana Lands",
  description: "Administration panel for Buy Ghana Lands platform",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
