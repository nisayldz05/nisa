// --- CONFIG ---
const DB_KEY = 'mia_database_v6';
const SESSION_KEY = 'mia_current_session_v6';
// Artık sunucu (API_URL) yok, her şey yerel çalışacak.

// --- DATA ---
const products = [
    { id: 1, name: "Signature Espresso", category: "hot", price: 60, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80" },
    { id: 2, name: "Latte Macchiato", category: "hot", price: 75, image: "https://images.unsplash.com/photo-1485808191679-5f8c7c8606af?auto=format&fit=crop&w=400&q=80" },
    { id: 3, name: "Iced Americano", category: "cold", price: 70, image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80" },
    { id: 4, name: "Berry Hibiscus", category: "cold", price: 85, image: "https://images.unsplash.com/photo-1461023058943-48dbf1399f98?auto=format&fit=crop&w=400&q=80" },
    { id: 5, name: "Belçika Kurvasan", category: "bakery", price: 65, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80" },
    { id: 6, name: "San Sebastian", category: "bakery", price: 120, image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80" }
];

// --- STATE ---
let user = { name: "Misafir", email: "", balance: 0, stars: 0, favorites: [], orders: [], walletHistory: [] };
let cart = [];
let currentProduct = null;
let currentQty = 1;
let currentSize = 'S';
let currentMilk = 'normal';
let currentMilkPrice = 0;
let currentExtras = [];
let isSpinning = false;

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('hide');
    }, 2000);

    if (localStorage.getItem('mia_theme') === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const darkToggle = document.getElementById('dark-mode-toggle');
        if (darkToggle) darkToggle.checked = true;
    }

    const sessionEmail = localStorage.getItem(SESSION_KEY);
    if (sessionEmail) {
        const db = getDB();
        const found = db.users.find(u => u.email === sessionEmail);
        if (found) {
            user = found;
        }
    }

    updateUI();
    renderMenu('all');
});

// --- SEARCH & TOAST ---
function handleSearch() {
    const queryEl = document.getElementById('menu-search');
    const query = queryEl ? queryEl.value.toLowerCase() : "";
    const activeChipEl = document.querySelector('.filter-chip.active');
    const activeChip = activeChipEl ? activeChipEl.dataset.category : "all";

    let filtered;
    if (activeChip === 'fav') {
        filtered = products.filter(p => user.favorites && user.favorites.includes(p.id));
    } else if (activeChip === 'all') {
        filtered = products;
    } else {
        filtered = products.filter(p => p.category === activeChip);
    }

    const final = filtered.filter(p => p.name.toLowerCase().includes(query));
    renderMenuWithData(final);
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function toggleDarkMode() {
    const darkToggle = document.getElementById('dark-mode-toggle');
    const isDark = darkToggle ? darkToggle.checked : false;
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('mia_theme', 'dark');
        showToast("Karanlık Mod On");
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('mia_theme', 'light');
        showToast("Aydınlık Mod On");
    }
}

// --- DATABASE CORE (YEREL) ---
function getDB() {
    let data = localStorage.getItem(DB_KEY);
    if (!data) {
        return { users: [] };
    }
    return JSON.parse(data);
}

function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function updateUserInDB() {
    if (!user || !user.email) return;
    const db = getDB();
    const idx = db.users.findIndex(u => u.email === user.email);
    if (idx !== -1) {
        db.users[idx] = { ...user };
        saveDB(db);
        updateUI();
    }
}
function getToday() { return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

// --- AUTH MODALS & LOGIC ---
function openAuthModal(tab = 'login') {
    switchAuth(tab);
    document.getElementById('overlay').classList.add('active');
    document.getElementById('auth-modal').classList.add('active');
}

function closeAuthModal() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('auth-modal').classList.remove('active');
}

function switchAuth(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    if (tab === 'login') {
        document.querySelectorAll('.auth-tab')[0].classList.add('active');
        document.getElementById('form-login').classList.add('active');
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('form-register').classList.add('active');
    }
}

