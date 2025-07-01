const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Document = require('../models/Document');

// Get all conversations for the current user
router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Conversation.findByUserId(req.user.userId);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific conversation with messages
router.get('/:id', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    
    // Verify conversation belongs to user
    const conversation = await Conversation.findById(conversationId, req.user.userId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Get messages for this conversation
    const messages = await Message.findByConversationId(conversationId);
    
    // Get documents for this conversation
    const documents = await Document.findByConversationId(conversationId, req.user.userId);

    res.json({
      conversation,
      messages,
      documents
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new conversation
router.post('/', auth, async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Conversation title is required' });
    }

    const conversation = await Conversation.create(req.user.userId, title.trim());
    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update conversation title
router.put('/:id', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { title } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Conversation title is required' });
    }

    const updated = await Conversation.updateTitle(conversationId, req.user.userId, title.trim());
    if (!updated) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ message: 'Conversation updated successfully' });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a conversation
router.delete('/:id', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    
    const deleted = await Conversation.delete(conversationId, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a message to a conversation
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { role, content } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({ message: 'Role and content are required' });
    }

    // Verify conversation belongs to user
    const conversation = await Conversation.findById(conversationId, req.user.userId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Create the message
    const message = await Message.create(conversationId, role, content);
    
    // Update conversation's last activity
    await Conversation.updateLastActivity(conversationId);

    res.status(201).json(message);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 