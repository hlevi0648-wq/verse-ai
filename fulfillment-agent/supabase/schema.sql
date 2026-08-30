create table if not exists fulfillment_events (
  id bigint generated always as identity primary key,
  event_id text not null unique,
  provider text not null,
  event_type text,
  order_id text,
  status text not null default 'received',
  payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fulfillment_events_order_id_idx
  on fulfillment_events(order_id);

create index if not exists fulfillment_events_status_idx
  on fulfillment_events(status);