function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value.trim();
    if (!email || !password) { showToast("Alanları doldurun."); return; }

    const db = getDB();
    const found = db.users.find(u => u.email === email && u.password === password);

    if (found) {
        user = found;
        localStorage.setItem(SESSION_KEY, email);
        closeAuthModal();
        updateUI();
        showToast("Hoş Geldin!");
    } else {
        showToast("Hatalı giriş!");
    }
}

function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value.trim();
    if (!name || !email || !password) { showToast("Eksikleri doldurun."); return; }

    const db = getDB();
    if (db.users.find(u => u.email === email)) {
        showToast("Bu e-posta kayıtlı!"); return;
    }

    const newUser = {
        name, email, password,
        balance: 100, stars: 0, favorites: [],
        orders: [], bankCards: [],
        walletHistory: [{ desc: "Yeni Üye Hediyesi 🎁", amount: 100, type: 'in', date: getToday() }]
    };

    db.users.push(newUser);
    saveDB(db);
    user = newUser;
    localStorage.setItem(SESSION_KEY, email);
    closeAuthModal();
    updateUI();
    showToast("Kayıt Başarılı! ☕");
}

function logout() {
    if (confirm("Çıkış Yapılsın mı?")) {
        localStorage.removeItem(SESSION_KEY);
        location.reload();
    }
}

function updateUI() {
    const isGuest = !user || user.email === "";
    document.body.classList.toggle('is-user', !isGuest);

    const nameDisp = document.getElementById('user-name-display');
    const greetingText = document.getElementById('greeting-text');
    const headBal = document.getElementById('header-balance');
    const wallBal = document.getElementById('wallet-balance-big');
    const userStars = document.getElementById('user-stars');
    const starBar = document.getElementById('star-bar');

    const cardUser = document.getElementById('card-user-name');
    const settingsName = document.getElementById('settings-user-fullname');
    const settingsEmail = document.getElementById('settings-user-email');
    const avatar = document.querySelector('.avatar');

    if (nameDisp) nameDisp.innerText = isGuest ? "Misafir" : user.name;
    if (greetingText) greetingText.innerText = isGuest ? "Hoş Geldin," : "Mia VIP Üyesi,";

    const currentBal = isGuest ? 0 : (user.balance || 0);
    if (headBal) headBal.innerText = currentBal.toFixed(2) + " ₺";
    if (wallBal) wallBal.innerText = currentBal.toFixed(2) + " ₺";

    if (cardUser) cardUser.innerText = isGuest ? "MİSAFİR KART" : user.name.toUpperCase();
    if (settingsName) settingsName.innerText = isGuest ? "Misafir Kullanıcı" : user.name;
    if (settingsEmail) settingsEmail.innerText = isGuest ? "Üyeliğe bekliyoruz..." : user.email;
    if (avatar) avatar.innerText = isGuest ? "?" : user.name.charAt(0).toUpperCase();

    // Barista Panel Security (Only show for Admin)
    const adminBtn = document.querySelector('.admin-mode-btn');
    const isAdmin = user && user.email === 'admin@miacoffee.com';
    if (adminBtn) adminBtn.style.display = isAdmin ? 'flex' : 'none';

    const stars = isGuest ? 0 : (user.stars || 0);
    if (userStars) userStars.innerText = stars;
    if (starBar) starBar.style.width = (stars / 5) * 100 + "%";

    const steps = document.querySelectorAll('.roadmap-step');
    steps.forEach((s, idx) => {
        if (idx < stars) s.classList.add('active');
        else s.classList.remove('active');
    });
}

// --- MENU & FAV ---
function renderMenu(cat) {
    let list;
    if (cat === 'fav') {
        list = products.filter(p => user.favorites && user.favorites.includes(p.id));
    } else {
        list = cat === 'all' ? products : products.filter(p => p.category === cat);
    }
    renderMenuWithData(list);
}

