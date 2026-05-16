import { TroqpayAPIError, TroqpayConfigurationError } from "./errors.js";
import type {
  Balance,
  Checkout,
  CreateCheckoutParams,
  CreateWithdrawalParams,
  FetchLike,
  RequestOptions,
  TroqpayClientOptions,
  TroqpayErrorResponse,
  Withdrawal,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.troqpay.com";
const DEFAULT_TIMEOUT_MS = 30_000;
const CLIENT_HEADER = "troqpay-js/0.1.0";

type ApiRequestOptions = RequestOptions & {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function getFetch(fetchImpl?: FetchLike): FetchLike {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof globalThis.fetch !== "function") {
    throw new TroqpayConfigurationError(
      "No fetch implementation found. Use Node.js 20+ or pass `fetch` in the client options."
    );
  }

  return globalThis.fetch.bind(globalThis);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function createTimeoutSignal(
  timeoutMs: number,
  signal?: AbortSignal
): { signal: AbortSignal; dispose: () => void } {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const abort = () => controller.abort(signal?.reason);

  if (signal?.aborted) {
    abort();
  } else {
    signal?.addEventListener("abort", abort, { once: true });
    timeout = setTimeout(() => controller.abort(), timeoutMs);
  }

  return {
    signal: controller.signal,
    dispose: () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      signal?.removeEventListener("abort", abort);
    },
  };
}

export class Troqpay {
  readonly checkouts: {
    create: (
      params: CreateCheckoutParams,
      options?: RequestOptions
    ) => Promise<Checkout>;
    retrieve: (checkoutId: string, options?: RequestOptions) => Promise<Checkout>;
  };

  readonly balance: {
    retrieve: (options?: RequestOptions) => Promise<Balance>;
  };

  readonly withdrawals: {
    create: (
      params: CreateWithdrawalParams,
      options: RequestOptions & { idempotencyKey: string }
    ) => Promise<Withdrawal>;
    retrieve: (
      withdrawalId: string,
      options?: RequestOptions
    ) => Promise<Withdrawal>;
  };

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: FetchLike;

  constructor(options: TroqpayClientOptions) {
    if (!options.apiKey?.trim()) {
      throw new TroqpayConfigurationError("`apiKey` is required.");
    }

    this.apiKey = options.apiKey;
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = getFetch(options.fetch);

    this.checkouts = {
      create: (params, requestOptions) =>
        this.request<Checkout>({
          method: "POST",
          path: "/v1/checkouts",
          body: params,
          ...requestOptions,
        }),
      retrieve: (checkoutId, requestOptions) =>
        this.request<Checkout>({
          method: "GET",
          path: `/v1/checkouts/${encodeURIComponent(checkoutId)}`,
          ...requestOptions,
        }),
    };

    this.balance = {
      retrieve: (requestOptions) =>
        this.request<Balance>({
          method: "GET",
          path: "/v1/balance",
          ...requestOptions,
        }),
    };

    this.withdrawals = {
      create: (params, requestOptions) =>
        this.request<Withdrawal>({
          method: "POST",
          path: "/v1/withdrawals",
          body: params,
          ...requestOptions,
        }),
      retrieve: (withdrawalId, requestOptions) =>
        this.request<Withdrawal>({
          method: "GET",
          path: `/v1/withdrawals/${encodeURIComponent(withdrawalId)}`,
          ...requestOptions,
        }),
    };
  }

  private async request<T>(options: ApiRequestOptions): Promise<T> {
    const headers = new Headers({
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      "X-Troqpay-Client": CLIENT_HEADER,
    });

    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (options.idempotencyKey) {
      headers.set("Idempotency-Key", options.idempotencyKey);
    }

    if (options.requestId) {
      headers.set("Request-Id", options.requestId);
    }

    const timeout = createTimeoutSignal(this.timeoutMs, options.signal);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${options.path}`, {
        method: options.method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: timeout.signal,
      });
      const responseBody = await parseResponseBody(response);

      if (!response.ok) {
        const errorResponse = responseBody as TroqpayErrorResponse;
        const requestId =
          response.headers.get("Request-Id") ??
          response.headers.get("X-Request-Id") ??
          null;

        throw new TroqpayAPIError({
          status: response.status,
          requestId,
          error: errorResponse.error,
          responseBody,
        });
      }

      return responseBody as T;
    } finally {
      timeout.dispose();
    }
  }
}

export { Troqpay as TroqpayClient };
