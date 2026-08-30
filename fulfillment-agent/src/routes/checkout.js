import { createCheckoutForOrder } from "../lib/stripe-checkout.js";

export async function createCheckout(req, res) {
  const {
    shopifyOrderId,
    priceId,
    quantity = 1,
    successUrl,
    cancelUrl
  } = req.body;

  if (!shopifyOrderId || !priceId) {
    return res.status(400).json({
      error: "shopifyOrderId and priceId are required"
    });
  }

  if (!String(priceId).startsWith("price_")) {
    return res.status(400).json({
      error: "Invalid Stripe Price ID"
    });
  }

  try {
    const session = await createCheckoutForOrder({
      shopifyOrderId,
      lineItems: [
        {
          price: priceId,
          quantity: Math.max(1, Number(quantity) || 1)
        }
      ],
      successUrl: successUrl || "https://example.com/success",
      cancelUrl: cancelUrl || "https://example.com/cancel"
    });

    return res.status(201).json({
      ok: true,
      sessionId: session.id,
      checkoutUrl: session.url
    });
  } catch (error) {
    console.error("Checkout creation failed:", error.message);

    return res.status(502).json({
      error: "Unable to create Checkout Session"
    });
  }
}