function renderMenuWithData(list) {
    const con = document.getElementById('menu-container');
    if (!con) return;
    con.innerHTML = '';
    if (list.length === 0) { con.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--gray);">Sonuç bulunamadı. ❤️</div>'; return; }
    list.forEach(p => {
        const isFav = user.favorites && user.favorites.includes(p.id);
        const div = document.createElement('div'); div.className = 'product-card';
        div.onclick = (e) => { if (!e.target.closest('.pc-fav')) openSheet(p); };
        div.innerHTML = `
            <div class="pc-fav ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${p.id});">
                <i class="${isFav ? 'ph-fill' : 'ph'} ph-heart"></i>
            </div>
            <div class="pc-img"><img src="${p.image}"></div>
            <div class="pc-title">${p.name}</div>
            <div class="pc-meta"><span class="pc-price">${p.price} ₺</span><span class="pc-add">+</span></div>
        `;
        con.appendChild(div);
    });
}

function toggleFavorite(id) {
    if (!user.favorites) user.favorites = [];
    const idx = user.favorites.indexOf(id);
    if (idx === -1) { user.favorites.push(id); showToast("Favoriye Eklendi ❤️"); }
    else { user.favorites.splice(idx, 1); showToast("Favoriden Çıkarıldı"); }
    updateUserInDB();
    const activeChipEl = document.querySelector('.filter-chip.active');
    const activeCat = activeChipEl ? activeChipEl.dataset.category : 'all';
    renderMenu(activeCat);
}

// --- PRODUCT DETAILS MODAL ---
function openSheet(p) {
    currentProduct = p;
    currentQty = 1;
    currentSize = 'S';
    currentMilk = 'normal';
    currentMilkPrice = 0;
    currentExtras = [];

    document.getElementById('modal-img').src = p.image;
    document.getElementById('modal-title').innerText = p.name;
    document.getElementById('order-note').value = '';

    document.querySelectorAll('.s-opt').forEach(el => el.classList.remove('active'));
    document.querySelector('.s-opt[data-size="S"]').classList.add('active');

    document.querySelectorAll('.m-opt').forEach(el => el.classList.remove('active'));
    document.querySelector('.m-opt[data-milk="normal"]').classList.add('active');

    document.querySelectorAll('.e-opt').forEach(el => el.classList.remove('active'));

    updateCalc();
    document.getElementById('overlay').classList.add('active');
    document.getElementById('product-modal').classList.add('active');
}

function selectMilk(type, price) {
    currentMilk = type;
    currentMilkPrice = price;
    document.querySelectorAll('.m-opt').forEach(el => el.classList.remove('active'));
    document.querySelector(`.m-opt[data-milk="${type}"]`).classList.add('active');
    updateCalc();
}

function toggleExtra(type, price) {
    const idx = currentExtras.findIndex(e => e.type === type);
    if (idx === -1) currentExtras.push({ type, price });
    else currentExtras.splice(idx, 1);

    document.querySelector(`.e-opt[data-extra="${type}"]`).classList.toggle('active');
    updateCalc();
}

function closeProductModal() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('product-modal').classList.remove('active');
}

function selectSize(s) {
    currentSize = s;
    document.querySelectorAll('.s-opt').forEach(el => el.classList.remove('active'));
    document.querySelector(`.s-opt[data-size="${s}"]`).classList.add('active');
    updateCalc();
}

function changeQty(d) {
    if (currentQty + d > 0) {
        currentQty += d;
        updateCalc();
    }
}

function updateCalc() {
    if (!currentProduct) return;
    let m = 1;
    if (currentSize === 'M') m = 1.25;
    if (currentSize === 'L') m = 1.5;

    let extrasTotal = currentExtras.reduce((sum, e) => sum + e.price, 0);
    let unitPrice = Math.round((currentProduct.price * m) + currentMilkPrice + extrasTotal);
    let total = unitPrice * currentQty;

    const unitPriceEl = document.getElementById('modal-price');
    const qtySpan = document.getElementById('modal-qty');
    const totalSpan = document.getElementById('modal-total-price');

    if (unitPriceEl) unitPriceEl.innerText = unitPrice + " ₺";
    if (qtySpan) qtySpan.innerText = currentQty;
    if (totalSpan) totalSpan.innerText = total + " ₺";
}

