const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface FlutterwavePaymentData {
  amount: number;
  email: string;
  phone: string;
  name: string;
  txRef: string;
  currency?: string;
  redirectUrl?: string;
  meta?: Record<string, string>;
}

interface FlutterwaveResponse {
  status: string;
  message: string;
  data?: {
    link?: string;
    id?: number;
    tx_ref?: string;
    flw_ref?: string;
    status?: string;
    amount?: number;
  };
}

export async function initializePayment(data: FlutterwavePaymentData): Promise<FlutterwaveResponse> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error("Flutterwave secret key not configured");
  }

  const payload = {
    tx_ref: data.txRef,
    amount: data.amount,
    currency: data.currency || "GHS",
    redirect_url: data.redirectUrl || `${APP_URL}/payments/callback`,
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: data.email,
      phonenumber: data.phone,
      name: data.name,
    },
    customizations: {
      title: "BuyGhanaLands",
      description: "Land purchase payment",
      logo: `${APP_URL}/logo.png`,
    },
    meta: data.meta || {},
  };

  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return result;
}

export async function verifyPayment(transactionId: string): Promise<FlutterwaveResponse> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error("Flutterwave secret key not configured");
  }

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const result = await response.json();
  return result;
}

export async function verifyPaymentByTxRef(txRef: string): Promise<FlutterwaveResponse> {
  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error("Flutterwave secret key not configured");
  }

  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const result = await response.json();
  return result;
}

export function getPublicKey(): string {
  return FLUTTERWAVE_PUBLIC_KEY || "";
}
