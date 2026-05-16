import { describe, expect, it } from "vitest";

import { Troqpay, TroqpayAPIError } from "../src/index.js";

function createJsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

describe("Troqpay", () => {
  it("creates a checkout with auth and idempotency headers", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      requests.push({ input, init });
      return createJsonResponse(
        {
          id: "chk_123",
          livemode: false,
          status: "PENDING",
          amount: 12990,
          currency: "BRL",
          description: "Plano Pro",
          externalId: "order_1001",
          checkoutUrl: "https://pay.troqpay.com/pay/chk_123",
          createdAt: "2026-05-16T00:00:00.000Z",
          expiresAt: "2026-05-16T00:30:00.000Z",
          paidAt: null,
          customer: null,
          pix: {
            copyPaste: "000201",
            qrCodeUrl: "https://api.troqpay.com/qrcode/chk_123.png",
          },
          settlement: {
            currency: "BRL",
            status: "PENDING",
            amount: null,
          },
          metadata: {},
        },
        { status: 201, headers: { "Request-Id": "req_123" } }
      );
    };

    const client = new Troqpay({
      apiKey: "trq_test_secret",
      baseUrl: "https://api.example.test/",
      fetch: fetchImpl,
    });

    const checkout = await client.checkouts.create(
      {
        amount: 12990,
        description: "Plano Pro",
      },
      {
        idempotencyKey: "order_1001",
        requestId: "req_client",
      }
    );

    expect(checkout.id).toBe("chk_123");
    expect(requests[0]?.input).toBe("https://api.example.test/v1/checkouts");
    expect(requests[0]?.init?.method).toBe("POST");

    const headers = requests[0]?.init?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer trq_test_secret");
    expect(headers.get("Idempotency-Key")).toBe("order_1001");
    expect(headers.get("Request-Id")).toBe("req_client");
  });

  it("raises a structured API error", async () => {
    const fetchImpl: typeof fetch = async () =>
      createJsonResponse(
        {
          error: {
            type: "auth_error",
            code: "unauthorized",
            message: "invalid or missing bearer token",
            requestId: "req_api",
          },
        },
        { status: 401, headers: { "Request-Id": "req_api" } }
      );

    const client = new Troqpay({
      apiKey: "trq_test_secret",
      fetch: fetchImpl,
    });

    await expect(client.balance.retrieve()).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
      requestId: "req_api",
    });

    await expect(client.balance.retrieve()).rejects.toBeInstanceOf(
      TroqpayAPIError
    );
  });

  it("retrieves balance", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      expect(input).toBe("https://api.troqpay.com/v1/balance");
      return createJsonResponse({
        livemode: false,
        currency: "BRL",
        grossAmount: "100.00",
        feeAmount: "2.00",
        pendingAmount: "0.00",
        availableAmount: "98.00",
        reservedAmount: "0.00",
        blockedAmount: "0.00",
      });
    };

    const client = new Troqpay({
      apiKey: "trq_test_secret",
      fetch: fetchImpl,
    });

    await expect(client.balance.retrieve()).resolves.toMatchObject({
      availableAmount: "98.00",
    });
  });
});
