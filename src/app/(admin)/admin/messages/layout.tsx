import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | Admin",
  description: "View and manage user messages on the Buy Ghana Lands platform.",
};

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
