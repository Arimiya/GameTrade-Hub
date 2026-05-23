import {
  autoReleaseOrderIfDue,
  createTradeAssuranceOrder,
  deleteListingById,
  ensureUserProfile,
  fetchAdminListings,
  fetchApprovedListings,
  fetchSellerBalance,
  fetchWallet,
  fetchWalletTransactions,
  fetchUserProfile,
  getCurrentSession,
  isSupabaseConfigured,
  mapSupabaseListing,
  onAuthStateChange,
  resendSignupCode,
  saveAppActivity,
  saveDispute,
  saveEscrowEvent,
  saveSecureDelivery,
  saveWalletDeposit,
  releaseOrderToSeller,
  requestSellerWithdrawal,
  startBuyerInspection,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  submitListingForReview,
  updateUserProfile,
  verifySignupCode,
} from "./supabaseClient.js";

const demoListings = [];

const pendingReviews = [
  {
    title: "Cosmic Siege level 102 account",
    seller: "FastVault",
    reason: "Video proof hides inventory during rare item claim.",
    image:
      "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Battle Craft account with historic badge",
    seller: "PixelTrade",
    reason: "Potential prohibited publisher terms. Needs admin decision.",
    image:
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Drift King console profile",
    seller: "RoadAce",
    reason: "Recovery email briefly visible in uploaded video.",
    image:
      "https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=400&q=80",
  },
];

const removedSeedSellers = new Set([
  "KofiRanked",
  "NanaCarry",
  "AmaPlayz",
  "TurboYaw",
  "QuestVault",
  "RankLift",
]);
const LOCAL_LISTINGS_KEY = "gametrade.localListings";
const LOCAL_ACTIVITY_KEY = "gametrade.localActivity";
const LOCAL_WALLET_KEY = "gametrade.walletState";
const DEFAULT_LISTING_IMAGE =
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=80";
const ADMIN_EMAIL = "adnansalman169@gmail.com";
const ADMIN_PASSWORD = "@Arimiyaw124";
const PUBLISHER_TRANSFER_WARNING =
  "Account transfers may violate the terms of the game publisher. Buyers understand that purchased accounts may be banned, restricted, or recovered. The platform provides payment protection but cannot guarantee that the game publisher will allow the transfer.";

const state = {
  search: "",
  platform: "all",
  region: "all",
  sort: "newest",
};

let listings = [...loadLocalListings(), ...demoListings];

const listingGrid = document.querySelector("#listingGrid");
const resultCount = document.querySelector("#resultCount");
const activeListings = document.querySelector("#activeListings");
const modal = document.querySelector("#listingModal");
const modalContent = document.querySelector("#modalContent");
const toast = document.querySelector("#toast");
const authScreen = document.querySelector("#authScreen");
const appShell = document.querySelector("#appShell");
const userEmailLabel = document.querySelector("#userEmailLabel");
const profileEmail = document.querySelector("#profileEmail");
const profileNameInput = document.querySelector("#profileNameInput");
const profileRoleInput = document.querySelector("#profileRoleInput");
const buyerTrustScore = document.querySelector("#buyerTrustScore");
const buyerAccountAge = document.querySelector("#buyerAccountAge");
const buyerCompletedPurchases = document.querySelector("#buyerCompletedPurchases");
const buyerDisputeHistory = document.querySelector("#buyerDisputeHistory");
const buyerAccountAgeMetric = document.querySelector("#buyerAccountAgeMetric");
const signOutButton = document.querySelector("#signOutButton");
const adminLoginButton = document.querySelector("#adminLoginButton");
const videoUpload = document.querySelector("#videoUpload");
const imageUpload = document.querySelector("#imageUpload");
const videoFileName = document.querySelector("#videoFileName");
const imageFileName = document.querySelector("#imageFileName");
const escrowStatusText = document.querySelector("#escrowStatusText");
const stepBuyerConfirm = document.querySelector("#stepBuyerConfirm");
const stepTransferStarted = document.querySelector("#stepTransferStarted");
const stepFundsRelease = document.querySelector("#stepFundsRelease");
const fundsReleaseText = document.querySelector("#fundsReleaseText");
const disputePanel = document.querySelector("#disputePanel");
const adminListingControl = document.querySelector("#adminListingControl");
const walletAvailable = document.querySelector("#walletAvailable");
const walletHeld = document.querySelector("#walletHeld");
const sellerAvailable = document.querySelector("#sellerAvailable");
const sellerPending = document.querySelector("#sellerPending");
const walletHistory = document.querySelector("#walletHistory");
const currentOrderAmount = document.querySelector("#currentOrderAmount");
const currentOrderStatus = document.querySelector("#currentOrderStatus");
const inspectionPeriodText = document.querySelector("#inspectionPeriodText");
const inspectionDeadlineText = document.querySelector("#inspectionDeadlineText");
const sellerProofForm = document.querySelector("#sellerProofForm");
const deliveryForm = document.querySelector("#deliveryForm");
const secureDeliveryForm = document.querySelector("#secureDeliveryForm");
const secureDeliveryStatus = document.querySelector("#secureDeliveryStatus");
const secureDeliveryDetails = document.querySelector("#secureDeliveryDetails");
const withdrawalForm = document.querySelector("#withdrawalForm");
let currentUser = null;
let currentProfile = null;
let adminModeRequested = false;
let pendingVerificationEmail = "";
let activeOrder = null;
let walletState = loadLocalWalletState();
let secureDelivery = null;

function isAdminUser(user) {
  if (!user) return false;
  return (
    currentProfile?.role === "admin" ||
    user.email === ADMIN_EMAIL ||
    user.app_metadata?.role === "admin" ||
    user.user_metadata?.role === "admin"
  );
}

function createFallbackUser(email) {
  return {
    id: `local-${email}`,
    email,
    app_metadata: email === ADMIN_EMAIL ? { role: "admin" } : {},
    user_metadata: email === ADMIN_EMAIL ? { role: "admin" } : {},
  };
}

function createIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function authSetupMessage(error) {
  const text = error?.message || "";
  if (
    text.toLowerCase().includes("database error") ||
    text.toLowerCase().includes("profiles") ||
    text.toLowerCase().includes("relation")
  ) {
    return "Supabase auth table setup is missing. Run supabase-auth-schema.sql in Supabase SQL editor.";
  }
  return text || "Authentication failed.";
}

function loadLocalListings() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_LISTINGS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalListing(listing) {
  const localListings = loadLocalListings();
  localListings.unshift(listing);
  localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(localListings));
}

function deleteLocalListing(id) {
  const localListings = loadLocalListings().filter((listing) => String(listing.id) !== String(id));
  localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(localListings));
  listings = listings.filter((listing) => String(listing.id) !== String(id));
}

function loadLocalWalletState() {
  try {
    return JSON.parse(
      localStorage.getItem(LOCAL_WALLET_KEY) ||
        '{"available":0,"held":0,"sellerAvailable":0,"sellerPending":0,"history":[]}',
    );
  } catch {
    return { available: 0, held: 0, sellerAvailable: 0, sellerPending: 0, history: [] };
  }
}

