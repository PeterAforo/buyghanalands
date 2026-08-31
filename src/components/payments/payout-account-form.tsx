"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ACCOUNT_ISSUERS, BANK_CODES } from "@/lib/theteller";

type AccountType = "MOBILE_MONEY" | "BANK";

interface PayoutAccountData {
  payoutAccountType: AccountType | null;
  payoutAccountNumber: string | null;
  payoutAccountIssuer: string | null;
  payoutAccountBank: string | null;
}

export function PayoutAccountForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accountType, setAccountType] = useState<AccountType>("MOBILE_MONEY");
  const [accountNumber, setAccountNumber] = useState("");
  const [issuer, setIssuer] = useState("");
  const [bank, setBank] = useState("");

  // Fetch current settings on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchAccount() {
      try {
        const res = await fetch("/api/profile/payout-account");
        if (!res.ok) {
          throw new Error("Failed to load payout account");
        }
        const data: PayoutAccountData = await res.json();
        if (cancelled) return;
        if (data.payoutAccountType) {
          setAccountType(data.payoutAccountType);
        }
        if (data.payoutAccountNumber) {
          setAccountNumber(data.payoutAccountNumber);
        }
        if (data.payoutAccountIssuer) {
          setIssuer(data.payoutAccountIssuer);
        }
        if (data.payoutAccountBank) {
          setBank(data.payoutAccountBank);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load payout account");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAccount();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const payload: Record<string, string> = {
        payoutAccountType: accountType,
        payoutAccountNumber: accountNumber,
      };
      if (accountType === "MOBILE_MONEY") {
        payload.payoutAccountIssuer = issuer;
      } else {
        payload.payoutAccountBank = bank;
      }

      const res = await fetch("/api/profile/payout-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save payout account");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payout account");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Payout account saved successfully.
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Account type selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Payout Method
        </label>
        <div className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="accountType"
              value="MOBILE_MONEY"
              checked={accountType === "MOBILE_MONEY"}
              onChange={() => setAccountType("MOBILE_MONEY")}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-900">Mobile Money</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="accountType"
              value="BANK"
              checked={accountType === "BANK"}
              onChange={() => setAccountType("BANK")}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-900">Bank Account</span>
          </label>
        </div>
      </div>

      {/* Account number */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {accountType === "MOBILE_MONEY" ? "Mobile Money Number" : "Bank Account Number"}
        </label>
        <Input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder={accountType === "MOBILE_MONEY" ? "e.g. 0240000000" : "Enter account number"}
          required
        />
      </div>

      {/* Mobile money issuer dropdown */}
      {accountType === "MOBILE_MONEY" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Mobile Money Provider
          </label>
          <Select
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            required
          >
            <option value="">Select provider...</option>
            {Object.entries(ACCOUNT_ISSUERS)
              .filter(([code]) => code !== "GIP")
              .map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
          </Select>
        </div>
      )}

      {/* Bank dropdown */}
      {accountType === "BANK" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Bank
          </label>
          <Select
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            required
          >
            <option value="">Select bank...</option>
            {Object.entries(BANK_CODES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <Button type="submit" isLoading={saving} disabled={saving}>
        Save Payout Account
      </Button>
    </form>
  );
}