function addToCartConfirm() {
    if (!currentProduct) return;
    let m = 1;
    if (currentSize === 'M') m = 1.25;
    if (currentSize === 'L') m = 1.5;
    const unit = Math.round(currentProduct.price * m);
    const note = document.getElementById('order-note').value.trim();

    cart.push({
        ...currentProduct,
        qty: currentQty,
        size: currentSize,
        price: unit,
        total: unit * currentQty,
        note: note
    });

    updateCartIcon();
    closeProductModal();
    showToast("Sepete Eklendi! 🛒");
}

// --- CART ---
function updateCartIcon() {
    const el = document.getElementById('cart-count');
    if (!el) return;
    el.innerText = cart.length;
    if (cart.length > 0) el.classList.add('show');
    else el.classList.remove('show');
}

function openCart() {
    renderCart();
    document.getElementById('overlay').classList.add('active');
    document.getElementById('cart-modal').classList.add('active');
}

function closeCart() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('cart-modal').classList.remove('active');
}

function renderCart() {
    const c = document.getElementById('cart-items-container');
    if (!c) return;
    c.innerHTML = '';
    let t = 0;
    if (cart.length === 0) c.innerHTML = '<p style="text-align:center; color:var(--gray); margin-top:20px;">Sepet Boş</p>';
    cart.forEach(i => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `<img src="${i.image}"><div class="ci-info"><h4>${i.name} (${i.size})</h4><p>x${i.qty}</p></div><div class="ci-price">${i.total} ₺</div>`;
        c.appendChild(row);
        t += i.total;
    });
    document.getElementById('cart-total-amount').innerText = t + " ₺";
}

// --- ORDERING & STATS ---
function checkout() {
    if (!user || user.email === "") { openAuthModal('login'); return; }
    if (cart.length === 0) { showToast("Sepetiniz boş!"); return; }

    let total = 0;
    cart.forEach(c => { total += parseFloat(c.total) || 0; });

    if (user.balance < total) {
        showToast("Yetersiz Bakiye! ❌");
        return;
    }

    // Eksiye düşmemek için yerel kontrol
    user.balance = Number((user.balance - total).toFixed(2));
    user.stars += cart.length;

    // Bedava içecek kontrolü (5 yıldız)
    if (user.stars >= 5) {
        user.stars -= 5;
        user.balance += 60; // Hediye iadesi gibi
        user.walletHistory.unshift({ desc: "⭐ Hediye İçecek İadesi", amount: 60, type: 'in', date: getToday() });
    }

    const orderId = Math.floor(Math.random() * 90000) + 10000;
    user.orders.unshift({ id: orderId, items: [...cart], total, date: getToday(), status: 'received' });
    user.walletHistory.unshift({ desc: "Sipariş Ödemesi", amount: total, type: 'out', date: getToday() });

    updateUserInDB();
    cart = [];
    updateCartIcon();
    closeCart();
    startLiveTracking(orderId);

    setTimeout(() => {
        document.getElementById('overlay').classList.add('active');
        document.getElementById('success-modal').classList.add('active');
    }, 300);
}

function closeSuccess() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('success-modal').classList.remove('active');
}

function renderStats() {
    const totalSpent = user.walletHistory ? user.walletHistory.filter(h => h.type === 'out').reduce((sum, h) => sum + h.amount, 0) : 0;
    const statsHtml = `<div class="stats-grid"><div class="stat-box"><h4>Sipariş</h4><p>${user.orders ? user.orders.length : 0}</p></div><div class="stat-box"><h4>Harcama</h4><p>${totalSpent}₺</p></div></div>`;
    const container = document.getElementById('page-settings');
    if (!container) return;
    const existing = container.querySelector('.stats-grid');
    if (existing) existing.remove();
    const group = container.querySelector('.settings-group');
    if (group) group.insertAdjacentHTML('afterend', statsHtml);
}

