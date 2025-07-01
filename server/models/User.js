const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static createTable() {
    return new Promise((resolve, reject) => {
      const query = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      db.run(query, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
        } else {
          console.log('Users table created or already exists');
          resolve();
        }
      });
    });
  }

  static createConversationsTable() {
    return new Promise((resolve, reject) => {
      const query = `
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `;
      
      db.run(query, (err) => {
        if (err) {
          console.error('Error creating conversations table:', err);
          reject(err);
        } else {
          console.log('Conversations table created or already exists');
          resolve();
        }
      });
    });
  }

  static createDocumentsTable() {
    return new Promise((resolve, reject) => {
      const query = `
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          conversation_id INTEGER,
          filename TEXT NOT NULL,
          filepath TEXT NOT NULL,
          file_type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE SET NULL
        )
      `;
      
      db.run(query, (err) => {
        if (err) {
          console.error('Error creating documents table:', err);
          reject(err);
        } else {
          console.log('Documents table created or already exists');
          resolve();
        }
      });
    });
  }

  static createMessagesTable() {
    return new Promise((resolve, reject) => {
      const query = `
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
        )
      `;
      
      db.run(query, (err) => {
        if (err) {
          console.error('Error creating messages table:', err);
          reject(err);
        } else {
          console.log('Messages table created or already exists');
          resolve();
        }
      });
    });
  }

  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE email = ?';
      db.get(query, [email], (err, row) => {
        if (err) {
          console.error('Error finding user by email:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static create(email, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
        
        db.run(query, [email, hashedPassword], function(err) {
          if (err) {
            console.error('Error creating user:', err);
            reject(err);
          } else {
            // Get the created user
            db.get('SELECT id, email, created_at FROM users WHERE id = ?', [this.lastID], (err, row) => {
              if (err) {
                reject(err);
              } else {
                // Return user object with correct structure
                resolve({
                  id: row.id,
                  email: row.email,
                  created_at: row.created_at
                });
              }
            });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  static verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User; 