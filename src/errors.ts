import type { TroqpayErrorBody } from "./types.js";

export type TroqpayAPIErrorOptions = {
  status: number;
  requestId: string | null;
  error?: TroqpayErrorBody;
  responseBody?: unknown;
};

export class TroqpayAPIError extends Error {
  readonly name = "TroqpayAPIError";
  readonly status: number;
  readonly requestId: string | null;
  readonly type: string | null;
  readonly code: string | null;
  readonly responseBody: unknown;

  constructor(options: TroqpayAPIErrorOptions) {
    super(
      options.error?.message ??
        `troqpay API request failed with status ${options.status}`
    );

    this.status = options.status;
    this.requestId = options.error?.requestId ?? options.requestId;
    this.type = options.error?.type ?? null;
    this.code = options.error?.code ?? null;
    this.responseBody = options.responseBody;
  }
}

export class TroqpayConfigurationError extends Error {
  readonly name = "TroqpayConfigurationError";
}
