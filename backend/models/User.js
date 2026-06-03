const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, match: /^[a-zA-Z\s\-']{2,50}$/ },
  idNumber: { type: String, required: true, unique: true, match: /^\d{13}$/ },
  accountNumber: { type: String, required: true, unique: true, match: /^\d{7,11}$/ },
  username: { type: String, required: true, unique: true, match: /^[a-zA-Z0-9_]{3,20}$/ },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'employee'], default: 'customer' }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
