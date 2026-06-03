const express = require('express');
const jwt = require('jsonwebtoken');
const ExpressBrute = require('express-brute');
const User = require('../models/User');
const router = express.Router();

// Brute force protection — per-IP lockout after failed attempts
const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store, {
  freeRetries: 5,
  minWait: 5 * 60 * 1000,    // 5 minutes
  maxWait: 60 * 60 * 1000,   // 1 hour
  failCallback: (req, res) => {
    res.status(429).json({ error: 'Too many failed attempts. Account temporarily locked.' });
  }
});

// Input whitelisting patterns
const patterns = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  accountNumber: /^\d{7,11}$/
};

// Login only — no registration endpoint (users are pre-created)
router.post('/login', bruteforce.prevent, async (req, res) => {
  try {
    const { username, accountNumber, password } = req.body;

    // Whitelist validation
    if (!username || !patterns.username.test(username))
      return res.status(400).json({ error: 'Invalid username format.' });
    if (!accountNumber || !patterns.accountNumber.test(accountNumber))
      return res.status(400).json({ error: 'Invalid account number format.' });
    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 30)
      return res.status(400).json({ error: 'Invalid password format.' });

    const user = await User.findOne({ username, accountNumber });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, role: user.role, fullName: user.fullName });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

module.exports = router;
