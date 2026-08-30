import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

if (!secret) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(secret);

export async function verifyPayment(paymentIntentId) {
  if (!paymentIntentId) {
    throw new Error("Missing paymentIntentId");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(
    paymentIntentId
  );

  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata,
    paid: paymentIntent.status === "succeeded"
  };
}

export function paymentMatchesOrder(payment, order) {
  const expectedOrderId = payment.metadata?.shopify_order_id;

  if (!expectedOrderId) {
    return false;
  }

  return (
    expectedOrderId === order.id ||
    expectedOrderId === String(order.id).replace("gid://shopify/Order/", "")
  );
}
