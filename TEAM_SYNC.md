# TEAM_SYNC — HornyHo unified main audit

- Дата синхронизации: 2026-11-26.
- Ветка аудита: `audit-main-sync`, ответвлена от `main`.
- Live-стек: Express + EJS + better-sqlite3.
- Active feature set: каталог с фильтрами/сортировкой, NSFW-флаг и возрастной контент, отзывы, избранное, сборщик модпаков, регистрация/login/reset по OTP, админка модов/отзывов/обращений.
- SQLite: 9 таблиц; рабочая БД сохраняет 20 модов.
- Роутов: 31 HTTP endpoint в `server.js`.
- Глобальные `res.locals`: `csrfToken`, `user`, `cartCount`, `appName`, `categories`, `currentPage`.
- SMTP: skeleton/fallback/smtp режимы в `utils/mailer.js`; не использовать `.env`.
- Безопасность: не менять данные БД вне миграционного тикета, делать `.bak`, работать в отдельной ветке, перезапускать только `pm2 restart hornyho`.