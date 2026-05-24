let listings = [];

let pendingReviews = [];

const publisherWarnings = {
  "Call of Duty":
    "Activision titles may restrict account sale or transfer. Buyer accepts ban and recovery risk.",
  "FIFA / EA FC":
    "EA account or service transfers may be restricted by EA terms. Buyer accepts ban and recovery risk.",
};

const state = {
  search: "",
  platform: "all",
  region: "all",
  maxPrice: 5000,
  sort: "newest",
};

const listingGrid = document.querySelector("#listingGrid");
const resultCount = document.querySelector("#resultCount");
const activeListings = document.querySelector("#activeListings");
const modal = document.querySelector("#listingModal");
const signupModal = document.querySelector("#signupModal");
const modalContent = document.querySelector("#modalContent");
const toast = document.querySelector("#toast");
let supabaseClient;
let currentSession;

function createIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function apiRequest(url, options) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

async function authRequest(url, options = {}) {
  if (!currentSession?.access_token) {
    throw new Error("Please log in first.");
  }

  return apiRequest(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentSession.access_token}`,
      ...(options.headers || {}),
    },
  });
}

async function setupAuth() {
  const config = await apiRequest("/api/config");
  if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase) {
    showToast("Supabase auth is not configured yet. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.");
    return;
  }

  supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data } = await supabaseClient.auth.getSession();
  currentSession = data.session;

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentSession = session;
    await refreshAuthUi();
  });

  await refreshAuthUi();
}

function initialsFromName(name) {
  return String(name || "Guest")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "GU";
}

function renderProfile(user, profile) {
  const displayName = profile?.display_name || user?.user_metadata?.displayName || user?.email || "Guest";
  document.querySelector("#topProfileName").textContent = displayName;
  document.querySelector("#profileInitials").textContent = initialsFromName(displayName);
  document.querySelector("#profileDisplayName").textContent = displayName;
  document.querySelector("#profileEmail").textContent = user?.email || "Sign in to manage your marketplace profile.";
  document.querySelector("#profileFullName").textContent = profile?.full_name || user?.user_metadata?.fullName || "Not set";
  document.querySelector("#profileUsername").textContent = profile?.username || user?.user_metadata?.username || "Not set";
  document.querySelector("#profileCountry").textContent = profile?.country || user?.user_metadata?.country || "Not set";
  document.querySelector("#profilePhone").textContent = profile?.phone || user?.user_metadata?.phone || "Not set";
  document.querySelector("#profileRole").textContent = profile?.role || user?.user_metadata?.role || "Buyer";
  document.querySelector("#profileEmailStatus").textContent = user?.email_confirmed_at ? "Verified" : "Pending";
  document.querySelector("#profileKyc").textContent = profile?.kyc_status || "Not started";
}

async function refreshAuthUi() {
  if (!currentSession?.user) {
    document.querySelector("#authStatus").textContent = "Not signed in";
    document.querySelector("#topProfileName").textContent = "Guest";
    renderProfile(null, null);
    switchView("auth");
    return;
  }

  document.querySelector("#authStatus").textContent = "Signed in";
  try {
    const data = await authRequest("/api/profile");
    renderProfile(data.user, data.profile);
  } catch (_error) {
    renderProfile(currentSession.user, null);
  }

  if (window.location.hash === "#auth" || !window.location.hash) {
    switchView("profile");
  }
}

async function loadRemoteData() {
  listings = [];
  pendingReviews = [];
}

function normalizeListing(listing) {
  return {
    ...listing,
    rating: Number(listing.rating || 0),
    buyerRating: Number(listing.buyerRating || listing.buyer_rating || 0),
    sales: Number(listing.sales || 0),
    views: Number(listing.views || 0),
    itemsCount: Number(listing.itemsCount || listing.items_count || 0),
    coinsBalance: Number(listing.coinsBalance || listing.coins_balance || 0),
    inspectionPeriodHours: Number(listing.inspectionPeriodHours || listing.inspection_period_hours || 48),
    banHistory: listing.banHistory || listing.ban_history || "Pending admin review",
    linkedEmailIncluded: Boolean(listing.linkedEmailIncluded || listing.linked_email_included),
    originalEmailIncluded: Boolean(listing.originalEmailIncluded || listing.original_email_included),
    twoFactorStatus: listing.twoFactorStatus || listing.two_factor_status || "Unknown",
    badges: listing.badges || ["Trade Assurance Protected"],
    disputeRate: listing.disputeRate || "New seller",
    refundRate: listing.refundRate || "New seller",
    successfulDeliveries: Number(listing.successfulDeliveries || listing.successful_deliveries || 0),
  };
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

function switchView(viewId) {
  const publicViews = ["auth", "admin"];
  if (!currentSession?.user && !publicViews.includes(viewId)) {
    viewId = "auth";
  }

  document.body.dataset.view = viewId;
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
      listing.badges?.join(" "),
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
              <span class="video-chip">${Number(listing.views || 0).toLocaleString()} views</span>
            </div>
          </div>
          <div class="listing-body">
            <div class="listing-title-row">
              <h3>${listing.title}</h3>
            </div>
            <div class="tag-row">
              <span class="tag">${listing.game}</span>
              <span class="tag">${listing.rank}</span>
              <span class="tag">Level ${listing.level}</span>
              <span class="tag">${listing.platform}</span>
              <span class="tag">${listing.inspectionPeriodHours}h inspection</span>
            </div>
            <div class="badge-list compact">
              ${(listing.badges || []).map((badge) => `<span class="status-pill verified">${badge}</span>`).join("")}
            </div>
            <p class="muted">${listing.description}</p>
            <div class="seller-row">
              <span>${listing.seller} - ${Number(listing.rating || 0).toFixed(1)} stars</span>
              <span class="status-pill ${listing.verified ? "verified" : "pending"}">
                ${listing.verified ? "Verified" : "Unverified"}
              </span>
            </div>
            <div class="card-actions">
              <button class="secondary-button" data-detail="${listing.id}"><i data-lucide="eye"></i> Details</button>
              <button class="primary-button" data-buy="${listing.id}"><i data-lucide="shopping-cart"></i> Buy</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  if (!data.length) {
    listingGrid.innerHTML = `<div class="review-card"><h3>No listings displayed</h3><p class="muted">Listings have been cleared from the web app.</p></div>`;
  }
  createIcons();
}

function openListing(id) {
  const listing = listings.find((item) => Number(item.id) === Number(id));
  if (!listing) return;
  const warning = publisherWarnings[listing.game] || "Confirm current publisher rules before buying or selling this account.";

  modalContent.innerHTML = `
    <div class="modal-hero" style="background-image:url('${listing.image}')"></div>
    <div class="modal-inner">
      <div>
        <p class="eyebrow">${listing.game}</p>
        <h2 id="modalTitle">${listing.title}</h2>
        <p>${listing.description}</p>
        <div class="legal-note">
          <i data-lucide="alert-triangle"></i>
          <p>${warning}</p>
        </div>
        <h3>Structured account details</h3>
        <div class="detail-list">
          <div><span>Rank</span><strong>${listing.rank}</strong></div>
          <div><span>Level</span><strong>${listing.level}</strong></div>
          <div><span>Items / skins</span><strong>${listing.itemsCount || "Disclosed in proof"}</strong></div>
          <div><span>Coins / points</span><strong>${Number(listing.coinsBalance || 0).toLocaleString()}</strong></div>
          <div><span>Linked email</span><strong>${listing.linkedEmailIncluded ? "Included" : "Not included"}</strong></div>
          <div><span>Original email</span><strong>${listing.originalEmailIncluded ? "Included" : "Not included"}</strong></div>
          <div><span>2FA status</span><strong>${listing.twoFactorStatus}</strong></div>
          <div><span>Ban history</span><strong>${listing.banHistory}</strong></div>
          <div><span>Region</span><strong>${listing.region}</strong></div>
          <div><span>Inspection</span><strong>${listing.inspectionPeriodHours} hours</strong></div>
        </div>
      </div>
      <aside class="review-card">
        <h3>Trade Assurance</h3>
        <p class="muted">Buyer funds are held until confirmation, auto-release, or admin decision.</p>
        <div class="badge-list">
          ${(listing.badges || []).map((badge) => `<span class="status-pill verified">${badge}</span>`).join("")}
        </div>
        <p><strong>Seller rating:</strong> ${Number(listing.rating || 0).toFixed(1)} stars across ${listing.sales} sales.</p>
        <p><strong>Successful deliveries:</strong> ${listing.successfulDeliveries}</p>
        <p><strong>Dispute rate:</strong> ${listing.disputeRate}</p>
        <p><strong>Refund rate:</strong> ${listing.refundRate}</p>
        <p><strong>Transfer:</strong> ${listing.transfer}</p>
        <div class="button-row">
          <button class="primary-button" data-buy="${listing.id}"><i data-lucide="lock-keyhole"></i> Buy with Trade Assurance</button>
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
  const queue = document.querySelector("#moderationQueue");
  if (!pendingReviews.length) {
    queue.innerHTML = `<div class="review-card"><h3>No review queue items</h3><p class="muted">The moderation list has been cleared.</p></div>`;
    createIcons();
    return;
  }

  queue.innerHTML = pendingReviews
    .map(
      (item) => `
        <article class="queue-item">
          <div class="queue-thumb" style="background-image:url('${item.image}')"></div>
          <div>
            <strong>${item.title}</strong>
            <p class="muted">Seller: ${item.seller}. ${item.reason}</p>
            <div class="queue-actions">
              <button class="primary-button" data-admin-action="approve"><i data-lucide="check"></i> Approve proof</button>
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

function estimatePrice(form) {
  const data = Object.fromEntries(new FormData(form));
  const level = Number(data.level || 0);
  const items = Number(data.items || 0);
  const coins = Number(data.coins || 0);
  const age = Number(data.age || 0);
  const rank = String(data.rank || "").toLowerCase();
  const gameRiskPenalty = ["Call of Duty", "FIFA / EA FC"].includes(data.game) ? 0.85 : 1;
  const banPenalty = data.banHistory === "ban" ? 0.45 : data.banHistory === "warning" ? 0.75 : 1;
  const rankBoost = rank.includes("elite") || rank.includes("diamond") || rank.includes("champion") ? 650 : 250;
  const platformBoost = data.platform === "PlayStation" || data.platform === "Xbox" ? 180 : 120;

  const base = 350 + level * 8 + items * 22 + coins * 0.015 + age * 7 + rankBoost + platformBoost;
  const score = Math.round((base * gameRiskPenalty * banPenalty) / 100);
  const label = score > 30 ? "High value profile" : score > 15 ? "Moderate value profile" : "Entry value profile";
  document.querySelector("#estimateValue").textContent = label;
  showToast("Value guidance updated. Admin proof review should still verify the listing.");
}

function bindEvents() {
  document.querySelectorAll("[data-view], [data-view-target]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view || button.dataset.viewTarget));
  });

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      showToast("Supabase auth is not configured yet.");
      return;
    }
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      showToast(error.message);
      return;
    }
    form.reset();
    showToast("Logged in successfully.");
    switchView("profile");
  });

  document.querySelector("#signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      showToast("Supabase auth is not configured yet.");
      return;
    }
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    const { data: signupData, error } = await supabaseClient.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          fullName: data.fullName,
          displayName: data.displayName,
          username: data.username,
          country: data.country,
          phone: data.phone,
          role: data.role,
        },
      },
    });

    if (error) {
      showToast(error.message);
      return;
    }

    const session = signupData.session || currentSession;
    currentSession = session;
    if (session?.access_token) {
      await authRequest("/api/profile", {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    form.reset();
    signupModal.classList.remove("is-open");
    signupModal.setAttribute("aria-hidden", "true");
    showToast(session ? "Account created. Profile saved." : "Account created. Check your email to confirm, then log in.");
    await refreshAuthUi();
  });

  document.querySelector("#openSignupModal").addEventListener("click", () => {
    signupModal.classList.add("is-open");
    signupModal.setAttribute("aria-hidden", "false");
    createIcons();
  });

  document.querySelector(".close-signup").addEventListener("click", () => {
    signupModal.classList.remove("is-open");
    signupModal.setAttribute("aria-hidden", "true");
  });

  signupModal.addEventListener("click", (event) => {
    if (event.target === signupModal) {
      signupModal.classList.remove("is-open");
      signupModal.setAttribute("aria-hidden", "true");
    }
  });

  document.querySelector("#openAdminButton").addEventListener("click", () => {
    showToast("Admin console opened. Connect real role checks before production use.");
    switchView("admin");
  });

  window.addEventListener("hashchange", () => {
    const requested = window.location.hash.replace("#", "") || "profile";
    const allowed = ["auth", "profile", "marketplace", "sell", "wallet", "orders", "admin"];
    if (allowed.includes(requested)) {
      switchView(requested);
    }
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

  document.querySelector("#priceFilter")?.addEventListener("input", (event) => {
    state.maxPrice = Number(event.target.value);
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
    state.maxPrice = 5000;
    state.sort = "newest";
    document.querySelector("#searchInput").value = "";
    document.querySelector("#platformFilter").value = "all";
    document.querySelector("#regionFilter").value = "all";
    if (document.querySelector("#priceFilter")) document.querySelector("#priceFilter").value = "5000";
    document.querySelector("#sortFilter").value = "newest";
    renderListings();
  });

  document.body.addEventListener("click", (event) => {
    const detailButton = event.target.closest("[data-detail]");
    const buyButton = event.target.closest("[data-buy]");
    const reportButton = event.target.closest("[data-report]");
    const messageButton = event.target.closest("[data-message]");
    const adminButton = event.target.closest("[data-admin-action]");

    if (detailButton) openListing(detailButton.dataset.detail);
    if (buyButton) {
      modal.classList.remove("is-open");
      showToast("Purchase started. Funds move from buyer wallet to Trade Assurance hold.");
      switchView("orders");
    }
    if (reportButton) showToast("Report submitted for admin review.");
    if (messageButton) showToast("Secure chat opened. Off-platform payment warnings are enabled.");
    if (adminButton) {
      const action = adminButton.dataset.adminAction;
      const text =
        action === "approve"
          ? "Proof approved, listing badge assigned, and marketplace visibility enabled."
          : action === "reject"
            ? "Listing rejected with a moderation reason."
            : "Change request sent to seller with proof requirements.";
      showToast(text);
    }
  });

  document.querySelector("#listingModal .close-modal").addEventListener("click", () => {
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
    const form = event.currentTarget;
    const listing = Object.fromEntries(new FormData(form));

    try {
      const createdListing = await apiRequest("/api/listings", {
        method: "POST",
        body: JSON.stringify(listing),
      });
      const normalized = normalizeListing(createdListing);
      listings = [normalized, ...listings];
      pendingReviews = [
        {
          title: normalized.title,
          seller: normalized.seller,
          reason: "New seller submission awaiting ownership and video proof review.",
          image: normalized.image,
          listingId: normalized.id,
        },
        ...pendingReviews,
      ];
      form.reset();
      renderListings();
      renderQueue();
      showToast("Listing submitted for verification. Buyers cannot purchase until admin approval.");
      switchView("admin");
    } catch (error) {
      showToast(`Could not save listing: ${error.message}`);
    }
  });

  document.querySelector("#valueForm").addEventListener("submit", (event) => {
    event.preventDefault();
    estimatePrice(event.currentTarget);
  });

  document.querySelector("#confirmTransfer").addEventListener("click", () => {
    showToast("Buyer confirmation recorded. Seller pending balance will move to available balance.");
  });

  document.querySelector("#pauseEscrow").addEventListener("click", () => {
    showToast("Trade Assurance release paused. Admin review required before funds move.");
  });

  document.querySelector("#openDispute").addEventListener("click", () => {
    showToast("Dispute opened. Held funds stay locked until admin decision.");
  });

  document.querySelector("#submitDispute").addEventListener("click", () => {
    const reason = document.querySelector("#disputeReason").value;
    showToast(`Dispute evidence submitted: ${reason}. Admin can refund, release, partial refund, suspend, or ban.`);
  });

  document.querySelector("#depositFunds").addEventListener("click", () => {
    showToast("Deposit flow opened. In production this connects to your payment provider.");
  });

  document.querySelector("#requestWithdrawal").addEventListener("click", () => {
    showToast("Withdrawal request created from seller available balance only.");
  });

  document.querySelector("#logoutButton").addEventListener("click", async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    currentSession = null;
    showToast("Logged out.");
    switchView("auth");
  });
}

async function boot() {
  await setupAuth();
  await loadRemoteData();
  bindEvents();
  renderListings();
  renderQueue();
  const initial = window.location.hash.replace("#", "");
  if (!currentSession?.user && initial !== "admin") {
    switchView("auth");
  } else if (["profile", "marketplace", "sell", "wallet", "orders", "admin"].includes(initial)) {
    switchView(initial);
  } else {
    switchView("profile");
  }
  createIcons();
}

boot();
