import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { DashboardShell, type DashboardUser, type DashboardCounts } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  // Fetch user info, professional profile existence, and unread counts in parallel
  const [user, professionalProfile, unreadMessages] = await withDbRetry(() =>
    Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { fullName: true, email: true, roles: true },
      }),
      prisma.professionalProfile.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      }),
      prisma.message.count({
        where: { receiverId: session.user.id, readAt: null },
      }),
    ])
  );

  const name = user?.fullName || session.user.name || "User";
  const email = user?.email || session.user.email || "";
  const isProfessional =
    !!professionalProfile || (user?.roles?.includes("PROFESSIONAL") ?? false);

  const dashUser: DashboardUser = {
    name,
    email,
    initial: name.charAt(0).toUpperCase(),
    isProfessional,
  };

  const counts: DashboardCounts = {
    unreadMessages,
    unreadNotifications: 0,
  };

  return <DashboardShell user={dashUser} counts={counts}>{children}</DashboardShell>;
}
