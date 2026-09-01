import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Messages | Buy Ghana Lands",
  description: "View and manage your messages on Buy Ghana Lands.",
};

export default function DashboardMessagesPage() {
  redirect("/messages");
}
