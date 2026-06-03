const express = require('express');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const router = express.Router();

// Input whitelisting patterns
const patterns = {
  amount: /^\d+(\.\d{1,2})?$/,
  currency: /^(ZAR|USD|EUR|GBP)$/,
  provider: /^SWIFT$/,
  payeeAccount: /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/,
  swiftCode: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  objectId: /^[a-fA-F0-9]{24}$/
};

// Create transaction (customer only)
router.post('/create', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer')
      return res.status(403).json({ error: 'Only customers can create payments.' });

    const { amount, currency, provider, payeeAccount, swiftCode } = req.body;

    if (!patterns.amount.test(String(amount)) || Number(amount) <= 0)
      return res.status(400).json({ error: 'Invalid amount.' });
    if (!patterns.currency.test(currency))
      return res.status(400).json({ error: 'Invalid currency (ZAR, USD, EUR, GBP).' });
    if (!patterns.provider.test(provider))
      return res.status(400).json({ error: 'Invalid provider.' });
    if (!patterns.payeeAccount.test(payeeAccount))
      return res.status(400).json({ error: 'Invalid payee account (IBAN format required).' });
    if (!patterns.swiftCode.test(swiftCode))
      return res.status(400).json({ error: 'Invalid SWIFT code.' });

    const transaction = new Transaction({
      userId: req.user.id, amount: Number(amount), currency, provider, payeeAccount, swiftCode
    });
    await transaction.save();
    res.status(201).json({ message: 'Payment created successfully.', transaction });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment.' });
  }
});

// Get all transactions (employee only)
router.get('/transactions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employee')
      return res.status(403).json({ error: 'Access denied.' });

    const transactions = await Transaction.find()
      .populate('userId', 'fullName accountNumber')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

// Verify transaction (employee only)
router.patch('/verify/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employee')
      return res.status(403).json({ error: 'Access denied.' });
    if (!patterns.objectId.test(req.params.id))
      return res.status(400).json({ error: 'Invalid transaction ID.' });

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status: 'verified', verifiedBy: req.user.id },
      { new: true }
    );
    if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });
    res.json({ message: 'Transaction verified.', transaction });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// Submit verified transactions to SWIFT (employee only)
router.post('/submit-swift', auth, async (req, res) => {
  try {
    if (req.user.role !== 'employee')
      return res.status(403).json({ error: 'Access denied.' });

    const result = await Transaction.updateMany(
      { status: 'verified' },
      { status: 'submitted' }
    );
    res.json({ message: `${result.modifiedCount} transaction(s) submitted to SWIFT.` });
  } catch (err) {
    res.status(500).json({ error: 'SWIFT submission failed.' });
  }
});

module.exports = router;
