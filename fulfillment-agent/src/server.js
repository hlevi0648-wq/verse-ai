import "dotenv/config";
import crypto from "node:crypto";
import express from "express";

const app = express();
const port = process.env.PORT || 3000;

function verifyShopifySignature(req) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const signature = req.get("X-Shopify-Hmac-Sha256");

  if (!secret || !signature || !req.rawBody) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
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

app.post("/api/webhooks/shopify", (req, res) => {
  if (!verifyShopifySignature(req)) {
    return res.status(401).json({ error: "Invalid Shopify signature" });
  }

  console.log("Verified Shopify webhook");
  return res.status(202).json({ accepted: true });
});

app.post("/api/webhooks/stripe", (_req, res) => {
  return res.status(501).json({
    error: "Stripe signature verification not configured yet"
  });
});

app.post("/api/orders/sync", (_req, res) => {
  res.status(501).json({ error: "Not configured" });
});

app.post("/api/payments/verify", (_req, res) => {
  res.status(501).json({ error: "Not configured" });
});

app.post("/api/invoices/create", (_req, res) => {
  res.status(501).json({ error: "Not configured" });
});

app.post("/api/fulfillment/process", (_req, res) => {
  res.status(501).json({ error: "Not configured" });
});

app.listen(port, () => {
  console.log(`Verse AI fulfillment agent listening on ${port}`);
});
