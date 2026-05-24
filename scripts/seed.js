require("dotenv").config();

const { getSupabase } = require("../db");

const listings = [
  {
    game: "Shadow Ops",
    title: "Elite tactical account with rare loadouts",
    price: 2450,
    level: 94,
    rank: "Diamond II",
    platform: "PC",
    region: "Europe",
    linked_email_included: true,
    original_email_included: true,
    two_factor_status: "will_be_removed",
    skins_count: 42,
    items_count: 121,
    coins_balance: 84000,
    account_age_months: 36,
    seller: "KofiRanked",
    rating: 4.9,
    sales: 38,
    verified: true,
    age: "3 years",
    transfer: "Email change, password reset, 2FA update",
    inventory: "42 legendary skins, 11 operator bundles, 68 badges, 84k coins",
    ban_history: "No bans or restrictions reported",
    views: 1480,
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=80",
    description: "Competitive-ready account with documented rank history, high-value cosmetics, and clean transfer checklist.",
    status: "approved",
    inspection_period_hours: 48,
  },
  {
    game: "Legends Rift",
    title: "Master tier profile with limited champion skins",
    price: 3180,
    level: 128,
    rank: "Master",
    platform: "PC",
    region: "North America",
    linked_email_included: true,
    original_email_included: false,
    two_factor_status: "will_be_removed",
    skins_count: 93,
    items_count: 124,
    coins_balance: 0,
    account_age_months: 60,
    seller: "NanaCarry",
    rating: 4.8,
    sales: 26,
    verified: true,
    age: "5 years",
    transfer: "Username login plus recovery email update",
    inventory: "93 skins, 31 rare emotes, season rewards from 2021-2025",
    ban_history: "One chat warning disclosed, no bans",
    views: 2012,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80",
    description: "High-rank account with long account age, strong champion pool, and safe public proof video.",
    status: "approved",
    inspection_period_hours: 72,
  },
  {
    game: "Street Ball Mobile",
    title: "Maxed mobile account with premium squad",
    price: 980,
    level: 72,
    rank: "Pro League",
    platform: "Mobile",
    region: "West Africa",
    linked_email_included: false,
    original_email_included: false,
    two_factor_status: "disabled",
    skins_count: 17,
    items_count: 57,
    coins_balance: 32000,
    account_age_months: 24,
    seller: "AmaPlayz",
    rating: 4.7,
    sales: 19,
    verified: true,
    age: "2 years",
    transfer: "Game ID binding and social login handoff",
    inventory: "8 premium players, 17 court skins, 32k coins",
    ban_history: "Clean",
    views: 760,
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80",
    description: "Budget-friendly account for quick competitive entry with screenshot and video proof.",
    status: "approved",
    inspection_period_hours: 24,
  },
];

const games = [
  {
    name: "Call of Duty",
    publisher: "Activision",
    is_allowed: false,
    terms_warning: "Account transfers may violate publisher terms and may lead to bans or account recovery risk.",
  },
  {
    name: "FIFA / EA FC",
    publisher: "Electronic Arts",
    is_allowed: false,
    terms_warning: "EA account transfers may violate publisher terms and may lead to account restrictions.",
  },
  {
    name: "Fortnite",
    publisher: "Epic Games",
    is_allowed: true,
    terms_warning: "Seller and buyer must verify current publisher terms before transfer.",
  },
  {
    name: "PUBG",
    publisher: "Krafton",
    is_allowed: true,
    terms_warning: "Seller and buyer must verify current publisher terms before transfer.",
  },
];

const reviews = [
  {
    title: "Cosmic Siege level 102 account",
    seller: "FastVault",
    reason: "Video proof hides inventory during rare item claim.",
    image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Battle Craft account with historic badge",
    seller: "PixelTrade",
    reason: "Potential prohibited publisher terms. Needs admin decision.",
    image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=400&q=80",
  },
];

async function seed() {
  const supabase = getSupabase();

  await supabase.from("moderation_reviews").delete().neq("id", 0);
  await supabase.from("listings").delete().neq("id", 0);
  await supabase.from("games").delete().neq("id", 0);

  const { error: gameError } = await supabase.from("games").insert(games);
  if (gameError) throw gameError;

  const { data: createdListings, error: listingError } = await supabase
    .from("listings")
    .insert(listings)
    .select("id");

  if (listingError) throw listingError;

  const { error: reviewError } = await supabase.from("moderation_reviews").insert(reviews);
  if (reviewError) throw reviewError;

  console.log(`Seeded Supabase with ${createdListings.length} listings and ${reviews.length} moderation reviews.`);
}

seed().catch((error) => {
  console.error("Could not seed Supabase.");
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env, then run npm.cmd run seed again.");
  console.error(error.message);
  process.exitCode = 1;
});
