const db = require('../config/database');

class Message {
  static create(conversationId, role, content) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)';
      
      db.run(query, [conversationId, role, content], function(err) {
        if (err) {
          console.error('Error creating message:', err);
          reject(err);
        } else {
          // Get the created message
          db.get('SELECT * FROM messages WHERE id = ?', [this.lastID], (err, row) => {
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

  static findByConversationId(conversationId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC';
      
      db.all(query, [conversationId], (err, rows) => {
        if (err) {
          console.error('Error finding messages by conversation:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findById(messageId, conversationId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM messages WHERE id = ? AND conversation_id = ?';
      
      db.get(query, [messageId, conversationId], (err, row) => {
        if (err) {
          console.error('Error finding message by id:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static delete(messageId, conversationId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM messages WHERE id = ? AND conversation_id = ?';
      
      db.run(query, [messageId, conversationId], function(err) {
        if (err) {
          console.error('Error deleting message:', err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static deleteByConversationId(conversationId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM messages WHERE conversation_id = ?';
      
      db.run(query, [conversationId], function(err) {
        if (err) {
          console.error('Error deleting messages by conversation:', err);
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  static getConversationSummary(conversationId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as user_messages,
          COUNT(CASE WHEN role = 'assistant' THEN 1 END) as assistant_messages,
          MIN(created_at) as first_message,
          MAX(created_at) as last_message
        FROM messages 
        WHERE conversation_id = ?
      `;
      
      db.get(query, [conversationId], (err, row) => {
        if (err) {
          console.error('Error getting conversation summary:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = Message; 