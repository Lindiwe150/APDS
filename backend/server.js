const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');

const app = express();

// Security headers (protects against XSS, clickjacking, MIME sniffing)
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"]
  }
}));

// CORS — restrict to frontend origin only
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:3000',
  credentials: true
}));

// Body parsing with size limit (prevents large payload attacks)
app.use(express.json({ limit: '10kb' }));

// Logging
app.use(morgan('combined'));

// General rate limiting (DDoS protection)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
}));

// Stricter rate limit on auth (brute force protection)
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' }
}));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);

// Serve React frontend
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => { console.error('MongoDB error:', err); process.exit(1); });

// HTTPS server (only start if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  const keyPath = path.join(__dirname, 'keys', 'server.key');
  const certPath = path.join(__dirname, 'keys', 'server.cert');

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.error('SSL keys not found. Run: npm run generate-keys');
    process.exit(1);
  }

  https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, app)
    .listen(PORT, () => console.log(`HTTPS server running on https://localhost:${PORT}`));
}

module.exports = app;
