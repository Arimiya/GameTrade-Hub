require("dotenv").config();

const express = require("express");
const path = require("path");
const { getSupabase } = require("./db");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/api/config", (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  });
});

async function getAuthUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    throw new Error("Missing Supabase access token.");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error(error?.message || "Invalid Supabase access token.");
  }

  return data.user;
}

function profileFromBody(user, body) {
  const fullName = String(body.fullName || body.full_name || "").trim();
  const displayName = String(body.displayName || body.display_name || fullName || user.email || "New user").trim();

  return {
    id: user.id,
    full_name: fullName || null,
    display_name: displayName,
    username: String(body.username || "").trim() || null,
    country: String(body.country || "").trim() || null,
    phone: String(body.phone || "").trim() || null,
    role: String(body.role || "buyer").trim(),
    verification_status: "email_pending",
    kyc_status: "not_started",
  };
}

app.get("/api/profile", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const supabase = getSupabase();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) throw error;
    res.json({ user: { id: user.id, email: user.email }, profile: data });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.post("/api/profile", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const supabase = getSupabase();
    const profile = profileFromBody(user, req.body);

    if (!profile.display_name || !profile.role) {
      res.status(400).json({ error: "Display name and account type are required." });
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profile, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

function listingFromBody(body) {
  return {
    game: String(body.game || "").trim(),
    title: String(body.title || "").trim(),
    price: Number(body.price || 0),
    level: Number(body.level || 0),
    rank: String(body.rank || "").trim(),
    platform: String(body.platform || "PC").trim(),
    region: String(body.region || "").trim(),
    linked_email_included: body.linkedEmailIncluded === "on" || Boolean(body.linked_email_included),
    original_email_included: body.originalEmailIncluded === "on" || Boolean(body.original_email_included),
    two_factor_status: String(body.twoFactorStatus || body.two_factor_status || "unknown").trim(),
    skins_count: Number(body.skinsCount || body.skins_count || 0),
    items_count: Number(body.itemsCount || body.items_count || 0),
    coins_balance: Number(body.coinsBalance || body.coins_balance || 0),
    account_age_months: body.accountAgeMonths || body.account_age_months ? Number(body.accountAgeMonths || body.account_age_months) : null,
    seller: String(body.seller || "Verified Seller").trim(),
    rating: Number(body.rating || 0),
    sales: Number(body.sales || 0),
    verified: Boolean(body.verified),
    age: String(body.age || "New listing").trim(),
    transfer: String(body.transfer || "").trim(),
    inventory: String(body.inventory || "Seller proof pending review").trim(),
    ban_history: String(body.banHistory || body.ban_history || "Pending admin review").trim(),
    views: Number(body.views || 0),
    image:
      String(body.image || "").trim() ||
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80",
    description: String(body.description || "").trim(),
    status: String(body.status || "pending_review").trim(),
    inspection_period_hours: Number(body.inspectionPeriodHours || body.inspection_period_hours || 48),
    ownership_declared: true,
    terms_risk_acknowledged: true,
  };
}

function publicListing(listing) {
  return {
    ...listing,
    banHistory: listing.ban_history,
    linkedEmailIncluded: listing.linked_email_included,
    originalEmailIncluded: listing.original_email_included,
    twoFactorStatus: listing.two_factor_status,
    skinsCount: listing.skins_count,
    itemsCount: listing.items_count,
    coinsBalance: listing.coins_balance,
    accountAgeMonths: listing.account_age_months,
    inspectionPeriodHours: listing.inspection_period_hours,
  };
}

app.get("/api/health", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("listings").select("id", { count: "exact", head: true });
    if (error) throw error;
    res.json({ ok: true, database: "supabase", project: process.env.SUPABASE_URL });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get("/api/listings", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json((data || []).map(publicListing));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/listings", async (req, res) => {
  try {
    const supabase = getSupabase();
    const listing = listingFromBody(req.body);

    if (
      !listing.game ||
      !listing.title ||
      !listing.price ||
      !listing.level ||
      !listing.rank ||
      !listing.region ||
      !listing.transfer ||
      !listing.description
    ) {
      res.status(400).json({ error: "Missing required listing fields." });
      return;
    }

    const { data: createdListing, error: listingError } = await supabase
      .from("listings")
      .insert(listing)
      .select("*")
      .single();

    if (listingError) throw listingError;

    const { error: reviewError } = await supabase.from("moderation_reviews").insert({
      title: createdListing.title,
      seller: createdListing.seller,
      reason: "New seller submission awaiting proof review.",
      image: createdListing.image,
      listing_id: createdListing.id,
    });

    if (reviewError) throw reviewError;

    res.status(201).json(publicListing(createdListing));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reviews", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("moderation_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(
      (data || []).map((review) => ({
        ...review,
        listingId: review.listing_id,
      })),
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`GameTrade Hub running at http://localhost:${port}`);
});
