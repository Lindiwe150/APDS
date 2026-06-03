import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const patterns = {
  username: /^[a-zA-Z0-9_]{3,20}$/,
  accountNumber: /^\d{7,11}$/
};

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', accountNumber: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!patterns.username.test(form.username)) return setError('Invalid username format.');
    if (!patterns.accountNumber.test(form.accountNumber)) return setError('Invalid account number format.');
    if (form.password.length < 8 || form.password.length > 30) return setError('Invalid password format.');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.token, data.role);
      navigate(data.role === 'employee' ? '/portal' : '/payment');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      <p className="subtitle">No registration — accounts are pre-created by admin.</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Account Number</label>
          <input value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
        </div>
        <button type="submit" className="btn">Login</button>
      </form>
    </div>
  );
}
