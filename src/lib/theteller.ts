/**
 * Theteller (Payswitch) Payment Gateway Integration Library
 *
 * Supports:
 *  - Standard Checkout (payment collection) via /initiate
 *  - Transaction verification via /v1.1/users/transactions/{id}/status
 *  - Fund transfers (disbursements) to mobile money and bank accounts
 *    via /v1.1/transaction/process
 *
 * Configuration is read from environment variables:
 *  - THETELLER_MERCHANT_ID
 *  - THETELLER_API_USER
 *  - THETELLER_API_KEY
 *  - THETELLER_PASS_CODE
 *  - THETELLER_BASE_URL       (e.g. "https://test.theteller.net")
 *  - THETELLER_CHECKOUT_URL   (e.g. "https://checkout-test.theteller.net")
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckoutData {
  /** Payment description shown to the customer */
  desc: string;
  /** Amount in GHS (e.g. 1.00 for one Ghana Cedi) */
  amountGhs: number;
  /** Customer email */
  email: string;
  /** Optional redirect URL; defaults to `${APP_URL}/theteller/response` */
  redirectUrl?: string;
  /** Optional 12-digit transaction ID; auto-generated if omitted */
  transactionId?: string;
}

export interface CheckoutResponse {
  status: string;
  code: number;
  reason: string;
  token: string;
  checkout_url: string;
}

export interface VerificationResponse {
  code: string;
  status: string;
  reason: string;
  transaction_id: string;
  r_switch: string;
  subscriber_number: string;
  amount: number;
}

export interface MobileMoneyTransferData {
  /** Mobile money subscriber number, e.g. "0240000000" */
  account_number: string;
  /** Account issuer code, e.g. "MTN" */
  account_issuer: string;
  /** Amount in GHS (e.g. 1.00) */
  amountGhs: number;
  /** Transfer description */
  desc: string;
  /** Optional 12-digit transaction ID; auto-generated if omitted */
  transactionId?: string;
}

export interface BankTransferData {
  /** Bank account number */
  account_number: string;
  /** Bank code, e.g. "GCB" */
  account_bank: string;
  /** Always "GIP" for bank transfers */
  account_issuer: string;
  /** Amount in GHS (e.g. 1.00) */
  amountGhs: number;
  /** Transfer description */
  desc: string;
  /** Optional 12-digit transaction ID; auto-generated if omitted */
  transactionId?: string;
}

