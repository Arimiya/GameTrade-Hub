const games = [
  {
    name: "eFootball",
    accounts: "No listings yet",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Call of Duty Mobile",
    accounts: "No listings yet",
    image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "PUBG Mobile",
    accounts: "No listings yet",
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Free Fire",
    accounts: "No listings yet",
    image: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Genshin Impact",
    accounts: "No listings yet",
    image: "https://images.unsplash.com/photo-1612404730960-5c71577fca11?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Clash of Clans",
    accounts: "No listings yet",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=80",
  },
];

const accounts = [];

const orders = [];

const conversations = [];

const state = {
  view: "home",
  query: "",
  selectedGame: "All Games",
  minPrice: "",
  maxPrice: "",
  level: "all",
  sort: "recent",
  cart: 0,
  compact: false,
  sellStep: 1,
  orderFilter: "all",
  activeConversation: 1,
  messageQuery: "",
  supportQuery: "",
};

const gamesGrid = document.querySelector("#gamesGrid");
const accountsGrid = document.querySelector("#accountsGrid");
const searchInput = document.querySelector("#searchInput");
const toast = document.querySelector("#toast");
const cartCount = document.querySelector("#cartCount");
const modal = document.querySelector("#modal");
const modalContent = document.querySelector("#modalContent");
const languageMenu = document.querySelector("#languageMenu");
const browsePage = document.querySelector("#browsePage");
const detailPage = document.querySelector("#detailPage");
const detailContent = document.querySelector("#detailContent");
const sellPage = document.querySelector("#sellPage");
const ordersPage = document.querySelector("#ordersPage");
const ordersList = document.querySelector("#ordersList");
const messagesPage = document.querySelector("#messagesPage");
const conversationList = document.querySelector("#conversationList");
const chatBody = document.querySelector("#chatBody");
const chatName = document.querySelector("#chatName");
const walletPage = document.querySelector("#walletPage");
const supportPage = document.querySelector("#supportPage");
const categoriesPage = document.querySelector("#categoriesPage");
const favoritesPage = document.querySelector("#favoritesPage");
const categoryGrid = document.querySelector("#categoryGrid");

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

function setActiveNav(section) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.section === section);
  });
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".landing-view").forEach((section) => {
    section.classList.toggle("is-hidden", view !== "home");
  });
  browsePage.classList.toggle("is-visible", view === "browse");
  detailPage.classList.toggle("is-visible", view === "detail");
  sellPage.classList.toggle("is-visible", view === "sell");
  ordersPage.classList.toggle("is-visible", view === "orders");
  messagesPage.classList.toggle("is-visible", view === "messages");
  walletPage.classList.toggle("is-visible", view === "wallet");
  supportPage.classList.toggle("is-visible", view === "support");
  categoriesPage.classList.toggle("is-visible", view === "categories");
  favoritesPage.classList.toggle("is-visible", view === "favorites");
  setActiveNav(
    view === "home"
      ? "home"
      : view === "sell"
        ? "sell"
        : view === "orders"
          ? "orders"
          : view === "messages"
            ? "messages"
            : view === "wallet"
              ? "wallet"
              : view === "support"
                ? "support"
                : view === "categories"
                  ? "categories"
                  : view === "favorites"
                    ? "favorites"
                    : "browse",
  );
  searchInput.placeholder = view === "browse" || view === "detail" ? "Search for accounts..." : "Search for games, accounts...";
  document.querySelector("#home").scrollIntoView({ behavior: "smooth", block: "start" });
}

function filteredGames() {
  const query = state.query.trim().toLowerCase();
  return games.filter((game) => !query || `${game.name} ${game.accounts}`.toLowerCase().includes(query));
}

function filteredAccounts() {
  const query = state.query.trim().toLowerCase();
  const min = Number(state.minPrice || 0);
  const max = Number(state.maxPrice || Infinity);

  const data = accounts.filter((account) => {
    const levelMatch =
      state.level === "all" ||
      (state.level === "high" && account.level >= 80) ||
      (state.level === "mid" && account.level >= 50 && account.level < 80) ||
      (state.level === "starter" && account.level < 50);

    return (
      (!query || `${account.game} ${account.title}`.toLowerCase().includes(query)) &&
      (state.selectedGame === "All Games" || account.game === state.selectedGame) &&
      account.price >= min &&
      account.price <= max &&
      levelMatch
    );
  });

  return data.sort((a, b) => {
    if (state.sort === "price-low") return a.price - b.price;
    if (state.sort === "price-high") return b.price - a.price;
    return b.id - a.id;
  });
}

