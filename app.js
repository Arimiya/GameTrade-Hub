const storageKey = "ledgerlite.pos.state.v2";

const seedState = {
  activeView: "dashboard",
  selectedPlan: "Premium",
  businesses: [
    { id: 1, name: "Asempa Mini Mart", plan: "Premium", status: "Active", users: 9, mrr: 499 },
    { id: 2, name: "North Ridge Pharmacy", plan: "Standard", status: "Active", users: 5, mrr: 249 },
    { id: 3, name: "Adom Boutique", plan: "Basic", status: "Past due", users: 1, mrr: 99 },
    { id: 4, name: "Kasoa Hardware", plan: "Standard", status: "Suspended", users: 4, mrr: 0 },
  ],
  products: [
    { id: 1, name: "Premium Rice 5kg", category: "Groceries", price: 94, cost: 71, stock: 28, reorder: 12, barcode: "100001" },
    { id: 2, name: "Sunflower Oil 2L", category: "Groceries", price: 68, cost: 49, stock: 9, reorder: 10, barcode: "100002" },
    { id: 3, name: "Liquid Soap 1L", category: "Household", price: 26, cost: 15, stock: 34, reorder: 8, barcode: "100003" },
    { id: 4, name: "Paracetamol Pack", category: "Pharmacy", price: 18, cost: 9, stock: 7, reorder: 15, barcode: "100004" },
    { id: 5, name: "Kids Sneakers", category: "Fashion", price: 155, cost: 102, stock: 14, reorder: 6, barcode: "100005" },
    { id: 6, name: "Recharge Card GHS 20", category: "Digital", price: 20, cost: 19, stock: 52, reorder: 20, barcode: "100006" },
    { id: 7, name: "Canned Tomatoes", category: "Groceries", price: 16, cost: 10, stock: 41, reorder: 18, barcode: "100007" },
    { id: 8, name: "LED Bulb 12W", category: "Hardware", price: 32, cost: 21, stock: 6, reorder: 10, barcode: "100008" },
  ],
  customers: [
    { id: 1, name: "Ama Mensah", phone: "+233 24 555 0173", email: "ama@example.com", address: "Osu, Accra", visits: 8, spent: 1240 },
    { id: 2, name: "Kojo Addai", phone: "+233 20 441 3289", email: "kojo@example.com", address: "Dansoman", visits: 4, spent: 640 },
    { id: 3, name: "Efua Boateng", phone: "+233 55 700 9841", email: "", address: "Madina", visits: 11, spent: 2180 },
  ],
  staff: [
    { id: 1, name: "Miriam", role: "Cashier", sales: 19, revenue: 3190 },
    { id: 2, name: "Yaw", role: "Manager", sales: 8, revenue: 2010 },
    { id: 3, name: "Abena", role: "Inventory Officer", sales: 4, revenue: 720 },
  ],
  sales: [
    { id: 101, date: "2026-05-24", customer: "Ama Mensah", cashier: "Miriam", payment: "Mobile Money", total: 322, profit: 88, items: [{ name: "Premium Rice 5kg", qty: 2 }, { name: "Liquid Soap 1L", qty: 1 }] },
    { id: 102, date: "2026-05-24", customer: "Walk-in", cashier: "Yaw", payment: "Cash", total: 155, profit: 53, items: [{ name: "Kids Sneakers", qty: 1 }] },
    { id: 103, date: "2026-05-23", customer: "Efua Boateng", cashier: "Miriam", payment: "Card", total: 436, profit: 121, items: [{ name: "Sunflower Oil 2L", qty: 4 }, { name: "Canned Tomatoes", qty: 6 }] },
  ],
  audit: [
    "Asempa Mini Mart upgraded to Premium",
    "Low-stock alert sent for Paracetamol Pack",
    "Admin suspended Kasoa Hardware",
    "Miriam completed sale #101",
  ],
  cart: [],
};