export interface TransferResponse {
  code: string;
  status: string;
  reason: string;
  transaction_id?: string;
  reference_id?: string;
  account_name?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Account issuer codes mapped to their human-readable names.
 */
export const ACCOUNT_ISSUERS: Record<string, string> = {
  MTN: "MTN Mobile Money",
  ATL: "Airtel",
  VDF: "Vodafone",
  TGO: "Tigo",
  ZPY: "Zeepay",
  GMY: "G-Money",
  GIP: "Bank Transfer (GIP)",
};

/**
 * Common Ghana bank codes usable for bank transfers (account_bank field).
 * Source: Theteller API documentation — "List of Banks" section.
 */
export const BANK_CODES: Record<string, string> = {
  SCH: "Standard Chartered Bank",
  ABG: "Absa Bank Ghana Limited",
  GCB: "GCB Bank Limited",
  NIB: "National Investment Bank",
  ADB: "Agricultural Development Bank",
  UMB: "Universal Merchant Bank",
  RBL: "Republic Bank Limited",
  ZEN: "Zenith Bank Ghana Ltd",
  ECO: "Ecobank Ghana Ltd",
  CAL: "Cal Bank Limited",
  PRD: "Prudential Bank Ltd",
  STB: "Stanbic Bank",
  GTB: "Guaranty Trust Bank",
  UBA: "United Bank for Africa",
  ACB: "Access Bank Ltd",
  CBG: "Consolidated Bank Ghana",
  SGG: "Societe Generale Ghana",
  FNB: "First National Bank",
  UNL: "Unity Link",
  FDL: "Fidelity Bank Limited",
  SIS: "Services Integrity Savings & Loans",
  BOA: "Bank of Africa",
  DFL: "Dalex Finance and Leasing Company",
  FBO: "First Bank of Nigeria",
  GHL: "GHL Bank",
  BOG: "Bank of Ghana",
  FAB: "First Atlantic Bank",
  SSB: "OmniBSIC Bank",
  GMY: "G-Money",
  APX: "ARB Apex Bank Limited",
};

/**
 * Theteller response codes mapped to human-readable descriptions.
 * Source: Theteller API documentation — "Theteller Response Codes" section.
 */
export const RESPONSE_CODES: Record<string, string> = {
  "000": "Transaction successful",
  "101": "Insufficient funds in wallet",
  "100": "Transaction not permitted to cardholder / Transaction Failed or Declined",
  "102": "Number not registered for mobile money",
  "103": "Wrong PIN or transaction timed out",
  "104": "Transaction declined or terminated",
  "105": "Invalid amount or general failure. Try changing transaction id",
  "111": "Payment request sent successfully",
  "107": "USSD is busy, please try again later",
  "114": "Invalid Voucher code",
  "200": "VBV Required",
  "600": "Access Denied",
  "979": "Access Denied. Invalid Credential",
  "909": "Duplicate Transaction ID. Transaction ID must be unique",
  "999": "Access Denied. Merchant ID is not set",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the configured merchant id, throwing if it is missing.
 */
export function getMerchantId(): string {
  const merchantId = process.env.THETELLER_MERCHANT_ID;
  if (!merchantId) {
    throw new Error(
      "THETELLER_MERCHANT_ID is not set. Please configure it in your environment variables."
    );
  }
  return merchantId;
}

/**
 * Generates a unique 12-digit transaction id.
 *
 * The id is built from the current timestamp (padded) plus a random suffix,
 * then truncated/padded to exactly 12 digits.
 */
export function generateTransactionId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  const id = (timestamp + random).slice(-12).padStart(12, "0");
  return id;
}

/**
 * Converts an amount in GHS to a 12-digit zero-padded pesewas string.
 *
 * 1 GHS = 100 pesewas, so 1.00 GHS -> "000000000100".
 */
export function formatAmount(amountGhs: number): string {
  if (typeof amountGhs !== "number" || isNaN(amountGhs) || amountGhs < 0) {
    throw new Error("amountGhs must be a non-negative number");
  }
  const pesewas = Math.round(amountGhs * 100);
  return pesewas.toString().padStart(12, "0");
}

/**
 * Builds the Basic auth header value from the api user / api key.
 */
function getBasicAuthHeader(): string {
  const apiUser = process.env.THETELLER_API_USER;
  const apiKey = process.env.THETELLER_API_KEY;
  if (!apiUser || !apiKey) {
    throw new Error(
      "THETELLER_API_USER and THETELLER_API_KEY must be set in your environment variables."
    );
  }
  const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");
  return `Basic ${credentials}`;
}

/**
 * Returns the configured pass code, throwing if it is missing.
 */
function getPassCode(): string {
  const passCode = process.env.THETELLER_PASS_CODE;
  if (!passCode) {
    throw new Error(
      "THETELLER_PASS_CODE is not set. Please configure it in your environment variables."
    );
  }
  return passCode;
}

/**
 * Returns the configured base url, throwing if missing.
 */
function getBaseUrl(): string {
  const baseUrl = process.env.THETELLER_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "THETELLER_BASE_URL is not set. Please configure it in your environment variables."
    );
  }
  return baseUrl.replace(/\/+$/, "");
}

/**
 * Returns the configured checkout url, throwing if missing.
 */
