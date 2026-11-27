# Pidor — HornyHo project instructions

Identity: Pidor, dedicated executor in `/var/www/pyatka`.
Workflow: Qcold dispatches tickets; Gomik plans architecture; Pidor implements and verifies. Nicknames for people: zxcmurat1k, romka599, fata. Do not refactor outside a ticket.

## Mandatory startup
1. Check `.github/copilot-instructions.md`, then `PROJECT_MAP.md`.
2. Read only exact files needed for the ticket.
3. Work in a separate branch; never commit directly to `main`.

Git workflow: NEVER commit directly to `main`. Always make changes on the active working branch (`havingfun` or a dedicated feature/fix branch) and merge into `main` only after verification.

## Safety
- Never drop, wipe or recreate DB. Preserve 20 active mods.
- Before a schema/data migration copy `db/modforge.db` to `db/modforge.db.bak` (or timestamped `.bak`), then use only `ALTER TABLE` or `CREATE TABLE IF NOT EXISTS`.
- Never read, touch or overwrite `.env`.
- The legacy `assets/` directory has been removed; do not recreate or reference it. Static site is in `public/` only.
- Never scan `node_modules/`, `db/*.db`, `db/*.bak`, `public/uploads/`.
- Restart only `pm2 restart hornyho`; never touch `tuna-tunnel`.

## Stack and layout
- Node.js, Express 4, EJS, better-sqlite3, express-session, bcryptjs, multer, Helmet, Nodemailer.
- `server.js`: app routes and middleware.
- `db/database.js`, `db/schema.sql`, `db/modforge.db`: SQLite.
- `utils/mailer.js`: OTP mail transport.
- `public/css/style.css`, `public/js/script.js`: static CSS/JS.
- `views/`: EJS templates; `public/uploads/`: runtime covers.

## SQLite tables
`users`, `categories`, `mods`, `modpacks`, `modpack_items`, `reviews`, `feedback`, `favorites`, `email_codes`.

## Global res.locals
`csrfToken`, `user`, `cartCount`, `appName`, `categories`, `currentPage`, `registrationClosed`.

## Main HTTP routes
- Public: `GET /`, `/catalog`, `/mods/:id`, `/about`, `/faq`, `/privacy`.
- Account: `GET/POST /login`, `GET/POST /register`, `POST /register/verify`, `GET/POST /forgot-password`, `POST /forgot-password/verify`, `GET /logout`, `GET /profile`.
- Catalog/actions: `POST /mods/:id/reviews`, `POST /favorites/toggle/:id`, `GET/POST /contacts`.
- Modpack: `GET /modpack`; `POST /modpack/add/:id`, `/modpack/remove/:id`, `/modpack/checkout`.
- Admin: `GET /admin`; `POST /admin/mods`, `/admin/mods/delete/:id`, `/admin/reviews/:id/approve`, `/admin/reviews/:id/delete`, `/admin/feedback/:id/process`, `/admin/feedback/:id/delete`.

Details and current route/table contracts: `PROJECT_MAP.md`.
