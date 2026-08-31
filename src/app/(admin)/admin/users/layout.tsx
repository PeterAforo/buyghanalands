import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users | Admin",
  description: "Manage users and their roles on the Buy Ghana Lands platform.",
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