function getCheckoutUrl(): string {
  const checkoutUrl = process.env.THETELLER_CHECKOUT_URL;
  if (!checkoutUrl) {
    throw new Error(
      "THETELLER_CHECKOUT_URL is not set. Please configure it in your environment variables."
    );
  }
  return checkoutUrl.replace(/\/+$/, "");
}

/**
 * Returns the default redirect url based on the app url.
 */
function getDefaultRedirectUrl(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/+$/, "")}/theteller/response`;
}

// ---------------------------------------------------------------------------
// API: Standard Checkout
// ---------------------------------------------------------------------------

/**
 * Initiates a standard checkout (payment collection) request.
 *
 * POSTs to `${THETELLER_CHECKOUT_URL}/initiate` and returns the generated
 * token + checkout_url that the customer should be redirected to.
 */
export async function initiateCheckout(
  data: CheckoutData
): Promise<CheckoutResponse> {
  const merchantId = getMerchantId();
  const checkoutUrl = getCheckoutUrl();

  const transactionId = data.transactionId || generateTransactionId();
  const amount = formatAmount(data.amountGhs);
  const redirectUrl = data.redirectUrl || getDefaultRedirectUrl();

  const body = {
    merchant_id: merchantId,
    transaction_id: transactionId,
    desc: data.desc,
    amount,
    redirect_url: redirectUrl,
    email: data.email,
  };

  let response: Response;
  try {
    response = await fetch(`${checkoutUrl}/initiate`, {
      method: "POST",
      headers: {
        Authorization: getBasicAuthHeader(),
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Theteller checkout request failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Theteller checkout request failed with status ${response.status}: ${text}`
    );
  }

  const json = (await response.json()) as CheckoutResponse;

  if (!json || json.status !== "success" || !json.token || !json.checkout_url) {
    throw new Error(
      `Theteller checkout initiation was unsuccessful: ${
        json?.reason || JSON.stringify(json)
      }`
    );
  }

  return json;
}

// ---------------------------------------------------------------------------
// API: Verify Transaction
// ---------------------------------------------------------------------------

/**
 * Verifies the status of a transaction.
 *
 * GETs `${THETELLER_BASE_URL}/v1.1/users/transactions/${transactionId}/status`.
 * A transaction is considered approved when `code === "000"`.
 */