function saveLocalWalletState() {
  localStorage.setItem(LOCAL_WALLET_KEY, JSON.stringify(walletState));
}

function money(value) {
  return `GHS ${Number(value || 0).toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return "Waiting for delivery";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysSince(value) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
}

function accountAgeLabel(value) {
  const days = daysSince(value);
  if (!days) return "New";
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"}`;
}

function getSellerTrust(listing) {
  const totalSales = Number(listing.sales || 0);
  const successfulDeliveries = Number(listing.successfulDeliveries ?? totalSales);
  const disputes = Number(listing.disputes || 0);
  const refunds = Number(listing.refunds || 0);
  return {
    totalSales,
    successfulDeliveries,
    disputeRate: totalSales ? Math.round((disputes / totalSales) * 100) : 0,
    refundRate: totalSales ? Math.round((refunds / totalSales) * 100) : 0,
    verified: Boolean(listing.verified),
    averageRating: Number(listing.rating || 0),
  };
}

function sellerTrustMarkup(listing) {
  const trust = getSellerTrust(listing);
  return `
    <div class="seller-trust-card">
      <div class="seller-row">
        <h4>Seller trust score</h4>
        <span class="status-pill ${trust.verified ? "verified" : "pending"}">${trust.verified ? "Verified badge" : "Unverified"}</span>
      </div>
      <div class="seller-trust-grid">
        <article><span>Total sales</span><strong>${trust.totalSales}</strong></article>
        <article><span>Successful deliveries</span><strong>${trust.successfulDeliveries}</strong></article>
        <article><span>Average rating</span><strong>${trust.averageRating.toFixed(1)} / 5</strong></article>
        <article><span>Dispute rate</span><strong>${trust.disputeRate}%</strong></article>
        <article><span>Refund rate</span><strong>${trust.refundRate}%</strong></article>
        <article><span>Verification</span><strong>${trust.verified ? "Verified" : "Pending"}</strong></article>
      </div>
    </div>
  `;
}

function renderBuyerTrust() {
  const purchases = Number(currentProfile?.completed_purchases || 0);
  const disputes = Number(currentProfile?.buyer_disputes || 0);
  const age = accountAgeLabel(currentProfile?.created_at || currentUser?.created_at);
  const score = purchases >= 10 && disputes === 0 ? "Trusted buyer" : purchases > 0 ? "Active buyer" : "New buyer";

  if (buyerTrustScore) buyerTrustScore.textContent = score;
  if (buyerAccountAge) buyerAccountAge.textContent = `Account age: ${age}`;
  if (buyerCompletedPurchases) buyerCompletedPurchases.textContent = purchases;
  if (buyerDisputeHistory) buyerDisputeHistory.textContent = `${disputes} dispute${disputes === 1 ? "" : "s"}`;
  if (buyerAccountAgeMetric) buyerAccountAgeMetric.textContent = age;
}

function inspectionIsActive() {
  return Boolean(activeOrder?.inspectionDeadline && Date.now() < new Date(activeOrder.inspectionDeadline).getTime());
}

function inspectionHasExpired() {
  return Boolean(activeOrder?.inspectionDeadline && Date.now() >= new Date(activeOrder.inspectionDeadline).getTime());
}

function pushWalletHistory(type, amount, status, reference = "Local") {
  walletState.history.unshift({
    type,
    amount,
    status,
    reference,
    created_at: new Date().toISOString(),
  });
  walletState.history = walletState.history.slice(0, 8);
  saveLocalWalletState();
  renderWalletState();
}

function renderWalletState(remoteTransactions = null) {
  if (walletAvailable) walletAvailable.textContent = money(walletState.available);
  if (walletHeld) walletHeld.textContent = money(walletState.held);
  if (sellerAvailable) sellerAvailable.textContent = money(walletState.sellerAvailable);
  if (sellerPending) sellerPending.textContent = money(walletState.sellerPending);
  if (currentOrderAmount) currentOrderAmount.textContent = activeOrder ? money(activeOrder.amount) : money(0);
  if (currentOrderStatus) currentOrderStatus.textContent = activeOrder?.status || "No active assurance order";
  if (inspectionPeriodText) {
    inspectionPeriodText.textContent = activeOrder?.inspectionHours
      ? `${activeOrder.inspectionHours} hours`
      : "Not started";
  }
  if (inspectionDeadlineText) {
    inspectionDeadlineText.textContent = activeOrder?.inspectionDeadline
      ? formatDateTime(activeOrder.inspectionDeadline)
      : "Waiting for delivery";
  }
  if (walletHistory) {
    const rows = remoteTransactions || walletState.history;
    walletHistory.innerHTML = rows.length
      ? rows
          .map(
            (row) => `
              <article class="wallet-history-row">
                <div>
                  <strong>${row.transaction_type || row.type}</strong>
                  <span>${row.reference || row.payment_method || "Wallet"} · ${new Date(row.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <strong>${money(row.amount)}</strong>
                  <span>${row.status}</span>
                </div>
              </article>
            `,
          )
          .join("")
      : `<p class="muted">No wallet transactions yet.</p>`;
  }
  renderSecureDelivery();
  createIcons();
}

function canBuyerViewSecureDelivery() {
  return Boolean(
    activeOrder &&
      ["PAYMENT_HELD", "SELLER_PROOF_SUBMITTED", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "BUYER_CONFIRMED", "COMPLETED"].includes(
        activeOrder.status,
      ),
  );
}

function renderSecureDelivery() {
  if (!secureDeliveryStatus || !secureDeliveryDetails) return;

  if (!activeOrder) {
    secureDeliveryStatus.textContent = "Buyer access is locked until a Trade Assurance order exists and payment is held.";
    secureDeliveryDetails.hidden = true;
    secureDeliveryDetails.innerHTML = "";
    return;
  }

  if (!canBuyerViewSecureDelivery()) {
    secureDeliveryStatus.textContent = "Buyer access is locked until payment is held.";
    secureDeliveryDetails.hidden = true;
    secureDeliveryDetails.innerHTML = "";
    return;
  }

  if (!secureDelivery) {
    secureDeliveryStatus.textContent = "Payment is held. Waiting for seller to submit secure delivery details.";
    secureDeliveryDetails.hidden = true;
    secureDeliveryDetails.innerHTML = "";
    return;
  }

  secureDeliveryStatus.textContent = "Payment is held. Buyer can view secure delivery details below.";
  secureDeliveryDetails.hidden = false;
  secureDeliveryDetails.innerHTML = `
    <div><span>Email/login</span><strong>${secureDelivery.login}</strong></div>
    <div><span>Password</span><strong>${secureDelivery.password}</strong></div>
    <div><span>Backup codes</span><strong>${secureDelivery.backupCodes || "Not provided"}</strong></div>
    <div><span>Transfer instructions</span><strong>${secureDelivery.instructions}</strong></div>
    <div><span>Platform details</span><strong>${secureDelivery.platformDetails}</strong></div>
    <div><span>Original email access</span><strong>${secureDelivery.emailAccessStatus}</strong></div>
  `;
}

