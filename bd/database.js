const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'modforge.db'), { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Execute schema if provided
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
}

// Seed Default Admin Account
const checkAdmin = db.prepare(`SELECT id FROM users WHERE email = ?`).get('admin@modforge.local');
if (!checkAdmin) {
    const hash = bcrypt.hashSync('Admin123!', 10);
    db.prepare(`
        INSERT INTO users (name, email, password_hash, role, is_blocked) 
        VALUES (?, ?, ?, 'admin', 0)
    `).run('Admin', 'admin@modforge.local', hash);
    console.log('Default admin seeded.');
}

module.exports = db;