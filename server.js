const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const db = require('./db/database');

const app = express();

// --- CONFIGURATION & MIDDLEWARE ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup
app.use(session({
    secret: crypto.randomBytes(32).toString('hex'), // In production, use env var
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'strict' }
}));

// CSRF Protection & Global Locals
app.use((req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    if (req.method === 'POST' && req.body._csrf !== req.session.csrfToken) {
        return res.status(403).send('CSRF Token Mismatch');
    }
    res.locals.csrfToken = req.session.csrfToken;
    res.locals.user = req.session.user || null;
    res.locals.cartCount = req.session.cart ? req.session.cart.length : 0;
    next();
});

// Auth Guards
const requireAuth = (req, res, next) => req.session.user ? next() : res.redirect('/login');
const requireAdmin = (req, res, next) => (req.session.user && req.session.user.role === 'admin') ? next() : res.status(403).send('Forbidden: Admins Only');

// File Upload Config (Multer)
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage, 
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return cb(null, true);
        cb(new Error('Only images allowed'));
    }
});

// --- PUBLIC ROUTES ---
app.get('/', (req, res) => res.render('index'));

app.get('/catalog', (req, res) => {
    // Example parameterized filter
    const search = req.query.q ? `%${req.query.q}%` : '%';
    const mods = db.prepare(`SELECT * FROM mods WHERE title LIKE ? AND is_available = 1`).all(search);
    res.render('catalog', { mods, query: req.query.q });
});

app.get('/mods/:id', (req, res) => {
    const mod = db.prepare(`SELECT * FROM mods WHERE id = ?`).get(req.params.id);
    if (!mod) return res.status(404).render('error', { msg: 'Mod not found' });
    const reviews = db.prepare(`SELECT * FROM reviews WHERE mod_id = ? AND is_approved = 1`).all(mod.id);
    res.render('mod_details', { mod, reviews });
});

// Static-style pages (using a generic view for MVP speed)
['about', 'faq', 'privacy'].forEach(page => {
    app.get(`/${page}`, (req, res) => res.render('generic', { title: page.toUpperCase() }));
});

app.route('/contacts')
    .get((req, res) => res.render('contacts'))
    .post((req, res) => {
        db.prepare(`INSERT INTO feedback (name, email, subject, message, status) VALUES (?, ?, ?, ?, 'new')`)
          .run(req.body.name, req.body.email, req.body.subject, req.body.message);
        res.redirect('/?msg=FeedbackSent');
    });

// --- AUTH & PROFILE ---
app.route('/login')
    .get((req, res) => res.render('login'))
    .post((req, res) => {
        const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(req.body.email);
        if (user && bcrypt.compareSync(req.body.password, user.password_hash)) {
            if (user.is_blocked) return res.status(403).send('Account blocked');
            req.session.user = { id: user.id, name: user.name, role: user.role };
            return res.redirect('/');
        }
        res.render('login', { error: 'Invalid credentials' });
    });

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

app.get('/profile', requireAuth, (req, res) => {
    const modpacks = db.prepare(`SELECT * FROM modpacks WHERE user_id = ?`).all(req.session.user.id);
    res.render('profile', { modpacks });
});

// --- MODPACK BUILDER (CART) ---
app.get('/modpack', (req, res) => {
    if (!req.session.cart) req.session.cart = [];
    const cartMods = req.session.cart.length > 0 
        ? db.prepare(`SELECT * FROM mods WHERE id IN (${req.session.cart.map(() => '?').join(',')})`).all(req.session.cart) 
        : [];
    res.render('modpack_builder', { cartMods });
});

app.post('/modpack/add/:id', (req, res) => {
    if (!req.session.cart) req.session.cart = [];
    if (!req.session.cart.includes(req.params.id)) req.session.cart.push(req.params.id);
    res.redirect('/catalog');
});

app.post('/modpack/checkout', requireAuth, (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) return res.redirect('/modpack');
    
    const insertModpack = db.prepare(`INSERT INTO modpacks (user_id, status) VALUES (?, 'new')`);
    const insertItem = db.prepare(`INSERT INTO modpack_items (modpack_id, mod_id) VALUES (?, ?)`);
    
    const transaction = db.transaction(() => {
        const info = insertModpack.run(req.session.user.id);
        req.session.cart.forEach(modId => insertItem.run(info.lastInsertRowid, modId));
    });
    
    transaction();
    req.session.cart = [];
    res.redirect('/profile');
});

// --- ADMIN PANEL ---
app.get('/admin', requireAdmin, (req, res) => {
    const stats = {
        users: db.prepare(`SELECT COUNT(*) as c FROM users`).get().c,
        mods: db.prepare(`SELECT COUNT(*) as c FROM mods`).get().c
    };
    res.render('admin/dashboard', { stats });
});

app.post('/admin/mods', requireAdmin, upload.single('cover'), (req, res) => {
    const imgUrl = req.file ? `/uploads/${req.file.filename}` : null;
    db.prepare(`INSERT INTO mods (title, category_id, image_url, is_available) VALUES (?, ?, ?, 1)`)
      .run(req.body.title, req.body.category_id, imgUrl);
    res.redirect('/admin');
});

// --- ERROR HANDLING ---
app.use((req, res) => res.status(404).render('error', { msg: '404 - Not Found' }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { msg: '500 - Internal Server Error' });
});

app.listen(3000, () => console.log('ModForge MVP running on http://localhost:3000'));