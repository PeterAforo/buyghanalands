import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CreditCard,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

export const dynamic = 'force-dynamic';

async function getTransactions() {
  const transactions = await prisma.transaction.findMany({
    include: {
      listing: { select: { id: true, title: true, region: true } },
      buyer: { select: { id: true, fullName: true, phone: true } },
      seller: { select: { id: true, fullName: true, phone: true } },
      payments: { select: { id: true, amount: true, status: true, type: true } },
      disputes: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return transactions;
}

async function getTransactionStats() {
  const [total, funded, released, disputed, totalValue] = await Promise.all([
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: "FUNDED" } }),
    prisma.transaction.count({ where: { status: "RELEASED" } }),
    prisma.transaction.count({ where: { status: "DISPUTED" } }),
    prisma.transaction.aggregate({ _sum: { agreedPriceGhs: true } }),
  ]);

  return { total, funded, released, disputed, totalValue: totalValue._sum.agreedPriceGhs || 0 };
}

function getStatusBadge(status: string) {
  const variants: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
    CREATED: "secondary",
    ESCROW_REQUESTED: "warning",
    FUNDED: "default",
    VERIFICATION_PERIOD: "default",
    DISPUTED: "destructive",
    READY_TO_RELEASE: "success",
    RELEASED: "success",
    REFUNDED: "warning",
    CLOSED: "secondary",
  };
  return variants[status] || "secondary";
}

export default async function AdminTransactionsPage() {
  const [transactions, stats] = await Promise.all([
    getTransactions(),
    getTransactionStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Monitor and manage all platform transactions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Funded</p>
                <p className="text-xl font-bold">{stats.funded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Released</p>
                <p className="text-xl font-bold">{stats.released}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Disputed</p>
                <p className="text-xl font-bold">{stats.disputed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-xl font-bold">{formatPrice(stats.totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Listing</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Buyer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Seller</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Payments</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {tx.id.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">{tx.listing.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tx.listing.region}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm">{tx.buyer.fullName}</p>
                            <p className="text-xs text-gray-500">{tx.buyer.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm">{tx.seller.fullName}</p>
                            <p className="text-xs text-gray-500">{tx.seller.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-emerald-600">
                          {formatPrice(tx.agreedPriceGhs)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadge(tx.status)}>
                          {tx.status.replace(/_/g, " ")}
                        </Badge>
                        {tx.disputes.length > 0 && (
                          <Badge variant="destructive" className="ml-1">
                            Dispute
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p>{tx.payments.filter(p => p.status === "SUCCESS").length} successful</p>
                          <p className="text-xs text-gray-500">
                            {tx.payments.length} total
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
