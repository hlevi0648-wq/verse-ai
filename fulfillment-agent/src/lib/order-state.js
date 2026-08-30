import { createClient } from "@supabase/supabase-js";

let supabase = null;

function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  supabase = createClient(url, key);
  return supabase;
}

export async function hasProcessedEvent(eventId) {
  if (!eventId) return false;

  const client = getSupabase();
  const { data, error } = await client
    .from("fulfillment_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function recordEvent(eventId, data = {}) {
  if (!eventId) return;

  const client = getSupabase();

  const { error } = await client
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
