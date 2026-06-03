import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Payment from './components/Payment';
import EmployeePortal from './components/EmployeePortal';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  const handleLogin = (t, r) => {
    localStorage.setItem('token', t);
    localStorage.setItem('role', r);
    setToken(t);
    setRole(r);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <h2>🏦 Chauke Ndlovu International Bank</h2>
          <div className="nav-links">
            {!token ? (
              <Link to="/login">Login</Link>
            ) : (
              <>
                {role === 'customer' && <Link to="/payment">Make Payment</Link>}
                {role === 'employee' && <Link to="/portal">Employee Portal</Link>}
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </>
            )}
          </div>
        </nav>
        <main className="container">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/payment" element={token && role === 'customer' ? <Payment token={token} /> : <Navigate to="/login" />} />
            <Route path="/portal" element={token && role === 'employee' ? <EmployeePortal token={token} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to={token ? (role === 'employee' ? '/portal' : '/payment') : '/login'} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
