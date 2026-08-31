import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | Buy Ghana Lands",
  description: "Create a free account on Buy Ghana Lands to start buying, selling, and verifying land in Ghana.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
