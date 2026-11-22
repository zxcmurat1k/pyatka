require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const db = require('./db/database');
const { sendCodeEmail } = require('./utils/mailer');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'HornyHo_Secret_Key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' }
}));

app.use((req, res, next) => {
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    res.locals.csrfToken = req.session.csrfToken;
    res.locals.user = req.session.user || null;
    res.locals.cartCount = req.session.cart ? req.session.cart.length : 0;
    res.locals.appName = 'HornyHo';
    res.locals.categories = db.prepare('SELECT * FROM categories').all();
    const p = req.path;
    res.locals.currentPage =
        p === '/' ? 'index' :
        (p.startsWith('/catalog') || p.startsWith('/mods')) ? 'catalog' :
        p.startsWith('/modpack') ? 'builder' :
        p.startsWith('/contacts') ? 'contacts' :
        p.startsWith('/admin') ? 'admin' :
        p.startsWith('/profile') ? 'profile' :
        (p.startsWith('/login') || p.startsWith('/register') || p.startsWith('/forgot-password')) ? 'login' : '';
    next();
});

const checkCsrf = (req, res, next) => {
    if (req.method === 'POST' && req.body._csrf !== req.session.csrfToken) {
        return res.status(403).send('CSRF Token Mismatch');
    }
    next();
};

app.use((req, res, next) => {
    if (req.method === 'POST' && (!req.headers['content-type'] || !req.headers['content-type'].startsWith('multipart/form-data'))) {
        return checkCsrf(req, res, next);
    }
    next();
});

const requireAuth = (req, res, next) => req.session.user ? next() : res.redirect('/login');
const requireAdmin = (req, res, next) => (req.session.user && req.session.user.role === 'admin') ? next() : res.status(403).send('Forbidden');

const upload = multer({ 
    storage: multer.diskStorage({
        destination: './public/uploads/',
        filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    }),
    fileFilter: (req, file, cb) => {
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
        cb(new Error('Only images allowed'));
    }
});

// --- PUBLIC ROUTES ---
app.get('/', (req, res) => {
    const games = db.prepare(`
        SELECT game_title, COUNT(*) as mods_count, SUM(downloads_count) as total_downloads 
        FROM mods WHERE is_available = 1 
        GROUP BY game_title 
        ORDER BY total_downloads DESC
    `).all();
    const popularMods = db.prepare(`SELECT mods.*, categories.name AS cat_name FROM mods LEFT JOIN categories ON mods.category_id = categories.id WHERE is_available = 1 AND is_nsfw = 0 ORDER BY downloads_count DESC LIMIT 6`).all();
    res.render('index', { games, popularMods });
});

app.get('/catalog', (req, res) => {
    let query = `SELECT mods.*, categories.name as cat_name, categories.slug as cat_slug FROM mods LEFT JOIN categories ON mods.category_id = categories.id WHERE is_available = 1`;
    const params = [];

    if (req.query.q) { query += ` AND (mods.title LIKE ? OR mods.description LIKE ?)`; params.push(`%${req.query.q}%`, `%${req.query.q}%`); }
    if (req.query.game) { query += ` AND mods.game_title = ?`; params.push(req.query.game); }
    if (req.query.category) { query += ` AND categories.slug = ?`; params.push(req.query.category); }
    if (req.query.version) { query += ` AND mods.game_version = ?`; params.push(req.query.version); }
    if (req.query.nsfw === '1') { query += ` AND mods.is_nsfw = 1`; }
    else if (req.query.nsfw === '0') { query += ` AND mods.is_nsfw = 0`; }

    const sortMap = { 'popular': 'downloads_count DESC', 'downloads': 'downloads_count DESC', 'size': 'file_size_mb ASC', 'newest': 'created_at DESC' };
    query += ` ORDER BY ${sortMap[req.query.sort] || 'downloads_count DESC'}`;

    const mods = db.prepare(query).all(...params);
    const gamesList = db.prepare(`SELECT DISTINCT game_title FROM mods`).all().map(r => r.game_title);
    res.render('catalog', { mods, gamesList, query: req.query });
});

