import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions | Admin",
  description: "View and manage transactions on the Buy Ghana Lands platform.",
};

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
