# @troqpay/sdk

Official JavaScript/TypeScript SDK for the troqpay API.

Use it from a backend runtime. Do not expose `trq_test_` or `trq_live_` keys in browser or mobile client code.

## Install

```bash
npm install @troqpay/sdk
```

## Quickstart

```ts
import { Troqpay } from "@troqpay/sdk";

const troqpay = new Troqpay({
  apiKey: process.env.TROQPAY_API_KEY!,
});

const checkout = await troqpay.checkouts.create(
  {
    amount: 12990,
    description: "Plano Pro",
    externalId: "order_1001",
    customer: {
      name: "Maria Silva",
      email: "maria@example.com",
    },
    metadata: {
      plan: "pro",
    },
  },
  {
    idempotencyKey: "order_1001",
  }
);

console.log(checkout.checkoutUrl);
```

## Staging or local API

```ts
const troqpay = new Troqpay({
  apiKey: process.env.TROQPAY_API_KEY!,
  baseUrl: "https://troqpay-api-staging-production.up.railway.app",
});
```

## Resources

```ts
await troqpay.checkouts.create(payload, { idempotencyKey: "order_1001" });
await troqpay.checkouts.retrieve("chk_4a8b3c1d5e6f2a9b0c1d");
await troqpay.balance.retrieve();
await troqpay.withdrawals.create(
  { rail: "BRL_PIX", amount: "100.00" },
  { idempotencyKey: "withdrawal_1001" }
);
await troqpay.withdrawals.retrieve("wdr_4a8b3c1d5e6f2a9b0c1d");
```

## Errors

Failed API responses throw `TroqpayAPIError`.

```ts
import { TroqpayAPIError } from "@troqpay/sdk";

try {
  await troqpay.balance.retrieve();
} catch (error) {
  if (error instanceof TroqpayAPIError) {
    console.log(error.status, error.code, error.requestId);
  }
}
```
