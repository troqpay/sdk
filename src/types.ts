export type TroqpayEnvironment = "test" | "live";

export type FetchLike = typeof fetch;

export type TroqpayClientOptions = {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: FetchLike;
};

export type RequestOptions = {
  idempotencyKey?: string;
  requestId?: string;
  signal?: AbortSignal;
};

export type Currency = "BRL";

export type CheckoutStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

export type SettlementStatus =
  | "PENDING"
  | "AVAILABLE"
  | "RESERVED"
  | "COMPLETED"
  | "BLOCKED"
  | "FAILED";

export type CheckoutCustomerInput = {
  name: string;
  email?: string;
  document?: string;
  phone?: string;
};

export type CheckoutCustomer = {
  name: string;
  email: string | null;
  document: string | null;
};

export type CreateCheckoutParams = {
  amount: number;
  currency?: Currency;
  description?: string;
  externalId?: string;
  expiresIn?: number;
  customer?: CheckoutCustomerInput;
  metadata?: Record<string, string>;
};

export type Checkout = {
  id: string;
  livemode: boolean;
  status: CheckoutStatus;
  amount: number;
  currency: Currency;
  description: string | null;
  externalId: string | null;
  checkoutUrl: string;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  customer: CheckoutCustomer | null;
  pix: {
    copyPaste: string;
    qrCodeUrl: string;
  };
  settlement: {
    currency: Currency;
    status: SettlementStatus;
    amount: string | null;
  };
  metadata: Record<string, string>;
};

export type Balance = {
  livemode: boolean;
  currency: Currency;
  grossAmount: string;
  feeAmount: string;
  pendingAmount: string;
  availableAmount: string;
  reservedAmount: string;
  blockedAmount: string;
};

export type WithdrawalRail = "BRL_PIX" | "USDT_WALLET";

export type WithdrawalStatus =
  | "REQUESTED"
  | "APPROVED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type CreateWithdrawalParams = {
  rail: WithdrawalRail;
  amount: string;
};

export type Withdrawal = {
  id: string;
  livemode: boolean;
  rail: WithdrawalRail;
  currency: Currency;
  status: WithdrawalStatus;
  requestedAmount: string;
  destination: {
    summary: string;
    label: string | null;
  };
  quote: {
    sourceAmount: string;
    sourceCurrency: Currency;
    withdrawalFeeAmount: string;
    withdrawalFeeCurrency: Currency;
    netSourceAmount: string;
    netSourceCurrency: Currency;
    destinationAmount: string;
    destinationCurrency: Currency | "USDT";
    quotedRateBrlPerUsdt: string | null;
    quotedAt: string | null;
    quoteSource: string;
    network: string | null;
    feePolicyVersion?: "v1" | null;
    monthlyWithdrawalCountAtRequest?: number | null;
    appliedFeeTier?: "STANDARD" | "OVER_THRESHOLD" | null;
  } | null;
  requestedAt: string;
  approvedAt: string | null;
  processingAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  failure: {
    code: string;
    message: string | null;
  } | null;
};

export type TroqpayErrorBody = {
  type: string;
  code: string;
  message: string;
  requestId?: string;
};

export type TroqpayErrorResponse = {
  error?: TroqpayErrorBody;
};
