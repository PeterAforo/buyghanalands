import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disputes | Buy Ghana Lands",
  description: "View and manage your disputes on Buy Ghana Lands.",
};

export default function DisputesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
