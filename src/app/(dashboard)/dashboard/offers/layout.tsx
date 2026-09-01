import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offers | Buy Ghana Lands",
  description: "View and manage offers on your land listings on Buy Ghana Lands.",
};

export default function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
