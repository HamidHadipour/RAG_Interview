const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Create database file in the server directory
const dbPath = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('SQLite database connected successfully');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

module.exports = db; 