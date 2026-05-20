const listings = [
  {
    id: 1,
    game: "Shadow Ops",
    title: "Elite tactical account with rare loadouts",
    price: 2450,
    level: 94,
    rank: "Diamond II",
    platform: "PC",
    region: "Europe",
    seller: "KofiRanked",
    rating: 4.9,
    sales: 38,
    verified: true,
    age: "3 years",
    transfer: "Email change, password reset, 2FA update",
    inventory: "42 legendary skins, 11 operator bundles, 68 badges, 84k coins",
    banHistory: "No bans or restrictions reported",
    views: 1480,
    image:
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1000&q=80",
    description:
      "Competitive-ready account with documented rank history, high-value cosmetics, and clean transfer checklist.",
  },
  {
    id: 2,
    game: "Legends Rift",
    title: "Master tier profile with limited champion skins",
    price: 3180,
    level: 128,
    rank: "Master",
    platform: "PC",
    region: "North America",
    seller: "NanaCarry",
    rating: 4.8,
    sales: 26,
    verified: true,
    age: "5 years",
    transfer: "Username login plus recovery email update",
    inventory: "93 skins, 31 rare emotes, season rewards from 2021-2025",
    banHistory: "One chat warning disclosed, no bans",
    views: 2012,
    image:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80",
    description:
      "High-rank account with long account age, strong champion pool, and safe public proof video.",
  },
  {
    id: 3,
    game: "Street Ball Mobile",
    title: "Maxed mobile account with premium squad",
    price: 980,
    level: 72,
    rank: "Pro League",
    platform: "Mobile",
    region: "West Africa",
    seller: "AmaPlayz",
    rating: 4.7,
    sales: 19,
    verified: true,
    age: "2 years",
    transfer: "Game ID binding and social login handoff",
    inventory: "8 premium players, 17 court skins, 32k coins",
    banHistory: "Clean",
    views: 760,
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80",
    description:
      "Budget-friendly account for quick competitive entry with screenshot and video proof.",
  },
  {
    id: 4,
    game: "Galaxy Racers",
    title: "Collector garage with event vehicles",
    price: 1760,
    level: 83,
    rank: "Platinum I",
    platform: "PlayStation",
    region: "Asia",
    seller: "TurboYaw",
    rating: 4.5,
    sales: 14,
    verified: false,
    age: "4 years",
    transfer: "Console profile transfer support",
    inventory: "26 unlocked vehicles, 9 limited event cars, 44 cosmetic kits",
    banHistory: "No bans",
    views: 1098,
    image:
      "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=1000&q=80",
    description:
      "Garage-focused profile with event unlocks and seller-provided transfer notes.",
  },
  {
    id: 5,
    game: "Royal Quest",
    title: "Mythic inventory account with rare mounts",
    price: 4620,
    level: 160,
    rank: "Mythic",
    platform: "Xbox",
    region: "Europe",
    seller: "QuestVault",
    rating: 4.95,
    sales: 51,
    verified: true,
    age: "6 years",
    transfer: "Email and authenticator handoff with admin escrow watch",
    inventory: "12 mythic mounts, 64 cosmetics, guild achievements, 210k gold",
    banHistory: "Clean",
    views: 3376,
    image:
      "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1000&q=80",
    description:
      "Premium account with extensive inventory proof and high seller completion rate.",
  },
  {
    id: 6,
    game: "Arena Clash",
    title: "Starter champion bundle and ranked placement",
    price: 640,
    level: 41,
    rank: "Gold III",
    platform: "Mobile",
    region: "West Africa",
    seller: "RankLift",
    rating: 4.2,
    sales: 8,
    verified: false,
    age: "1 year",
    transfer: "Linked email switch",
    inventory: "14 champions, 6 rare skins, 8k coins",
    banHistory: "Clean",
    views: 542,
    image:
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1000&q=80",
    description:
      "Affordable account for buyers who want a ready but lower-risk entry profile.",
  },
];

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

const state = {
  search: "",
  platform: "all",
  region: "all",
  maxPrice: 5000,
  sort: "newest",
};

const money = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

const listingGrid = document.querySelector("#listingGrid");
const resultCount = document.querySelector("#resultCount");
const activeListings = document.querySelector("#activeListings");
const modal = document.querySelector("#listingModal");
const modalContent = document.querySelector("#modalContent");
const toast = document.querySelector("#toast");

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

function switchView(viewId) {
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
      (state.region === "all" || listing.region === state.region) &&
      listing.price <= state.maxPrice
    );
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    if (state.sort === "cheapest") return a.price - b.price;
    if (state.sort === "expensive") return b.price - a.price;
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
              <span class="price">${money.format(listing.price)}</span>
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
    listingGrid.innerHTML = `<div class="review-card"><h3>No matching listings</h3><p class="muted">Try a wider price range or remove a platform filter.</p></div>`;
  }
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
        <h3>${money.format(listing.price)}</h3>
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
  document.querySelectorAll("[data-view], [data-view-target]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view || button.dataset.viewTarget));
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

  document.querySelector("#priceFilter").addEventListener("input", (event) => {
    state.maxPrice = Number(event.target.value);
    document.querySelector("#priceValue").textContent = `Up to ${money.format(state.maxPrice)}`;
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
    document.querySelector("#priceFilter").value = "5000";
    document.querySelector("#sortFilter").value = "newest";
    document.querySelector("#priceValue").textContent = "Up to GH₵ 5,000";
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

  document.querySelector("#listingForm").addEventListener("submit", (event) => {
    event.preventDefault();
    showToast("Listing submitted. Admin review queue status: Pending Review.");
    switchView("admin");
  });

  document.querySelector("#confirmTransfer").addEventListener("click", () => {
    showToast("Buyer confirmation recorded. Escrow release is now scheduled.");
  });

  document.querySelector("#pauseEscrow").addEventListener("click", () => {
    showToast("Escrow release paused. Admin review required before funds move.");
  });

  document.querySelector("#openDispute").addEventListener("click", () => {
    showToast("Dispute opened with evidence upload enabled for buyer and seller.");
  });
}

function boot() {
  bindEvents();
  renderListings();
  renderQueue();
  const initial = window.location.hash.replace("#", "");
  if (["marketplace", "sell", "orders", "admin"].includes(initial)) {
    switchView(initial);
  }
  createIcons();
}

boot();
