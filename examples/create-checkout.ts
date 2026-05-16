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
