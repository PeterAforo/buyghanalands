import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fraud Cases | Admin",
  description: "Review and manage fraud cases on the Buy Ghana Lands platform.",
};

export default function FraudLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
