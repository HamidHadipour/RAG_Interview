// =======================================
// 2. UPLOAD ROUTE - server/routes/upload.js
// =======================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const Conversation = require('../models/Conversation');

const { parseAndEmbed } = require('../services/embedding');

router.post('/', auth, async (req, res) => {
    console.log('Upload request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Files keys:', Object.keys(req.files || {}));
    console.log('User:', req.user);

    if (!req.files || !req.files.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return res.status(400).json({ 
            error: `File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB` 
        });
    }
    
    // Get conversationId from form fields
    const conversationId = req.body?.conversationId || null;
    const uploadPath = path.join(__dirname, '../uploads', file.name);

    console.log('File info:', {
        name: file.name,
        size: file.size,
        mimetype: file.mimetype
    });
    console.log('Upload path:', uploadPath);

    try {
        // Move file to uploads directory
        console.log('Moving file...');
        await new Promise((resolve, reject) => {
            file.mv(uploadPath, (err) => {
                if (err) {
                    console.error('File move error:', err);
                    reject(err);
                } else {
                    console.log('File moved successfully');
                    resolve();
                }
            });
        });

        // Process and embed the file
        console.log('Processing file...');
        await parseAndEmbed(uploadPath, file.name);
        console.log('File processed successfully');

        // Determine file type
        const fileType = path.extname(file.name).toLowerCase().substring(1);
        console.log('File type:', fileType);

        // Create or get conversation
        let conversation;
        if (conversationId) {
            console.log('Using existing conversation:', conversationId);
            conversation = await Conversation.findById(conversationId, req.user.userId);
            if (!conversation) {
                return res.status(404).json({ message: 'Conversation not found' });
            }
        } else {
            console.log('Creating new conversation');
            const title = `Chat about ${file.name}`;
            conversation = await Conversation.create(req.user.userId, title);
            console.log('New conversation created:', conversation.id);
        }

        // Store document information in database
        console.log('Storing document in database...');
        const document = await Document.create(
            req.user.userId,
            conversation.id,
            file.name,
            uploadPath,
            fileType
        );
        console.log('Document stored:', document.id);

        console.log('Upload completed successfully');

        res.json({ 
            message: 'File uploaded and processed', 
            filename: file.name,
            conversationId: conversation.id,
            documentId: document.id
        });
    } catch (error) {
        console.error('Upload error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

module.exports = router;