// --- STANDARD UI ---
function showPage(pid) {
    if (pid === 'admin' && user.email !== 'admin@miacoffee.com') {
        showToast("Bu alana erişim yetkiniz yok! ⛔");
        showPage('home');
        return;
    }

    document.querySelectorAll('.page-section').forEach(el => { el.classList.remove('active'); el.style.display = 'none'; });
    const t = document.getElementById('page-' + pid);
    if (!t) return;
    t.style.display = 'block';
    setTimeout(() => t.classList.add('active'), 10);
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItems = document.querySelectorAll('.nav-item');
    if (pid === 'home' && navItems[0]) navItems[0].classList.add('active');
    if (pid === 'wallet' && navItems[1]) { navItems[1].classList.add('active'); renderWallet(); renderBankCards(); }
    if (pid === 'orders' && navItems[2]) { navItems[2].classList.add('active'); renderOrders(); }
    if (pid === 'settings' && navItems[3]) { navItems[3].classList.add('active'); renderStats(); }
    if (pid === 'admin') { renderAdminDashboard(); }
}

// --- BARISTA / ADMIN DASHBOARD LOGIC ---
async function renderAdminDashboard() {
    const listCon = document.getElementById('admin-orders-list');
    if (!listCon) return;
    listCon.innerHTML = '<div style="text-align:center; padding:50px;">Yükleniyor...</div>';

    try {
        const data = await apiFetch('/admin/orders');
        if (!data.success) {
            listCon.innerHTML = `<div style="text-align:center; padding:50px; color:var(--error);">${data.message}</div>`;
            return;
        }

        const allOrders = data.orders;
        listCon.innerHTML = '';

        if (allOrders.length === 0) {
            listCon.innerHTML = '<div style="text-align:center; padding:50px; color:var(--gray);">Henüz sipariş yok. ☕</div>';
            return;
        }

        allOrders.forEach(o => {
            const card = document.createElement('div');
            card.className = 'admin-order-card';
            card.innerHTML = `
                <div class="admin-order-header">
                    <div>
                        <div class="admin-order-user">${o.userName}</div>
                        <div class="admin-order-time">${o.date} - #${o.id}</div>
                    </div>
                    <span class="status-badge status-${o.status}">${o.status}</span>
                </div>
                <div class="admin-order-items">
                    ${o.items.map(i => `• <b>${i.qty}x ${i.name}</b> (${i.size})`).join('<br>')}
                </div>
                ${o.items[0].note ? `<div class="admin-order-note">📝 ${o.items[0].note}</div>` : ''}
                <div class="admin-actions">
                    <button class="btn-prep" onclick="updateOrderStatusAdmin('${o.userEmail}', ${o.id}, 'preparing')">Hazırlanıyor</button>
                    <button class="btn-ready" onclick="updateOrderStatusAdmin('${o.userEmail}', ${o.id}, 'ready')">Hazır!</button>
                </div>
            `;
            listCon.appendChild(card);
        });
    } catch (err) {
        listCon.innerHTML = '<div style="text-align:center; padding:50px; color:var(--error);">Sunucu hatası!</div>';
    }
}


function updateOrderStatusAdmin(userEmail, orderId, newStatus) {
    const db = getDB();
    const userIdx = db.users.findIndex(u => u.email === userEmail);
    if (userIdx !== -1) {
        const orderIdx = db.users[userIdx].orders.findIndex(o => o.id === orderId);
        if (orderIdx !== -1) {
            db.users[userIdx].orders[orderIdx].status = newStatus;
            saveDB(db);
            showToast(`Sipariş #${orderId} güncellendi: ${newStatus}`);
            renderAdminDashboard();
            if (user.email === userEmail) {
                user = db.users[userIdx];
                renderOrders();
            }
        }
    }
}

