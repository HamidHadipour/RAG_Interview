// =======================================
// 2. UPLOAD ROUTE - server/routes/upload.js
// =======================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const parseAndEmbed = require('../services/embedding');

router.post('/', async (req, res) => {
    if (!req.files || !req.files.file) return res.status(400).send('No file uploaded');

    const file = req.files.file;
    const uploadPath = path.join(__dirname, '../uploads', file.name);

    file.mv(uploadPath, async (err) => {
        if (err) return res.status(500).send(err);

        try {
            await parseAndEmbed(uploadPath, file.name);
            console.log('Received file:', file.name);

            res.send({ message: 'File uploaded and processed', filename: file.name });
        } catch (error) {
            res.status(500).send({ error: error.message });
        }
    });
});

module.exports = router;