const plans = [
  {
    name: "Basic",
    price: 99,
    target: "Small shops",
    features: ["1 user", "Limited products", "Basic sales reports"],
  },
  {
    name: "Standard",
    price: 249,
    target: "Growing SMEs",
    features: ["Multiple users", "Inventory management", "Customer records"],
  },
  {
    name: "Premium",
    price: 499,
    target: "Larger SMEs",
    features: ["Multiple branches", "Advanced reports", "Supplier management"],
  },
];

const weeklySales = [
  { label: "Mon", value: 960 },
  { label: "Tue", value: 1240 },
  { label: "Wed", value: 840 },
  { label: "Thu", value: 1710 },
  { label: "Fri", value: 1510 },
  { label: "Sat", value: 2140 },
  { label: "Sun", value: 1320 },
];

const pageTitles = {
  dashboard: "Dashboard",
  checkout: "Checkout",
  inventory: "Inventory",
  customers: "Customers",
  reports: "Reports",
  billing: "Subscription",
  admin: "Admin Dashboard",
};

let state = loadState();

const money = (value) => `GHS ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const byId = (id) => document.getElementById(id);
const nextId = (items) => Math.max(0, ...items.map((item) => Number(item.id) || 0)) + 1;

function loadState() {
  try {
    return { ...seedState, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function setView(viewName) {
  state.activeView = viewName;
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-visible", view.id === viewName));
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("is-active", link.dataset.viewTarget === viewName));
  byId("pageTitle").textContent = pageTitles[viewName] || "LedgerLite POS";
  saveState();
  refreshIcons();
}

function productStatus(product) {
  if (product.stock <= 0) return { label: "Out", tone: "danger" };
  if (product.stock <= product.reorder) return { label: "Low", tone: "warning" };
  return { label: "Healthy", tone: "success" };
}

function cartSubtotal() {
  return state.cart.reduce((sum, item) => {
    const product = state.products.find((candidate) => candidate.id === item.productId);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function cartTotals() {
  const subtotal = cartSubtotal();
  const discountRate = Number(byId("discountInput")?.value || 0) / 100;
  const taxRate = Number(byId("taxInput")?.value || 0) / 100;
  const discount = subtotal * discountRate;
  const taxable = subtotal - discount;
  const tax = taxable * taxRate;
  return { subtotal, discount, tax, total: taxable + tax };
}

function renderDashboard() {
  const todaySales = state.sales.filter((sale) => sale.date === "2026-05-24");
  const revenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = todaySales.reduce((sum, sale) => sum + sale.profit, 0);
  const lowStock = state.products.filter((product) => product.stock <= product.reorder);
  const inventoryValue = state.products.reduce((sum, product) => sum + product.stock * product.cost, 0);

  byId("alertCount").textContent = lowStock.length;
  byId("metricGrid").innerHTML = [
    { icon: "banknote", label: "Today sales", value: money(revenue), detail: `${todaySales.length} transactions`, tone: "green" },
    { icon: "chart-line", label: "Gross profit", value: money(profit), detail: `${Math.round((profit / Math.max(revenue, 1)) * 100)}% margin`, tone: "blue" },
    { icon: "package-search", label: "Inventory value", value: money(inventoryValue), detail: `${state.products.length} active products`, tone: "amber" },
    { icon: "alert-triangle", label: "Low stock", value: lowStock.length, detail: "Products need attention", tone: "red" },
  ]
    .map(
      (metric) => `
        <article class="metric-card ${metric.tone}">
          <i data-lucide="${metric.icon}"></i>
          <span>${metric.label}</span>
          <strong>${metric.value}</strong>
          <small>${metric.detail}</small>
        </article>
      `,
    )
    .join("");

  const max = Math.max(...weeklySales.map((item) => item.value));
  byId("salesChart").innerHTML = weeklySales
    .map(
      (item) => `
        <div class="bar-item">
          <div class="bar-track"><span style="height: ${(item.value / max) * 100}%"></span></div>
          <strong>${item.label}</strong>
          <small>${money(item.value)}</small>
        </div>
      `,
    )
    .join("");

  byId("lowStockList").innerHTML =
    lowStock
      .map(
        (product) => `
          <article class="list-row">
            <span class="row-icon warning"><i data-lucide="alert-circle"></i></span>
            <div>
              <strong>${product.name}</strong>
              <small>${product.stock} left, reorder at ${product.reorder}</small>
            </div>
            <button class="text-button" type="button" data-adjust-stock="${product.id}" data-amount="10">+10</button>
          </article>
        `,
      )
      .join("") || `<p class="empty-state">All stock levels are healthy.</p>`;

  byId("recentSalesList").innerHTML = state.sales
    .slice(0, 5)
    .map(
      (sale) => `
        <article class="list-row">
          <span class="row-icon success"><i data-lucide="receipt"></i></span>
          <div>
            <strong>Sale #${sale.id} - ${sale.customer}</strong>
            <small>${sale.payment} by ${sale.cashier}</small>
          </div>
          <strong>${money(sale.total)}</strong>
        </article>
      `,
    )
    .join("");
}

function productCard(product) {
  const status = productStatus(product);
  return `
    <article class="product-card">
      <div>
        <span class="status-pill ${status.tone}">${status.label}</span>
        <h3>${product.name}</h3>
        <p>${product.category} - ${product.barcode || "No barcode"}</p>
      </div>
      <div class="product-card-footer">
        <strong>${money(product.price)}</strong>
        <button class="icon-button" type="button" data-add-cart="${product.id}" title="Add ${product.name}" aria-label="Add ${product.name}">
          <i data-lucide="plus"></i>
        </button>
      </div>
    </article>
  `;
}

function renderCheckout() {
  const query = byId("productSearch")?.value?.toLowerCase() || "";
  const products = state.products.filter((product) =>
    [product.name, product.category, product.barcode].some((value) => String(value).toLowerCase().includes(query)),
  );
  byId("checkoutProducts").innerHTML = products.map(productCard).join("");

  byId("saleCustomer").innerHTML = `<option>Walk-in</option>${state.customers
    .map((customer) => `<option>${customer.name}</option>`)
    .join("")}`;

  byId("cartList").innerHTML =
    state.cart
      .map((item) => {
        const product = state.products.find((candidate) => candidate.id === item.productId);
        if (!product) return "";
        return `
          <article class="cart-row">
            <div>
              <strong>${product.name}</strong>
              <small>${money(product.price)} each</small>
            </div>
            <div class="qty-controls">
              <button type="button" data-cart-decrement="${product.id}" aria-label="Decrease ${product.name}">-</button>
              <span>${item.qty}</span>
              <button type="button" data-cart-increment="${product.id}" aria-label="Increase ${product.name}">+</button>
            </div>
          </article>
        `;
      })
      .join("") || `<p class="empty-state">Scan or add products to start a sale.</p>`;

  const totals = cartTotals();
  byId("cartTotals").innerHTML = `
    <span>Subtotal <strong>${money(totals.subtotal)}</strong></span>
    <span>Discount <strong>-${money(totals.discount)}</strong></span>
    <span>Tax <strong>${money(totals.tax)}</strong></span>
    <span class="grand-total">Total <strong>${money(totals.total)}</strong></span>
  `;
}

function renderInventory() {
  const query = byId("inventorySearch")?.value?.toLowerCase() || "";
  const products = state.products.filter((product) =>
    [product.name, product.category, product.barcode].some((value) => String(value).toLowerCase().includes(query)),
  );
  byId("inventoryTable").innerHTML = products
    .map((product) => {
      const status = productStatus(product);
      return `
        <tr>
          <td><strong>${product.name}</strong><small>${product.barcode || "No barcode"}</small></td>
          <td>${product.category}</td>
          <td>${money(product.price)}</td>
          <td>${product.stock}</td>
          <td><span class="status-pill ${status.tone}">${status.label}</span></td>
          <td>
            <div class="table-actions">
              <button type="button" data-adjust-stock="${product.id}" data-amount="-1">-1</button>
              <button type="button" data-adjust-stock="${product.id}" data-amount="10">+10</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderCustomers() {
  byId("customerGrid").innerHTML = state.customers
    .map(
      (customer) => `
        <article class="customer-card">
          <div class="avatar">${customer.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
          <div>
            <h3>${customer.name}</h3>
            <p>${customer.phone}</p>
            <small>${customer.email || "No email"} - ${customer.address || "No address"}</small>
          </div>
          <div class="customer-stats">
            <span><strong>${customer.visits}</strong> visits</span>
            <span><strong>${money(customer.spent)}</strong> spent</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderReports() {
  const revenue = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const profit = state.sales.reduce((sum, sale) => sum + sale.profit, 0);
  const taxEstimate = state.sales.reduce((sum, sale) => sum + sale.total * 0.125, 0);
  const avgSale = revenue / Math.max(state.sales.length, 1);

  byId("reportCards").innerHTML = [
    ["Sales revenue", money(revenue), "Daily, weekly, monthly, and yearly rollups"],
    ["Profit", money(profit), "Based on recorded cost prices"],
    ["Tax estimate", money(taxEstimate), "Using current business tax settings"],
    ["Average sale", money(avgSale), "Transaction efficiency benchmark"],
  ]
    .map(
      ([label, value, detail]) => `
        <article class="report-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <small>${detail}</small>
        </article>
      `,
    )
    .join("");

  const productCounts = new Map();
  state.sales.forEach((sale) => {
    sale.items.forEach((item) => productCounts.set(item.name, (productCounts.get(item.name) || 0) + item.qty));
  });
  byId("bestSellersList").innerHTML = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(
      ([name, qty]) => `
        <article class="list-row">
          <span class="row-icon neutral"><i data-lucide="trending-up"></i></span>
          <div><strong>${name}</strong><small>${qty} units sold</small></div>
        </article>
      `,
    )
    .join("");

  byId("staffList").innerHTML = state.staff
    .map(
      (staff) => `
        <article class="list-row">
          <span class="row-icon success"><i data-lucide="user-check"></i></span>
          <div><strong>${staff.name}</strong><small>${staff.role} - ${staff.sales} sales</small></div>
          <strong>${money(staff.revenue)}</strong>
        </article>
      `,
    )
    .join("");
}

function renderBilling() {
  byId("subscriptionStatus").textContent = `${state.selectedPlan} active`;
  byId("planGrid").innerHTML = plans
    .map(
      (plan) => `
        <article class="plan-card ${state.selectedPlan === plan.name ? "is-selected" : ""}">
          <div>
            <span class="status-pill ${state.selectedPlan === plan.name ? "success" : "neutral"}">${plan.target}</span>
            <h3>${plan.name}</h3>
            <strong>${money(plan.price)}<small>/month</small></strong>
          </div>
          <ul>
            ${plan.features.map((feature) => `<li><i data-lucide="check"></i>${feature}</li>`).join("")}
          </ul>
          <button class="${state.selectedPlan === plan.name ? "secondary-button" : "primary-button"} full-width" type="button" data-select-plan="${plan.name}">
            ${state.selectedPlan === plan.name ? "Current plan" : "Choose plan"}
          </button>
        </article>
      `,
    )
    .join("");

  byId("billingHistory").innerHTML = [
    ["2026-05-01", state.selectedPlan, "Paid", plans.find((plan) => plan.name === state.selectedPlan)?.price || 0],
    ["2026-04-01", "Standard", "Paid", 249],
    ["2026-03-01", "Standard", "Paid", 249],
  ]
    .map(
      ([date, plan, status, amount]) => `
        <article class="list-row">
          <span class="row-icon success"><i data-lucide="credit-card"></i></span>
          <div><strong>${plan} subscription</strong><small>${date} - ${status}</small></div>
          <strong>${money(amount)}</strong>
        </article>
      `,
    )
    .join("");
}

function renderAdmin() {
  byId("businessTable").innerHTML = state.businesses
    .map(
      (business) => `
        <tr>
          <td><strong>${business.name}</strong></td>
          <td>${business.plan}</td>
          <td><span class="status-pill ${business.status === "Active" ? "success" : business.status === "Past due" ? "warning" : "danger"}">${business.status}</span></td>
          <td>${business.users}</td>
          <td>${money(business.mrr)}</td>
          <td><button type="button" data-toggle-business="${business.id}">${business.status === "Suspended" ? "Activate" : "Suspend"}</button></td>
        </tr>
      `,
    )
    .join("");

  byId("auditList").innerHTML = state.audit
    .map(
      (event) => `
        <article class="list-row">
          <span class="row-icon neutral"><i data-lucide="activity"></i></span>
          <div><strong>${event}</strong><small>Platform audit log</small></div>
        </article>
      `,
    )
    .join("");
}

function renderAll() {
  renderDashboard();
  renderCheckout();
  renderInventory();
  renderCustomers();
  renderReports();
  renderBilling();
  renderAdmin();
  setView(state.activeView || "dashboard");
  refreshIcons();
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product || product.stock <= 0) {
    showToast("This product is out of stock.");
    return;
  }
  const cartItem = state.cart.find((item) => item.productId === productId);
  if (cartItem) {
    if (cartItem.qty >= product.stock) {
      showToast("Cart quantity cannot exceed available stock.");
      return;
    }
    cartItem.qty += 1;
  } else {
    state.cart.push({ productId, qty: 1 });
  }
  saveState();
  renderAll();
}

function adjustCart(productId, amount) {
  const item = state.cart.find((cartItem) => cartItem.productId === productId);
  const product = state.products.find((candidate) => candidate.id === productId);
  if (!item || !product) return;
  item.qty += amount;
  if (item.qty <= 0) {
    state.cart = state.cart.filter((cartItem) => cartItem.productId !== productId);
  }
  if (item.qty > product.stock) item.qty = product.stock;
  saveState();
  renderAll();
}

function adjustStock(productId, amount) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  product.stock = Math.max(0, product.stock + amount);
  state.audit.unshift(`${product.name} stock adjusted by ${amount > 0 ? "+" : ""}${amount}`);
  saveState();
  renderAll();
  showToast(`${product.name} stock updated.`);
}

function completeSale() {
  if (!state.cart.length) {
    showToast("Add products before completing a sale.");
    return;
  }

  const totals = cartTotals();
  const saleItems = state.cart.map((item) => {
    const product = state.products.find((candidate) => candidate.id === item.productId);
    return { name: product.name, qty: item.qty, price: product.price, cost: product.cost };
  });

  saleItems.forEach((item) => {
    const product = state.products.find((candidate) => candidate.name === item.name);
    product.stock = Math.max(0, product.stock - item.qty);
  });

  const customerName = byId("saleCustomer").value;
  const customer = state.customers.find((item) => item.name === customerName);
  if (customer) {
    customer.visits += 1;
    customer.spent += totals.total;
  }

  const profit = saleItems.reduce((sum, item) => sum + (item.price - item.cost) * item.qty, 0) - totals.discount;
  const sale = {
    id: nextId(state.sales),
    date: "2026-05-24",
    customer: customerName,
    cashier: "Miriam",
    payment: byId("paymentMethod").value,
    total: totals.total,
    profit,
    items: saleItems.map((item) => ({ name: item.name, qty: item.qty })),
  };

  state.sales.unshift(sale);
  state.staff[0].sales += 1;
  state.staff[0].revenue += totals.total;
  state.audit.unshift(`Miriam completed sale #${sale.id}`);
  state.cart = [];
  saveState();
  renderReceipt(sale, totals);
  renderAll();
  showToast(`Sale #${sale.id} completed.`);
}

function renderReceipt(sale, totals) {
  byId("receiptContent").innerHTML = `
    <div class="receipt-lines">
      <span><strong>Receipt #${sale.id}</strong><small>${sale.date} - ${sale.payment}</small></span>
      <span><strong>Customer</strong><small>${sale.customer}</small></span>
      <span><strong>Cashier</strong><small>${sale.cashier}</small></span>
      ${sale.items.map((item) => `<span><strong>${item.name}</strong><small>${item.qty} item(s)</small></span>`).join("")}
      <span><strong>Subtotal</strong><small>${money(totals.subtotal)}</small></span>
      <span><strong>Discount</strong><small>-${money(totals.discount)}</small></span>
      <span><strong>Tax</strong><small>${money(totals.tax)}</small></span>
      <span class="receipt-total"><strong>Total</strong><small>${money(totals.total)}</small></span>
    </div>
  `;
  byId("receiptModal").hidden = false;
  refreshIcons();
}

function exportReports() {
  const rows = [["Sale ID", "Date", "Customer", "Cashier", "Payment", "Total", "Profit"]];
  state.sales.forEach((sale) => rows.push([sale.id, sale.date, sale.customer, sale.cashier, sale.payment, sale.total.toFixed(2), sale.profit.toFixed(2)]));
  const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ledgerlite-sales-report.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

document.addEventListener("click", (event) => {
  const viewTarget = event.target.closest("[data-view-target]")?.dataset.viewTarget;
  if (viewTarget) setView(viewTarget);

  const addButton = event.target.closest("[data-add-cart]");
  if (addButton) addToCart(Number(addButton.dataset.addCart));

  const incrementButton = event.target.closest("[data-cart-increment]");
  if (incrementButton) adjustCart(Number(incrementButton.dataset.cartIncrement), 1);

  const decrementButton = event.target.closest("[data-cart-decrement]");
  if (decrementButton) adjustCart(Number(decrementButton.dataset.cartDecrement), -1);

  const stockButton = event.target.closest("[data-adjust-stock]");
  if (stockButton) adjustStock(Number(stockButton.dataset.adjustStock), Number(stockButton.dataset.amount));

  const planButton = event.target.closest("[data-select-plan]");
  if (planButton) {
    state.selectedPlan = planButton.dataset.selectPlan;
    state.audit.unshift(`Asempa Mini Mart selected ${state.selectedPlan}`);
    saveState();
    renderAll();
    showToast(`${state.selectedPlan} plan selected.`);
  }

  const businessButton = event.target.closest("[data-toggle-business]");
  if (businessButton) {
    const business = state.businesses.find((item) => item.id === Number(businessButton.dataset.toggleBusiness));
    business.status = business.status === "Suspended" ? "Active" : "Suspended";
    business.mrr = business.status === "Suspended" ? 0 : plans.find((plan) => plan.name === business.plan)?.price || 0;
    state.audit.unshift(`${business.name} ${business.status === "Suspended" ? "suspended" : "activated"} by admin`);
    saveState();
    renderAll();
  }
});

byId("productSearch").addEventListener("input", renderCheckout);
byId("inventorySearch").addEventListener("input", renderInventory);
byId("discountInput").addEventListener("input", renderCheckout);
byId("taxInput").addEventListener("input", renderCheckout);
byId("clearCartButton").addEventListener("click", () => {
  state.cart = [];
  saveState();
  renderAll();
});
byId("completeSaleButton").addEventListener("click", completeSale);
byId("closeReceiptButton").addEventListener("click", () => {
  byId("receiptModal").hidden = true;
});
byId("exportReportButton").addEventListener("click", exportReports);

byId("productForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.products.unshift({
    id: nextId(state.products),
    name: form.get("name").trim(),
    category: form.get("category").trim(),
    price: Number(form.get("price")),
    cost: Number(form.get("cost")),
    stock: Number(form.get("stock")),
    reorder: Number(form.get("reorder")),
    barcode: form.get("barcode").trim() || String(Date.now()).slice(-6),
  });
  state.audit.unshift(`${form.get("name")} added to inventory`);
  event.currentTarget.reset();
  saveState();
  renderAll();
  showToast("Product saved.");
});

byId("customerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.customers.unshift({
    id: nextId(state.customers),
    name: form.get("name").trim(),
    phone: form.get("phone").trim(),
    email: form.get("email").trim(),
    address: form.get("address").trim(),
    visits: 0,
    spent: 0,
  });
  event.currentTarget.reset();
  saveState();
  renderAll();
  showToast("Customer saved.");
});

window.addEventListener("load", renderAll);
