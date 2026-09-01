import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Listings | Buy Ghana Lands",
  description: "Manage your land listings on Buy Ghana Lands.",
};

export default function MyListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
