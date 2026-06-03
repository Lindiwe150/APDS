const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, required: true, enum: ['ZAR', 'USD', 'EUR', 'GBP'] },
  provider: { type: String, required: true, enum: ['SWIFT'] },
  payeeAccount: { type: String, required: true, match: /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/ },
  swiftCode: { type: String, required: true, match: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/ },
  status: { type: String, enum: ['pending', 'verified', 'submitted'], default: 'pending' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
