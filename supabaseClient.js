import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function fetchApprovedListings() {
  if (!supabase) return { data: null, error: null };

  return supabase
    .from("listings")
    .select(
      `
        id,
        game,
        title,
        description,
        price,
        platform,
        region,
        account_level,
        rank,
        inventory_details,
        transfer_method,
        ban_history,
        status,
        views,
        seller_name,
        seller_rating,
        seller_sales,
        seller_verified,
        cover_image_url
      `,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });
}

export async function fetchAdminListings() {
  if (!supabase) return { data: null, error: null };

  return supabase
    .from("listings")
    .select(
      `
        id,
        game,
        title,
        description,
        price,
        platform,
        region,
        account_level,
        rank,
        inventory_details,
        transfer_method,
        ban_history,
        status,
        views,
        seller_name,
        seller_rating,
        seller_sales,
        seller_verified,
        cover_image_url
      `,
    )
    .order("created_at", { ascending: false });
}

export async function deleteListingById(id) {
  if (!supabase) return { data: null, error: null };

  return supabase.from("listings").delete().eq("id", id).select();
}

export async function submitListingForReview(listing) {
  if (!supabase) return { data: null, error: null };

  return supabase
    .from("listings")
    .insert({
      game: listing.game,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      platform: listing.platform,
      region: listing.region,
      account_level: listing.level,
      rank: listing.rank,
      inventory_details: listing.inventory,
      transfer_method: listing.transfer,
      ban_history: listing.banHistory,
      status: "pending_review",
      views: listing.views || 0,
      seller_name: listing.seller || "Current seller",
      seller_rating: 0,
      seller_sales: 0,
      seller_verified: false,
      cover_image_url: listing.image?.startsWith("http") ? listing.image : null,
    })
    .select()
    .single();
}

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function fetchUserProfile(userId) {
  if (!supabase || !userId) return { data: null, error: null };

  return supabase.from("profiles").select("*").eq("id", userId).single();
}

export async function ensureUserProfile(user) {
  if (!supabase || !user) return { data: null, error: null };

  return supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select()
    .single();
}

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe() {} } } };
  return supabase.auth.onAuthStateChange(callback);
}

export async function signInWithEmail(email, password) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        email,
      },
    },
  });
}

export async function signOut() {
  if (!supabase) return { error: null };
  return supabase.auth.signOut();
}

export function mapSupabaseListing(row) {
  return {
    id: row.id,
    game: row.game,
    title: row.title,
    price: Number(row.price || 0),
    level: row.account_level || 1,
    rank: row.rank || "Unranked",
    platform: row.platform || "PC",
    region: row.region || "Global",
    seller: row.seller_name || "Verified Seller",
    rating: Number(row.seller_rating || 0),
    sales: Number(row.seller_sales || 0),
    verified: Boolean(row.seller_verified),
    age: row.account_age || "Not provided",
    transfer: row.transfer_method || "Escrow transfer",
    inventory: row.inventory_details || "Inventory details pending",
    banHistory: row.ban_history || "Not disclosed",
    views: Number(row.views || 0),
    image:
      row.cover_image_url ||
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=80",
    description: row.description || "Seller has not added a description yet.",
  };
}