app.get('/mods/:id', (req, res) => {
    const mod = db.prepare(`SELECT mods.*, categories.name as cat_name, categories.slug as cat_slug FROM mods LEFT JOIN categories ON mods.category_id = categories.id WHERE mods.id = ?`).get(req.params.id);
    if (!mod) return res.status(404).render('error', { msg: 'Mod not found' });
    const reviews = db.prepare(`SELECT reviews.*, users.name AS user_name FROM reviews JOIN users ON reviews.user_id = users.id WHERE mod_id = ? AND is_approved = 1`).all(mod.id);
    const relatedMods = db.prepare(`SELECT * FROM mods WHERE game_title = ? AND id != ? LIMIT 3`).all(mod.game_title, mod.id);
    const isFavorited = req.session.user
        ? !!db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND mod_id = ?').get(req.session.user.id, mod.id)
        : false;
    res.render('mod_details', { mod, reviews, relatedMods, isFavorited, reviewSubmitted: req.query.msg === 'ReviewSubmitted' });
});

app.post('/mods/:id/reviews', requireAuth, (req, res) => {
    const rating = Math.min(5, Math.max(1, parseInt(req.body.rating, 10) || 5));
    const comment = (req.body.comment || '').trim();
    if (!comment) return res.redirect(`/mods/${req.params.id}`);
    db.prepare(`INSERT INTO reviews (user_id, mod_id, rating, comment) VALUES (?, ?, ?, ?)`).run(req.session.user.id, req.params.id, rating, comment);
    res.redirect(`/mods/${req.params.id}?msg=ReviewSubmitted`);
});

['about', 'faq', 'privacy'].forEach(page => {
    app.get(`/${page}`, (req, res) => res.render('generic', { title: page.toUpperCase() }));
});

app.route('/contacts')
    .get((req, res) => res.render('contacts', { sent: req.query.sent === '1' }))
    .post((req, res) => {
        db.prepare(`INSERT INTO feedback (name, email, subject, message, status) VALUES (?, ?, ?, ?, 'new')`)
          .run(req.body.name, req.body.email, req.body.subject, req.body.message);
        res.redirect('/contacts?sent=1');
    });

// --- AUTH & PROFILE ---
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));

app.route('/login')
    .get((req, res) => {
        const msgMap = {
            Registered: 'Аккаунт успешно создан и подтверждён! Теперь войдите в систему.',
            ResetSent: 'Пароль успешно обновлён! Войдите с новым паролем.'
        };
        res.render('login', { successMsg: msgMap[req.query.msg] || null });
    })
    .post((req, res) => {
        const email = (req.body.email || '').trim().toLowerCase();
        const user = db.prepare(`SELECT * FROM users WHERE LOWER(email) = ?`).get(email);
        if (user && bcrypt.compareSync(req.body.password || '', user.password_hash)) {
            if (user.is_blocked) return res.status(403).send('Account blocked');
            req.session.user = { id: user.id, name: user.name, role: user.role };
            return req.session.save(() => res.redirect('/'));
        }
        res.render('login', { error: 'Неверный email или пароль' });
    });