function renderWallet() {
    const c = document.getElementById('wallet-history');
    if (!c) return;
    c.innerHTML = '';
    if (!user.walletHistory || user.walletHistory.length === 0) { c.innerHTML = '<div style="text-align:center; padding:20px; color:var(--gray);">Geçmiş Yok</div>'; return; }
    user.walletHistory.forEach(h => {
        const el = document.createElement('div'); el.className = 'history-item';
        el.innerHTML = `<div><b>${h.desc}</b><br><small style="color:var(--gray)">${h.date}</small></div><div style="font-weight:700; color:${h.type === 'in' ? 'var(--success)' : '#ef5350'}">${h.type === 'in' ? '+' : '-'}${h.amount}₺</div>`;
        c.appendChild(el);
    });
}

function renderOrders() {
    const c = document.getElementById('orders-list');
    if (!c) return;
    c.innerHTML = '';
    if (!user.orders || user.orders.length === 0) { c.innerHTML = '<div style="text-align:center; padding:20px; color:var(--gray);">Sipariş Yok</div>'; return; }
    user.orders.forEach(o => {
        const el = document.createElement('div'); el.className = 'order-card';
        const stText = o.status === 'received' ? 'Alındı' : (o.status === 'preparing' ? 'Hazırlanıyor' : 'Hazır');
        el.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:10px;"><small>${o.date}</small><span class="status-badge status-${o.status}">${stText}</span></div><div style="font-weight:600; margin-bottom:10px;">${o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</div><div style="display:flex; justify-content:space-between; color:var(--primary); font-weight:700;"><span>#${o.id}</span><span>${o.total}₺</span></div>`;
        c.appendChild(el);
    });
}

function openLoadModal() {
    if (user.email === "") { openAuthModal('login'); showToast("Önce giriş yapmalısın! ☕"); return; }
    document.getElementById('overlay').classList.add('active');
    document.getElementById('payment-modal').classList.add('active');
    document.getElementById('load-amount').value = '';
}

function closeLoadModal() {
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('payment-modal').classList.remove('active');
}

function confirmLoad(directAmt = null) {
    const amtEl = document.getElementById('load-amount');
    const amt = directAmt !== null ? directAmt : (amtEl ? parseFloat(amtEl.value) : 0);

    if (!amt || amt <= 0) {
        showToast("Lütfen geçerli bir tutar girin.");
        return;
    }

    user.balance = Number((user.balance + amt).toFixed(2));
    if (!user.walletHistory) user.walletHistory = [];
    user.walletHistory.unshift({ desc: "Bakiye Yükleme", amount: amt, type: 'in', date: getToday() });

    updateUserInDB();
    if (amtEl) amtEl.value = ""; // Temizle
    closeLoadModal();
    showToast(amt + " ₺ Yüklendi! ✅");
}

function addMoney(amt) {
    confirmLoad(amt);
}

// --- BANK CARD MANAGEMENT ---
function openAddCardModal() {
    if (user.email === "") { openAuthModal('login'); return; }
    document.getElementById('overlay').classList.add('active');
    document.getElementById('add-card-modal').classList.add('active');
}

function confirmAddCard() {
    const name = document.getElementById('new-card-name').value;
    const num = document.getElementById('new-card-number').value;
    if (!name || num.length < 15) { showToast("Geçerli kart bilgileri girin!"); return; }

    if (!user.bankCards) user.bankCards = [];
    user.bankCards.push({
        id: Date.now(),
        name: name,
        number: "**** **** **** " + num.slice(-4),
        type: num.startsWith('4') ? 'visa' : 'master'
    });

    updateUserInDB();
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('add-card-modal').classList.remove('active');
    renderBankCards();
    showToast("Banka kartı kaydedildi! 💳");
}

