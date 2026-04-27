import { useState } from 'react';
import './style.css';

import { BookingProvider, useBooking } from './context/BookingContext.jsx';
import Booking from './pages/Booking.jsx';
import Seats from './pages/Seats.jsx';
import Confirmation from './pages/Confirmatiom.jsx';
import MyBookings from './pages/MyBookings.jsx';

// ═══════════════════════════════════════════════════════════════
//  BACKGROUND
// ═══════════════════════════════════════════════════════════════
function Background() {
  return (
    <div className="bg-pattern" aria-hidden="true">
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dde4f0" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════
function Login() {
  const { login } = useBooking();
  const [mode, setMode] = useState('login'); // login, register, agent
  const [form, setForm] = useState({ username: '', password: '', email: '', agentId: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [otp, setOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError(''); };
  const handleSubmit = () => {
    if (mode === 'register' && !form.email.trim()) { setError('Please enter your Email.'); return; }
    if (mode === 'agent' && !form.agentId.trim()) { setError('Please enter your Agent ID.'); return; }
    if (!form.username.trim()) { setError('Please enter your User Name.'); return; }
    if (!form.password.trim()) { setError('Please enter your Password.'); return; }
    if (form.password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); login(form.username.trim()); }, 1200);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-hero">
          <div className="hero-badge">🇮🇳 India's Largest Booking Platform</div>
          <h1>Book Your<br /><span>Train Tickets</span><br />Instantly</h1>
          <p>Experience seamless train reservations across India. Book tickets, check PNR status, and manage your journeys all in one place.</p>
          <div className="login-stats">
            <div className="stat-item"><div className="num">14M+</div><div className="label">Daily Users</div></div>
            <div className="stat-item"><div className="num">8000+</div><div className="label">Trains</div></div>
            <div className="stat-item"><div className="num">7000+</div><div className="label">Stations</div></div>
          </div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          {mode === 'login' && <h2>Login</h2>}
          {mode === 'register' && <h2>Register</h2>}
          {mode === 'agent' && <h2>Agent Login</h2>}
          <p className="subtitle">
            {mode === 'login' && 'Sign in to book your journey'}
            {mode === 'register' && 'Create a new account'}
            {mode === 'agent' && 'Authorized agent access portal'}
            </p>
            {error && <div className="error-msg"> {error}</div>}

            {mode === 'register' && (
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email" name="email" value={form.email}
                    onChange={handleChange} placeholder="Enter your email"
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>
              </div>
            )}

            {mode === 'agent' && (
              <div className="form-group">
                <label>Agent ID</label>
                <div className="input-wrapper">
                  <input
                    type="text" name="agentId" value={form.agentId}
                    onChange={handleChange} placeholder="Enter your Agent ID"
                    style={{ paddingLeft: '1rem' }}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>User Name</label>
              <div className="input-wrapper">
                <input
                  type="text" name="username" value={form.username}
                  onChange={handleChange} placeholder="Enter your username"
                  style={{ paddingLeft: '1rem' }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input
                  type={showPwd ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} placeholder="Enter your password"
                  style={{ paddingLeft: '1rem', paddingRight: '2.75rem' }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <button className="eye-btn" onClick={() => setShowPwd(v => !v)} type="button">
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            {mode === 'login' && <span className="forgot-link">Forgot Account Details?</span>}
            <div className="checkbox-row">
              <input type="checkbox" id="otp-check" checked={otp} onChange={e => setOtp(e.target.checked)} />
              <label htmlFor="otp-check">Visually impaired users may select this option to receive OTP instead of CAPTCHA</label>
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? ' Processing...' : (mode === 'login' ? 'Sign In' : mode === 'register' ? 'Register' : 'Agent Sign In')}
            </button>
            <div className="login-divider">or</div>

            {mode !== 'login' ? (
              <div className="login-bottom-btns">
                <button className="btn-secondary" onClick={() => { setMode('login'); setError(''); }}>Back to Login</button>
              </div>
            ) : (
              <div className="login-bottom-btns">
                <button className="btn-secondary" onClick={() => { setMode('register'); setError(''); }}>Register</button>
                <button className="btn-secondary" onClick={() => { setMode('agent'); setError(''); }}>Agent Login</button>
              </div>
            )}
          </div>
        </div>
      </div>
      );
}

      // ═══════════════════════════════════════════════════════════════
      //  STEPS BAR
      // ═══════════════════════════════════════════════════════════════
      const STEPS = [
      {id: 'search',  label: 'Search'  },
      {id: 'seats',   label: 'Seats'   },
      {id: 'confirm', label: 'Confirm' },
      ];

      function StepsBar({currentStep}) {
  const idx = STEPS.findIndex(s => s.id === currentStep);
      return (
      <div className="steps-bar">
        {STEPS.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step ${i === idx ? 'active' : i < idx ? 'completed' : ''}`}>
              <div className="step-num">{i < idx ? '✓' : i + 1}</div>
              {step.label}
            </div>
            {i < STEPS.length - 1 && <div className={`step-divider ${i < idx ? 'completed' : ''}`} />}
          </div>
        ))}
      </div>
      );
}

      // ═══════════════════════════════════════════════════════════════
      //  PNR STATUS & CHARTS
      // ═══════════════════════════════════════════════════════════════
      function PNRStatus() {
  const [pnr, setPnr] = useState('');
      const [status, setStatus] = useState(null);

  const checkStatus = () => {
    if (pnr.length !== 10) return alert('Please enter a valid 10-digit PNR number.');
      setStatus({
        train: '12301 - RAJDHANI EXP',
      date: new Date().toLocaleDateString(),
      passengers: [{name: 'Passenger 1', status: 'CNF / B4 / 12' }],
      chart: 'Chart Prepared'
    });
  };

      return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2>PNR Status Enquiry</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>Enter the 10-digit PNR printed on your ticket.</p>
        <div className="form-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <input
            type="text" maxLength="10" placeholder="Enter 10 digit PNR"
            value={pnr} onChange={e => setPnr(e.target.value.replace(/\D/g, ''))}
            style={{ width: '200px', paddingLeft: '1rem' }}
          />
          <button className="btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }} onClick={checkStatus}>Submit</button>
        </div>

        {status && (
          <div style={{ marginTop: '2rem', textAlign: 'left', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Ticket Details</h3>
            <p><strong>Train:</strong> {status.train}</p>
            <p><strong>Date of Journey:</strong> {status.date}</p>
            <p><strong>Charting Status:</strong> <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>{status.chart}</span></p>
            <div style={{ marginTop: '1rem' }}>
              <strong>Passenger Info:</strong>
              {status.passengers.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', padding: '0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span>{p.name}</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      );
}

      function ChartsVacancy() {
  return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2>Charts & Vacancy</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-light)' }}>View available seats and reservation charts.</p>
        <div className="form-group">
          <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem' }}>Train Name / Number</label>
          <div className="input-wrapper">
            <input type="text" placeholder="e.g. 12951 - RAJDHANI" style={{ paddingLeft: '1rem' }} />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem' }}>Journey Date</label>
          <div className="input-wrapper">
            <input type="date" style={{ paddingLeft: '1rem' }} />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label style={{ textAlign: 'left', display: 'block', marginBottom: '0.5rem' }}>Boarding Station</label>
          <div className="input-wrapper">
            <input type="text" placeholder="e.g. NDLS - NEW DELHI" style={{ paddingLeft: '1rem' }} />
          </div>
        </div>
        <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => alert("Charts data is generated 4 hours prior to departure. No data available for this selection right now.")}>Get Train Chart</button>
      </div>
      );
}

      // ═══════════════════════════════════════════════════════════════
      //  HEADER
      // ═══════════════════════════════════════════════════════════════
      function Header({onMyBookings, onPnrStatus, onChartsVacancy}) {
  const {user, logout} = useBooking();
      return (
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">IR</div>
          <div className="logo-text">IR<span>CTC</span></div>
        </div>
        {user && (
          <>
            <nav className="header-nav">
              <span className="nav-item" onClick={onPnrStatus} style={{ cursor: 'pointer' }}>PNR Status</span>
              <span className="nav-item" onClick={onChartsVacancy} style={{ cursor: 'pointer' }}>Charts / Vacancy</span>
              <span
                className="nav-item"
                onClick={onMyBookings}
                style={{ cursor: 'pointer', color: 'var(--navy)', fontWeight: 700, borderBottom: '2px solid var(--navy)', paddingBottom: '2px' }}
              >
                🎫 My Bookings
              </span>
            </nav>
            <div className="header-user" onClick={logout} title="Click to logout">
              👤 {user.name} <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '0.25rem' }}>(Logout)</span>
            </div>
          </>
        )}
      </header>
      );
}

      // ═══════════════════════════════════════════════════════════════
      //  MAIN APP
      // ═══════════════════════════════════════════════════════════════
      function AppInner({page, setPage}) {
  const {user, setSelectedTrain} = useBooking();
      const [totalFare, setTotalFare]  = useState(0);

      if (!user) return <Login />;

  const handleBack = () => {
    if (page === 'seats') setPage('search');
    else if (page === 'confirm') setPage('seats');
    else setPage('search');
  };

      return (
      <div className="page-wrapper">
        {page !== 'search' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto 1rem auto', display: 'flex', width: '100%', padding: '0 2rem' }}>
            <button className="btn-secondary" onClick={handleBack} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ← Back
            </button>
          </div>
        )}
        {page !== 'myBookings' && page !== 'pnrStatus' && page !== 'chartsVacancy' && <StepsBar currentStep={page} />}
        {page === 'search' && <Booking onSelectTrain={t => { setSelectedTrain(t); setPage('seats'); }} />}
        {page === 'seats' && <Seats onProceed={fare => { setTotalFare(fare); setPage('confirm'); }} onBack={() => setPage('search')} />}
        {page === 'confirm' && <Confirmation totalFare={totalFare} onNewBooking={() => { setSelectedTrain(null); setPage('search'); }} />}
        {page === 'myBookings' && <MyBookings />}
        {page === 'pnrStatus' && <PNRStatus />}
        {page === 'chartsVacancy' && <ChartsVacancy />}
      </div>
      );
}

      export default function App() {
  const [page, setPage] = useState('search');
      return (
      <BookingProvider>
        <Background />
        <Header
          onMyBookings={() => setPage('myBookings')}
          onPnrStatus={() => setPage('pnrStatus')}
          onChartsVacancy={() => setPage('chartsVacancy')}
        />
        <AppInner page={page} setPage={setPage} />
      </BookingProvider>
      );
}
