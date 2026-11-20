const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'modforge.db'), { verbose: console.log });
db.pragma('foreign_keys = ON');

const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
    db.exec(fs.readFileSync(schemaPath, 'utf8'));
}

const modCols = db.prepare("PRAGMA table_info(mods)").all().map(c => c.name);
if (!modCols.includes('is_nsfw')) {
    db.exec("ALTER TABLE mods ADD COLUMN is_nsfw INTEGER NOT NULL DEFAULT 0;");
}

const checkAdmin = db.prepare(`SELECT id FROM users WHERE email = ?`).get('admin@modforge.local');
if (!checkAdmin) {
    const hash = bcrypt.hashSync('Admin123!', 10);
    db.prepare(`INSERT INTO users (name, email, phone, password_hash, role, is_blocked) VALUES (?, ?, ?, ?, 'admin', 0)`)
      .run('Admin', 'admin@modforge.local', '+00000000000', hash);
}

module.exports = db;
