let token = "";
let currentRole = "GUEST";
let currentUserName = "";
let currentUserAddress = ""; // CHANGED: track user address for order success message
let allProducts = [];
let activeCategory = "ALL";
let loginTab = "USER";

const BASE_URL = "http://localhost:8082";

/* ─── API HELPER ─── */
async function api(path, method = "GET", body = null, auth = false) {
    const headers = { "Content-Type": "application/json" };
    if (auth && token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(BASE_URL + path, { method, headers, body: body ? JSON.stringify(body) : null });
    return res.json().catch(() => ({}));
}

/* ─── NAVIGATION ─── */
function showPage(name) {
    ["homePage", "loginPage", "registerPage", "cartPage", "adminPage", "ordersPage"].forEach(id => {
        document.getElementById(id).classList.add("hidden");
        document.getElementById(id).classList.remove("active");
    });
    const target = document.getElementById(name + "Page");
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }
    if (name === "cart") loadCart();
    if (name === "admin") { renderAdminProductGrid(); loadAdminOrders(); } // CHANGED: also load admin orders
    if (name === "home") loadFeaturedProducts();
    if (name === "orders") loadOrders();
}

function scrollToProducts() {
    document.getElementById("productSectionTitle").scrollIntoView({ behavior: "smooth" });
}

/* ─── AUTH UI ─── */
function switchLoginTab(role) {
    loginTab = role;
    document.getElementById("tabUser").classList.toggle("active", role === "USER");
    document.getElementById("tabAdmin").classList.toggle("active", role === "ADMIN");
}

async function submitLogin() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errEl = document.getElementById("loginError");
    errEl.classList.add("hidden");
    errEl.textContent = "";

    if (!email || !password) {
        errEl.textContent = "Please enter email and password.";
        errEl.classList.remove("hidden");
        return;
    }

    const data = await api("/api/users/login", "POST", { email, password });

    if (!data.token) {
        errEl.textContent = data.error || "Invalid credentials.";
        errEl.classList.remove("hidden");
        return;
    }

    if (data.role !== loginTab) {
        errEl.textContent = `This login is for ${loginTab} only. Please use the correct tab.`;
        errEl.classList.remove("hidden");
        return;
    }

    setSession(data);
    showPage("home");
}

// CHANGED: Added address field, validation, and API call
async function registerUser() {
    const firstName = document.getElementById("regFirstName").value.trim();
    const lastName = document.getElementById("regLastName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirmPassword").value;
    const address = document.getElementById("regAddress").value.trim(); // CHANGED: read address
    const msgEl = document.getElementById("registerMessage");

    msgEl.className = "msg-box hidden";
    msgEl.textContent = "";

    // CHANGED: added address to required fields check
    if (!firstName || !lastName || !phone || !email || !password || !confirm || !address) {
        showMsg(msgEl, "Please fill in all fields including your delivery address.", "error");
        return;
    }
    if (password !== confirm) {
        showMsg(msgEl, "Passwords do not match.", "error");
        return;
    }

    // CHANGED: include address in registration payload
    const data = await api("/api/users/register", "POST", {
        name: `${firstName} ${lastName}`, phone, email, password, address
    });

    if (data.token) {
        showMsg(msgEl, "Registration successful! Redirecting...", "success");
        setSession(data);
        setTimeout(() => showPage("home"), 1200);
    } else {
        showMsg(msgEl, data.error || "Registration failed. Please try again.", "error");
    }
}

function showMsg(el, text, type) {
    el.textContent = text;
    el.className = `msg-box ${type}`;
}

// CHANGED: fetch profile after login to store user address
async function setSession(data) {
    token = data.token;
    currentRole = data.role;
    currentUserName = data.name || "User";
    updateNavbar();
    loadFeaturedProducts();
    if (currentRole === "USER") {
        updateCartBadge();
        // CHANGED: fetch and cache user's delivery address
        const profile = await api("/api/users/profile", "GET", null, true);
        currentUserAddress = profile.address || "";
    }
}

