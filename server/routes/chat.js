// =======================================
// 3. CHAT ROUTE - server/routes/chat.js
// =======================================

const express = require('express');
const router = express.Router();
const { queryChroma, askLLM } = require('../services/chatbot');

router.post('/', async (req, res) => {
    const { question } = req.body;
    try {
        const context = await queryChroma(question);
        const answer = await askLLM(question, context);
        res.send({ answer });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
