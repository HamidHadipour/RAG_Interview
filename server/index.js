// =======================================
// 1. SERVER SETUP - server/index.js
// =======================================

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
