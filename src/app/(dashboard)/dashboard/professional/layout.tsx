import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Professional Profile | Buy Ghana Lands",
  description: "Manage your professional profile and services on Buy Ghana Lands.",
};

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
