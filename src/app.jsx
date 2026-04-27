import { useState } from 'react';
import './style.css';

import { BookingProvider, useBooking } from './context/BookingContext.jsx';
import Booking from './pages/Booking.jsx';
import Seats from './pages/Seats.jsx';
import PassengerDetails from './pages/PassengerDetails.jsx';
import Payment from './pages/Payment.jsx';
import Confirmation from './pages/Confirmatiom.jsx';
import MyBookings from './pages/MyBookings.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

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
  const { login, register } = useBooking();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', email: '', agentId: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [otp, setOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError(''); };
  const handleSubmit = async () => {
    if (mode === 'register' && !form.email.trim()) { setError('Please enter your Email.'); return; }
    if (mode === 'agent' && !form.agentId.trim()) { setError('Please enter your Agent ID.'); return; }
    if (!form.username.trim()) { setError('Please enter your User Name.'); return; }
    if (!form.password.trim()) { setError('Please enter your Password.'); return; }
    if (form.password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(form.username.trim(), form.email.trim(), form.password);
      } else {
        await login(form.username.trim(), form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          {mode === 'login'    && <h2>Login</h2>}
          {mode === 'register' && <h2>Register</h2>}
          {mode === 'agent'    && <h2>Agent Login</h2>}
          <p className="subtitle">
            {mode === 'login'    && 'Sign in to book your journey'}
            {mode === 'register' && 'Create a new account'}
            {mode === 'agent'    && 'Authorized agent access portal'}
          </p>
          {error && <div className="error-msg">{error}</div>}

          {mode === 'register' && (
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="Enter your email" style={{ paddingLeft: '1rem' }} />
              </div>
            </div>
          )}

          {mode === 'agent' && (
            <div className="form-group">
              <label>Agent ID</label>
              <div className="input-wrapper">
                <input type="text" name="agentId" value={form.agentId} onChange={handleChange}
                  placeholder="Enter your Agent ID" style={{ paddingLeft: '1rem' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>User Name</label>
            <div className="input-wrapper">
              <input type="text" name="username" value={form.username} onChange={handleChange}
                placeholder="Enter your username" style={{ paddingLeft: '1rem' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input type={showPwd ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="Enter your password"
                style={{ paddingLeft: '1rem', paddingRight: '2.75rem' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
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
            {loading ? '⏳ Processing...' : (mode === 'login' ? 'Sign In' : mode === 'register' ? 'Register' : 'Agent Sign In')}
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
  { id: 'search',  label: 'Search'  },
  { id: 'seats',   label: 'Seats'   },
  { id: 'details', label: 'Details' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirm', label: 'Confirm' },
];

function StepsBar({ currentStep }) {
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
//  HEADER
// ═══════════════════════════════════════════════════════════════
function Header({ onMyBookings, onAdmin }) {
  const { user, logout } = useBooking();
  const isAdmin = user?.role === 'admin';
  return (
    <header className="header">
      <div className="header-logo">
        <div className="logo-icon">IR</div>
        <div className="logo-text">IR<span>CTC</span></div>
      </div>
      {user && (
        <>
          <nav className="header-nav">
            {isAdmin ? (
              <span className="nav-item" onClick={onAdmin}
                style={{ cursor: 'pointer', fontWeight: 700, borderBottom: '2px solid var(--navy)', paddingBottom: '2px' }}>
                🛡 Admin Dashboard
              </span>
            ) : (
              <span className="nav-item" onClick={onMyBookings}
                style={{ cursor: 'pointer', fontWeight: 700, borderBottom: '2px solid var(--navy)', paddingBottom: '2px' }}>
                🎫 My Bookings
              </span>
            )}
          </nav>
          <div className="header-user" onClick={logout} title="Click to logout">
            👤 {user.username} <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '0.25rem' }}>(Logout)</span>
          </div>
        </>
      )}
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
function AppInner({ page, setPage }) {
  const { user, setSelectedTrain, seatSelection, setSeatSelection } = useBooking();
  const [totalFare, setTotalFare] = useState(0);
  const [paymentId, setPaymentId] = useState(null);

  if (!user) return <Login />;
  if (user.role === 'admin') return <AdminDashboard />;

  const handleBack = () => {
    if (page === 'seats')      setPage('search');
    else if (page === 'details') setPage('seats');
    else if (page === 'payment') setPage('details');
    else if (page === 'confirm') setPage('payment');
    else setPage('search');
  };

  return (
    <div className="page-wrapper">
      {page !== 'search' && (
        <div style={{ maxWidth:'1200px', margin:'0 auto 1rem auto', display:'flex', width:'100%', padding:'0 2rem' }}>
          <button className="btn-secondary" onClick={handleBack} style={{ padding:'0.5rem 1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>← Back</button>
        </div>
      )}
      {page !== 'myBookings' && <StepsBar currentStep={page} />}
      {page === 'search'     && <Booking onSelectTrain={t => { setSelectedTrain(t); setPage('seats'); }} />}
      {page === 'seats'      && <Seats onProceed={fare => { setTotalFare(fare); setPage('details'); }} onBack={() => setPage('search')} />}
      {page === 'details'    && <PassengerDetails onConfirm={() => setPage('payment')} onBack={() => setPage('seats')} />}
      {page === 'payment'    && <Payment totalFare={totalFare} onSuccess={pid => { setPaymentId(pid); setPage('confirm'); }} onBack={() => setPage('details')} />}
      {page === 'confirm'    && <Confirmation totalFare={totalFare} paymentId={paymentId} onNewBooking={() => { setSelectedTrain(null); setPaymentId(null); setPage('search'); }} />}
      {page === 'myBookings' && <MyBookings />}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('search');
  return (
    <BookingProvider>
      <Background />
      <Header onMyBookings={() => setPage('myBookings')} onAdmin={() => setPage('admin')} />
      <AppInner page={page} setPage={setPage} />
    </BookingProvider>
  );
}
