// =======================================
// 1. SERVER SETUP - server/index.js
// =======================================

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');

const app = express();
const PORT = 5000;

// Initialize database
User.createTable();
User.createConversationsTable();
User.createDocumentsTable();
User.createMessagesTable();

// Configure CORS with specific options
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Handle preflight requests
app.options('*', cors());

app.use(fileUpload({
    useTempFiles: false, // Changed to false to avoid temp file issues
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    parseNested: true,
    debug: true // Enable debug logging
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