function updateNavbar() {
    const guest = document.getElementById("guestNav");
    const userN = document.getElementById("userNav");
    const adminN = document.getElementById("adminNav");

    if (currentRole === "USER") {
        guest.classList.add("hidden");
        adminN.classList.add("hidden");
        userN.classList.remove("hidden");
        document.getElementById("loggedInName").textContent = `Hello, ${currentUserName.split(" ")[0]}`;
    } else if (currentRole === "ADMIN") {
        guest.classList.add("hidden");
        userN.classList.add("hidden");
        adminN.classList.remove("hidden");
        document.getElementById("loggedInAdminName").textContent = `Hello, ${currentUserName.split(" ")[0]}`;
    } else {
        guest.classList.remove("hidden");
        userN.classList.add("hidden");
        adminN.classList.add("hidden");
    }
}

function logout() {
    token = "";
    currentRole = "GUEST";
    currentUserName = "";
    currentUserAddress = ""; // CHANGED: clear address on logout
    updateNavbar();
    showPage("home");
    loadFeaturedProducts();
    const badge = document.getElementById("cartBadge");
    badge.classList.add("hidden");
    badge.textContent = "0";
}

/* ─── CATEGORY BAR ─── */
function buildCategoryBar(products) {
    const bar = document.getElementById("categoryBar");
    const cats = ["ALL", ...new Set(products.map(p => p.category || "General").sort())];
    bar.innerHTML = cats.map(c => `
        <div class="cat-item ${c === activeCategory ? "active" : ""}" onclick="filterCategory('${c}')">${c}</div>
    `).join("");
}

function filterCategory(cat) {
    activeCategory = cat;
    buildCategoryBar(allProducts);
    const filtered = cat === "ALL" ? allProducts : allProducts.filter(p => (p.category || "General") === cat);
    renderProducts(filtered);
    const title = document.getElementById("productSectionTitle");
    title.textContent = cat === "ALL" ? "Featured Products" : cat;
}

/* ─── PRODUCT DISPLAY ─── */
async function loadFeaturedProducts() {
    const products = await fetch(BASE_URL + "/api/products").then(r => r.json()).catch(() => []);
    allProducts = Array.isArray(products) ? products : [];
    buildCategoryBar(allProducts);
    const filtered = activeCategory === "ALL" ? allProducts : allProducts.filter(p => (p.category || "General") === activeCategory);
    renderProducts(filtered);
}

function handleSearch() {
    const q = document.getElementById("searchInput").value.toLowerCase().trim();
    if (!q) { renderProducts(allProducts); return; }
    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
    renderProducts(filtered);
}

// CHANGED: Added quantity selector (−/+) on each product card
function renderProducts(products) {
    const grid = document.getElementById("productGrid");
    if (!products.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:#878787;">No products found.</div>`;
        return;
    }
    grid.innerHTML = products.map(p => {
        // CHANGED: qty selector + Add to Cart (was a single Add to Cart button)
        const inStock=p.stock>0;
        const cartBtn = currentRole === "USER"
            ? inStock
                ? `<div class="qty-row">
                     <button class="qty-btn" onclick="event.stopPropagation();changeQty(${p.id}, -1)">&#8722;</button>
                     <span id="qty-${p.id}" class="qty-display">1</span>
                     <button class="qty-btn" onclick="event.stopPropagation();changeQty(${p.id}, 1)">+</button>
                     <button class="add-cart-btn" onclick="event.stopPropagation();addProductToCart(${p.id})">Add to Cart</button>
                   </div>`
                : `<div class="out-of-stock-tag">&#10006; Out of Stock</div>`
            : "";
        return `
        <article class="product-card">
            <img src="${p.image || "https://via.placeholder.com/300x200?text=No+Image"}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="product-content">
                <div class="product-category-tag">${p.category || "General"}</div>
                <h3>${p.name}</h3>
                <p class="desc">${p.description || ""}</p>
                <div class="product-price">&#8377;${p.price}</div>
                <div class="${inStock ? 'stock-in' : 'stock-out'}">${inStock ? '&#10003; In Stock (' + p.stock + ')' : '&#10006; Out of Stock'}</div>
                ${cartBtn}
            </div>
        </article>`;
    }).join("");
}

// CHANGED: New helper to increment/decrement qty on product card
function changeQty(productId, delta) {
    const el = document.getElementById(`qty-${productId}`);
    if (!el) return;
    let current = parseInt(el.textContent) || 1;
    current = Math.max(1, current + delta);
    el.textContent = current;
}

