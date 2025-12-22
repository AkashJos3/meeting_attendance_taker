const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists if we decide to put it in a subfolder, 
// but for now keeping it in root is fine, or maybe a 'data' folder.
const dbPath = path.join(__dirname, 'attendance.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize Schema
const initDb = () => {
    // Meetings Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS meetings (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            admin_secret TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACTIVE', 'ENDED')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    // Attendees Table
    db.prepare(`
        CREATE TABLE IF NOT EXISTS attendees (
            id TEXT PRIMARY KEY,
            meeting_id TEXT NOT NULL,
            name TEXT NOT NULL,
            signature TEXT NOT NULL,
            ip_hash TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (meeting_id) REFERENCES meetings(id)
        )
    `).run();

    console.log('Database initialized.');
};

initDb();

module.exports = db;
