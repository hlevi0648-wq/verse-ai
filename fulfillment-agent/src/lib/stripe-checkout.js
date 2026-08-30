import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;

if (!secret) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(secret);

export async function createCheckoutForOrder({
  shopifyOrderId,
  lineItems,
  successUrl,
  cancelUrl
}) {
  if (!shopifyOrderId) {
    throw new Error("Missing shopifyOrderId");
  }

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new Error("Missing lineItems");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",

    line_items: lineItems,

    success_url: successUrl,
    cancel_url: cancelUrl,

    metadata: {
      shopify_order_id: String(shopifyOrderId)
    },

    payment_intent_data: {
      metadata: {
        shopify_order_id: String(shopifyOrderId)
      }
    }
  });

  return {
    id: session.id,
    url: session.url
  };
}