function renderBankCards() {
    const container = document.getElementById('bank-cards-container');
    if (!container) return;
    container.innerHTML = '';

    if (!user.bankCards || user.bankCards.length === 0) {
        container.innerHTML = '<p style="font-size:12px; color:var(--gray); padding:10px;">Henüz kart eklemediniz.</p>';
        return;
    }

    user.bankCards.forEach((card, idx) => {
        const div = document.createElement('div');
        div.className = `bank-card mini-${card.type}`;
        div.innerHTML = `
            ${idx === 0 ? '<i class="ph-fill ph-check-circle active-check"></i>' : ''}
            <div class="b-card-top">
                <i class="ph-fill ph-${card.type === 'visa' ? 'arrows-left-right' : 'circles-four'}"></i>
                <span>${card.number}</span>
            </div>
            <small>${card.name}</small>
        `;
        container.appendChild(div);
    });
}



// --- REORDER LOGIC ---
function renderQuickReorder() {
    const container = document.getElementById('quick-reorder-container');
    const content = document.getElementById('quick-reorder-card-content');
    if (!container || !content) return;

    if (!user || !user.orders || user.orders.length === 0) {
        container.style.display = 'none';
        return;
    }

    const lastOrder = user.orders[0];
    const item = lastOrder.items[0]; // İlk ürünü alalım
    container.style.display = 'block';

    content.innerHTML = `
        <div class="qr-reorder-card">
            <img src="${item.image}">
            <div class="qr-info">
                <h5>${item.name}</h5>
                <p>${item.size} Boy • ${item.total} ₺</p>
            </div>
            <button class="btn-reorder" onclick="reorderFast(${JSON.stringify(item).replace(/"/g, '&quot;')})">Tekrarla</button>
        </div>
    `;
}

function reorderFast(item) {
    cart.push({ ...item });
    updateCartIcon();
    showToast(`${item.name} sepete eklendi! ☕`);
    openCart();
}