async function refreshWalletFromSupabase() {
  if (!canSyncCurrentUser()) {
    renderWalletState();
    return;
  }
  const [walletResult, sellerResult, transactionResult] = await Promise.all([
    fetchWallet(currentUser.id),
    fetchSellerBalance(currentUser.id),
    fetchWalletTransactions(currentUser.id),
  ]);
  if (walletResult.data) {
    walletState.available = Number(walletResult.data.balance || 0);
    walletState.held = Number(walletResult.data.held_balance || 0);
  }
  if (sellerResult.data) {
    walletState.sellerAvailable = Number(sellerResult.data.available_balance || 0);
    walletState.sellerPending = Number(sellerResult.data.pending_balance || 0);
  }
  saveLocalWalletState();
  renderWalletState(transactionResult.data || null);
}

async function releaseActiveOrder(reason) {
  if (!activeOrder) return false;
  const payload = {
    orderId: activeOrder.id,
    reason,
    inspectionDeadline: activeOrder.inspectionDeadline || null,
  };

  if (canSyncCurrentUser() && Number.isInteger(Number(activeOrder.id))) {
    const { error } = await releaseOrderToSeller({
      orderId: Number(activeOrder.id),
      buyerId: currentUser.id,
    });
    if (error) {
      console.warn("Supabase seller release failed", error);
      showToast(error.message || "Could not release seller payment.");
      return false;
    }
    await refreshWalletFromSupabase();
  } else {
    const commission = Math.round(activeOrder.amount * 0.1 * 100) / 100;
    const sellerAmount = activeOrder.amount - commission;
    walletState.held = Math.max(walletState.held - activeOrder.amount, 0);
    walletState.sellerAvailable += sellerAmount;
    pushWalletHistory("COMMISSION", commission, "COMPLETED", `ORDER-${activeOrder.id}`);
    pushWalletHistory("SELLER_RELEASE", sellerAmount, "SELLER_PAID", `ORDER-${activeOrder.id}`);
  }

  activeOrder.status = "COMPLETED";
  await syncUserActivity("seller_payout_released", payload);
  renderWalletState();
  return true;
}

function canSyncCurrentUser() {
  return Boolean(isSupabaseConfigured && currentUser?.id && !String(currentUser.id).startsWith("local-"));
}

function saveLocalActivity(activityType, payload = {}) {
  const activity = {
    id: `activity-${Date.now()}`,
    user: currentUser?.email || "guest",
    activityType,
    payload,
    createdAt: new Date().toISOString(),
  };
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_ACTIVITY_KEY) || "[]");
    existing.unshift(activity);
    localStorage.setItem(LOCAL_ACTIVITY_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch {
    localStorage.setItem(LOCAL_ACTIVITY_KEY, JSON.stringify([activity]));
  }
}

async function syncUserActivity(activityType, payload = {}) {
  saveLocalActivity(activityType, payload);
  if (!canSyncCurrentUser()) return { data: null, error: null };
  const { error } = await saveAppActivity({
    userId: currentUser.id,
    activityType,
    payload,
  });
  if (error) console.warn("Supabase activity sync failed", error);
  return { error };
}

function setAuthMode(mode) {
  document.querySelectorAll(".auth-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.authMode === mode);
  });
  document.querySelector("#loginForm").classList.toggle("is-active", mode === "login");
  document.querySelector("#signupForm").classList.toggle("is-active", mode === "signup");
  document.querySelector("#verifyForm").classList.toggle("is-active", mode === "verify");
}

function setAuthenticatedUser(user) {
  const isSignedIn = Boolean(user);
  const wasHidden = appShell.hidden;
  currentUser = user || null;
  authScreen.hidden = isSignedIn;
  appShell.hidden = !isSignedIn;
  document.body.classList.toggle("is-authenticated", isSignedIn);
  if (userEmailLabel && user?.email) {
    userEmailLabel.textContent = user.email;
  }
  if (profileEmail && user?.email) {
    profileEmail.textContent = user.email;
  }
  if (isSignedIn && adminModeRequested) {
    adminModeRequested = false;
    if (isAdminUser(user)) {
      switchView("admin");
      return;
    }
    showToast("This account is not authorized as an admin.");
    signOut();
    return;
  }
  if (isSignedIn && wasHidden) {
    switchView("profile");
  }
  if (isSignedIn) {
    refreshWalletFromSupabase();
  } else {
    renderWalletState();
  }
}

async function loadSignedInProfile(user) {
  if (!user) {
    currentProfile = null;
    return null;
  }

  let { data: profile, error } = await fetchUserProfile(user.id);
  if (error || !profile) {
    const ensured = await ensureUserProfile(user);
    profile = ensured.data;
  }
  currentProfile = profile || {
    id: user.id,
    email: user.email,
    role: user.email === ADMIN_EMAIL ? "admin" : "buyer",
  };
  if (profileNameInput) {
    profileNameInput.value = currentProfile.full_name || "";
  }
  if (profileRoleInput) {
    profileRoleInput.value = currentProfile.role === "seller" ? "seller" : "buyer";
  }
  renderBuyerTrust();
  return currentProfile;
}

async function handleAuthSubmit(event, mode) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const submitButton = event.currentTarget.querySelector("button[type='submit']");

  if (!isSupabaseConfigured) {
    adminModeRequested = false;
    showToast("Supabase is not configured.");
    return;
  }

  if (adminModeRequested && (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD)) {
    adminModeRequested = false;
    showToast("Admin access requires the authorized admin email and password.");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = mode === "login" ? "Logging in..." : "Creating account...";

  const { data, error } =
    mode === "login"
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password);

  submitButton.disabled = false;
  submitButton.innerHTML =
    mode === "login"
      ? '<i data-lucide="log-in"></i> Log in'
      : '<i data-lucide="user-plus"></i> Sign up';
  createIcons();

  if (error) {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const fallbackUser = createFallbackUser(email);
      currentProfile = { id: fallbackUser.id, email, role: "admin", status: "active" };
      setAuthenticatedUser(fallbackUser);
      showToast("Supabase blocked the session, so admin opened locally for this prototype.");
      return;
    }
    adminModeRequested = false;
    showToast(authSetupMessage(error));
    return;
  }

  if (mode === "signup" && !data.session) {
    pendingVerificationEmail = email;
    document.querySelector("#verifyForm input[name='email']").value = email;
    setAuthMode("verify");
    showToast("Verification code sent. Check your email/Gmail.");
    return;
  }

  if (data.user) {
    await loadSignedInProfile(data.user);
    setAuthenticatedUser(data.user);
  }

  showToast(
    mode === "login"
      ? "Logged in successfully."
      : "Account created and signed in.",
  );
}

