let token = "";
let currentRole = "GUEST";
let currentUserName = "";
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
    if (name === "admin") renderAdminProductGrid();
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

async function registerUser() {
    const firstName = document.getElementById("regFirstName").value.trim();
    const lastName = document.getElementById("regLastName").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirmPassword").value;
    const msgEl = document.getElementById("registerMessage");

    msgEl.className = "msg-box hidden";
    msgEl.textContent = "";

    if (!firstName || !lastName || !phone || !email || !password || !confirm) {
        showMsg(msgEl, "Please fill in all fields.", "error");
        return;
    }
    if (password !== confirm) {
        showMsg(msgEl, "Passwords do not match.", "error");
        return;
    }

    const data = await api("/api/users/register", "POST", {
        name: `${firstName} ${lastName}`, phone, email, password
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

function setSession(data) {
    token = data.token;
    currentRole = data.role;
    currentUserName = data.name || "User";
    updateNavbar();
    loadFeaturedProducts();
    if (currentRole === "USER") updateCartBadge();
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

function renderProducts(products) {
    const grid = document.getElementById("productGrid");
    if (!products.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:#878787;">No products found.</div>`;
        return;
    }
    grid.innerHTML = products.map(p => {
        const cartBtn = currentRole === "USER"
            ? `<button class="add-cart-btn" onclick="event.stopPropagation();addProductToCart(${p.id})">Add to Cart</button>`
            : "";
        return `
        <article class="product-card">
            <img src="${p.image || "https://via.placeholder.com/300x200?text=No+Image"}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="product-content">
                <div class="product-category-tag">${p.category || "General"}</div>
                <h3>${p.name}</h3>
                <p class="desc">${p.description || ""}</p>
                <div class="product-price">₹${p.price}</div>
                ${cartBtn}
            </div>
        </article>`;
    }).join("");
}

/* ─── CART ─── */
async function addProductToCart(productId) {
    if (currentRole !== "USER") { showPage("login"); return; }
    await api("/api/cart/add", "POST", { productId, quantity: 1 }, true);
    await updateCartBadge();
    showToast("Item added to cart!");
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
                <div class="cart-item-price">₹${item.totalPrice}</div>
                <div style="font-size:13px;color:#878787">Qty: ${item.quantity}</div>
            </div>
        </div>
    `).join("");

    summary.innerHTML = `
        <div class="summary-row"><span>Price (${cart.items.length} items)</span><span>₹${cart.totalPrice}</span></div>
        <div class="summary-row"><span>Delivery Charges</span><span style="color:#388e3c">FREE</span></div>
        <div class="summary-row summary-total"><span>Total Amount</span><span>₹${cart.totalPrice}</span></div>
    `;
}

async function removeCartItem(itemId) {
    await api(`/api/cart/${itemId}`, "DELETE", null, true);
    await loadCart();
    await updateCartBadge();
}

async function placeOrderWithCod() {
    const order = await api("/api/orders/place", "POST", {}, true);
    if (!order.id) { showToast("Failed to place order. Check your cart."); return; }
    await api("/api/payments/process", "POST", { orderId: order.id, paymentMethod: "COD" }, true);
    await loadCart();
    await updateCartBadge();
    showToast("Order placed successfully! Payment: Cash on Delivery.");
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
                <div class="product-price">₹${p.price}</div>
                <div class="admin-id-tag">ID: ${p.id}</div>
            </div>
        </article>`).join("");
}

/* ─── ORDERS ─── */
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
                    <span class="order-item-meta">Qty: ${item.quantity} &nbsp;|&nbsp; ₹${item.price}</span>
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
                <span class="order-total">Total: <strong>₹${order.totalAmount}</strong></span>
                <span class="order-payment-tag">&#10003; Cash on Delivery</span>
            </div>
        </div>`;
    }).join("");
}

/* ─── TOAST ─── */
function showToast(message) {
    const t = document.getElementById("toast");
    t.textContent = message;
    t.classList.remove("hidden");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.add("hidden"), 3000);
}

/* ─── UTILS ─── */
function val(id) { return document.getElementById(id).value; }

/* ─── INIT ─── */
updateNavbar();
showPage("home");
loadFeaturedProducts();
