const db = require('../config/database');

class Conversation {
  static create(userId, title) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO conversations (user_id, title) VALUES (?, ?)';
      
      db.run(query, [userId, title], function(err) {
        if (err) {
          console.error('Error creating conversation:', err);
          reject(err);
        } else {
          // Get the created conversation
          db.get('SELECT * FROM conversations WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        }
      });
    });
  }

  static findByUserId(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT c.*, 
               COUNT(m.id) as message_count,
               MAX(m.created_at) as last_message_time
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.user_id = ?
        GROUP BY c.id
        ORDER BY c.updated_at DESC
      `;
      
      db.all(query, [userId], (err, rows) => {
        if (err) {
          console.error('Error finding conversations by user:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findById(conversationId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM conversations WHERE id = ? AND user_id = ?';
      
      db.get(query, [conversationId, userId], (err, row) => {
        if (err) {
          console.error('Error finding conversation by id:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static updateTitle(conversationId, userId, title) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';
      
      db.run(query, [title, conversationId, userId], function(err) {
        if (err) {
          console.error('Error updating conversation title:', err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static delete(conversationId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM conversations WHERE id = ? AND user_id = ?';
      
      db.run(query, [conversationId, userId], function(err) {
        if (err) {
          console.error('Error deleting conversation:', err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static updateLastActivity(conversationId) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      
      db.run(query, [conversationId], function(err) {
        if (err) {
          console.error('Error updating conversation activity:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = Conversation; 