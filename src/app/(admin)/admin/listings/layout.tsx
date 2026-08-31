import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listings | Admin",
  description: "Manage and moderate land listings on the Buy Ghana Lands platform.",
};

export default function ListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
