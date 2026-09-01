import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity | Buy Ghana Lands",
  description: "View your recent activity on Buy Ghana Lands including listings, offers, and messages.",
};

export default function ActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
