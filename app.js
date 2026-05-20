import {
  deleteListingById,
  ensureUserProfile,
  fetchAdminListings,
  fetchApprovedListings,
  fetchUserProfile,
  getCurrentSession,
  isSupabaseConfigured,
  mapSupabaseListing,
  onAuthStateChange,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  submitListingForReview,
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
const DEFAULT_LISTING_IMAGE =
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=80";
const ADMIN_EMAIL = "adnansalman169@gmail.com";
const ADMIN_PASSWORD = "@Arimiyaw124";

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
const signOutButton = document.querySelector("#signOutButton");
const adminLoginButton = document.querySelector("#adminLoginButton");
const videoUpload = document.querySelector("#videoUpload");
const imageUpload = document.querySelector("#imageUpload");
const videoFileName = document.querySelector("#videoFileName");
const imageFileName = document.querySelector("#imageFileName");
const escrowStatusText = document.querySelector("#escrowStatusText");
const stepBuyerConfirm = document.querySelector("#stepBuyerConfirm");
const stepFundsRelease = document.querySelector("#stepFundsRelease");
const fundsReleaseText = document.querySelector("#fundsReleaseText");
const disputePanel = document.querySelector("#disputePanel");
const adminListingControl = document.querySelector("#adminListingControl");
let currentUser = null;
let currentProfile = null;
let adminModeRequested = false;

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

function setAuthMode(mode) {
  document.querySelectorAll(".auth-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.authMode === mode);
  });
  document.querySelector("#loginForm").classList.toggle("is-active", mode === "login");
  document.querySelector("#signupForm").classList.toggle("is-active", mode === "signup");
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
    showToast(error.message);
    return;
  }

  if (mode === "signup" && !data.session) {
    const fallbackUser = createFallbackUser(email);
    currentProfile = {
      id: data.user?.id || fallbackUser.id,
      email,
      role: email === ADMIN_EMAIL ? "admin" : "buyer",
      status: "active",
    };
    setAuthenticatedUser(data.user || fallbackUser);
    showToast("Account created. You can continue now; confirm your email when Supabase asks.");
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
            </div>
            <div class="tag-row">
              <span class="tag">${listing.game}</span>
              <span class="tag">${listing.rank}</span>
              <span class="tag">Level ${listing.level}</span>
              <span class="tag">${listing.platform}</span>
            </div>
            <p class="muted">${listing.description}</p>
            <div class="seller-row">
              <span>${listing.seller} · ${listing.rating.toFixed(1)} stars</span>
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
          <p>This platform is not affiliated with game publishers. Confirm publisher rules before buying or selling.</p>
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
        <p class="muted">Payment is held in escrow until transfer confirmation.</p>
        <div class="seller-row">
          <span>${listing.seller}</span>
          <span class="status-pill ${listing.verified ? "verified" : "pending"}">${listing.verified ? "Verified seller" : "Pending verification"}</span>
        </div>
        <p><strong>${listing.rating.toFixed(1)} stars</strong> across ${listing.sales} completed sales.</p>
        <p><strong>Transfer:</strong> ${listing.transfer}</p>
        <div class="button-row">
          <button class="primary-button" data-buy="${listing.id}"><i data-lucide="lock-keyhole"></i> Buy with escrow</button>
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
    adminModeRequested = true;
    const loginForm = document.querySelector("#loginForm");
    if (loginForm.requestSubmit) {
      loginForm.requestSubmit();
    } else {
      loginForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
  });

  document.querySelector("#signupForm").addEventListener("submit", (event) => {
    handleAuthSubmit(event, "signup");
  });

  signOutButton.addEventListener("click", async () => {
    currentProfile = null;
    setAuthenticatedUser(null);
    const { error } = await signOut();
    showToast(error ? error.message : "Signed out.");
  });

  document.querySelectorAll("[data-view], [data-view-target]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view || button.dataset.viewTarget));
  });

  document.querySelector("#depositForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const method = String(form.get("method") || "").replace("-", " ");
    showToast(`Deposit started with ${method}. Connect a payment gateway to process real payments.`);
    event.currentTarget.reset();
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

  document.body.addEventListener("click", (event) => {
    const detailButton = event.target.closest("[data-detail]");
    const buyButton = event.target.closest("[data-buy]");
    const reportButton = event.target.closest("[data-report]");
    const messageButton = event.target.closest("[data-message]");
    const adminButton = event.target.closest("[data-admin-action]");
    const deleteListingButton = event.target.closest("[data-delete-listing]");

    if (detailButton) openListing(detailButton.dataset.detail);
    if (buyButton) {
      modal.classList.remove("is-open");
      showToast("Checkout created. Funds will be held in escrow until transfer confirmation.");
      switchView("orders");
    }
    if (reportButton) showToast("Report submitted for admin review.");
    if (messageButton) showToast("Secure chat opened. Off-platform payment warnings are enabled.");
    if (adminButton) {
      const action = adminButton.dataset.adminAction;
      const text =
        action === "approve"
          ? "Listing approved and moved to active marketplace."
          : action === "reject"
            ? "Listing rejected with a moderation reason."
            : "Change request sent to seller.";
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
      game: form.get("game"),
      title: form.get("title"),
      price: 0,
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
        showToast("Account uploaded and sent to Supabase review.");
      }
    } else {
      showToast("Account uploaded locally and added to the marketplace.");
    }
    switchView("marketplace");
  });

  document.querySelector("#confirmTransfer").addEventListener("click", () => {
    const checks = [...document.querySelectorAll(".transfer-check")];
    if (!checks.every((check) => check.checked)) {
      showToast("Complete the transfer checklist before confirming receipt.");
      return;
    }
    stepBuyerConfirm.classList.remove("active");
    stepBuyerConfirm.classList.add("done");
    stepBuyerConfirm.querySelector("strong").textContent = "Buyer confirmed";
    stepBuyerConfirm.querySelector("small").textContent = "Buyer verified account access and listed items.";
    stepFundsRelease.classList.remove("paused", "disputed");
    stepFundsRelease.classList.add("done");
    fundsReleaseText.textContent = "Escrow completed. Funds are ready for release.";
    escrowStatusText.textContent = "Transfer confirmed. Escrow is completed.";
    disputePanel.hidden = true;
    showToast("Confirmed received. Escrow marked as completed.");
  });

  document.querySelector("#pauseEscrow").addEventListener("click", () => {
    stepFundsRelease.classList.remove("done");
    stepFundsRelease.classList.add("active", "paused");
    fundsReleaseText.textContent = "Release paused. Admin review is required before funds move.";
    escrowStatusText.textContent = "Escrow release is paused for review.";
    showToast("Escrow release paused.");
  });

  document.querySelector("#openDispute").addEventListener("click", () => {
    disputePanel.hidden = false;
    disputePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    stepFundsRelease.classList.remove("done");
    stepFundsRelease.classList.add("active", "disputed");
    fundsReleaseText.textContent = "Release paused because a dispute is being prepared.";
    escrowStatusText.textContent = "Dispute mode is open. Add the reason and explanation below.";
    showToast("Dispute form opened.");
  });

  disputePanel.addEventListener("submit", (event) => {
    event.preventDefault();
    const reason = document.querySelector("#disputeReason").value;
    if (!reason) {
      showToast("Select a dispute reason first.");
      return;
    }
    stepFundsRelease.classList.remove("done");
    stepFundsRelease.classList.add("active", "disputed");
    fundsReleaseText.textContent = `Dispute opened: ${reason}. Admin review is required.`;
    escrowStatusText.textContent = "Dispute submitted. Escrow release remains paused.";
    showToast("Dispute submitted for admin review.");
  });
}

function boot() {
  bindEvents();
  initializeAuthGate();
  renderListings();
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
