import React, { useState } from 'react';

const patterns = {
  amount: /^\d+(\.\d{1,2})?$/,
  payeeAccount: /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/,
  swiftCode: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/
};

export default function Payment({ token }) {
  const [form, setForm] = useState({ amount: '', currency: 'ZAR', provider: 'SWIFT', payeeAccount: '', swiftCode: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!patterns.amount.test(form.amount) || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    if (!patterns.payeeAccount.test(form.payeeAccount)) return setError('Invalid IBAN (e.g., GB29NWBK60161331926819).');
    if (!patterns.swiftCode.test(form.swiftCode)) return setError('Invalid SWIFT code (e.g., NWBKGB2L).');

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, amount: Number(form.amount) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Payment submitted successfully!');
      setForm({ amount: '', currency: 'ZAR', provider: 'SWIFT', payeeAccount: '', swiftCode: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <h2>International Payment</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Amount</label>
          <input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Currency</label>
          <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
            <option value="ZAR">ZAR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div className="form-group">
          <label>Provider</label>
          <input value="SWIFT" disabled />
        </div>
        <div className="form-group">
          <label>Payee Account (IBAN)</label>
          <input value={form.payeeAccount} onChange={e => setForm({...form, payeeAccount: e.target.value.toUpperCase()})} placeholder="GB29NWBK60161331926819" required />
        </div>
        <div className="form-group">
          <label>SWIFT Code</label>
          <input value={form.swiftCode} onChange={e => setForm({...form, swiftCode: e.target.value.toUpperCase()})} placeholder="NWBKGB2L" maxLength="11" required />
        </div>
        <button type="submit" className="btn">💳 Pay Now</button>
      </form>
    </div>
  );
}
