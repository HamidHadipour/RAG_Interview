const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');

const app = express();
app.use(fileUpload());

app.post('/test-upload', (req, res) => {
    console.log('Files received:', req.files);
    console.log('Body received:', req.body);
    
    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    console.log('File info:', {
        name: file.name,
        size: file.size,
        mimetype: file.mimetype
    });

    res.json({ message: 'File received successfully', filename: file.name });
});

app.listen(5001, () => {
    console.log('Test server running on port 5001');
}); 