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
    paid: paymentIntent.status === "succeeded"
  };
}