app.route('/register')
    .get((req, res) => {
        if (req.session.user) return res.redirect('/profile');
        res.render('register', { step: 'form', formData: {} });
    })
    .post(async (req, res) => {
        const name = (req.body.name || '').trim();
        const email = (req.body.email || '').trim().toLowerCase();
        const phone = (req.body.phone || '').trim() || 'Не указан';
        const password = req.body.password || '';
        const confirm = req.body.password_confirm || '';
        const formData = { name, email, phone: phone === 'Не указан' ? '' : phone };

        if (name.length < 2) {
            return res.render('register', { step: 'form', formData, error: 'Имя должно содержать минимум 2 символа.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.render('register', { step: 'form', formData, error: 'Введите корректный адрес электронной почты.' });
        }
        if (password.length < 6) {
            return res.render('register', { step: 'form', formData, error: 'Пароль должен быть не короче 6 символов.' });
        }
        if (password !== confirm) {
            return res.render('register', { step: 'form', formData, error: 'Пароли не совпадают.' });
        }

        const existingUser = db.prepare(`SELECT id FROM users WHERE LOWER(email) = ?`).get(email);
        if (existingUser) {
            return res.render('register', { step: 'form', formData, error: 'Аккаунт с таким email уже существует.' });
        }

        const now = Date.now();
        const prevCode = db.prepare(`SELECT * FROM email_codes WHERE email = ? AND purpose = 'register' ORDER BY id DESC LIMIT 1`).get(email);
        if (prevCode && (now - prevCode.created_at) < OTP_COOLDOWN_MS) {
            const waitSec = Math.ceil((OTP_COOLDOWN_MS - (now - prevCode.created_at)) / 1000);
            return res.render('register', {
                step: 'verify',
                formData: { email },
                info: `Код уже был отправлен ранее. Повторная отправка доступна через ${waitSec} сек.`
            });
        }

        const code = generateOtpCode();
        const payload = JSON.stringify({ name, phone, password_hash: bcrypt.hashSync(password, 10) });
        db.transaction(() => {
            db.prepare(`DELETE FROM email_codes WHERE email = ? AND purpose = 'register'`).run(email);
            db.prepare(`INSERT INTO email_codes (email, purpose, code, payload, attempts, expires_at, created_at) VALUES (?, 'register', ?, ?, 0, ?, ?)`)
              .run(email, code, payload, now + OTP_TTL_MS, now);
        })();

        const mailRes = await sendCodeEmail(email, code, 'register');
        const info = mailRes.mode === 'smtp'
            ? 'Письмо с 6-значным кодом отправлено на вашу почту.'
            : (mailRes.mode === 'fallback'
                ? 'SMTP временно недоступен — код записан в лог сервера.'
                : 'Код сформирован (SMTP ещё не подключён).');

        res.render('register', { step: 'verify', formData: { email }, info, devCode: mailRes.devCode });
    });

app.post('/register/verify', (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const code = (req.body.code || '').trim();
    const record = db.prepare(`SELECT * FROM email_codes WHERE email = ? AND purpose = 'register' ORDER BY id DESC LIMIT 1`).get(email);

    if (!record) {
        return res.render('register', { step: 'form', formData: { email }, error: 'Сессия подтверждения не найдена. Отправьте форму заново.' });
    }
    if (Date.now() > record.expires_at) {
        db.prepare(`DELETE FROM email_codes WHERE id = ?`).run(record.id);
        return res.render('register', { step: 'form', formData: { email }, error: 'Срок действия кода истёк (10 минут). Запросите новый код.' });
    }
    if (record.attempts >= 5) {
        db.prepare(`DELETE FROM email_codes WHERE id = ?`).run(record.id);
        return res.render('register', { step: 'form', formData: { email }, error: 'Превышено число попыток ввода кода. Запросите новый код.' });
    }
    if (record.code !== code) {
        db.prepare(`UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?`).run(record.id);
        return res.render('register', { step: 'verify', formData: { email }, error: `Неверный код. Осталось попыток: ${4 - record.attempts}.` });
    }

    try {
        const data = JSON.parse(record.payload);
        db.transaction(() => {
            db.prepare(`INSERT INTO users (name, email, phone, password_hash, role, is_blocked) VALUES (?, ?, ?, ?, 'user', 0)`)
              .run(data.name, email, data.phone || 'Не указан', data.password_hash);
            db.prepare(`DELETE FROM email_codes WHERE email = ? AND purpose = 'register'`).run(email);
        })();
        res.redirect('/login?msg=Registered');
    } catch (e) {
        res.render('register', { step: 'form', formData: { email }, error: 'Не удалось создать аккаунт: возможно, этот email уже занят.' });
    }
});

app.route('/forgot-password')
    .get((req, res) => res.render('forgot_password', { step: 'request', email: '' }))
    .post(async (req, res) => {
        const email = (req.body.email || '').trim().toLowerCase();
        const user = db.prepare(`SELECT id, is_blocked FROM users WHERE LOWER(email) = ?`).get(email);
        if (!user) {
            return res.render('forgot_password', { step: 'request', email, error: 'Аккаунт с таким email не найден.' });
        }
        if (user.is_blocked) {
            return res.render('forgot_password', { step: 'request', email, error: 'Этот аккаунт заблокирован.' });
        }

        const now = Date.now();
        const prevCode = db.prepare(`SELECT * FROM email_codes WHERE email = ? AND purpose = 'reset' ORDER BY id DESC LIMIT 1`).get(email);
        if (prevCode && (now - prevCode.created_at) < OTP_COOLDOWN_MS) {
            const waitSec = Math.ceil((OTP_COOLDOWN_MS - (now - prevCode.created_at)) / 1000);
            return res.render('forgot_password', {
                step: 'verify',
                email,
                info: `Код уже отправлен. Повторная отправка через ${waitSec} сек.`
            });
        }

        const code = generateOtpCode();
        db.transaction(() => {
            db.prepare(`DELETE FROM email_codes WHERE email = ? AND purpose = 'reset'`).run(email);
            db.prepare(`INSERT INTO email_codes (email, purpose, code, payload, attempts, expires_at, created_at) VALUES (?, 'reset', ?, NULL, 0, ?, ?)`)
              .run(email, code, now + OTP_TTL_MS, now);
        })();

        const mailRes = await sendCodeEmail(email, code, 'reset');
        const info = mailRes.mode === 'smtp'
            ? 'Код восстановления отправлен на вашу почту.'
            : 'Код восстановления сформирован (SMTP ещё не подключён).';

        res.render('forgot_password', { step: 'verify', email, info, devCode: mailRes.devCode });
    });

app.post('/forgot-password/verify', (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const code = (req.body.code || '').trim();
    const newPassword = req.body.new_password || '';
    const confirmPassword = req.body.confirm_password || '';

    if (newPassword.length < 6) {
        return res.render('forgot_password', { step: 'verify', email, error: 'Новый пароль должен быть не короче 6 символов.' });
    }
    if (newPassword !== confirmPassword) {
        return res.render('forgot_password', { step: 'verify', email, error: 'Пароли не совпадают.' });
    }

    const record = db.prepare(`SELECT * FROM email_codes WHERE email = ? AND purpose = 'reset' ORDER BY id DESC LIMIT 1`).get(email);
    if (!record || Date.now() > record.expires_at) {
        if (record) db.prepare(`DELETE FROM email_codes WHERE id = ?`).run(record.id);
        return res.render('forgot_password', { step: 'request', email, error: 'Код не найден или истёк. Запросите новый.' });
    }
    if (record.attempts >= 5) {
        db.prepare(`DELETE FROM email_codes WHERE id = ?`).run(record.id);
        return res.render('forgot_password', { step: 'request', email, error: 'Превышено число попыток. Запросите новый код.' });
    }
    if (record.code !== code) {
        db.prepare(`UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?`).run(record.id);
        return res.render('forgot_password', { step: 'verify', email, error: `Неверный код. Осталось попыток: ${4 - record.attempts}.` });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.transaction(() => {
        db.prepare(`UPDATE users SET password_hash = ? WHERE LOWER(email) = ?`).run(hash, email);
        db.prepare(`DELETE FROM email_codes WHERE email = ? AND purpose = 'reset'`).run(email);
    })();

    res.redirect('/login?msg=ResetSent');
});

app.get('/logout', (req, res) => { req.session.destroy(() => res.redirect('/')); });

app.get('/profile', requireAuth, (req, res) => {
    const modpacks = db.prepare(`SELECT * FROM modpacks WHERE user_id = ? ORDER BY created_at DESC`).all(req.session.user.id);
    const getItems = db.prepare(`SELECT m.id, m.title, m.game_title, m.file_size_mb, mi.load_order FROM modpack_items mi JOIN mods m ON mi.mod_id = m.id WHERE mi.modpack_id = ? ORDER BY mi.load_order ASC`);
    modpacks.forEach(p => { p.items = getItems.all(p.id); });
    const favorites = db.prepare(`SELECT mods.* FROM favorites JOIN mods ON favorites.mod_id = mods.id WHERE favorites.user_id = ?`).all(req.session.user.id);
    res.render('profile', { modpacks, favorites });
});

app.post('/favorites/toggle/:id', requireAuth, (req, res) => {
    const exists = db.prepare(`SELECT 1 FROM favorites WHERE user_id = ? AND mod_id = ?`).get(req.session.user.id, req.params.id);
    if (exists) db.prepare(`DELETE FROM favorites WHERE user_id = ? AND mod_id = ?`).run(req.session.user.id, req.params.id);
    else db.prepare(`INSERT INTO favorites (user_id, mod_id) VALUES (?, ?)`).run(req.session.user.id, req.params.id);
    res.redirect(req.get('Referrer') || `/mods/${req.params.id}`);
});

// --- MODPACK BUILDER ---
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
    res.redirect('back');
});

app.post('/modpack/remove/:id', (req, res) => {
    if (req.session.cart) req.session.cart = req.session.cart.filter(id => String(id) !== String(req.params.id));
    res.redirect('/modpack');
});

app.post('/modpack/checkout', requireAuth, (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) return res.redirect('/modpack');
    const mods = db.prepare(`SELECT * FROM mods WHERE id IN (${req.session.cart.map(() => '?').join(',')})`).all(req.session.cart);
    const totalSize = mods.reduce((sum, m) => sum + (m.file_size_mb || 0), 0);

    const insertModpack = db.prepare(`INSERT INTO modpacks (user_id, target_game_version, install_method, notes, total_size_mb, status) VALUES (?, ?, ?, ?, ?, 'new')`);
    const insertItem = db.prepare(`INSERT INTO modpack_items (modpack_id, mod_id, load_order, size_at_save) VALUES (?, ?, ?, ?)`);
    
    db.transaction(() => {
        const info = insertModpack.run(req.session.user.id, req.body.target_game_version || 'Latest', req.body.install_method || 'Manual', req.body.notes || '', totalSize);
        mods.forEach((m, idx) => insertItem.run(info.lastInsertRowid, m.id, idx + 1, m.file_size_mb || 0));
    })();
    
    req.session.cart = [];
    res.redirect('/profile');
});

