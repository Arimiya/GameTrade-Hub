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
        successful_deliveries,
        dispute_count,
        refund_count,
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
        successful_deliveries,
        dispute_count,
        refund_count,
        cover_image_url
      `,
    )
    .order("created_at", { ascending: false });
}

export async function deleteListingById(id) {
  if (!supabase) return { data: null, error: null };

  return supabase.from("listings").delete().eq("id", id).select();
}

export async function saveWalletDeposit({ userId, amount, method, reference }) {
  if (!supabase || !userId) return { data: null, error: null };

  return supabase.rpc("process_deposit_success", {
    p_user_id: userId,
    p_amount: amount,
    p_provider: method,
    p_reference: reference,
  });
}

export async function saveEscrowEvent({ userId, action, status, details }) {
  if (!supabase || !userId) return { data: null, error: null };

  return supabase
    .from("escrow_events")
    .insert({
      user_id: userId,
      action,
      status,
      details,
    })
    .select()
    .single();
}

export async function saveDispute({ userId, reason, description }) {
  if (!supabase || !userId) return { data: null, error: null };

  return supabase
    .from("disputes")
    .insert({
      user_id: userId,
      reason,
      description,
      status: "open",
    })
    .select()
    .single();
}

export async function saveSecureDelivery({ orderId, sellerId, delivery }) {
  if (!supabase || !orderId || !sellerId) return { data: null, error: null };

  return supabase
    .from("secure_deliveries")
    .insert({
      order_id: orderId,
      seller_id: sellerId,
      login_identifier: delivery.login,
      password_secret: delivery.password,
      backup_codes: delivery.backupCodes,
      transfer_instructions: delivery.instructions,
      platform_details: delivery.platformDetails,
      original_email_access_status: delivery.emailAccessStatus,
      status: "SUBMITTED",
    })
    .select()
    .single();
}

export async function saveAppActivity({ userId, activityType, payload }) {
  if (!supabase || !userId) return { data: null, error: null };

  return supabase
    .from("app_activities")
    .insert({
      user_id: userId,
      activity_type: activityType,
      payload,
    })
    .select()
    .single();
}

export async function fetchWallet(userId) {
  if (!supabase || !userId) return { data: null, error: null };

  return supabase
    .from("wallets")
    .select("balance, held_balance, currency")
    .eq("user_id", userId)
    .maybeSingle();
}

export async function fetchSellerBalance(userId) {
  if (!supabase || !userId) return { data: null, error: null };

  return supabase
    .from("seller_balances")
    .select("available_balance, pending_balance, currency")
    .eq("seller_id", userId)
    .maybeSingle();
}

export async function fetchWalletTransactions(userId) {
  if (!supabase || !userId) return { data: null, error: null };

  return supabase
    .from("wallet_transactions")
    .select("transaction_type, amount, status, payment_method, reference, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);
}

export async function buyListingWithWallet({ buyerId, listingId, amount }) {
  if (!supabase || !buyerId) return { data: null, error: null };

  return supabase.rpc("buy_with_wallet", {
    p_buyer_id: buyerId,
    p_listing_id: listingId,
    p_amount: amount,
  });
}

export async function createTradeAssuranceOrder({ buyerId, listingId, amount, provider }) {
  if (!supabase || !buyerId) return { data: null, error: null };

  return supabase.rpc("create_trade_assurance_order", {
    p_buyer_id: buyerId,
    p_listing_id: listingId,
    p_amount: amount,
    p_provider: provider,
  });
}

export async function releaseOrderToSeller({ orderId, buyerId }) {
  if (!supabase || !buyerId) return { data: null, error: null };

  return supabase.rpc("release_order_to_seller", {
    p_order_id: orderId,
    p_buyer_id: buyerId,
    p_commission_rate: 10,
  });
}

export async function startBuyerInspection({ orderId, sellerId, inspectionHours }) {
  if (!supabase || !orderId || !sellerId) return { data: null, error: null };

  return supabase.rpc("start_buyer_inspection", {
    p_order_id: orderId,
    p_seller_id: sellerId,
    p_inspection_hours: inspectionHours,
  });
}

export async function autoReleaseOrderIfDue(orderId) {
  if (!supabase || !orderId) return { data: null, error: null };

  return supabase.rpc("auto_release_order_if_due", {
    p_order_id: orderId,
  });
}

export async function requestSellerWithdrawal({ sellerId, amount, paymentMethod }) {
  if (!supabase || !sellerId) return { data: null, error: null };

  return supabase.rpc("request_seller_withdrawal", {
    p_seller_id: sellerId,
    p_amount: amount,
    p_payment_method: paymentMethod,
  });
}

export async function submitListingForReview(listing) {
  if (!supabase) return { data: null, error: null };

  return supabase
    .from("listings")
    .insert({
      seller_id: listing.sellerId || null,
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

export async function updateUserProfile(userId, updates) {
  if (!supabase || !userId) return { data: null, error: null };

  return supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
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

export async function verifySignupCode(email, token) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });
}

export async function resendSignupCode(email) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.auth.resend({
    email,
    type: "signup",
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
    successfulDeliveries: Number(row.successful_deliveries || row.seller_sales || 0),
    disputes: Number(row.dispute_count || 0),
    refunds: Number(row.refund_count || 0),
    verified: Boolean(row.seller_verified),
    age: row.account_age || "Not provided",
    transfer: row.transfer_method || "Trade Assurance transfer",
    inventory: row.inventory_details || "Inventory details pending",
    banHistory: row.ban_history || "Not disclosed",
    views: Number(row.views || 0),
    image:
      row.cover_image_url ||
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=80",
    description: row.description || "Seller has not added a description yet.",
  };
}
