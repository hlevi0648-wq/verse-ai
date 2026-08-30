const orders = new Map();

export function hasProcessedEvent(eventId) {
  return orders.has(eventId);
}

export function recordEvent(eventId, data = {}) {
  orders.set(eventId, {
    ...data,
    processedAt: new Date().toISOString()
  });
}

export function getOrderState(eventId) {
  return orders.get(eventId) || null;
}