// --- STORIES LOGIC ---
const storiesData = {
    winter: { title: "Kış Güneşi ❄️", desc: "Yeni Pumpkin Spice Latte ve kışa özel kurabiyelerimiz çıktı! Sıcaklığın tadını çıkar.", img: "https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=800&q=80" },
    stars: { title: "Yıldız Yağmuru! ⭐", desc: "Bu hafta sonu tüm içeceklerde 2 kat yıldız fırsatı seni bekliyor. Hemen sipariş ver!", img: "https://images.unsplash.com/photo-1510511459019-5dee995d3cb1?auto=format&fit=crop&w=800&q=80" },
    bakery: { title: "Fırından Taze 🥐", desc: "Belçika çikolatalı kruvasanlarımız her sabah 08:00'de sıcak servis edilir.", img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80" },
    gift: { title: "Mutluluk Paylaşılır! 🎁", desc: "Cüzdan sekmesine git, arkadaşına tek tıkla kahve ısmarla. Paylaşmak güzeldir.", img: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80" }
};

let storyTimer;
function showStory(id) {
    const s = storiesData[id];
    const area = document.getElementById('story-content-area');
    const viewer = document.getElementById('story-viewer');
    const bar = viewer.querySelector('.story-progress-bar');

    if (!s || !viewer) return;

    area.innerHTML = `
        <img src="${s.img}">
        <div class="story-text-overlay">
            <h2>${s.title}</h2>
            <p>${s.desc}</p>
        </div>
    `;

    viewer.classList.add('active');

    bar.style.width = '0%';
    setTimeout(() => {
        bar.style.transition = 'width 5s linear';
        bar.style.width = '100%';
    }, 50);

    storyTimer = setTimeout(() => closeStory(), 5000);
}

function closeStory() {
    const viewer = document.getElementById('story-viewer');
    if (viewer) {
        viewer.classList.remove('active');
        const bar = viewer.querySelector('.story-progress-bar');
        bar.style.transition = 'none';
        bar.style.width = '0%';
    }
    clearTimeout(storyTimer);
}

// Close story on background click
document.getElementById('story-viewer').addEventListener('click', (e) => {
    closeStory();
});

// --- GIFT COFFEE LOGIC ---
function openGiftModal() {
    if (user.email === "") { openAuthModal('login'); return; }
    document.getElementById('overlay').classList.add('active');
    document.getElementById('gift-modal').classList.add('active');
}

function confirmGift() {
    const targetEmail = document.getElementById('gift-email').value;
    const price = parseInt(document.getElementById('gift-item-id').value);

    if (!targetEmail.includes('@')) { showToast("Geçerli e-posta girin!"); return; }
    if (user.balance < price) { showToast("Yetersiz bakiye!"); return; }

    const db = getDB();
    const recipient = db.users.find(u => u.email === targetEmail);

    user.balance = Number((user.balance - price).toFixed(2));
    user.walletHistory.unshift({ desc: `Hediye: ${targetEmail}`, amount: price, type: 'out', date: getToday() });

    if (recipient) {
        recipient.balance += price;
        recipient.walletHistory.unshift({ desc: `Hediye geldi: ${user.email}`, amount: price, type: 'in', date: getToday() });
    }

    updateUserInDB();
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('gift-modal').classList.remove('active');
    showToast("Hediye gönderildi! 🎁☕");
}

// --- OVERLAY CLICK ---
const overlay = document.getElementById('overlay');
if (overlay) {
    overlay.addEventListener('click', () => {
        closeProductModal();
        closeCart();
        closeSuccess();
        closeLoadModal();
        closeAuthModal();
        if (document.getElementById('add-card-modal')) document.getElementById('add-card-modal').classList.remove('active');
        if (document.getElementById('gift-modal')) document.getElementById('gift-modal').classList.remove('active');
        overlay.classList.remove('active');
    });
}

// Inject Extra Logic to updateUI
const originalFinalUpdate = updateUI;
updateUI = function () {
    originalFinalUpdate();
    renderQuickReorder();
    renderBankCards();
};


// Event Listeners for Filters
document.querySelectorAll('.filter-chip').forEach(b => {
    b.onclick = () => {
        document.querySelectorAll('.filter-chip').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderMenu(b.dataset.category);
    };
});

// --- LIVE ORDER TRACKER LOGIC ---
let trackerInterval;
function startLiveTracking(orderId) {
    const container = document.getElementById('live-tracker-container');
    const msgEl = document.getElementById('tracker-status-msg');
    const barEl = document.getElementById('tracker-bar');
    const timerEl = document.getElementById('tracker-timer');

    if (!container) return;

    container.style.display = 'block';
    let progress = 10;
    let seconds = 90;

    const statuses = [
        "Barista siparişini aldı...",
        "Kahve çekirdekleri öğütülüyor... ☕",
        "Espresso shot hazırlanıyor...",
        "Sütün tam kıvamında köpürtülüyor... 🥛",
        "Fincanına son dokunuşlar yapılıyor...",
        "Siparişin tam önünde, seni bekliyor! ✅"
    ];

    let statusIdx = 0;

    if (trackerInterval) clearInterval(trackerInterval);

    trackerInterval = setInterval(() => {
        seconds--;
        progress += 1.5; // Biraz daha hızlandırdım

        // Timer format
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        timerEl.innerText = `0${min}:${sec < 10 ? '0' : ''}${sec}`;

        barEl.style.width = progress + "%";

        // Status updates based on progress
        if (progress > 15 && statusIdx === 0) statusIdx = 1;
        if (progress > 35 && statusIdx === 1) statusIdx = 2;
        if (progress > 55 && statusIdx === 2) statusIdx = 3;
        if (progress > 75 && statusIdx === 3) statusIdx = 4;
        if (progress > 95 && statusIdx === 4) statusIdx = 5;

        msgEl.innerText = statuses[statusIdx];

        if (seconds <= 0) {
            clearInterval(trackerInterval);
            timerEl.innerText = "HAZIR!";
            barEl.style.width = "100%";
            showToast("Siparişin Hazır! Afiyet olsun. ☕✨");
            setTimeout(() => {
                container.style.display = 'none';
            }, 5000);
        }
    }, 1000);
}
