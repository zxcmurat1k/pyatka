# PROJECT_MAP — HornyHo (`/var/www/pyatka`)

Актуальная ветка аудита: `audit-main-sync`, создана от `main`. Production-сайт также работает с unified `main`; рабочее дерево не меняет данные БД.

## Стек и структура
- Node.js + Express 4 + EJS 7 + better-sqlite3.
- `server.js`: порт 3000, Helmet, express-session, rate-limit, CSRF, multer, auth, OTP и все HTTP-маршруты.
- `db/database.js`: открывает `db/modforge.db`, применяет `db/schema.sql`, добавляет недостающий `mods.is_nsfw` через `ALTER TABLE`, создаёт `email_codes` через `CREATE TABLE IF NOT EXISTS`, гарантирует админа.
- `utils/mailer.js`: Nodemailer; skeleton/fallback/smtp режимы для OTP-писем.
- Статика только в `public/`: `public/css/style.css`, `public/js/script.js`, `public/images/`, `public/uploads/`. Legacy-папка `assets/` удалена; не добавлять ссылки на неё и не восстанавливать её.

## Views
- `index.ejs`, `catalog.ejs`, `mod_details.ejs`, `modpack_builder.ejs`
- `login.ejs`, `register.ejs`, `forgot_password.ejs`, `profile.ejs`
- `contacts.ejs`, `generic.ejs`, `error.ejs`
- `admin/dashboard.ejs`, `partials/header.ejs`, `partials/footer.ejs`

## SQLite таблицы (`db/modforge.db`)
Всего: 9 (`schema.sql` + runtime `email_codes`).
- `users`: аккаунты, хеши, роли, блокировки.
- `categories`: категории модов (`slug`, описание).
- `mods`: карточки модов и NSFW-флаг.
- `modpacks`: сохранённые сборки пользователя.
- `modpack_items`: элементы сборки с порядком и размером на момент сохранения.
- `reviews`: отзывы с премодерацией.
- `feedback`: обращения из формы контактов.
- `favorites`: избранное пользователя по паре `user_id/mod_id`.
- `email_codes`: OTP-регистрация/сброс, payload, попытки и сроки жизни.

База содержит 20 исходных модов. Схемные изменения допускаются только с `.bak`, через `ALTER TABLE` или `CREATE TABLE IF NOT EXISTS`.

## Ключевые маршруты (`server.js`)
Всего HTTP-endpoints: 31.
- Публичные: `GET /`, `GET /catalog`, `GET /mods/:id`, `GET /about|/faq|/privacy`.
- Отзывы и избранное: `POST /mods/:id/reviews`, `POST /favorites/toggle/:id`.
- Контакты: `GET/POST /contacts`.
- Auth: `GET/POST /login`, `GET/POST /register`, `POST /register/verify`, `GET/POST /forgot-password`, `POST /forgot-password/verify`, `GET /logout`.
- Профиль: `GET /profile`.
- Сборщик: `GET /modpack`, `POST /modpack/add/:id`, `POST /modpack/remove/:id`, `POST /modpack/checkout`.
- Админка: `GET /admin`; `POST /admin/mods`, `/admin/mods/delete/:id`, `/admin/reviews/:id/approve`, `/admin/reviews/:id/delete`, `/admin/feedback/:id/process`, `/admin/feedback/:id/delete`.
- Неизвестные URL и ошибки рендерят `error.ejs`.

## Каталог
- Фильтры: `q`, `game`, `category`, `version`, `nsfw=0|1`.
- Сортировка: `popular`, `downloads`, `size`, `newest`.
- Данные: моды с названием категории, список игр и связанные моды по той же игре.

## Res.locals
Глобально доступны:
- `csrfToken`: токен сессии; обязательное `_csrf` для обычных POST-запросов.
- `user`: `{ id, name, role }` или `null`.
- `cartCount`: длина `req.session.cart`.
- `appName`: `HornyHo`.
- `categories`: все категории БД.
- `currentPage`: `index`, `catalog`, `builder`, `contacts`, `admin`, `profile`, `login` или пустая строка.

## Активные функции
- Регистрация с bcrypt и 6-значным OTP по email.
- Вход/выход, блокировка аккаунта, сброс пароля через OTP.
- Сессии корзины сборщика, избранное и сохранённые модпаки.
- Отзывы с премодерацией и админ-управление модами/отзывами/обращениями.
- Скелет e-mail доставки до настройки SMTP через `.env`.
