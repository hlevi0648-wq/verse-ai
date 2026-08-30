import { getOrder } from "../lib/shopify.js";

export async function processFulfillment(req, res) {
  const { orderId, paymentIntentId } = req.body;

  if (!orderId || !paymentIntentId) {
    return res.status(400).json({
      error: "orderId and paymentIntentId are required"
    });
  }

  try {
    const order = await getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        error: "Shopify order not found"
      });
    }

    if (order.displayFinancialStatus !== "PAID") {
      return res.status(409).json({
        error: "Order is not marked paid",
        financialStatus: order.displayFinancialStatus
      });
    }

    return res.status(202).json({
      accepted: true,
      orderId: order.id,
      fulfillment: "payment_verified"
    });
  } catch (error) {
    console.error("Fulfillment validation failed:", error.message);

    return res.status(502).json({
      error: "Unable to validate fulfillment"
    });
  }
}
