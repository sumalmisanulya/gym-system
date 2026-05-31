import React, { useState, useEffect } from 'react';
import { backendSim } from '../utils/simulatedBackend';
import { Dumbbell, CreditCard, CheckCircle, ShieldAlert, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const KioskMode: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Success state
  const [successInfo, setSuccessInfo] = useState<{
    memberName: string;
    profilePhoto: string;
    status: string;
    daysLeft: number;
  } | null>(null);

  const [countdown, setCountdown] = useState(4);

  const navigate = useNavigate();

  // Numeric keypad simulation
  const handleKeypadPress = (val: string) => {
    if (val === 'clear') {
      setEmail('');
      setPassword('');
      setError(null);
    } else {
      // Just helper: append to email if email not filled, or fill password
      if (!email.includes('@')) {
        setEmail(prev => prev + val);
      } else {
        setPassword(prev => prev + val);
      }
    }
  };

  const handleKioskLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccessInfo(null);

    try {
      let authData;
      if (backendSim.getDbState().isLiveMode) {
        // Live server API login
        const res = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Authentication failed.');
        }
        authData = await res.json();
      } else {
        // Simulated API login
        authData = await backendSim.handleRequest('POST', '/api/login', { email, password });
      }

      // Check if user is a member
      if (authData.user.role !== 'member') {
        throw new Error('Only members can check in via this kiosk terminal.');
      }

      // Automatically trigger self check-in
      const memberToken = authData.access_token;

      if (backendSim.getDbState().isLiveMode) {
        const cRes = await fetch(`http://localhost:8000/api/members/${authData.user.id}/check-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${memberToken}`
          }
        });
        if (!cRes.ok) {
          const errData = await cRes.json();
          throw new Error(errData.message || 'Check-in failed');
        }
      } else {
        await backendSim.handleRequest('POST', `/api/members/${authData.user.id}/check-in`, null, {
          'Authorization': `Bearer ${memberToken}`
        });
      }

      // Get Member object details from DB
      const dbState = backendSim.getDbState();
      const memberObj = dbState.users.find(u => u.id === authData.user.id);

      setSuccessInfo({
        memberName: authData.user.name,
        profilePhoto: memberObj?.profile_photo || 'https://i.pravatar.cc/150',
        status: memberObj?.membership_status || 'Active',
        daysLeft: memberObj?.days_left ?? 0
      });

      // Clear input fields
      setEmail('');
      setPassword('');
      setCountdown(4);

    } catch (err: any) {
      setError(err.message || 'Invalid credentials or access denied.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Member selector for testing
  const handleQuickKioskSelect = (memberEmail: string) => {
    setEmail(memberEmail);
    setPassword('password');
    setError(null);
  };

  // Countdown timer redirect effect
  useEffect(() => {
    if (!successInfo) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setSuccessInfo(null);
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [successInfo]);

  return (
    <div className="kiosk-container">
      {/* Return to Staff portal banner */}
      <div className="kiosk-nav-banner">
        <button className="back-portal-btn" onClick={() => navigate('/login')}>
          <ArrowLeft size={14} />
          Exit Kiosk Mode
        </button>
        <span className="kiosk-status-text">
          <ShieldCheck size={14} className="text-emerald-400 animate-pulse" />
          Kiosk Terminal Online
        </span>
      </div>

      <div className="kiosk-grid">
        {/* Left Side: Brand branding & card-swipe emulator */}
        <div className="kiosk-brand-panel">
          <div className="brand-logo-circle">
            <Dumbbell className="text-purple-400" size={48} />
          </div>
          <h1>IRONPULSE</h1>
          <p className="subtitle">SELF-SERVICE TERMINAL</p>

          <div className="swipe-card-box">
            <CreditCard size={48} className="swipe-icon animate-bounce" />
            <div className="swipe-reader-slot"></div>
            <p>Select a quick-fill card below to simulate key fob scanner swipe</p>
          </div>

          <div className="quick-kiosk-members mt-6">
            <span className="label">Tap fob to scan:</span>
            <div className="flex gap-2 justify-center flex-wrap mt-2">
              <button 
                className="fob-btn" 
                onClick={() => handleQuickKioskSelect('ethan@gym.com')}
                title="Active Member Card Fob"
              >
                Ethan Hunt (Active)
              </button>
              <button 
                className="fob-btn" 
                onClick={() => handleQuickKioskSelect('selena@gym.com')}
                title="Suspended Member Card Fob"
              >
                Selena Kyle (Suspended)
              </button>
              <button 
                className="fob-btn" 
                onClick={() => handleQuickKioskSelect('bruce@gym.com')}
                title="Expired Member Card Fob"
              >
                Bruce Wayne (Expired)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Keypad & Input Form / Success Screen */}
        <div className="kiosk-input-panel">
          {successInfo ? (
            <div className="kiosk-success-screen">
              <div className="success-icon-shield">
                <CheckCircle className="text-green-400 animate-scale" size={64} />
              </div>
              
              <h2>Access Granted!</h2>
              <p className="welcome-tag">Welcome back,</p>
              <h3>{successInfo.memberName}</h3>

              <div className="kiosk-member-profile-card">
                <img src={successInfo.profilePhoto} alt={successInfo.memberName} />
                <div className="details">
                  <span className={`status-badge ${successInfo.status.toLowerCase()}`}>{successInfo.status}</span>
                  <span className="days-left">{successInfo.daysLeft} Days Remaining</span>
                </div>
              </div>

              <div className="kiosk-motivation-quote">
                <p>"No shortcuts. Only sweat and consistency. Let's smash today's workout!"</p>
              </div>

              <div className="kiosk-cooldown-text">
                Resetting terminal in <span>{countdown}</span>...
              </div>
            </div>
          ) : (
            <div className="kiosk-form-wrapper">
              <h2>Self Check-In Login</h2>
              <p className="card-desc">Provide your gym credentials to log attendance entry</p>

              {error && (
                <div className="login-error-alert kiosk">
                  <ShieldAlert size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleKioskLogin} className="kiosk-form">
                <div className="input-group-field">
                  <label htmlFor="kiosk-email">Member Email Address</label>
                  <input
                    id="kiosk-email"
                    type="email"
                    placeholder="e.g. member@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group-field">
                  <label htmlFor="kiosk-password">Security Password</label>
                  <input
                    id="kiosk-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-4 items-center">
                  <button type="button" className="kiosk-clear-btn" onClick={() => handleKeypadPress('clear')}>
                    Clear
                  </button>
                  <button type="submit" className="kiosk-submit-btn" disabled={loading}>
                    {loading ? (
                      <span className="spinner-loader"></span>
                    ) : (
                      <>
                        Check In
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Numeric keypad layout */}
              <div className="kiosk-touch-keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '@gym.com', '0', 'clear'].map((keyVal, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`keypad-digit-btn ${keyVal === 'clear' || keyVal === '@gym.com' ? 'special' : ''}`}
                    onClick={() => {
                      if (keyVal === 'clear') {
                        handleKeypadPress('clear');
                      } else if (keyVal === '@gym.com') {
                        setEmail(prev => prev + '@gym.com');
                      } else {
                        // Append digit helper
                        if (!email.includes('@')) {
                          setEmail(prev => prev + keyVal);
                        } else {
                          setPassword(prev => prev + keyVal);
                        }
                      }
                    }}
                  >
                    {keyVal === 'clear' ? 'C' : keyVal}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