export async function verifyTransaction(
  transactionId: string
): Promise<VerificationResponse> {
  const merchantId = getMerchantId();
  const baseUrl = getBaseUrl();

  if (!transactionId || transactionId.length !== 12) {
    throw new Error("transactionId must be a 12-digit string");
  }

  let response: Response;
  try {
    response = await fetch(
      `${baseUrl}/v1.1/users/transactions/${transactionId}/status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Merchant-Id": merchantId,
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (err) {
    throw new Error(
      `Theteller verification request failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Theteller verification request failed with status ${response.status}: ${text}`
    );
  }

  const json = (await response.json()) as VerificationResponse;
  return json;
}

// ---------------------------------------------------------------------------
// API: Transfers (Disbursements)
// ---------------------------------------------------------------------------

/**
 * Transfers funds to a mobile money account.
 *
 * POSTs to `${THETELLER_BASE_URL}/v1.1/transaction/process` with
 * processing_code "404000".
 */
export async function transferToMobileMoney(
  data: MobileMoneyTransferData
): Promise<TransferResponse> {
  const merchantId = getMerchantId();
  const baseUrl = getBaseUrl();
  const passCode = getPassCode();

  if (!data.account_number) {
    throw new Error("account_number is required for mobile money transfer");
  }
  if (!data.account_issuer) {
    throw new Error("account_issuer is required for mobile money transfer");
  }
  if (!(data.account_issuer in ACCOUNT_ISSUERS)) {
    throw new Error(
      `Unsupported account_issuer "${data.account_issuer}". Supported issuers: ${Object.keys(
        ACCOUNT_ISSUERS
      ).join(", ")}`
    );
  }

  const transactionId = data.transactionId || generateTransactionId();
  const amount = formatAmount(data.amountGhs);

  const body = {
    account_number: data.account_number,
    account_issuer: data.account_issuer,
    merchant_id: merchantId,
    transaction_id: transactionId,
    processing_code: "404000",
    amount,
    "r-switch": "FLT",
    desc: data.desc,
    pass_code: passCode,
  };

  return processTransfer(baseUrl, body);
}

/**
 * Transfers funds to a bank account.
 *
 * This is a TWO-STEP process per the Theteller documentation:
 *  1. POST to /v1.1/transaction/process with processing_code "404020"
 *     → Returns reference_id and account_name (name enquiry)
 *  2. POST to /v1.1/transaction/bank/ftc/authorize with the reference_id
 *     → Completes the bank transfer
 *
 * If step 1 returns code "000" with a reference_id, step 2 is called
 * automatically. The final response from step 2 is returned.
 */
export async function transferToBank(
  data: BankTransferData
): Promise<TransferResponse> {
  const merchantId = getMerchantId();
  const baseUrl = getBaseUrl();
  const passCode = getPassCode();

  if (!data.account_number) {
    throw new Error("account_number is required for bank transfer");
  }
  if (!data.account_bank) {
    throw new Error("account_bank is required for bank transfer");
  }
  if (!data.account_issuer) {
    throw new Error("account_issuer is required for bank transfer");
  }

  const transactionId = data.transactionId || generateTransactionId();
  const amount = formatAmount(data.amountGhs);

  // Step 1: Initiate bank transfer (name enquiry)
  const body = {
    account_number: data.account_number,
    account_bank: data.account_bank,
    account_issuer: data.account_issuer,
    merchant_id: merchantId,
    transaction_id: transactionId,
    processing_code: "404020",
    amount,
    "r-switch": "FLT",
    desc: data.desc,
    pass_code: passCode,
  };

  const enquiryResponse = await processTransfer(baseUrl, body);

  // If the name enquiry failed, return the error response
  if (enquiryResponse.code !== "000") {
    return enquiryResponse;
  }

  // If we got a reference_id, proceed to step 2: authorize the transfer
  if (enquiryResponse.reference_id) {
    return await authorizeBankTransfer(baseUrl, enquiryResponse.reference_id);
  }

  // If no reference_id was returned but code is "000", the transfer may have
  // completed in a single step (some implementations). Return as-is.
  return enquiryResponse;
}

/**
 * Completes a bank transfer by authorizing it with the reference_id
 * obtained from the initial transfer request.
 *
 * POSTs to `${THETELLER_BASE_URL}/v1.1/transaction/bank/ftc/authorize`.
 */
async function authorizeBankTransfer(
  baseUrl: string,
  referenceId: string
): Promise<TransferResponse> {
  const merchantId = getMerchantId();

  const body = {
    merchant_id: merchantId,
    reference_id: referenceId,
  };

  let response: Response;
  try {
    response = await fetch(
      `${baseUrl}/v1.1/transaction/bank/ftc/authorize`,
      {
        method: "POST",
        headers: {
          Authorization: getBasicAuthHeader(),
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(body),
      }
    );
  } catch (err) {
    throw new Error(
      `Theteller bank transfer authorization failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Theteller bank transfer authorization failed with status ${response.status}: ${text}`
    );
  }

  const json = (await response.json()) as TransferResponse;
  return json;
}

/**
 * Shared helper that performs the transfer POST request.
 */
async function processTransfer(
  baseUrl: string,
  body: Record<string, unknown>
): Promise<TransferResponse> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1.1/transaction/process`, {
      method: "POST",
      headers: {
        Authorization: getBasicAuthHeader(),
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Theteller transfer request failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Theteller transfer request failed with status ${response.status}: ${text}`
    );
  }

  const json = (await response.json()) as TransferResponse;
  return json;
}
