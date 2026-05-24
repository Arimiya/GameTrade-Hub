-- GameTrade Hub Supabase schema
-- Run this in Supabase SQL Editor before using the app.
-- This resets GameTrade Hub tables, so run it before you have production data.

create extension if not exists pgcrypto;

drop table if exists public.reviews cascade;
drop table if exists public.disputes cascade;
drop table if exists public.dispute_evidence cascade;
drop table if exists public.messages cascade;
drop table if exists public.secure_deliveries cascade;
drop table if exists public.orders cascade;
drop table if exists public.withdrawals cascade;
drop table if exists public.wallet_transactions cascade;
drop table if exists public.wallets cascade;
drop table if exists public.listing_badges cascade;
drop table if exists public.profile_badges cascade;
drop table if exists public.badges cascade;
drop table if exists public.moderation_reviews cascade;
drop table if exists public.listing_media cascade;
drop table if exists public.verification_submissions cascade;
drop table if exists public.account_value_estimates cascade;
drop table if exists public.listings cascade;
drop table if exists public.games cascade;
drop table if exists public.profiles cascade;

drop type if exists withdrawal_status cascade;
drop type if exists wallet_transaction_type cascade;
drop type if exists delivery_status cascade;
drop type if exists order_status cascade;
drop type if exists dispute_reason cascade;
drop type if exists dispute_resolution cascade;
drop type if exists listing_status cascade;

create type listing_status as enum (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'sold',
  'removed'
);

create type order_status as enum (
  'pending_payment',
  'paid_escrow',
  'awaiting_delivery',
  'delivered',
  'buyer_confirmed',
  'completed',
  'disputed',
  'cancelled',
  'refunded'
);

create type delivery_status as enum (
  'not_submitted',
  'submitted',
  'buyer_viewed',
  'accepted',
  'disputed',
  'expired'
);

create type wallet_transaction_type as enum (
  'deposit',
  'purchase_hold',
  'seller_pending_credit',
  'release_to_seller',
  'refund_to_buyer',
  'platform_commission',
  'withdrawal',
  'adjustment'
);

create type withdrawal_status as enum (
  'pending',
  'approved',
  'paid',
  'rejected',
  'cancelled'
);

create type dispute_reason as enum (
  'wrong_account_details',
  'account_not_as_described',
  'account_recovered_by_seller',
  'login_not_working',
  'account_banned',
  'missing_items',
  'fake_proof',
  'other'
);

