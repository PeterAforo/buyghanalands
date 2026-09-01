import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions | Buy Ghana Lands",
  description: "View your transaction history on Buy Ghana Lands.",
};

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