function renderGames() {
  const data = filteredGames();
  gamesGrid.innerHTML = data
    .map(
      (game) => `
        <article class="game-card" data-game="${game.name}">
          <div class="game-media" style="background-image:url('${game.image}')"></div>
          <div class="game-body">
            <h3>${game.name}</h3>
            <p>${accounts.filter((account) => account.game === game.name).length || "No"} listings</p>
          </div>
        </article>
      `,
    )
    .join("");

  if (!data.length) {
    gamesGrid.innerHTML = `<article class="game-card"><div class="game-body"><h3>No games found</h3><p>Try another search.</p></div></article>`;
  }

  createIcons();
}

function renderCategories() {
  categoryGrid.innerHTML = games
    .map(
      (game) => `
        <button class="category-card" data-category-game="${game.name}">
          <span style="background-image:url('${game.image}')"></span>
          <strong>${game.name}</strong>
          <small>${accounts.filter((account) => account.game === game.name).length || "No"} listings</small>
        </button>
      `,
    )
    .join("");
  createIcons();
}

function renderGameFilters() {
  const names = ["All Games", ...games.map((game) => game.name)];
  document.querySelector("#gameFilterList").innerHTML = names
    .map(
      (name) => `
        <button class="${state.selectedGame === name ? "is-active" : ""}" data-game-filter="${name}">
          <span>${name === "All Games" ? "All Games" : name}</span>
          <small>${name === "All Games" ? accounts.length : accounts.filter((account) => account.game === name).length}</small>
        </button>
      `,
    )
    .join("");
  document.querySelector("#gameFilterCount").textContent = state.selectedGame;
}

