import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Wind } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import './LoginView.css';

export default function LoginView({ onBack, onAuthenticated, session }) {
  const [mode, setMode] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  const showMessage = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/${mode === 'signup' ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('The authentication service returned an invalid response.');
      }
      if (!response.ok) {
        const detail = typeof result?.detail === 'string'
          ? result.detail
          : Array.isArray(result?.detail)
            ? result.detail.map((issue) => issue.msg).filter(Boolean).join(' ')
            : '';
        throw new Error(detail || `Authentication failed (HTTP ${response.status}).`);
      }
      if (typeof result?.user?.email !== 'string') {
        throw new Error('The authentication service returned an incomplete user session.');
      }
      onAuthenticated({ user: result.user });
      showMessage(mode === 'signup' ? 'Your account is ready.' : 'You are signed in.', 'success');
    } catch (error) {
      showMessage(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-page" aria-labelledby="login-title">
      <div className="login-story">
        <div className="login-story-topline">
          <span className="login-live-dot" />
          <span>ENVIRONMENTAL INTELLIGENCE</span>
          <span className="login-story-index">01 / 04</span>
        </div>

        <div className="login-story-copy">
          <p className="login-eyebrow">AEROVISION · INDIA</p>
          <h2>Know the air.<br />Move with clarity.</h2>
          <p className="login-story-description">
            A grounded view of air quality, built from real pollutant measurements and machine learning.
          </p>
        </div>

        <div className="login-signal" aria-label="Illustration of changing air quality readings">
          <div className="login-signal-heading">
            <span>ATMOSPHERIC SIGNAL</span>
            <span>LIVE MODEL</span>
          </div>
          <div className="login-signal-chart" aria-hidden="true">
            {[36, 52, 42, 69, 48, 78, 59, 88, 65, 74, 51, 68, 44, 60, 39, 55, 31, 46, 35, 50].map((height, index) => (
              <span key={index} style={{ '--bar-height': `${height}%` }} />
            ))}
          </div>
          <div className="login-signal-axis"><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span></div>
        </div>

        <div className="login-story-footer">
          <span>26 monitored cities</span>
          <span className="login-footer-divider" />
          <span>Daily air quality insights</span>
        </div>
      </div>

      <div className="login-form-panel">
        <button type="button" className="login-back-button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to AeroVision</span>
        </button>

        <div className="login-form-content">
          <div className="login-mark" aria-hidden="true"><Wind size={19} /></div>
          <p className="login-eyebrow">YOUR AIR QUALITY WORKSPACE</p>
          <h1 id="login-title">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
          <p className="login-form-intro">
            {mode === 'signup' ? 'Create an account to access your dashboard.' : 'Sign in to continue to your dashboard.'}
          </p>

          {session && (
            <div className="login-session-notice">
              <span>Signed in as {session.user.email}</span>
              <button type="button" className="login-text-button" onClick={onBack}>Continue</button>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              maxLength={320}
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <div className="login-password-label">
              <label htmlFor="login-password">Password</label>
              <span className="login-password-hint">8 to 128 characters</span>
            </div>
            <div className="login-password-input">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                maxLength={128}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="Enter your password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="login-reveal-button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button className="login-submit" type="submit" disabled={isLoading}>
              <span>{isLoading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}</span>
              <ArrowUpRight size={17} />
            </button>
          </form>

          <p className={`login-message login-message-${messageType}`} role="status" aria-live="polite">{message}</p>

          <div className="login-signup">
            <span>{mode === 'signup' ? 'Already have an account?' : 'New to AeroVision?'}</span>
            <button
              type="button"
              className="login-text-button"
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setMessage('');
              }}
            >
              {mode === 'signup' ? 'Sign in' : 'Create account'}
            </button>
          </div>
          <p className="login-privacy-note">Forgot your password? Password recovery is not configured yet.</p>
        </div>

        <div className="login-panel-footer">
          <span>© 2026 AeroVision</span>
          <span>Air quality, made visible.</span>
        </div>
      </div>
    </section>
  );
}