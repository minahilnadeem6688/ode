-- ode: creations, orders and stock. Safe to run on every cold start.

create table if not exists creations (
  id          text primary key,
  cafe_id     text not null,
  data        jsonb not null,
  rating      smallint check (rating between 1 and 5),
  chips       text[],
  created_at  timestamptz not null default now()
);
create index if not exists creations_cafe_day on creations (cafe_id, created_at desc);

create table if not exists orders (
  id            text primary key,
  cafe_id       text not null,
  code          text not null,
  creation_id   text not null references creations (id),
  size          text not null check (size in ('regular', 'large')),
  price         integer not null,
  status        text not null default 'new' check (status in ('new', 'making', 'ready', 'collected')),
  placed_at     timestamptz not null default now(),
  making_at     timestamptz,
  ready_at      timestamptz,
  collected_at  timestamptz
);
create index if not exists orders_board on orders (cafe_id, status, placed_at);

create table if not exists stock_out (
  cafe_id  text not null,
  item_id  text not null,
  at       timestamptz not null default now(),
  primary key (cafe_id, item_id)
);

-- Cafés asking for ode from the website
create table if not exists leads (
  id          bigserial primary key,
  cafe_name   text not null,
  name        text not null,
  city        text not null,
  contact     text not null,
  message     text,
  created_at  timestamptz not null default now()
);
