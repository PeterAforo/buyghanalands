const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

interface InitializePaymentParams {
  email: string;
  amount: number; // in pesewas (kobo equivalent)
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface InitializePaymentData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface VerifyPaymentData {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  paid_at: string;
  customer: {
    email: string;
  };
  metadata: Record<string, any>;
}

export async function initializePayment(
  params: InitializePaymentParams
): Promise<PaystackResponse<InitializePaymentData>> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`Paystack error: ${response.statusText}`);
  }

  return response.json();
}

export async function verifyPayment(
  reference: string
): Promise<PaystackResponse<VerifyPaymentData>> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Paystack error: ${response.statusText}`);
  }

  return response.json();
}

export function generateReference(prefix: string = "BGL"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

export function convertToPesewas(amountGhs: number): number {
  return Math.round(amountGhs * 100);
}

export function convertFromPesewas(amountPesewas: number): number {
  return amountPesewas / 100;
}