function renderAccounts() {
  renderGameFilters();
  const data = filteredAccounts();
  accountsGrid.classList.toggle("is-compact", state.compact);
  accountsGrid.innerHTML = data
    .map(
      (account) => `
        <article class="account-card" data-account="${account.id}">
          <div class="account-media" style="background-image:url('${account.image}')">
            <span>${account.status}</span>
            <button class="mini-icon" data-favorite="${account.id}" aria-label="Favorite ${account.title}"><i data-lucide="heart"></i></button>
          </div>
          <div class="account-body">
            <p>${account.game}</p>
            <h3>${account.title}</h3>
            <div class="account-meta">
              <span>Level ${account.level}</span>
              <strong>$${account.price}.00</strong>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  if (!data.length) {
    accountsGrid.innerHTML = `
      <article class="account-card empty-card">
        <div class="account-body">
          <h3>No accounts listed yet</h3>
          <p>Be the first seller to create a listing, or check back when sellers add accounts.</p>
          <button class="primary-button" data-empty-action="sell">Sell Your Account</button>
        </div>
      </article>
    `;
  }

  createIcons();
}

function updateCart() {
  cartCount.textContent = state.cart;
  cartCount.classList.toggle("is-visible", state.cart > 0);
}

function showProfileModal() {
  modalContent.innerHTML = `
    <div class="modal-inner profile-modal">
      <h2 id="modalTitle">Account Profile</h2>
      <p>Manage your buyer and seller account details.</p>
      <div class="modal-row"><span>Display name</span><strong>Alex Gamer</strong></div>
      <div class="modal-row"><span>Wallet balance</span><strong>$0.00</strong></div>
      <div class="modal-row"><span>Verification</span><strong>Not started</strong></div>
      <button class="primary-button" data-empty-action="support">Contact Support</button>
    </div>
  `;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  createIcons();
}

function showCartModal() {
  modalContent.innerHTML = `
    <div class="modal-inner">
      <h2 id="modalTitle">Cart</h2>
      <p>${state.cart ? `${state.cart} item ready for secure checkout.` : "Your cart is empty."}</p>
      <div class="modal-row"><span>Items</span><strong>${state.cart}</strong></div>
      <div class="modal-row"><span>Protected checkout</span><strong>Trade Assurance</strong></div>
      <button class="primary-button" data-empty-action="browse">${state.cart ? "Continue Shopping" : "Browse Accounts"}</button>
    </div>
  `;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  createIcons();
}

function renderAccountDetail(account) {
  const thumbs = [account.image, ...accounts.filter((item) => item.id !== account.id).slice(0, 3).map((item) => item.image)];
  detailContent.innerHTML = `
    <div class="detail-shell">
      <div class="detail-gallery">
        <div class="detail-main-image" style="background-image:url('${account.image}')">
          <span>${account.status}</span>
        </div>
        <div class="thumb-row">
          ${thumbs.map((image, index) => `<button class="${index === 0 ? "is-active" : ""}" data-thumb="${image}" style="background-image:url('${image}')" aria-label="Preview image ${index + 1}"></button>`).join("")}
        </div>
        <div class="description-panel">
          <h3>Description</h3>
          <p>Top quality ${account.game} account with legendary players and high team strength.</p>
          <ul>
            <li>Legendary squad</li>
            <li>High rank</li>
            <li>Full access included</li>
          </ul>
        </div>
      </div>

      <div class="detail-info">
        <div class="detail-title-row">
          <div>
            <h1>${account.game} 2024 Account</h1>
            <h2>${account.title} | Rank: ${account.rank}</h2>
          </div>
          <strong>$${account.price}.00</strong>
        </div>

        <div class="seller-info-grid">
          <div class="seller-list">
            ${["Verified Seller", "Backup Seller", "Fast Transfer", "Secure Trader"].map(
              (seller, index) => `
                <button>
                  <span class="seller-avatar"></span>
                  <span><strong>${seller}</strong><small>${index === 0 ? "100% Positive (26)" : `${8 - index}%`}</small></span>
                  <i data-lucide="chevron-right"></i>
                </button>
              `,
            ).join("")}
          </div>

          <div class="account-info-panel">
            <h3>Account Info</h3>
            <div><span>Account Level</span><strong>${account.level}</strong></div>
            <div><span>Rank</span><strong>${account.rank}</strong></div>
            <div><span>Team Strength</span><strong>${account.teamStrength}</strong></div>
            <div><span>Players</span><strong>Legendary Players</strong></div>
            <div><span>In-game Currency</span><strong>${account.currency}</strong></div>
            <div><span>Linked</span><strong>${account.linked}</strong></div>
            <div><span>Email Access</span><strong>${account.access}</strong></div>
          </div>
        </div>

        <div class="detail-actions">
          <button class="primary-button" data-buy-detail="${account.id}">Buy Now</button>
          <button class="outline-button" data-cart-detail="${account.id}">Add to Cart</button>
          <button class="favorite-wide" data-favorite="${account.id}"><i data-lucide="heart"></i> Favorite</button>
        </div>
      </div>
    </div>
  `;
  createIcons();
}

function showAccountDetail(account) {
  renderAccountDetail(account);
  closeModal();
  languageMenu.classList.remove("is-open");
  languageMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  setView("detail");
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function showHome() {
  state.query = "";
  searchInput.value = "";
  closeModal();
  languageMenu.classList.remove("is-open");
  languageMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  renderGames();
  setView("home");
}

function showBrowse(gameName = "All Games") {
  state.view = "browse";
  state.query = "";
  state.selectedGame = gameName;
  searchInput.value = "";
  closeModal();
  languageMenu.classList.remove("is-open");
  languageMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  renderAccounts();
  setView("browse");
}

function showCategories() {
  state.view = "categories";
  state.query = "";
  searchInput.value = "";
  closeModal();
  languageMenu.classList.remove("is-open");
  languageMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  renderCategories();
  setView("categories");
}

function showFavorites() {
  state.view = "favorites";
  state.query = "";
  searchInput.value = "";
  closeModal();
  languageMenu.classList.remove("is-open");
  languageMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  setView("favorites");
}

function renderSellStep() {
  document.querySelectorAll("#sellStepper span").forEach((step, index) => {
    step.classList.toggle("is-active", index + 1 <= state.sellStep);
  });
}

function showSell() {
  state.view = "sell";
  state.query = "";
  searchInput.value = "";
  closeModal();
  languageMenu.classList.remove("is-open");
  languageMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  renderSellStep();
  setView("sell");
}

function renderOrders() {
  const visibleOrders = orders.filter((order) => state.orderFilter === "all" || order.status === state.orderFilter);
  document.querySelectorAll("[data-order-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.orderFilter === state.orderFilter);
  });

  ordersList.innerHTML = visibleOrders
    .map(
      (order) => `
        <article class="order-row">
          <div class="order-thumb" style="background-image:url('${order.image}')"></div>
          <div>
            <h3>${order.title}</h3>
            <p>Order ID: ${order.id}</p>
          </div>
          <strong>$${order.price}.00</strong>
          <span class="order-status ${order.status}">${order.status === "progress" ? "In Progress" : order.status}</span>
          <button class="outline-button" data-order-detail="${order.id}">View Details</button>
        </article>
      `,
    )
    .join("");

  if (!visibleOrders.length) {
    ordersList.innerHTML = `
      <article class="order-row empty-card">
        <div>
          <h3>No orders yet</h3>
          <p>Orders will appear here after you buy or sell an account.</p>
        </div>
        <button class="primary-button" data-empty-action="browse">Browse Accounts</button>
      </article>
    `;
  }
}

function showOrders() {
  state.view = "orders";
  state.query = "";
  searchInput.value = "";
  closeModal();
  languageMenu.classList.remove("is-open");
  languageMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  renderOrders();
  setView("orders");
}

function filteredConversations() {
  const query = state.messageQuery.trim().toLowerCase();
  return conversations.filter((conversation) => !query || `${conversation.name} ${conversation.preview}`.toLowerCase().includes(query));
}

function renderConversations() {
  const data = filteredConversations();
  conversationList.innerHTML = data
    .map(
      (conversation) => `
        <button class="${conversation.id === state.activeConversation ? "is-active" : ""}" data-conversation="${conversation.id}">
          <span class="conversation-avatar" style="background-image:url('${conversation.avatar}')"></span>
          <span>
            <strong>${conversation.name}</strong>
            <small>${conversation.preview}</small>
          </span>
          <em>${conversation.time}</em>
        </button>
      `,
    )
    .join("");

  if (!data.length) {
    conversationList.innerHTML = `<div class="empty-message-state"><strong>No messages yet</strong><small>Buyer and seller conversations will appear here.</small></div>`;
  }
}

function renderChat() {
  const conversation = conversations.find((item) => item.id === state.activeConversation);
  if (!conversation) {
    chatName.textContent = "Messages";
    document.querySelector(".chat-avatar").style.backgroundImage = "";
    chatBody.innerHTML = `<div class="empty-chat-state"><h3>No conversations</h3><p>Messages from buyers and sellers will appear here when trading starts.</p></div>`;
    return;
  }

  chatName.textContent = conversation.name;
  document.querySelector(".chat-avatar").style.backgroundImage = `url('${conversation.avatar}')`;
  chatBody.innerHTML = conversation.messages
    .map(
      (message) => `
        <div class="message-row ${message.from === "me" ? "from-me" : "from-seller"}">
          ${message.from === "seller" ? `<span class="message-avatar" style="background-image:url('${conversation.avatar}')"></span>` : ""}
          <div class="message-stack">
            <p>${message.text}</p>
            ${message.images ? `<div class="message-images">${message.images.map((image) => `<button style="background-image:url('${image}')" aria-label="Chat attachment"></button>`).join("")}</div>` : ""}
          </div>
          ${message.from === "me" ? `<span class="message-avatar" style="background-image:url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80')"></span>` : ""}
        </div>
      `,
    )
    .join("");
  chatBody.scrollTop = chatBody.scrollHeight;
}

function showMessages() {
  state.view = "messages";
  state.query = "";
  searchInput.value = "";
  closeModal();
  languageMenu.classList.remove("is-open");
  languageMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  renderConversations();
  renderChat();
  setView("messages");
}

function showWallet() {
  state.view = "wallet";
  state.query = "";
  searchInput.value = "";
  closeModal();
  languageMenu.classList.remove("is-open");
  languageMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  setView("wallet");
}

function filterSupportTopics() {
  const query = state.supportQuery.trim().toLowerCase();
  document.querySelectorAll("[data-support-topic]").forEach((card) => {
    const text = card.dataset.supportTopic.toLowerCase();
    card.classList.toggle("is-hidden", Boolean(query) && !text.includes(query));
  });
}

function showSupport() {
  state.view = "support";
  state.query = "";
  searchInput.value = "";
  closeModal();
  languageMenu.classList.remove("is-open");
  languageMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  filterSupportTopics();
  setView("support");
}

function bindEvents() {
  document.querySelector("#menuButton").addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
  });

  document.querySelector("#brandHome").addEventListener("click", (event) => {
    event.preventDefault();
    showHome();
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", (event) => {
      const section = button.dataset.section;
      if (section === "home") {
        event.preventDefault();
        showHome();
        return;
      }

      if (section === "browse") {
        event.preventDefault();
        showBrowse();
      } else if (section === "categories") {
        event.preventDefault();
        showCategories();
      } else if (section === "favorites") {
        event.preventDefault();
        showFavorites();
      } else if (section === "sell") {
        event.preventDefault();
        showSell();
      } else if (section === "orders") {
        event.preventDefault();
        showOrders();
      } else if (section === "messages") {
        event.preventDefault();
        showMessages();
      } else if (section === "wallet") {
        event.preventDefault();
        showWallet();
      } else if (section === "support") {
        event.preventDefault();
        showSupport();
      } else {
        setActiveNav(section);
        showToast(`${button.textContent.trim()} opened`);
      }
    });
  });

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    if (state.view === "browse") {
      renderAccounts();
    } else {
      renderGames();
    }
  });

  document.querySelector("[data-scroll-target='games']").addEventListener("click", () => {
    showBrowse();
  });

  document.querySelector("#sellHeroButton").addEventListener("click", showSell);
  document.querySelector("#sellerButton").addEventListener("click", showSell);

  document.querySelector("#viewAllButton").addEventListener("click", () => {
    state.query = "";
    searchInput.value = "";
    renderGames();
    showToast("Showing all popular games");
  });

  document.querySelector("#sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderAccounts();
  });

  document.querySelector("#levelFilter").addEventListener("change", (event) => {
    state.level = event.target.value;
    renderAccounts();
  });

  document.querySelector("#applyPriceButton").addEventListener("click", () => {
    state.minPrice = document.querySelector("#minPrice").value;
    state.maxPrice = document.querySelector("#maxPrice").value;
    renderAccounts();
  });

  document.querySelector("#gridViewButton").addEventListener("click", () => {
    state.compact = false;
    renderAccounts();
  });

  document.querySelector("#compactViewButton").addEventListener("click", () => {
    state.compact = true;
    renderAccounts();
  });

  document.querySelector("#backToBrowse").addEventListener("click", () => {
    showBrowse(state.selectedGame);
  });

  document.querySelector("#sellForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.sellStep === 3) {
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      if (!Number(data.price)) {
        showToast("Add a selling price before publishing.");
        return;
      }
      const newAccount = {
        id: Date.now(),
        game: data.game,
        title: `${data.rank} ${data.game} Account`,
        price: Number(data.price),
        level: Number(data.level),
        rank: data.rank,
        teamStrength: 0,
        currency: "0",
        linked: data.type === "Linked Account" ? "Yes" : "No",
        access: data.type,
        status: "New",
        image: games.find((game) => game.name === data.game)?.image || games[0].image,
      };
      accounts.push(newAccount);
      form.reset();
      state.sellStep = 1;
      renderSellStep();
      renderAccounts();
      showToast("Listing created and added to Browse.");
      showBrowse(newAccount.game);
      return;
    }
    state.sellStep = Math.min(3, state.sellStep + 1);
    renderSellStep();
    showToast(state.sellStep === 3 ? "Ready for review and pricing" : "Account details step unlocked");
  });

  document.querySelectorAll(".upload-strip button").forEach((button) => {
    button.addEventListener("click", () => {
      showToast(button.classList.contains("add-upload") ? "Image picker will open after backend upload is connected." : "Preview selected.");
    });
  });

  document.querySelector("#orderTabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-order-filter]");
    if (!button) return;
    state.orderFilter = button.dataset.orderFilter;
    renderOrders();
  });

  document.querySelector("#messageSearch").addEventListener("input", (event) => {
    state.messageQuery = event.target.value;
    renderConversations();
  });

  conversationList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-conversation]");
    if (!button) return;
    state.activeConversation = Number(button.dataset.conversation);
    renderConversations();
    renderChat();
  });

  document.querySelector("#chatForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#chatMessage");
    const text = input.value.trim();
    if (!text) return;
    const conversation = conversations.find((item) => item.id === state.activeConversation);
    if (!conversation) {
      showToast("No conversation selected.");
      return;
    }
    conversation.messages.push({ from: "me", text });
    conversation.preview = `You: ${text}`;
    conversation.time = "now";
    input.value = "";
    renderConversations();
    renderChat();
  });

  document.querySelector("#supportSearch").addEventListener("input", (event) => {
    state.supportQuery = event.target.value;
    filterSupportTopics();
  });

  document.body.addEventListener("click", (event) => {
    const gameCard = event.target.closest("[data-game]");
    const categoryGame = event.target.closest("[data-category-game]");
    const gameFilter = event.target.closest("[data-game-filter]");
    const accountCard = event.target.closest("[data-account]");
    const favorite = event.target.closest("[data-favorite]");
    const thumb = event.target.closest("[data-thumb]");
    const buyDetail = event.target.closest("[data-buy-detail]");
    const cartDetail = event.target.closest("[data-cart-detail]");
    const orderDetail = event.target.closest("[data-order-detail]");
    const walletAction = event.target.closest("[data-wallet-action]");
    const supportAction = event.target.closest("[data-support-action]");
    const emptyAction = event.target.closest("[data-empty-action]");
    const modalDone = event.target.closest("[data-modal-done]");
    const topAction = event.target.closest("[data-action]");

    if (gameCard) {
      showBrowse(gameCard.dataset.game);
    }

    if (categoryGame) {
      showBrowse(categoryGame.dataset.categoryGame);
    }

    if (gameFilter) {
      state.selectedGame = gameFilter.dataset.gameFilter;
      renderAccounts();
    }

    if (favorite) {
      event.stopPropagation();
      showToast("Added to favorites");
    }

    if (thumb) {
      document.querySelector(".detail-main-image").style.backgroundImage = `url('${thumb.dataset.thumb}')`;
      document.querySelectorAll("[data-thumb]").forEach((button) => button.classList.toggle("is-active", button === thumb));
    }

    if (buyDetail || cartDetail) {
      state.cart += 1;
      updateCart();
      showToast(buyDetail ? "Secure checkout opened" : "Account added to cart");
    }

    if (accountCard && !favorite) {
      const account = accounts.find((item) => item.id === Number(accountCard.dataset.account));
      if (account) showAccountDetail(account);
    }

    if (orderDetail) {
      const order = orders.find((item) => item.id === orderDetail.dataset.orderDetail);
      if (order) showToast(`${order.title} is ${order.status === "progress" ? "in progress" : order.status}.`);
    }

    if (walletAction) {
      const labels = {
        deposit: "Deposit flow opened",
        withdraw: "Withdrawal request started",
        policy: "Trade Assurance policy opened",
      };
      showToast(labels[walletAction.dataset.walletAction] || "Wallet action opened");
    }

    if (supportAction) {
      showToast(`${supportAction.dataset.supportAction} request created`);
    }

    if (emptyAction) {
      if (emptyAction.dataset.emptyAction === "browse") showBrowse();
      if (emptyAction.dataset.emptyAction === "sell") showSell();
      if (emptyAction.dataset.emptyAction === "support") showSupport();
    }

    if (modalDone) {
      if (modalDone.dataset.modalDone === "checkout") {
        state.cart += 1;
        updateCart();
        closeModal();
        showToast("Account added to cart");
      } else {
        closeModal();
        showToast("Seller setup started. Verification checklist created.");
      }
    }

    if (topAction) {
      const action = topAction.dataset.action;
      if (action === "messages") {
        showMessages();
      } else if (action === "notifications") {
        showToast("No notifications yet.");
      } else if (action === "account") {
        showProfileModal();
      }
    }
  });

  document.querySelector("#cartButton").addEventListener("click", () => {
    showCartModal();
  });

  document.querySelector("#walletButton").addEventListener("click", () => {
    showWallet();
  });

  document.querySelector("#languageButton").addEventListener("click", () => {
    languageMenu.classList.toggle("is-open");
    languageMenu.setAttribute("aria-hidden", String(!languageMenu.classList.contains("is-open")));
  });

  languageMenu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-language]");
    if (!button) return;
    document.querySelector("#languageButton span").innerHTML = `<i data-lucide="globe-2"></i> ${button.dataset.language}`;
    languageMenu.classList.remove("is-open");
    languageMenu.setAttribute("aria-hidden", "true");
    showToast(`Language set to ${button.dataset.language}`);
    createIcons();
  });

  document.querySelector("#modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      document.body.classList.remove("menu-open");
    }
  });
}

function boot() {
  bindEvents();
  updateCart();
  renderGames();
  renderAccounts();
  renderCategories();
  renderOrders();
  renderConversations();
  renderChat();
  const page = new URLSearchParams(window.location.search).get("page");
  if (page === "browse") {
    showBrowse();
  } else if (page === "sell") {
    showSell();
  } else if (page === "orders") {
    showOrders();
  } else if (page === "messages") {
    showMessages();
  } else if (page === "wallet") {
    showWallet();
  } else if (page === "support") {
    showSupport();
  } else if (page === "categories") {
    showCategories();
  } else if (page === "favorites") {
    showFavorites();
  } else {
    setView("home");
  }
}

boot();
