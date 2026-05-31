import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendSim } from '../utils/simulatedBackend';
import { Lock, Mail, Dumbbell, ShieldAlert, ArrowRight, Shield } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (backendSim.getDbState().isLiveMode) {
        // Real server API call placeholder
        const res = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Login failed.');
        }
        const data = await res.json();
        if (data.user.role !== 'admin' && !(data.user.role === 'member' && data.user.membership_status === 'Active')) {
          throw new Error('Access Denied. Only Admins and Active Members are permitted access.');
        }
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      } else {
        // Simulator Mode
        const data = await backendSim.handleRequest('POST', '/api/login', { email, password });
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }

      onLoginSuccess();
      const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      
      // Redirect based on role
      if (storedUser.role === 'member') {
        navigate('/member/dashboard');
      } else if (storedUser.role === 'trainer') {
        navigate('/admin/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password');
    setError(null);
  };

  return (
    <div className="login-container">
      <div className="login-card-wrapper">
        <div className="login-branding">
          <div className="brand-icon-bg">
            <Dumbbell className="brand-logo-icon" size={32} />
          </div>
          <h1>IRONPULSE</h1>
          <p className="subtitle">Premium Club Management Portal</p>
        </div>

        <div className="login-card">
          <h2>Sign In to Gym Portal</h2>
          <p className="card-desc">Enter credentials or select a role profile below to preview dashboards.</p>

          {error && (
            <div className="login-error-alert">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group-field">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} />
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. receptionist@gym.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group-field">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <Lock size={16} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <span className="spinner-loader"></span>
              ) : (
                <>
                  Authenticate Token
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Selections */}
          <div className="quick-roles-section">
            <div className="section-divider">
              <span>Quick Role Selector</span>
            </div>
            <div className="quick-roles-grid" style={{ gridTemplateCols: 'repeat(2, 1fr)' }}>
              <button 
                type="button" 
                className={`quick-role-btn ${email === 'admin@gym.com' ? 'selected' : ''}`}
                onClick={() => handleQuickSelect('admin@gym.com')}
              >
                <Shield size={12} className="text-red-400" />
                <span>Admin</span>
              </button>
              <button 
                type="button" 
                className={`quick-role-btn ${email === 'ethan@gym.com' ? 'selected' : ''}`}
                onClick={() => handleQuickSelect('ethan@gym.com')}
              >
                <Shield size={12} className="text-green-400" />
                <span>Member (Active)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Protected by Laravel Sanctum Scoped Abilities. Mode: {backendSim.getDbState().isLiveMode ? 'Live Backend Client' : 'Simulated Sandbox'}</p>
        </div>
      </div>
    </div>
  );
};
