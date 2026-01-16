import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  ArrowRight,
} from "lucide-react";

async function getPermitApplications(userId: string) {
  const applications = await prisma.permitApplication.findMany({
    where: { applicantId: userId },
    include: {
      assembly: {
        select: { name: true, region: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return applications;
}

function getStatusInfo(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive"; icon: typeof Clock }> = {
    DRAFT: { label: "Draft", variant: "secondary", icon: FileText },
    SUBMITTED: { label: "Submitted", variant: "warning", icon: Clock },
    UNDER_REVIEW: { label: "Under Review", variant: "warning", icon: Clock },
    QUERY_RAISED: { label: "Query Raised", variant: "destructive", icon: AlertCircle },
    RESUBMITTED: { label: "Resubmitted", variant: "warning", icon: Clock },
    APPROVED: { label: "Approved", variant: "success", icon: CheckCircle },
    REJECTED: { label: "Rejected", variant: "destructive", icon: AlertCircle },
    CANCELLED: { label: "Cancelled", variant: "secondary", icon: AlertCircle },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const, icon: FileText };
}

export default async function PermitsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/permits");
  }

  const applications = await getPermitApplications(session.user.id);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-emerald-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Building Permits</h1>
              <p className="mt-2 text-emerald-100">
                Apply for and track your building permit applications
              </p>
            </div>
            <Link href="/permits/apply">
              <Button className="mt-4 md:mt-0 bg-white text-emerald-900 hover:bg-emerald-50">
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{applications.length}</p>
                  <p className="text-sm text-gray-500">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {applications.filter((a) => ["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED"].includes(a.status)).length}
                  </p>
                  <p className="text-sm text-gray-500">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {applications.filter((a) => a.status === "APPROVED").length}
                  </p>
                  <p className="text-sm text-gray-500">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
            <CardDescription>
              Track the status of your building permit applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No applications yet
                </h3>
                <p className="mt-2 text-gray-600">
                  Start a new building permit application
                </p>
                <Link href="/permits/apply">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    New Application
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => {
                  const status = getStatusInfo(application.status);
                  const StatusIcon = status.icon;

                  return (
                    <Link
                      key={application.id}
                      href={`/permits/${application.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {application.projectTitle}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {application.assembly.name} • {application.assembly.region}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Applied: {formatDate(application.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How Building Permits Work
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600 mb-3">
                  1
                </div>
                <h3 className="font-medium">Submit Application</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Fill out the application form and upload required documents
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600 mb-3">
                  2
                </div>
                <h3 className="font-medium">Pay Fees</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Pay the required processing fees online
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600 mb-3">
                  3
                </div>
                <h3 className="font-medium">Review Process</h3>
                <p className="text-sm text-gray-500 mt-1">
                  District Assembly reviews your application
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600 mb-3">
                  4
                </div>
                <h3 className="font-medium">Get Permit</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Receive your approved building permit
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
