const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'modforge.db'), { verbose: console.log });
db.pragma('foreign_keys = ON');

let needsSeed = false;
try {
    const count = db.prepare('SELECT COUNT(*) as c FROM mods').get();
    if (count.c < 20) needsSeed = true;
    db.prepare('SELECT is_nsfw FROM mods LIMIT 1').get();
    const hasDeadlock = db.prepare("SELECT id FROM mods WHERE game_title = 'Deadlock' LIMIT 1").get();
    if (!hasDeadlock) needsSeed = true;
} catch (e) {
    needsSeed = true;
}

if (needsSeed) {
    console.log('Applying HornyHo DB Schema & 20-Mod Seed...');
    db.exec(`
        DROP TABLE IF EXISTS favorites;
        DROP TABLE IF EXISTS reviews;
        DROP TABLE IF EXISTS modpack_items;
        DROP TABLE IF EXISTS modpacks;
        DROP TABLE IF EXISTS mods;
        DROP TABLE IF EXISTS categories;
    `);
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema);
}

const checkAdmin = db.prepare(`SELECT id FROM users WHERE email = ?`).get('admin@modforge.local');
if (!checkAdmin) {
    const hash = bcrypt.hashSync('Admin123!', 10);
    db.prepare(`INSERT INTO users (name, email, phone, password_hash, role, is_blocked) VALUES (?, ?, ?, ?, 'admin', 0)`)
      .run('Admin', 'admin@modforge.local', '+00000000000', hash);
}

module.exports = db;
