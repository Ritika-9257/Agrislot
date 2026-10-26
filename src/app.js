const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const env = require('./config/env');
const apiRoutes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts and styles for local dashboard UI
}));

app.use(cors({
  origin: [env.FRONTEND_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global Rate Limiting
app.use('/api/', apiLimiter);

// Serve Interactive Frontend UI (Lab 10 & Lab 11 + AgriSlot Portal)
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Routes (Supports both /api/v1 and /api for backwards compatibility)
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes);

// Root route redirect or friendly greeting
app.get('/api', (req, res) => {
  res.json({
    project: 'AgriSlot APMC Slot Booking System',
    version: '1.0.0',
    documentation: '/api/v1/health',
    uiDashboard: '/'
  });
});

// 404 Handler
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
