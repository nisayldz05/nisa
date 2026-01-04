const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Veritabanı dosyasını dışarıdan erişime kapat
app.use('/database.json', (req, res) => {
    res.status(403).send('Erişim engellendi! ⛔');
});

// Statik dosyaları sun (index.html vb.)
app.use(express.static('./'));

const DB_FILE = path.join(__dirname, 'database.json');

// --- DATABASE HELPERS ---
function readDB() {
    try {
        if (!fs.existsSync(DB_FILE)) return { users: [] };
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { users: [] };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getToday() {
    return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// --- API ENDPOINTS ---

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = readDB();

    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: "Bu e-posta kayıtlı." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
        name,
        email,
        password: hashedPassword,
        balance: 200,
        stars: 0,
        favorites: [],
        orders: [],
        bankCards: [],
        walletHistory: [{ desc: 'Yeni Üye Hediyesi 🎁', amount: 200, type: 'in', date: getToday() }]
    };

    db.users.push(newUser);
    writeDB(db);
    res.json({ success: true, user: newUser });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === email);

    if (!user) return res.status(401).json({ success: false, message: "Hatalı giriş!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) res.json({ success: true, user });
    else res.status(401).json({ success: false, message: "Hatalı giriş!" });
});

app.post('/api/user/update', (req, res) => {
    const { email, name, favorites, bankCards } = req.body;
    const db = readDB();
    const idx = db.users.findIndex(u => u.email === email);
    if (idx !== -1) {
        if (name) db.users[idx].name = name;
        if (favorites) db.users[idx].favorites = favorites;
        if (bankCards) db.users[idx].bankCards = bankCards;
        writeDB(db);
        res.json({ success: true, user: db.users[idx] });
    } else res.status(404).json({ success: false });
});

// GÜVENLİ BAKİYE YÜKLEME
app.post('/api/payment', (req, res) => {
    const { email, amount } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(404).json({ success: false });

    const loadAmount = parseFloat(amount) || 0;
    user.balance = Number((user.balance + loadAmount).toFixed(2));
    user.walletHistory.unshift({ desc: 'Bakiye Yükleme', amount: loadAmount, type: 'in', date: getToday() });

    writeDB(db);
    res.json({ success: true, user });
});

// GÜVENLİ SİPARİŞ (Eksiye düşmeyi engeller)
app.post('/api/order', (req, res) => {
    const { email, cart, total } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === email);

    if (!user) return res.status(404).json({ success: false });

    const orderTotal = parseFloat(total) || 0;
    if (user.balance < orderTotal) {
        return res.status(400).json({ success: false, message: "Yetersiz Bakiye! ❌" });
    }

    user.balance = Number((user.balance - orderTotal).toFixed(2));
    user.stars = (user.stars || 0) + cart.length;

    if (user.stars >= 5) {
        user.stars -= 5;
        user.balance = Number((user.balance + 60).toFixed(2));
        user.walletHistory.unshift({ desc: '⭐ Hediye İçecek İradesi', amount: 60, type: 'in', date: getToday() });
    }

    const orderId = Math.floor(Math.random() * 90000) + 10000;
    user.orders.unshift({ id: orderId, items: cart, total: orderTotal, date: getToday(), status: 'received' });
    user.walletHistory.unshift({ desc: 'Sipariş Ödemesi', amount: orderTotal, type: 'out', date: getToday() });

    writeDB(db);
    res.json({ success: true, user, orderId });
});

app.listen(PORT, () => {
    console.log(`Mia Coffee Sunucusu Yayında! Link: http://localhost:${PORT}`);
});
