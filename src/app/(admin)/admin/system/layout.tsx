import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System | Admin",
  description: "Monitor system health and status for the Buy Ghana Lands platform.",
};

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
