import { useState } from 'react';
import { useBooking } from '../context/BookingContext.jsx';

export default function Login() {
  const { login } = useBooking();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [otp, setOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSignIn = () => {
    if (!form.username.trim()) { setError('Please enter your User Name.'); return; }
    if (!form.password.trim()) { setError('Please enter your Password.'); return; }
    if (form.password.length < 4) { setError('Password must be at least 4 characters.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login(form.username.trim());
    }, 1200);
  };

  return (
    <div className="login-page">
      {/* LEFT PANEL */}
      <div className="login-left">
        <div className="login-hero">
          <div className="hero-badge"> India's Largest Booking Platform</div>
          <h1>
            Book Your<br />
            <span>Train Tickets</span><br />
            Instantly
          </h1>
          <p>
            Experience seamless train reservations across India. Book tickets, check PNR status,
            and manage your journeys all in one place.
          </p>
          <div className="login-stats">
            <div className="stat-item">
              <div className="num">14M+</div>
              <div className="label">Daily Users</div>
            </div>
            <div className="stat-item">
              <div className="num">8000+</div>
              <div className="label">Trains</div>
            </div>
            <div className="stat-item">
              <div className="num">7000+</div>
              <div className="label">Stations</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-card">
          <h2>Login</h2>
          <p className="subtitle">Sign in to book your journey</p>

          {error && (
            <div className="error-msg">
              <span>Warning</span> {error}
            </div>
          )}

          <div className="form-group">
            <label>User Name</label>
            <div className="input-wrapper">
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                autoComplete="username"
                style={{ paddingLeft: '1rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input
                type={showPwd ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ paddingLeft: '1rem', paddingRight: '2.75rem' }}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              />
              <button
                className="eye-btn"
                onClick={() => setShowPwd(v => !v)}
                type="button"
                aria-label="Toggle password visibility"
              >
                
              </button>
            </div>
          </div>

          <span className="forgot-link">Forgot Account Details?</span>

          <div className="checkbox-row">
            <input
              type="checkbox"
              id="otp-check"
              checked={otp}
              onChange={e => setOtp(e.target.checked)}
            />
            <label htmlFor="otp-check">
              Visually impaired users may select this option to receive OTP instead of CAPTCHA
            </label>
          </div>

          <button
            className="btn-primary"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? ' Signing In...' : 'Sign In'}
          </button>

          <div className="login-divider">or</div>

          <div className="login-bottom-btns">
            <button className="btn-secondary" onClick={() => alert("Registration feature coming soon!")}>Register</button>
            <button className="btn-secondary" onClick={() => alert("Agent Login feature coming soon!")}>Agent Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}