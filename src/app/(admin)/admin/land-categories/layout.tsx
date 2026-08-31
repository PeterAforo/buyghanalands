import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Land Categories | Admin",
  description: "Manage land categories and types on the Buy Ghana Lands platform.",
};

export default function LandCategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