async function handleVerifySubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get("email") || pendingVerificationEmail).trim();
  const token = String(form.get("token") || "").trim();
  const submitButton = event.currentTarget.querySelector("button[type='submit']");

  submitButton.disabled = true;
  submitButton.textContent = "Verifying...";
  const { data, error } = await verifySignupCode(email, token);
  submitButton.disabled = false;
  submitButton.innerHTML = '<i data-lucide="badge-check"></i> Verify account';
  createIcons();

  if (error) {
    showToast(error.message || "Invalid verification code.");
    return;
  }

  if (data.user) {
    await loadSignedInProfile(data.user);
    setAuthenticatedUser(data.user);
    showToast("Email verified. Account created successfully.");
  } else {
    setAuthMode("login");
    showToast("Email verified. Please log in.");
  }
}

async function handleResendCode() {
  const email =
    String(document.querySelector("#verifyForm input[name='email']").value || pendingVerificationEmail).trim();
  if (!email) {
    showToast("Enter your email first.");
    return;
  }
  const { error } = await resendSignupCode(email);
  showToast(error ? error.message : "Verification code resent.");
}

async function openAdminFromLoginForm() {
  const loginForm = document.querySelector("#loginForm");
  const form = new FormData(loginForm);
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    showToast("Admin access requires the authorized admin email and password.");
    return;
  }

  const fallbackUser = createFallbackUser(email);
  currentProfile = { id: fallbackUser.id, email, role: "admin", status: "active" };
  setAuthenticatedUser(fallbackUser);
  switchView("admin");
  showToast("Admin opened.");

  if (isSupabaseConfigured) {
    signInWithEmail(email, password).then(async ({ data, error }) => {
      if (!error && data.user) {
        await loadSignedInProfile(data.user);
        setAuthenticatedUser(data.user);
        switchView("admin");
      }
    });
  }
}

async function initializeAuthGate() {
  if (!isSupabaseConfigured) {
    setAuthenticatedUser(null);
    showToast("Add Supabase credentials before users can log in.");
    return;
  }

  const session = await getCurrentSession();
  if (session?.user) {
    await loadSignedInProfile(session.user);
    setAuthenticatedUser(session.user);
  } else {
    setAuthenticatedUser(null);
  }

  onAuthStateChange(async (_event, nextSession) => {
    if (nextSession?.user) {
      await loadSignedInProfile(nextSession.user);
      setAuthenticatedUser(nextSession.user);
    } else {
      setAuthenticatedUser(null);
    }
  });
}

function switchView(viewId) {
  if (viewId === "admin" && !isAdminUser(currentUser)) {
    showToast("Admin access requires an authenticated admin account.");
    viewId = "profile";
  }
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-visible", view.id === viewId);
  });
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewId);
  });
  window.location.hash = viewId;
}

function filteredListings() {
  const query = state.search.trim().toLowerCase();
  const filtered = listings.filter((listing) => {
    const haystack = [
      listing.game,
      listing.title,
      listing.rank,
      listing.inventory,
      listing.seller,
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!query || haystack.includes(query)) &&
      (state.platform === "all" || listing.platform === state.platform) &&
      (state.region === "all" || listing.region === state.region)
    );
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (state.sort === "rating") return Number(b.verified) - Number(a.verified) || b.rating - a.rating;
    return b.id - a.id;
  });
  return sorted;
}