create type dispute_resolution as enum (
  'refund_buyer',
  'release_to_seller',
  'partial_refund',
  'ban_seller',
  'suspend_listing',
  'cancel_order',
  'request_more_evidence'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text not null,
  username text unique,
  avatar_url text,
  country text,
  phone text,
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'moderator', 'admin')),
  verification_status text not null default 'unverified',
  kyc_status text not null default 'not_started' check (kyc_status in ('not_started', 'pending', 'approved', 'rejected')),
  seller_rating numeric(3, 2) not null default 0,
  buyer_rating numeric(3, 2) not null default 0,
  completed_sales integer not null default 0 check (completed_sales >= 0),
  completed_purchases integer not null default 0 check (completed_purchases >= 0),
  successful_deliveries integer not null default 0 check (successful_deliveries >= 0),
  dispute_count integer not null default 0 check (dispute_count >= 0),
  refund_count integer not null default 0 check (refund_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.games (
  id bigint generated always as identity primary key,
  name text not null unique,
  publisher text,
  is_allowed boolean not null default true,
  terms_warning text,
  created_at timestamptz not null default now()
);

create table if not exists public.wallets (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  buyer_wallet_balance numeric(12, 2) not null default 0 check (buyer_wallet_balance >= 0),
  held_balance numeric(12, 2) not null default 0 check (held_balance >= 0),
  seller_pending_balance numeric(12, 2) not null default 0 check (seller_pending_balance >= 0),
  seller_available_balance numeric(12, 2) not null default 0 check (seller_available_balance >= 0),
  platform_commission_balance numeric(12, 2) not null default 0 check (platform_commission_balance >= 0),
  currency text not null default 'GHS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id) on delete set null,
  order_id bigint,
  type wallet_transaction_type not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'GHS',
  reference text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id bigint generated always as identity primary key,
  seller_profile_id uuid references public.profiles(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'GHS',
  payout_method text not null,
  payout_reference text,
  status withdrawal_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.listings (
  id bigint generated always as identity primary key,
  seller_profile_id uuid references public.profiles(id) on delete set null,
  game_id bigint references public.games(id) on delete set null,
  game text not null,
  title text not null,
  description text not null,
  price numeric(12, 2) not null check (price > 0),
  currency text not null default 'GHS',
  level integer not null check (level >= 0),
  rank text not null,
  platform text not null,
  region text not null,
  linked_email_included boolean not null default false,
  original_email_included boolean not null default false,
  two_factor_status text not null default 'unknown' check (two_factor_status in ('enabled', 'disabled', 'unknown', 'will_be_removed')),
  skins_count integer not null default 0 check (skins_count >= 0),
  items_count integer not null default 0 check (items_count >= 0),
  coins_balance integer not null default 0 check (coins_balance >= 0),
  account_age_months integer check (account_age_months is null or account_age_months >= 0),
  seller text not null default 'Verified Seller',
  rating numeric(3, 2) not null default 0,
  sales integer not null default 0 check (sales >= 0),
  verified boolean not null default false,
  age text not null default 'New listing',
  transfer text not null,
  inventory text not null default 'Seller proof pending review',
  ban_history text not null default 'Pending admin review',
  views integer not null default 0 check (views >= 0),
  image text not null,
  status listing_status not null default 'pending_review',
  inspection_period_hours integer not null default 48 check (inspection_period_hours between 24 and 72),
  legal_warning text not null default 'Account transfers may violate the terms of the game publisher. Buyers understand that purchased accounts may be banned, restricted, or recovered. The platform provides payment protection but cannot guarantee that the game publisher will allow the transfer.',
  ownership_declared boolean not null default true,
  terms_risk_acknowledged boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_value_estimates (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id) on delete set null,
  game text not null,
  platform text not null,
  region text,
  level integer not null default 0,
  rank text,
  skins_count integer not null default 0,
  items_count integer not null default 0,
  coins_balance integer not null default 0,
  account_age_months integer,
  ban_history text,
  estimated_min_price numeric(12, 2) not null default 0,
  estimated_max_price numeric(12, 2) not null default 0,
  currency text not null default 'GHS',
  created_at timestamptz not null default now()
);

create table if not exists public.verification_submissions (
  id bigint generated always as identity primary key,
  listing_id bigint references public.listings(id) on delete cascade,
  seller_profile_id uuid references public.profiles(id) on delete set null,
  account_dashboard_screenshot_url text,
  login_video_url text,
  in_game_profile_video_url text,
  rank_level_proof_url text,
  inventory_proof_url text,
  recording_date date,
  visible_seller_username text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'changes_requested', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.listing_media (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  url text not null,
  thumbnail_url text,
  processing_status text not null default 'ready',
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_reviews (
  id bigint generated always as identity primary key,
  listing_id bigint references public.listings(id) on delete cascade,
  title text not null,
  seller text not null,
  reason text not null,
  image text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'changes_requested', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.badges (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_badges (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_id bigint not null references public.badges(id) on delete cascade,
  awarded_by_profile_id uuid references public.profiles(id) on delete set null,
  awarded_at timestamptz not null default now(),
  primary key (profile_id, badge_id)
);

create table if not exists public.listing_badges (
  listing_id bigint not null references public.listings(id) on delete cascade,
  badge_id bigint not null references public.badges(id) on delete cascade,
  awarded_by_profile_id uuid references public.profiles(id) on delete set null,
  awarded_at timestamptz not null default now(),
  primary key (listing_id, badge_id)
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings(id) on delete restrict,
  buyer_profile_id uuid references public.profiles(id) on delete set null,
  seller_profile_id uuid references public.profiles(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'GHS',
  platform_fee numeric(12, 2) not null default 0 check (platform_fee >= 0),
  status order_status not null default 'pending_payment',
  trade_assurance_hold_amount numeric(12, 2) not null default 0 check (trade_assurance_hold_amount >= 0),
  seller_pending_amount numeric(12, 2) not null default 0 check (seller_pending_amount >= 0),
  platform_commission_amount numeric(12, 2) not null default 0 check (platform_commission_amount >= 0),
  inspection_period_hours integer not null default 48 check (inspection_period_hours between 24 and 72),
  inspection_deadline_at timestamptz,
  auto_release_at timestamptz,
  payment_provider text,
  payment_reference text,
  delivery_notes text,
  delivery_submitted_at timestamptz,
  buyer_confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_transactions
add constraint wallet_transactions_order_id_fkey
foreign key (order_id) references public.orders(id) on delete set null;

create table if not exists public.secure_deliveries (
  id bigint generated always as identity primary key,
  order_id bigint not null unique references public.orders(id) on delete cascade,
  seller_profile_id uuid references public.profiles(id) on delete set null,
  buyer_profile_id uuid references public.profiles(id) on delete set null,
  encrypted_login text,
  encrypted_password text,
  encrypted_backup_codes text,
  transfer_instructions text,
  platform_details text,
  original_email_access_status text,
  status delivery_status not null default 'not_submitted',
  buyer_viewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  order_id bigint references public.orders(id) on delete cascade,
  listing_id bigint references public.listings(id) on delete cascade,
  sender_profile_id uuid references public.profiles(id) on delete set null,
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  body text not null,
  moderation_status text not null default 'clean',
  created_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  opened_by_profile_id uuid references public.profiles(id) on delete set null,
  reason dispute_reason not null,
  status text not null default 'open' check (status in ('open', 'awaiting_evidence', 'resolved', 'cancelled')),
  resolution dispute_resolution,
  requested_refund_amount numeric(12, 2) check (requested_refund_amount is null or requested_refund_amount >= 0),
  approved_refund_amount numeric(12, 2) check (approved_refund_amount is null or approved_refund_amount >= 0),
  moderator_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.dispute_evidence (
  id bigint generated always as identity primary key,
  dispute_id bigint not null references public.disputes(id) on delete cascade,
  submitted_by_profile_id uuid references public.profiles(id) on delete set null,
  evidence_type text not null check (evidence_type in ('screenshot', 'video', 'text', 'file')),
  evidence_url text,
  body text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  buyer_profile_id uuid references public.profiles(id) on delete set null,
  seller_profile_id uuid references public.profiles(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_game_idx on public.listings(game);
create index if not exists listings_platform_idx on public.listings(platform);
create index if not exists listings_region_idx on public.listings(region);
create index if not exists listings_price_idx on public.listings(price);
create index if not exists listings_created_at_idx on public.listings(created_at desc);
create index if not exists moderation_reviews_created_at_idx on public.moderation_reviews(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_auto_release_at_idx on public.orders(auto_release_at);
create index if not exists wallet_transactions_profile_idx on public.wallet_transactions(profile_id, created_at desc);
create index if not exists disputes_status_idx on public.disputes(status);
create index if not exists verification_submissions_status_idx on public.verification_submissions(status);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.listings enable row level security;
alter table public.account_value_estimates enable row level security;
alter table public.verification_submissions enable row level security;
alter table public.listing_media enable row level security;
alter table public.moderation_reviews enable row level security;
alter table public.badges enable row level security;
alter table public.profile_badges enable row level security;
alter table public.listing_badges enable row level security;
alter table public.orders enable row level security;
alter table public.secure_deliveries enable row level security;
alter table public.messages enable row level security;
alter table public.disputes enable row level security;
alter table public.dispute_evidence enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Public can read approved listings" on public.listings;
create policy "Public can read approved listings"
on public.listings for select
using (status = 'approved' or status = 'pending_review');

drop policy if exists "Public can read listing media" on public.listing_media;
create policy "Public can read listing media"
on public.listing_media for select
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_media.listing_id
      and listings.status in ('approved', 'pending_review')
  )
);

drop policy if exists "Public can read games" on public.games;
create policy "Public can read games"
on public.games for select
using (true);

drop policy if exists "Public can read seller reviews" on public.reviews;
create policy "Public can read seller reviews"
on public.reviews for select
using (true);

drop policy if exists "Public can read badges" on public.badges;
create policy "Public can read badges"
on public.badges for select
using (true);

drop policy if exists "Public can read profile badges" on public.profile_badges;
create policy "Public can read profile badges"
on public.profile_badges for select
using (true);

drop policy if exists "Public can read listing badges" on public.listing_badges;
create policy "Public can read listing badges"
on public.listing_badges for select
using (true);

drop policy if exists "Service role full access profiles" on public.profiles;
create policy "Service role full access profiles"
on public.profiles
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access games" on public.games;
create policy "Service role full access games"
on public.games
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access wallets" on public.wallets;
create policy "Service role full access wallets"
on public.wallets
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access wallet transactions" on public.wallet_transactions;
create policy "Service role full access wallet transactions"
on public.wallet_transactions
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access withdrawals" on public.withdrawals;
create policy "Service role full access withdrawals"
on public.withdrawals
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access listings" on public.listings;
create policy "Service role full access listings"
on public.listings
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access account value estimates" on public.account_value_estimates;
create policy "Service role full access account value estimates"
on public.account_value_estimates
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access verification submissions" on public.verification_submissions;
create policy "Service role full access verification submissions"
on public.verification_submissions
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access listing media" on public.listing_media;
create policy "Service role full access listing media"
on public.listing_media
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access moderation reviews" on public.moderation_reviews;
create policy "Service role full access moderation reviews"
on public.moderation_reviews
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access badges" on public.badges;
create policy "Service role full access badges"
on public.badges
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access profile badges" on public.profile_badges;
create policy "Service role full access profile badges"
on public.profile_badges
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access listing badges" on public.listing_badges;
create policy "Service role full access listing badges"
on public.listing_badges
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access orders" on public.orders;
create policy "Service role full access orders"
on public.orders
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access secure deliveries" on public.secure_deliveries;
create policy "Service role full access secure deliveries"
on public.secure_deliveries
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access messages" on public.messages;
create policy "Service role full access messages"
on public.messages
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access disputes" on public.disputes;
create policy "Service role full access disputes"
on public.disputes
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access dispute evidence" on public.dispute_evidence;
create policy "Service role full access dispute evidence"
on public.dispute_evidence
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role full access reviews" on public.reviews;
create policy "Service role full access reviews"
on public.reviews
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into public.badges (code, name, description) values
  ('verified_seller', 'Verified Seller', 'Seller passed identity or admin review.'),
  ('proof_approved', 'Proof Approved', 'Listing proof was reviewed by an admin.'),
  ('high_trust_seller', 'High Trust Seller', 'Seller has strong delivery and dispute history.'),
  ('instant_delivery', 'Instant Delivery', 'Listing supports fast delivery.'),
  ('manual_delivery', 'Manual Delivery', 'Seller manually transfers account details.'),
  ('trade_assurance', 'Trade Assurance Protected', 'Payment is held until buyer confirmation or dispute window expiration.')
on conflict (code) do nothing;