/* ─── CART ─── */
// CHANGED: reads qty selector value instead of always sending 1
async function addProductToCart(productId) {
    if (currentRole !== "USER") { showPage("login"); return; }
    const qtyEl = document.getElementById(`qty-${productId}`);
    const quantity = qtyEl ? parseInt(qtyEl.textContent) || 1 : 1;
    const data = await api("/api/cart/add", "POST", { productId, quantity }, true);
    if (data.id) {
        await updateCartBadge();
        showToast(`${quantity} item(s) added to cart!`);
    } else {
        showToast(data.error || "Failed to add to cart.");
    }
}

async function updateCartBadge() {
    if (currentRole !== "USER") return;
    const cart = await api("/api/cart", "GET", null, true);
    const count = Array.isArray(cart.items) ? cart.items.length : 0;
    const badge = document.getElementById("cartBadge");
    badge.textContent = count;
    count > 0 ? badge.classList.remove("hidden") : badge.classList.add("hidden");
}

async function loadCart() {
    if (currentRole !== "USER") {
        document.getElementById("cartList").innerHTML = `<p style="color:#878787">Please login to view your cart.</p>`;
        document.getElementById("cartSummary").innerHTML = "";
        return;
    }
    const cart = await api("/api/cart", "GET", null, true);
    renderCart(cart);
}

function renderCart(cart) {
    const list = document.getElementById("cartList");
    const summary = document.getElementById("cartSummary");

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:40px 0;color:#878787;"><div style="font-size:48px">🛒</div><p>Your cart is empty</p><button class="submit-btn" style="width:auto;padding:10px 24px" onclick="showPage('home')">Shop Now</button></div>`;
        summary.innerHTML = "";
        return;
    }

    list.innerHTML = cart.items.map(item => `
        <div class="cart-item">
            <img src="${item.product.image || "https://via.placeholder.com/80?text=?"}" alt="${item.product.name}" onerror="this.src='https://via.placeholder.com/80?text=?'">
            <div class="cart-item-info">
                <h4>${item.product.name}</h4>
                <p>${item.product.category || ""}</p>
                <button class="remove-btn" onclick="removeCartItem(${item.id})">Remove</button>
            </div>
            <div>
                <div class="cart-item-price">&#8377;${item.totalPrice}</div>
                <div style="font-size:13px;color:#878787">Qty: ${item.quantity}</div>
            </div>
        </div>
    `).join("");

    summary.innerHTML = `
        <div class="summary-row"><span>Price (${cart.items.length} items)</span><span>&#8377;${cart.totalPrice}</span></div>
        <div class="summary-row"><span>Delivery Charges</span><span style="color:#388e3c">FREE</span></div>
        <div class="summary-row summary-total"><span>Total Amount</span><span>&#8377;${cart.totalPrice}</span></div>
    `;
}

async function removeCartItem(itemId) {
    await api(`/api/cart/${itemId}`, "DELETE", null, true);
    await loadCart();
    await updateCartBadge();
}

// CHANGED: Replaced placeOrderWithCod() with placeOrderWithPayment() supporting all payment methods
async function placeOrderWithPayment() {
    const selected = document.querySelector('input[name="payMethod"]:checked');
    const paymentMethod = selected ? selected.value : "COD";

    const order = await api("/api/orders/place", "POST", {}, true);
    if (!order.id) { showToast("Failed to place order. Check your cart."); return; }

    const payment = await api("/api/payments/process", "POST", { orderId: order.id, paymentMethod }, true);
    await loadCart();
    await updateCartBadge();

    const methodLabel = { COD: "Cash on Delivery", CARD: "Credit/Debit Card", UPI: "UPI", NET_BANKING: "Net Banking" }[paymentMethod] || paymentMethod;
    const address = currentUserAddress || "your registered address";
    // CHANGED: show delivery address in success message
    showToast(`Order placed! Payment via ${methodLabel}. Will be delivered to: ${address}`);
}

/* ─── ADMIN PRODUCTS ─── */
async function addProduct() {
    const data = await api("/api/products", "POST", {
        name: val("productName"), description: val("productDescription"),
        price: Number(val("productPrice")), stock: Number(val("productStock")),
        category: val("productCategory"), image: val("productImage")
    }, true);
    if (data.id) { showToast("Product added successfully!"); loadFeaturedProducts(); renderAdminProductGrid(); }
    else showToast("Failed: " + (data.error || "Check input."));
}

