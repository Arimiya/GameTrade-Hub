# GameTrade Hub

Gaming account marketplace prototype with a static frontend, Express API, and Supabase database schema.

## Run Locally

Install dependencies:

```powershell
npm.cmd install
```

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

Set these values in `.env` from your Supabase project settings:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
```

The anon key is used by the browser for Supabase Auth. Do not expose the service role key in frontend code or commit it to Git.

## Supabase Setup

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run `supabase/schema.sql`.
4. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env`.
5. Seed sample data:

```powershell
npm.cmd run seed
```

6. Start the app:

```powershell
npm.cmd run dev
```

Open http://localhost:3000.

## Main Tables

- `profiles`: user profile and seller reputation data
- `games`: game catalog and allowed/restricted game metadata
- `wallets`: buyer, held, seller pending, seller available, and commission balances
- `wallet_transactions`: audit trail for deposits, holds, releases, refunds, commissions, and withdrawals
- `withdrawals`: seller payout requests
- `listings`: gaming account listings
- `account_value_estimates`: saved account price calculator estimates
- `verification_submissions`: ownership and proof review uploads
- `listing_media`: listing screenshots and video proof
- `moderation_reviews`: admin listing review queue
- `badges`: marketplace trust badges
- `profile_badges`: seller and buyer badge assignments
- `listing_badges`: listing-level trust badges
- `orders`: escrow-style order tracking
- `secure_deliveries`: protected account handover records
- `messages`: buyer and seller messages
- `disputes`: order dispute records
- `dispute_evidence`: evidence uploaded during disputes
- `reviews`: buyer reviews for sellers

## Trust and Safety Model

The schema supports:

- Seller verification and KYC status
- Required account proof submissions before approval
- Trade Assurance wallet holds
- Secure delivery instead of sending credentials in public chat
- 24-72 hour buyer inspection windows
- Dispute reasons for wrong account details, recovered accounts, fake proof, bans, missing items, and failed login
- Admin resolutions for refunds, partial refunds, seller release, listing suspension, and seller bans
- Seller and buyer rating history
- Verification badges such as `Verified Seller`, `Proof Approved`, and `Trade Assurance Protected`
- Legal warning fields for games where publisher terms may restrict account transfers