// --- ADMIN PANEL ---
app.get('/admin', requireAdmin, (req, res) => {
    const stats = {
        users: db.prepare(`SELECT COUNT(*) as c FROM users`).get().c,
        mods: db.prepare(`SELECT COUNT(*) as c FROM mods`).get().c,
        modpacks: db.prepare(`SELECT COUNT(*) as c FROM modpacks`).get().c,
        reviews: db.prepare(`SELECT COUNT(*) as c FROM reviews`).get().c
    };
    const pendingReviews = db.prepare(`SELECT r.*, u.name AS user_name, m.title AS mod_title FROM reviews r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN mods m ON r.mod_id = m.id WHERE r.is_approved = 0 ORDER BY r.created_at DESC`).all();
    const allMods = db.prepare(`SELECT m.*, c.name AS cat_name FROM mods m LEFT JOIN categories c ON m.category_id = c.id ORDER BY m.id DESC`).all();
    const feedbackList = db.prepare(`SELECT * FROM feedback ORDER BY CASE WHEN status = 'new' THEN 0 ELSE 1 END, created_at DESC`).all();
    res.render('admin/dashboard', { stats, pendingReviews, allMods, feedbackList });
});

app.post('/admin/mods', requireAdmin, upload.single('cover'), checkCsrf, (req, res) => {
    const imgUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url && req.body.image_url.trim() ? req.body.image_url.trim() : "/images/logo.png");
    db.prepare(`INSERT INTO mods (title, game_title, game_version, category_id, description, install_instructions, source_url, image_url, file_size_mb, is_nsfw, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`)
      .run(
          req.body.title || 'Untitled',
          req.body.game_title || 'Deadlock',
          req.body.game_version || 'Latest',
          req.body.category_id || 1,
          req.body.description || 'Описание мода',
          req.body.install_instructions || '1. Скачайте мод по ссылке.\n2. Установите в папку игры.',
          req.body.source_url || 'https://gamebanana.com',
          imgUrl,
          Number(req.body.file_size_mb) || 1.0,
          req.body.is_nsfw ? 1 : 0
      );
    res.redirect('/admin');
});

