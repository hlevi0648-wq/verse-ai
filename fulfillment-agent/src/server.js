import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import Stripe from "stripe";
import { hasProcessedEvent, recordEvent } from "./lib/order-state.js";
import { syncOrder } from "./routes/orders.js";
import { processFulfillment } from "./routes/fulfillment.js";
import { createCheckout } from "./routes/checkout.js";

const app = express();
const port = process.env.PORT || 3000;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

function verifyShopifySignature(req) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const signature = req.get("X-Shopify-Hmac-Sha256");

  if (!secret || !signature || !req.rawBody) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(signature);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = Buffer.from(buf);
    }
  })
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "verse-ai-fulfillment-agent"
  });
});

app.post("/api/webhooks/shopify", async (req, res) => {
  if (!verifyShopifySignature(req)) {
    return res.status(401).json({
      error: "Invalid Shopify signature"
    });
  }

  const eventId =
    req.get("X-Shopify-Webhook-Id") ||
    req.get("X-Request-ID");

  if (eventId && await hasProcessedEvent(eventId)) {
    return res.status(200).json({
      accepted: true,
      duplicate: true
    });
  }

  if (eventId) {
    await recordEvent(eventId, {
      provider: "shopify",
      topic: req.get("X-Shopify-Topic") || "unknown"
    });
  }

  console.log("Verified Shopify webhook");

  return res.status(202).json({
    accepted: true
  });
});

app.post("/api/webhooks/stripe", async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({
      error: "Stripe webhook configuration is missing"
    });
  }

  const signature = req.get("Stripe-Signature");

  if (!signature || !req.rawBody) {
    return res.status(400).json({
      error: "Missing Stripe signature"
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Stripe signature verification failed");
    return res.status(400).json({
      error: "Invalid Stripe webhook signature"
    });
  }

  console.log(`Verified Stripe event: ${event.type}`);

  if (await hasProcessedEvent(event.id)) {
    return res.status(200).json({
      received: true,
      duplicate: true
    });
  }

  await recordEvent(event.id, {
    provider: "stripe",
    type: event.type
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("Checkout completed:", session.id);

    // Fulfillment should only continue after authoritative
    // payment verification in the next stage.
  }

  return res.status(200).json({
    received: true
  });
});

app.post("/api/payments/verify", async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      error: "Stripe is not configured"
    });
  }

  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({
      error: "paymentIntentId is required"
    });
  }

  try {
    const paymentIntent =
      await stripe.paymentIntents.retrieve(paymentIntentId);

    return res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      paid: paymentIntent.status === "succeeded"
    });
  } catch {
    return res.status(404).json({
      error: "Payment could not be verified"
    });
  }
});

app.post("/api/orders/sync", syncOrder);
app.post("/api/checkout_sessions", createCheckout);

app.post("/api/invoices/create", (_req, res) => {
  res.status(501).json({
    error: "Invoice creation not configured yet"
  });
});

app.post("/api/fulfillment/process", processFulfillment);

export default app;
