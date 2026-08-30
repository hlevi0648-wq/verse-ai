import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, key);

export async function hasProcessedEvent(eventId) {
  const { data, error } = await supabase
    .from("fulfillment_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

export async function recordEvent(eventId, data = {}) {
  const { error } = await supabase
    .from("fulfillment_events")
    .insert({
      event_id: eventId,
      provider: data.provider || "unknown",
      event_type: data.type || null,
      order_id: data.order_id || null,
      status: "received",
      payload: data.payload || {}
    });

  if (error) throw error;
}
