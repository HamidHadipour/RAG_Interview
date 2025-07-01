const db = require('../config/database');

class Document {
  static create(userId, conversationId, filename, filepath, fileType) {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO documents (user_id, conversation_id, filename, filepath, file_type) VALUES (?, ?, ?, ?, ?)';
      
      db.run(query, [userId, conversationId, filename, filepath, fileType], function(err) {
        if (err) {
          console.error('Error creating document:', err);
          reject(err);
        } else {
          // Get the created document
          db.get('SELECT * FROM documents WHERE id = ?', [this.lastID], (err, row) => {
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

  static findByConversationId(conversationId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM documents WHERE conversation_id = ? AND user_id = ? ORDER BY created_at DESC';
      
      db.all(query, [conversationId, userId], (err, rows) => {
        if (err) {
          console.error('Error finding documents by conversation:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findByUserId(userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC';
      
      db.all(query, [userId], (err, rows) => {
        if (err) {
          console.error('Error finding documents by user:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findById(documentId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM documents WHERE id = ? AND user_id = ?';
      
      db.get(query, [documentId, userId], (err, row) => {
        if (err) {
          console.error('Error finding document by id:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static delete(documentId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM documents WHERE id = ? AND user_id = ?';
      
      db.run(query, [documentId, userId], function(err) {
        if (err) {
          console.error('Error deleting document:', err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static updateConversationId(documentId, conversationId, userId) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE documents SET conversation_id = ? WHERE id = ? AND user_id = ?';
      
      db.run(query, [conversationId, documentId, userId], function(err) {
        if (err) {
          console.error('Error updating document conversation:', err);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }
}

module.exports = Document; 