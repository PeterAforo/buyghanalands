import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites | Buy Ghana Lands",
  description: "View and manage your favorite land listings on Buy Ghana Lands.",
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