async function updateProduct() {
    const id = val("updateProductId");
    if (!id) { showToast("Enter a Product ID to update."); return; }
    const data = await api(`/api/products/${id}`, "PUT", {
        name: val("productName"), description: val("productDescription"),
        price: Number(val("productPrice")), stock: Number(val("productStock")),
        category: val("productCategory"), image: val("productImage")
    }, true);
    if (data.id) { showToast("Product updated!"); loadFeaturedProducts(); renderAdminProductGrid(); }
    else showToast("Failed: " + (data.error || "Check Product ID."));
}

async function deleteProduct() {
    const id = val("deleteProductId");
    if (!id) { showToast("Enter a Product ID to delete."); return; }
    await api(`/api/products/${id}`, "DELETE", null, true);
    showToast("Product deleted.");
    loadFeaturedProducts();
    renderAdminProductGrid();
}

async function renderAdminProductGrid() {
    const products = await fetch(BASE_URL + "/api/products").then(r => r.json()).catch(() => []);
    const grid = document.getElementById("adminProductGrid");
    if (!grid) return;
    if (!products.length) { grid.innerHTML = "<p style='color:#878787'>No products yet.</p>"; return; }
    grid.innerHTML = products.map(p => `
        <article class="product-card">
            <img src="${p.image || "https://via.placeholder.com/200?text=No+Image"}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
            <div class="product-content">
                <div class="product-category-tag">${p.category || "General"}</div>
                <h3>${p.name}</h3>
                <p class="desc">${p.description || ""}</p>
                <div class="product-price">&#8377;${p.price}</div>
                <div class="admin-id-tag">ID: ${p.id}</div>
            </div>
        </article>`).join("");
}

/* ─── ORDERS (USER) ─── */
async function loadOrders() {
    const list = document.getElementById("ordersList");
    if (currentRole !== "USER") {
        list.innerHTML = `<p style="color:#878787;text-align:center;padding:40px">Please login to view your orders.</p>`;
        return;
    }
    const orders = await api("/api/orders", "GET", null, true);
    renderOrders(Array.isArray(orders) ? orders : []);
}

function renderOrders(orders) {
    const list = document.getElementById("ordersList");
    if (!orders.length) {
        list.innerHTML = `
            <div style="text-align:center;padding:60px 0;color:#878787;">
                <div style="font-size:52px">📦</div>
                <p style="font-size:16px;margin-top:12px">No orders placed yet.</p>
                <button class="submit-btn" style="width:auto;padding:10px 28px;margin-top:12px" onclick="showPage('home')">Start Shopping</button>
            </div>`;
        return;
    }

    const statusColor = {
        PLACED: "#2874f0",
        PROCESSING: "#ff9f00",
        SHIPPED: "#0095ff",
        DELIVERED: "#388e3c",
        CANCELLED: "#dc2626"
    };

    // CHANGED: show actual payment method in order footer instead of hardcoded "Cash on Delivery"
    list.innerHTML = orders.slice().reverse().map(order => {
        const date = new Date(order.orderDate).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
        const color = statusColor[order.status] || "#878787";
        const itemsHtml = (order.items || []).map(item => `
            <div class="order-item-row">
                <img src="${item.product?.image || "https://via.placeholder.com/56?text=?"}" alt="${item.product?.name || "Item"}" onerror="this.src='https://via.placeholder.com/56?text=?'">
                <div class="order-item-info">
                    <span class="order-item-name">${item.product?.name || "Product"}</span>
                    <span class="order-item-meta">Qty: ${item.quantity} &nbsp;|&nbsp; &#8377;${item.price}</span>
                </div>
            </div>
        `).join("");

        return `
        <div class="order-card">
            <div class="order-card-header">
                <div>
                    <span class="order-id">Order #${order.id}</span>
                    <span class="order-date">${date}</span>
                </div>
                <span class="order-status-badge" style="background:${color}20;color:${color};border:1px solid ${color}40">
                    ${order.status}
                </span>
            </div>
            <div class="order-items-list">${itemsHtml}</div>
            <div class="order-card-footer">
                <span class="order-total">Total: <strong>&#8377;${order.totalAmount}</strong></span>
                <span class="order-payment-tag">&#10003; ${order.status === "DELIVERED" ? "Delivered" : "Order Placed"}</span>
            </div>
        </div>`;
    }).join("");
}

