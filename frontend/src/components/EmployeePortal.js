import React, { useState, useEffect, useCallback } from 'react';

export default function EmployeePortal({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/payment/transactions', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransactions(data);
    } catch (err) { setError(err.message); }
  }, [token]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleVerify = async (id) => {
    try {
      const res = await fetch(`/api/payment/verify/${id}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Transaction verified.');
      fetchTransactions();
    } catch (err) { setError(err.message); }
  };

  const handleSubmitSwift = async () => {
    try {
      const res = await fetch('/api/payment/submit-swift', {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      fetchTransactions();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="table-container">
      <h2>Employee Portal — Transaction Verification</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <table>
        <thead>
          <tr><th>Customer</th><th>Amount</th><th>Currency</th><th>Payee (IBAN)</th><th>SWIFT</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t._id}>
              <td>{t.userId?.fullName || 'N/A'}</td>
              <td>{t.amount.toFixed(2)}</td>
              <td>{t.currency}</td>
              <td>{t.payeeAccount}</td>
              <td>{t.swiftCode}</td>
              <td className={`status-${t.status}`}>{t.status.toUpperCase()}</td>
              <td>{t.status === 'pending' && <button className="btn-verify" onClick={() => handleVerify(t._id)}>✅ Verify</button>}</td>
            </tr>
          ))}
          {transactions.length === 0 && <tr><td colSpan="7" style={{textAlign:'center'}}>No transactions.</td></tr>}
        </tbody>
      </table>
      {transactions.some(t => t.status === 'verified') && (
        <button className="btn-submit" onClick={handleSubmitSwift}>🚀 Submit to SWIFT</button>
      )}
    </div>
  );
}
