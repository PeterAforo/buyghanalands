import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | Buy Ghana Lands",
  description: "View and edit your Buy Ghana Lands profile information.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