/* ─── ADMIN ORDERS ─── (CHANGED: All new functions below for admin order management) */
async function loadAdminOrders() {
    const list = document.getElementById("adminOrdersList");
    if (!list) return;
    if (currentRole !== "ADMIN") { list.innerHTML = "<p style='color:#878787'>Admin access only.</p>"; return; }
    list.innerHTML = "<p style='color:#878787'>Loading orders...</p>";
    const orders = await api("/api/orders/all", "GET", null, true);
    renderAdminOrders(Array.isArray(orders) ? orders : []);
}

function renderAdminOrders(orders) {
    const list = document.getElementById("adminOrdersList");
    if (!list) return;
    if (!orders.length) {
        list.innerHTML = "<p style='color:#878787'>No orders found.</p>";
        return;
    }

    const statusColor = {
        PLACED: "#2874f0", PROCESSING: "#ff9f00", SHIPPED: "#0095ff",
        DELIVERED: "#388e3c", CANCELLED: "#dc2626"
    };

    list.innerHTML = orders.slice().reverse().map(order => {
        const color = statusColor[order.status] || "#878787";
        const date = new Date(order.orderDate).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
        const itemsHtml = (order.items || []).map(item => `
            <span class="admin-order-item-tag">${item.product?.name || "Product"} x${item.quantity}</span>
        `).join("");

        const isDelivered = order.status === "DELIVERED";
        const isCancelled = order.status === "CANCELLED";

        return `
        <div class="admin-order-card">
            <div class="order-card-header">
                <div>
                    <span class="order-id">Order #${order.id}</span>
                    <span class="order-date" style="margin-left:8px">${date}</span>
                    <span style="margin-left:10px;font-size:13px;color:#555">&#128100; ${order.user?.name || "User"}</span>
                </div>
                <span class="order-status-badge" style="background:${color}20;color:${color};border:1px solid ${color}40">
                    ${order.status}
                </span>
            </div>
            <div style="padding:8px 18px;font-size:13px;color:#555;flex-wrap:wrap;display:flex;gap:6px;">
                ${itemsHtml}
            </div>
            <div class="order-card-footer">
                <span class="order-total">Total: <strong>&#8377;${order.totalAmount}</strong></span>
                <div style="display:flex;gap:10px;">
                    ${!isDelivered && !isCancelled ? `<button class="submit-btn" style="width:auto;padding:7px 16px;font-size:13px;background:#388e3c;margin-top:0"
                        onclick="markOrderDelivered(${order.id})">&#10003; Mark Delivered</button>` : ""}
                    ${!isDelivered && !isCancelled ?`<button class="submit-btn danger" style="width:auto;padding:7px 16px;font-size:13px;margin-top:0"
                        onclick="cancelOrder(${order.id})">&#10005; Cancel Order</button>` : ""}
                </div>
            </div>
        </div>`;
    }).join("");
}

async function markOrderDelivered(orderId) {
    // Update order status to DELIVERED
    const orderRes = await api(`/api/orders/${orderId}/status`, "PUT", { status: "DELIVERED" }, true);
    if (!orderRes.id) { showToast("Failed to update order status."); return; }
    // Update payment status to SUCCESS
    await api(`/api/payments/admin/order/${orderId}/complete`, "PUT", {}, true);
    showToast("Order marked as Delivered and payment updated to SUCCESS.");
    loadAdminOrders();
}

async function cancelOrder(orderId) {
     if (!confirm("Cancel this order?")) return;
    const res = await api(`/api/orders/${orderId}/cancel`, "PUT", null, true);
    if (res.id || res.status) {
        showToast("Order marked as Cancelled.");
    } else {
        showToast(res.message || "Order cancelled.");
    }
    loadAdminOrders();
}

/* ─── TOAST ─── */
function showToast(message) {
    const t = document.getElementById("toast");
    t.textContent = message;
    t.classList.remove("hidden");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.add("hidden"), 4000);
}

/* ─── UTILS ─── */
function val(id) { return document.getElementById(id).value; }

/* ─── INIT ─── */
updateNavbar();
showPage("home");
loadFeaturedProducts();