app.post('/admin/mods/delete/:id', requireAdmin, (req, res) => {
    const deleteTx = db.transaction((modId) => {
        db.prepare(`DELETE FROM modpack_items WHERE mod_id = ?`).run(modId);
        db.prepare(`DELETE FROM reviews WHERE mod_id = ?`).run(modId);
        db.prepare(`DELETE FROM favorites WHERE mod_id = ?`).run(modId);
        db.prepare(`DELETE FROM mods WHERE id = ?`).run(modId);
    });
    deleteTx(req.params.id);
    res.redirect('/admin');
});

app.post('/admin/reviews/:id/approve', requireAdmin, (req, res) => {
    db.prepare(`UPDATE reviews SET is_approved = 1 WHERE id = ?`).run(req.params.id);
    res.redirect('/admin');
});

app.post('/admin/reviews/:id/delete', requireAdmin, (req, res) => {
    db.prepare(`DELETE FROM reviews WHERE id = ?`).run(req.params.id);
    res.redirect('/admin');
});

app.post('/admin/feedback/:id/process', requireAdmin, (req, res) => {
    db.prepare(`UPDATE feedback SET status = CASE WHEN status = 'new' THEN 'processed' ELSE 'new' END WHERE id = ?`).run(req.params.id);
    res.redirect('/admin');
});

app.post('/admin/feedback/:id/delete', requireAdmin, (req, res) => {
    db.prepare(`DELETE FROM feedback WHERE id = ?`).run(req.params.id);
    res.redirect('/admin');
});

app.use((req, res) => res.status(404).render('error', { msg: '404 - Not Found' }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).render('error', { msg: '500 - Internal Server Error' }); });

app.listen(3000, () => console.log('HornyHo MVP running on http://localhost:3000'));
