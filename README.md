# GameTrade Hub

Static web app prototype for a gaming account marketplace with Supabase-ready listings.

## Run Locally

```bash
npm start
```

Open:

```text
http://localhost:4173
```

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase-schema.sql`.
4. Copy `supabase-config.example.js` into `supabase-config.js`.
5. Paste your project URL and public anon key:

```js
export const SUPABASE_URL = "https://your-project-ref.supabase.co";
export const SUPABASE_ANON_KEY = "your-public-anon-key";
```

When configured, the marketplace reads `active` listings from Supabase. Seller form submissions are inserted as `pending_review` listings for admin moderation.
