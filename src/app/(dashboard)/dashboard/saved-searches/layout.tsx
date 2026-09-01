import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Searches | Buy Ghana Lands",
  description: "View and manage your saved search alerts on Buy Ghana Lands.",
};

export default function SavedSearchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
