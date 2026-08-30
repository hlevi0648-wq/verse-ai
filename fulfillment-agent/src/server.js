import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "verse-ai-fulfillment-agent"
  });
});

app.post("/api/webhooks/shopify", (req, res) => {
  console.log("Shopify webhook received");
  res.status(202).json({
    accepted: true,
    provider: "shopify"
  });
});

app.post("/api/webhooks/stripe", (req, res) => {
  console.log("Stripe webhook received");
  res.status(202).json({
    accepted: true,
    provider: "stripe"
  });
});

app.post("/api/orders/sync", (_req, res) => {
  res.status(501).json({
    error: "Order synchronization not configured yet"
  });
});

app.post("/api/payments/verify", (_req, res) => {
  res.status(501).json({
    error: "Payment verification not configured yet"
  });
});

app.post("/api/invoices/create", (_req, res) => {
  res.status(501).json({
    error: "Invoice provider not configured yet"
  });
});

app.post("/api/fulfillment/process", (_req, res) => {
  res.status(501).json({
    error: "Fulfillment provider not configured yet"
  });
});

app.listen(port, () => {
  console.log(`Verse AI fulfillment agent listening on ${port}`);
});