function renderListings() {
  const data = filteredListings();
  activeListings.textContent = listings.length;
  resultCount.textContent = `${data.length} ${data.length === 1 ? "listing" : "listings"}`;

  listingGrid.innerHTML = data
    .map(
      (listing) => `
        <article class="listing-card">
          <div class="listing-media" style="background-image:url('${listing.image}')">
            <div class="media-overlay">
              <span class="video-chip"><i data-lucide="play-circle"></i> Video proof</span>
              <span class="video-chip">${listing.views.toLocaleString()} views</span>
            </div>
          </div>
          <div class="listing-body">
            <div class="listing-title-row">
              <h3>${listing.title}</h3>
              <strong>${money(listing.price)}</strong>
            </div>
            <div class="tag-row">
              <span class="tag">${listing.game}</span>
              <span class="tag">${listing.rank}</span>
              <span class="tag">Level ${listing.level}</span>
              <span class="tag">${listing.platform}</span>
            </div>
            <p class="muted">${listing.description}</p>
            <div class="listing-warning">
              <i data-lucide="alert-triangle"></i>
              <span>${PUBLISHER_TRANSFER_WARNING}</span>
            </div>
            <div class="seller-row">
              <span>${listing.seller} · ${listing.rating.toFixed(1)} stars</span>
              <span class="status-pill ${listing.verified ? "verified" : "pending"}">
                ${listing.verified ? "Verified" : "Unverified"}
              </span>
            </div>
            ${sellerTrustMarkup(listing)}
            <div class="card-actions">
              <button class="secondary-button" data-detail="${listing.id}"><i data-lucide="eye"></i> Details</button>
              <button class="primary-button" data-buy="${listing.id}"><i data-lucide="credit-card"></i> Buy Now</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  if (!data.length) {
    listingGrid.innerHTML = `<div class="review-card"><h3>No account listings yet</h3><p class="muted">Create a new account listing from the Sell tab. Approved listings will appear here.</p></div>`;
  }
  createIcons();
}

function showDataSourceStatus(source, details = "") {
  const existing = document.querySelector("#dataSourceStatus");
  if (existing) existing.remove();

  const status = document.createElement("span");
  status.id = "dataSourceStatus";
  status.className = `status-pill ${source === "supabase" ? "verified" : "pending"}`;
  status.textContent =
    source === "supabase" ? "Supabase connected" : `Demo data${details ? `: ${details}` : ""}`;
  document.querySelector("#marketplace .section-heading").append(status);
}

async function loadListingsFromSupabase() {
  if (!isSupabaseConfigured) {
    showDataSourceStatus("demo", "add Supabase URL and anon key");
    return;
  }

  const { data, error } = await fetchApprovedListings();
  if (error) {
    console.warn("Supabase listing fetch failed", error);
    showDataSourceStatus("demo", "Supabase table not ready");
    return;
  }

  if (data?.length) {
    const remoteListings = data
      .map(mapSupabaseListing)
      .map((listing) => ({ ...listing, source: "supabase" }))
      .filter((listing) => !removedSeedSellers.has(listing.seller));
    listings = [...loadLocalListings(), ...remoteListings];
    showDataSourceStatus("supabase");
    renderListings();
    return;
  }

  showDataSourceStatus("demo", "no active listings yet");
}

async function renderAdminListingControl() {
  if (!adminListingControl) return;
  const localRows = loadLocalListings().map((listing) => ({ ...listing, source: "local" }));
  let remoteRows = [];
  let remoteError = null;

  if (isSupabaseConfigured) {
    const { data, error } = await fetchAdminListings();
    remoteError = error;
    if (data?.length) {
      remoteRows = data
        .map(mapSupabaseListing)
        .map((listing) => ({ ...listing, source: "supabase" }))
        .filter((listing) => !removedSeedSellers.has(listing.seller));
    }
  }

  const rows = [...localRows, ...remoteRows];
  if (!rows.length) {
    adminListingControl.innerHTML = `<p class="muted">No account listings found. Upload an account from the Sell page first.</p>`;
    if (remoteError) {
      adminListingControl.innerHTML += `<p class="muted">Supabase control needs admin select/delete policies before remote rows can appear.</p>`;
    }
    return;
  }

  adminListingControl.innerHTML = rows
    .map(
      (listing) => `
        <article class="admin-listing-row">
          <div>
            <strong>${listing.title}</strong>
            <span>${listing.game} · ${listing.seller} · ${listing.source}</span>
          </div>
          <button class="secondary-button danger-button" data-delete-listing="${listing.id}" data-source="${listing.source}">
            <i data-lucide="trash-2"></i>
            Delete
          </button>
        </article>
      `,
    )
    .join("");
  createIcons();
}

function openListing(id) {
  const listing = listings.find((item) => item.id === Number(id));
  if (!listing) return;

  modalContent.innerHTML = `
    <div class="modal-hero" style="background-image:url('${listing.image}')"></div>
    <div class="modal-inner">
      <div>
        <p class="eyebrow">${listing.game}</p>
        <h2 id="modalTitle">${listing.title}</h2>
        <p>${listing.description}</p>
        <div class="legal-note">
          <i data-lucide="alert-triangle"></i>
          <p>${PUBLISHER_TRANSFER_WARNING}</p>
        </div>
        <h3>Account proof</h3>
        <div class="detail-list">
          <div><span>Rank</span><strong>${listing.rank}</strong></div>
          <div><span>Level</span><strong>${listing.level}</strong></div>
          <div><span>Inventory</span><strong>${listing.inventory}</strong></div>
          <div><span>Ban history</span><strong>${listing.banHistory}</strong></div>
          <div><span>Region</span><strong>${listing.region}</strong></div>
          <div><span>Platform</span><strong>${listing.platform}</strong></div>
        </div>
      </div>
      <aside class="review-card">
        <p class="muted">Payment is held by the platform/provider until Trade Assurance release.</p>
        <div class="seller-row">
          <span>${listing.seller}</span>
          <span class="status-pill ${listing.verified ? "verified" : "pending"}">${listing.verified ? "Verified seller" : "Pending verification"}</span>
        </div>
        <p><strong>${listing.rating.toFixed(1)} stars</strong> across ${listing.sales} completed sales.</p>
        ${sellerTrustMarkup(listing)}
        <p><strong>Provider payment:</strong> ${money(listing.price)}</p>
        <p><strong>Transfer:</strong> ${listing.transfer}</p>
        <div class="button-row">
          <button class="primary-button" data-buy="${listing.id}"><i data-lucide="credit-card"></i> Buy Now</button>
          <button class="secondary-button" data-message="${listing.id}"><i data-lucide="message-circle"></i> Message seller</button>
          <button class="secondary-button" data-report="${listing.id}"><i data-lucide="flag"></i> Report</button>
        </div>
      </aside>
    </div>
  `;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  createIcons();
}

function renderQueue() {
  document.querySelector("#moderationQueue").innerHTML = pendingReviews
    .map(
      (item) => `
        <article class="queue-item">
          <div class="queue-thumb" style="background-image:url('${item.image}')"></div>
          <div>
            <strong>${item.title}</strong>
            <p class="muted">Seller: ${item.seller}. ${item.reason}</p>
            <div class="queue-actions">
              <button class="primary-button" data-admin-action="approve"><i data-lucide="check"></i> Approve</button>
              <button class="secondary-button" data-admin-action="changes"><i data-lucide="pencil"></i> Request changes</button>
              <button class="secondary-button" data-admin-action="reject"><i data-lucide="x"></i> Reject</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
  createIcons();
}

function bindEvents() {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  document.querySelector("#loginForm").addEventListener("submit", (event) => {
    handleAuthSubmit(event, "login");
  });

  adminLoginButton.addEventListener("click", () => {
    openAdminFromLoginForm();
  });

  document.querySelector("#signupForm").addEventListener("submit", (event) => {
    handleAuthSubmit(event, "signup");
  });

  document.querySelector("#verifyForm").addEventListener("submit", (event) => {
    handleVerifySubmit(event);
  });

  document.querySelector("#resendCodeButton").addEventListener("click", () => {
    handleResendCode();
  });

  signOutButton.addEventListener("click", async () => {
    currentProfile = null;
    setAuthenticatedUser(null);
    const { error } = await signOut();
    showToast(error ? error.message : "Signed out.");
  });

  document.querySelector("#profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const updates = {
      full_name: String(form.get("full_name") || "").trim(),
      role: String(form.get("role") || "buyer"),
    };
    saveLocalActivity("profile_updated", updates);
    if (canSyncCurrentUser()) {
      const { data, error } = await updateUserProfile(currentUser.id, updates);
      if (error) {
        console.warn("Supabase profile update failed", error);
        showToast("Profile saved on this device. Run profile policies to sync online.");
        return;
      }
      currentProfile = data;
      showToast("Profile updated in Supabase.");
      return;
    }
    showToast("Profile saved locally. Log in with Supabase to sync online.");
  });

  document.querySelectorAll("[data-view], [data-view-target]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view || button.dataset.viewTarget));
  });

  document.querySelector("#depositForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const method = String(form.get("method") || "").replace("-", " ");
    const amount = Number(form.get("amount") || 0);
    const reference = String(form.get("reference") || "").trim();
    saveLocalActivity("wallet_deposit", { amount, method, reference, status: "pending" });
    if (canSyncCurrentUser()) {
      const { error } = await saveWalletDeposit({
        userId: currentUser.id,
        amount,
        method,
        reference,
      });
      if (error) {
        console.warn("Supabase wallet deposit failed", error);
        showToast("Deposit saved on this device. Run wallet SQL/policies to save it online.");
      } else {
        await refreshWalletFromSupabase();
        showToast(`Deposit saved to Supabase with ${method}. Gateway processing can be connected next.`);
      }
    } else {
      walletState.available += amount;
      pushWalletHistory("DEPOSIT", amount, "DEPOSIT_SUCCESSFUL", reference || method);
      showToast(`Demo provider success. ${money(amount)} added to wallet locally.`);
    }
    event.currentTarget.reset();
  });

  sellerProofForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeOrder) {
      showToast("Create a Trade Assurance order before submitting seller proof.");
      return;
    }
    const form = new FormData(event.currentTarget);
    activeOrder.status = "SELLER_PROOF_SUBMITTED";
    stepTransferStarted.classList.remove("active");
    stepTransferStarted.classList.add("done");
    stepBuyerConfirm.classList.add("active");
    escrowStatusText.textContent = "Seller proof submitted. Admin review can approve or reject before delivery.";
    fundsReleaseText.textContent = "Money remains in trade assurance hold.";
    await syncUserActivity("seller_proof_submitted", {
      orderId: activeOrder.id,
      proofType: form.get("proofType"),
      notes: form.get("proofNotes"),
      status: "SELLER_PROOF_SUBMITTED",
    });
    renderWalletState();
    event.currentTarget.reset();
    showToast("Seller proof submitted and saved.");
  });

  document.querySelector("#approveProof").addEventListener("click", async () => {
    if (!activeOrder) {
      showToast("Create an order before approving proof.");
      return;
    }
    if (activeOrder.status !== "SELLER_PROOF_SUBMITTED") {
      showToast("Seller proof must be submitted first.");
      return;
    }
    activeOrder.status = "READY_TO_SHIP";
    escrowStatusText.textContent = "Proof approved. Order is READY_TO_SHIP and seller payout remains held.";
    fundsReleaseText.textContent = "Payment stays held until shipping, buyer confirmation, auto-release, or admin decision.";
    await syncUserActivity("proof_approved", { orderId: activeOrder.id, status: "READY_TO_SHIP" });
    renderWalletState();
    showToast("Proof approved. Seller can ship now.");
  });

  document.querySelector("#rejectProof").addEventListener("click", async () => {
    if (!activeOrder) {
      showToast("Create an order before rejecting proof.");
      return;
    }
    activeOrder.status = "PROOF_REJECTED";
    escrowStatusText.textContent = "Proof rejected. Buyer can receive a refund by admin decision.";
    fundsReleaseText.textContent = "Payout blocked because proof was rejected.";
    await syncUserActivity("proof_rejected", { orderId: activeOrder.id, status: "PROOF_REJECTED" });
    renderWalletState();
    showToast("Proof rejected. Funds remain held for refund review.");
  });

  deliveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeOrder) {
      showToast("Create a Trade Assurance order before marking delivery.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const inspectionHours = Number(form.get("inspectionHours") || 24);
    activeOrder.status = "SHIPPED";
    activeOrder.inspectionHours = inspectionHours;
    escrowStatusText.textContent = "Shipment submitted. Buyer can track the order and confirm after delivery.";
    await syncUserActivity("delivery_submitted", {
      orderId: activeOrder.id,
      trackingNumber: form.get("trackingNumber"),
      inspectionHours,
      notes: form.get("deliveryNotes"),
      status: "SHIPPED",
    });
    renderWalletState();
    event.currentTarget.reset();
    showToast("Shipment saved. Payment remains held until confirmation or auto-release.");
  });

  document.querySelector("#markDelivered").addEventListener("click", async () => {
    if (!activeOrder) {
      showToast("Create a Trade Assurance order before starting inspection.");
      return;
    }
    if (!["SHIPPED", "READY_TO_SHIP", "PAYMENT_HELD", "SELLER_PROOF_SUBMITTED"].includes(activeOrder.status)) {
      showToast("This order cannot start inspection from its current status.");
      return;
    }
    const hours = Number(activeOrder.inspectionHours || 24);
    const startedAt = new Date();
    const deadline = new Date(startedAt.getTime() + hours * 60 * 60 * 1000);
    activeOrder.status = "DELIVERED";
    activeOrder.inspectionStartedAt = startedAt.toISOString();
    activeOrder.inspectionDeadline = deadline.toISOString();
    activeOrder.inspectionHours = hours;
    if (canSyncCurrentUser() && Number.isInteger(Number(activeOrder.id))) {
      const { data, error } = await startBuyerInspection({
        orderId: Number(activeOrder.id),
        sellerId: currentUser.id,
        inspectionHours: hours,
      });
      if (error) {
        console.warn("Supabase inspection start failed", error);
        showToast("Inspection started locally. Run inspection SQL to sync online.");
      } else if (data) {
        activeOrder = {
          ...activeOrder,
          ...data,
          inspectionHours: Number(data.inspection_period_hours || hours),
          inspectionStartedAt: data.inspection_started_at,
          inspectionDeadline: data.auto_release_at,
        };
      }
    }
    stepBuyerConfirm.classList.add("active");
    escrowStatusText.textContent = `Delivery confirmed. Buyer has ${hours} hours to inspect, confirm, or open a dispute.`;
    fundsReleaseText.textContent = `Seller payout auto-releases after ${formatDateTime(deadline)} if no dispute is opened.`;
    await syncUserActivity("inspection_period_started", {
      orderId: activeOrder.id,
      inspectionHours: hours,
      inspectionDeadline: activeOrder.inspectionDeadline,
      status: "DELIVERED",
    });
    renderWalletState();
    showToast(`Buyer inspection period started: ${hours} hours.`);
  });

  document.querySelector("#checkAutoRelease").addEventListener("click", async () => {
    if (!activeOrder) {
      showToast("Create a Trade Assurance order before checking auto-release.");
      return;
    }
    if (activeOrder.status === "DISPUTED") {
      showToast("Auto-release is blocked because a dispute is open.");
      return;
    }
    if (!activeOrder.inspectionDeadline) {
      showToast("Auto-release starts after delivery is marked delivered.");
      return;
    }
    if (!inspectionHasExpired()) {
      showToast(`Inspection is still active until ${formatDateTime(activeOrder.inspectionDeadline)}.`);
      return;
    }
    if (canSyncCurrentUser() && Number.isInteger(Number(activeOrder.id))) {
      const { data, error } = await autoReleaseOrderIfDue(Number(activeOrder.id));
      if (error) {
        console.warn("Supabase auto-release failed", error);
        showToast(error.message || "Auto-release is not ready yet.");
        return;
      }
      if (data) activeOrder = { ...activeOrder, ...data, status: data.status || "COMPLETED" };
    }
    const released = canSyncCurrentUser() && Number.isInteger(Number(activeOrder.id))
      ? true
      : await releaseActiveOrder("Inspection period expired without dispute");
    if (released) {
      fundsReleaseText.textContent = "Inspection period expired. Seller payout auto-released after commission.";
      escrowStatusText.textContent = "Buyer did not dispute during inspection. Order is COMPLETED.";
      await refreshWalletFromSupabase();
      renderWalletState();
      showToast("Inspection expired. Seller payout auto-released.");
    }
  });

  secureDeliveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeOrder) {
      showToast("Create a Trade Assurance order before secure delivery.");
      return;
    }
    if (!canBuyerViewSecureDelivery()) {
      showToast("Secure delivery unlocks only after payment is held.");
      return;
    }
    const form = new FormData(event.currentTarget);
    secureDelivery = {
      login: String(form.get("login") || "").trim(),
      password: String(form.get("password") || "").trim(),
      backupCodes: String(form.get("backupCodes") || "").trim(),
      instructions: String(form.get("instructions") || "").trim(),
      platformDetails: String(form.get("platformDetails") || "").trim(),
      emailAccessStatus: String(form.get("emailAccessStatus") || "").trim(),
    };

    if (canSyncCurrentUser() && Number.isInteger(Number(activeOrder.id))) {
      const { error } = await saveSecureDelivery({
        orderId: Number(activeOrder.id),
        sellerId: currentUser.id,
        delivery: secureDelivery,
      });
      if (error) {
        console.warn("Supabase secure delivery failed", error);
        showToast("Secure delivery saved locally. Run secure delivery SQL to sync online.");
      } else {
        showToast("Secure delivery saved to Supabase.");
      }
    } else {
      showToast("Secure delivery saved for this Trade Assurance order.");
    }

    await syncUserActivity("secure_delivery_submitted", {
      orderId: activeOrder.id,
      platformDetails: secureDelivery.platformDetails,
      emailAccessStatus: secureDelivery.emailAccessStatus,
    });
    renderSecureDelivery();
    event.currentTarget.reset();
  });

  withdrawalForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount") || 0);
    const paymentMethod = String(form.get("method") || "").trim();
    if (walletState.sellerAvailable < amount) {
      showToast("Withdrawal cannot exceed seller available balance.");
      return;
    }
    if (canSyncCurrentUser()) {
      const { error } = await requestSellerWithdrawal({
        sellerId: currentUser.id,
        amount,
        paymentMethod,
      });
      if (error) {
        console.warn("Supabase withdrawal request failed", error);
        showToast(error.message || "Withdrawal request failed.");
        return;
      }
      await refreshWalletFromSupabase();
    } else {
      walletState.sellerAvailable -= amount;
      walletState.sellerPending += amount;
      pushWalletHistory("WITHDRAWAL_REQUEST", amount, "WITHDRAWAL_REQUESTED", paymentMethod);
    }
    await syncUserActivity("withdrawal_requested", { amount, paymentMethod, status: "PENDING" });
    event.currentTarget.reset();
    showToast("Withdrawal request saved as PENDING.");
  });

  document.querySelector("#refreshAdminListings").addEventListener("click", () => {
    renderAdminListingControl();
    showToast("Admin account list refreshed.");
  });

  document.querySelector("#chooseVideoButton").addEventListener("click", () => {
    videoUpload.click();
  });

  document.querySelector("#chooseImageButton").addEventListener("click", () => {
    imageUpload.click();
  });

  videoUpload.addEventListener("change", () => {
    videoFileName.textContent = videoUpload.files[0]?.name || "No video selected";
  });

  imageUpload.addEventListener("change", () => {
    const count = imageUpload.files.length;
    imageFileName.textContent = count ? `${count} image${count === 1 ? "" : "s"} selected` : "No images selected";
  });

  document.querySelector("#searchInput").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderListings();
  });

  document.querySelector("#platformFilter").addEventListener("change", (event) => {
    state.platform = event.target.value;
    renderListings();
  });

  document.querySelector("#regionFilter").addEventListener("change", (event) => {
    state.region = event.target.value;
    renderListings();
  });

  document.querySelector("#sortFilter").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderListings();
  });

  document.querySelector("#clearFilters").addEventListener("click", () => {
    state.search = "";
    state.platform = "all";
    state.region = "all";
    state.sort = "newest";
    document.querySelector("#searchInput").value = "";
    document.querySelector("#platformFilter").value = "all";
    document.querySelector("#regionFilter").value = "all";
    document.querySelector("#sortFilter").value = "newest";
    renderListings();
  });

  document.body.addEventListener("click", async (event) => {
    const detailButton = event.target.closest("[data-detail]");
    const buyButton = event.target.closest("[data-buy]");
    const reportButton = event.target.closest("[data-report]");
    const messageButton = event.target.closest("[data-message]");
    const adminButton = event.target.closest("[data-admin-action]");
    const deleteListingButton = event.target.closest("[data-delete-listing]");

    if (detailButton) openListing(detailButton.dataset.detail);
    if (buyButton) {
      modal.classList.remove("is-open");
      const listing = listings.find((item) => String(item.id) === String(buyButton.dataset.buy));
      if (!listing) return;
      const amount = Number(listing.price || 0);
      if (amount <= 0) {
        showToast("This listing needs a wallet price before checkout.");
        return;
      }
      activeOrder = {
        id: `local-order-${Date.now()}`,
        listingId: listing.id,
        amount,
        provider: "Visa card",
        status: "PAYMENT_HELD",
        inspectionHours: 24,
        inspectionStartedAt: null,
        inspectionDeadline: null,
      };
      secureDelivery = null;
      if (canSyncCurrentUser() && Number.isInteger(Number(listing.id))) {
        const { data, error } = await createTradeAssuranceOrder({
          buyerId: currentUser.id,
          listingId: Number(listing.id),
          amount,
          provider: "Visa card",
        });
        if (error) {
          console.warn("Supabase wallet purchase failed", error);
          showToast(error.message || "Wallet purchase failed.");
          return;
        }
        activeOrder = data;
        activeOrder.inspectionHours = 24;
        activeOrder.inspectionStartedAt = null;
        activeOrder.inspectionDeadline = null;
        await refreshWalletFromSupabase();
      } else {
        walletState.held += amount;
        pushWalletHistory("PURCHASE_HOLD", amount, "PAYMENT_HELD", `Provider hold ORDER-${activeOrder.id}`);
      }
      renderWalletState();
      renderSecureDelivery();
      syncUserActivity("checkout_created", { listingId: listing.id, amount, provider: "Visa card", status: "PAYMENT_HELD" });
      showToast("Payment provider approved. Money is held under Trade Assurance.");
      switchView("orders");
    }
    if (reportButton) {
      syncUserActivity("listing_reported", { listingId: reportButton.dataset.report });
      showToast("Report submitted for admin review.");
    }
    if (messageButton) {
      syncUserActivity("seller_message_started", { listingId: messageButton.dataset.message, credentialDeliveryBlocked: true });
      showToast("Normal chat cannot be used for login details. Use Secure Delivery after payment is held.");
      switchView("orders");
    }
    if (adminButton) {
      const action = adminButton.dataset.adminAction;
      const text =
        action === "approve"
          ? "Listing approved and moved to active marketplace."
          : action === "reject"
            ? "Listing rejected with a moderation reason."
            : "Change request sent to seller.";
      syncUserActivity("admin_moderation_action", { action });
      showToast(text);
    }
    if (deleteListingButton) {
      if (!isAdminUser(currentUser)) {
        showToast("Only admin can delete accounts.");
        return;
      }
      const id = deleteListingButton.dataset.deleteListing;
      const source = deleteListingButton.dataset.source;
      deleteListingButton.disabled = true;
      deleteListingButton.textContent = "Deleting...";
      deleteLocalListing(id);
      if (source === "supabase") {
        deleteListingById(id).then(({ error }) => {
          if (error) {
            console.warn("Supabase delete failed", error);
            showToast("Deleted from app view. Supabase delete needs delete policy.");
          } else {
            showToast("Account deleted from app and Supabase.");
          }
          renderListings();
          renderAdminListingControl();
        });
        return;
      }
      renderListings();
      renderAdminListingControl();
      showToast("Account deleted from the app.");
    }
  });

  document.querySelector(".close-modal").addEventListener("click", () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }
  });

  document.querySelector("#listingForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const listing = {
      id: `local-${Date.now()}`,
      sellerId: canSyncCurrentUser() ? currentUser.id : null,
      game: form.get("game"),
      title: form.get("title"),
      price: Number(form.get("price") || 0),
      level: Number(form.get("level")),
      rank: form.get("rank"),
      region: form.get("region"),
      platform: form.get("platform"),
      transfer: form.get("transfer"),
      description: form.get("description"),
      inventory: `${imageUpload.files.length || 0} screenshot${imageUpload.files.length === 1 ? "" : "s"} selected`,
      banHistory: "Seller disclosure pending moderation",
      seller: currentUser?.email || "Current seller",
      rating: 0,
      sales: 0,
      verified: false,
      successfulDeliveries: 0,
      disputes: 0,
      refunds: 0,
      age: "New listing",
      views: 0,
      image:
        imageUpload.files[0] && imageUpload.files[0].type.startsWith("image/")
          ? URL.createObjectURL(imageUpload.files[0])
          : DEFAULT_LISTING_IMAGE,
    };

    saveLocalListing({ ...listing, image: listing.image.startsWith("blob:") ? DEFAULT_LISTING_IMAGE : listing.image });
    listings = [listing, ...listings];
    renderListings();
    event.currentTarget.reset();
    videoUpload.value = "";
    imageUpload.value = "";
    videoFileName.textContent = "No video selected";
    imageFileName.textContent = "No images selected";

    if (isSupabaseConfigured) {
      const { error } = await submitListingForReview(listing);
      if (error) {
        console.warn("Supabase listing submit failed", error);
        showToast("Account uploaded locally. Supabase needs table/RLS setup to sync online.");
      } else {
        await syncUserActivity("listing_submitted", {
          title: listing.title,
          game: listing.game,
          status: "pending_review",
        });
        showToast("Account uploaded and sent to Supabase review.");
      }
    } else {
      showToast("Account uploaded locally and added to the marketplace.");
    }
    switchView("marketplace");
  });

  document.querySelector("#confirmTransfer").addEventListener("click", async () => {
    if (!activeOrder) {
      showToast("Create a Trade Assurance order before confirming receipt.");
      return;
    }
    const checks = [...document.querySelectorAll(".transfer-check")];
    if (!checks.every((check) => check.checked)) {
      showToast("Complete the transfer checklist before confirming receipt.");
      return;
    }
    if (activeOrder.status !== "DELIVERED" && !inspectionIsActive()) {
      showToast("Confirm after delivery starts the buyer inspection period.");
      return;
    }
    stepBuyerConfirm.classList.remove("active");
    stepBuyerConfirm.classList.add("done");
    stepBuyerConfirm.querySelector("strong").textContent = "Buyer confirmed";
    stepBuyerConfirm.querySelector("small").textContent = "Buyer verified account access and listed items.";
    stepFundsRelease.classList.remove("paused", "disputed");
    stepFundsRelease.classList.add("done");
    activeOrder.status = "COMPLETED";
    fundsReleaseText.textContent = "Trade Assurance completed. Seller payout is released after commission.";
    escrowStatusText.textContent = "Buyer confirmed delivery. Order is COMPLETED.";
    disputePanel.hidden = true;
    const payload = {
      checklist: checks.map((check) => check.parentElement.textContent.trim()),
      completed: true,
      orderId: activeOrder.id,
    };
    const released = await releaseActiveOrder("Buyer confirmed during inspection period");
    if (released) showToast("Buyer confirmed received. Seller payout released.");
  });

  document.querySelector("#pauseEscrow").addEventListener("click", async () => {
    if (!activeOrder) {
      showToast("Create a Trade Assurance order before pausing release.");
      return;
    }
    activeOrder.status = "DISPUTED";
    stepFundsRelease.classList.remove("done");
    stepFundsRelease.classList.add("active", "paused");
    fundsReleaseText.textContent = "Release paused. Admin review is required before funds move.";
    escrowStatusText.textContent = "Trade Assurance payout is paused for review.";
    const payload = { reason: "Buyer paused delayed payout from Trade Assurance page" };
    if (canSyncCurrentUser()) {
      const { error } = await saveEscrowEvent({
        userId: currentUser.id,
        action: "pause_release",
        status: "paused",
        details: payload,
      });
      if (error) {
        console.warn("Supabase pause release failed", error);
        saveLocalActivity("escrow_pause_release", payload);
        showToast("Payout paused locally. Run assurance SQL/policies to sync online.");
        return;
      }
    } else {
      saveLocalActivity("escrow_pause_release", payload);
    }
    renderWalletState();
    showToast("Seller payout paused and saved.");
  });

  document.querySelector("#openDispute").addEventListener("click", () => {
    if (!activeOrder) {
      showToast("Create a Trade Assurance order before opening a dispute.");
      return;
    }
    disputePanel.hidden = false;
    disputePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    stepFundsRelease.classList.remove("done");
    stepFundsRelease.classList.add("active", "disputed");
    fundsReleaseText.textContent = "Release paused because a dispute is being prepared.";
    escrowStatusText.textContent = "Dispute mode is open. The inspection timer no longer auto-releases payout.";
    showToast("Dispute form opened.");
  });

  disputePanel.addEventListener("submit", async (event) => {
    event.preventDefault();
    const reason = document.querySelector("#disputeReason").value;
    const description = document.querySelector("#disputeDescription").value.trim();
    if (!reason) {
      showToast("Select a dispute reason first.");
      return;
    }
    stepFundsRelease.classList.remove("done");
    stepFundsRelease.classList.add("active", "disputed");
    fundsReleaseText.textContent = `Dispute opened: ${reason}. Admin review is required.`;
    escrowStatusText.textContent = "Dispute submitted. Seller payout remains paused.";
    const payload = { reason, description };
    activeOrder.status = "DISPUTED";
    if (canSyncCurrentUser()) {
      const disputeResult = await saveDispute({
        userId: currentUser.id,
        reason,
        description,
      });
      const eventResult = await saveEscrowEvent({
        userId: currentUser.id,
        action: "open_dispute",
        status: "disputed",
        details: payload,
      });
      if (disputeResult.error || eventResult.error) {
        console.warn("Supabase dispute sync failed", disputeResult.error || eventResult.error);
        saveLocalActivity("dispute_opened", payload);
        showToast("Dispute saved locally. Run dispute SQL/policies to sync online.");
        return;
      }
    } else {
      saveLocalActivity("dispute_opened", payload);
    }
    event.currentTarget.reset();
    showToast("Dispute submitted and saved for admin review.");
  });
}

function boot() {
  bindEvents();
  initializeAuthGate();
  renderListings();
  renderWalletState();
  renderQueue();
  renderAdminListingControl();
  loadListingsFromSupabase();
  const initial = window.location.hash.replace("#", "");
  if (["profile", "wallet", "marketplace", "sell", "orders"].includes(initial)) {
    switchView(initial);
  }
  createIcons();
}

boot();
