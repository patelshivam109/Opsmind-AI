require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRouter = require('./routes/auth');
const documentsRouter = require('./routes/documents');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/docs', documentsRouter);
app.use('/api/chat', chatRouter);

// Root health check
app.get('/', (req, res) => {
  res.json({
    service: 'OpsMind AI Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      docs: '/api/docs',
      chat: '/api/chat',
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 50MB.' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\nOpsMind AI Backend running on http://localhost:${PORT}`);
    console.log(`Upload SOPs at: http://localhost:${PORT}/api/docs/upload`);
    console.log(`Chat endpoint: http://localhost:${PORT}/api/chat\n`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing backend or set a different PORT in .env.`);
      process.exit(1);
    }

    console.error('Server failed to start:', error.message);
    process.exit(1);
  });
};

startServer();

module.exports = app;
