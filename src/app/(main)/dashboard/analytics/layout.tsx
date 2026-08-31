import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | Buy Ghana Lands",
  description: "View analytics for your listings, offers, and performance on Buy Ghana Lands.",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
