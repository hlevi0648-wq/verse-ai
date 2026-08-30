import { getOrder } from "../lib/shopify.js";

export async function syncOrder(req, res) {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({
      error: "orderId is required"
    });
  }

  try {
    const order = await getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        error: "Shopify order not found"
      });
    }

    return res.json({
      ok: true,
      order
    });
  } catch (error) {
    console.error("Shopify order lookup failed:", error.message);

    return res.status(502).json({
      error: "Shopify order lookup failed"
    });
  }
}
