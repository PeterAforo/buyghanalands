import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Admin",
  description: "Configure platform settings for Buy Ghana Lands.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
