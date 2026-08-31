import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disputes | Admin",
  description: "Review and manage disputes on the Buy Ghana Lands platform.",
};

export default function DisputesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
