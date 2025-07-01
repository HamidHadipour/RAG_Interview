// =======================================
// 3. CHAT ROUTE - server/routes/chat.js
// =======================================

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { queryChroma, askLLM } = require('../services/chatbot');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

router.post('/', auth, async (req, res) => {
    const { question, conversationId } = req.body;
    
    if (!question) {
        return res.status(400).json({ message: 'Question is required' });
    }

    try {
        // Verify conversation belongs to user
        const conversation = await Conversation.findById(conversationId, req.user.userId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Store user message
        await Message.create(conversationId, 'user', question);

        // Get context from documents
        const context = await queryChroma(question);
        
        // Get AI response
        const answer = await askLLM(question, context);
        
        // Store AI response
        await Message.create(conversationId, 'assistant', answer);
        
        // Update conversation's last activity
        await Conversation.updateLastActivity(conversationId);

        res.send({ answer });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
