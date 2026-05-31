import React, { useState, useEffect } from 'react';
import { backendSim } from '../utils/simulatedBackend';
import type { SimCheckIn } from '../utils/simulatedBackend';
import { 
  Award, Calendar, Activity, Clock, LogOut, 
  CheckCircle, TrendingDown 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MemberDashboardProps {
  onLogout: () => void;
}

interface ClassSlot {
  id: number;
  name: string;
  trainer: string;
  time: string;
  available: number;
  booked?: boolean;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ onLogout }) => {
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [bmiHistory, setBmiHistory] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassSlot[]>([]);
  const [userLogs, setUserLogs] = useState<SimCheckIn[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'booking' | 'logs'>('overview');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hoveredBmi, setHoveredBmi] = useState<any | null>(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const token = localStorage.getItem('auth_token') || '';

  const loadData = async () => {
    try {
      let data;
      if (backendSim.getDbState().isLiveMode) {
        const res = await fetch('http://localhost:8000/api/member/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        data = await res.json();
      } else {
        data = await backendSim.handleRequest('GET', '/api/member/dashboard', null, {
          'Authorization': `Bearer ${token}`
        });
      }

      setPackageInfo(data.package);
      setBmiHistory(data.bmi_history);
      
      // Seed class slots if empty in state
      if (classes.length === 0) {
        setClasses(data.class_slots);
      }

      // Load check-in history for this member
      const dbState = backendSim.getDbState();
      const myLogs = dbState.checkIns.filter((log: SimCheckIn) => log.member_id === user.id);
      setUserLogs(myLogs);

    } catch (err: any) {
      console.error(err);
      setFeedback('Error loading portal dashboard.');
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = backendSim.registerListener(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  const handleBookClass = async (classId: number) => {
    setFeedback(null);
    try {
      let data;
      if (backendSim.getDbState().isLiveMode) {
        const res = await fetch(`http://localhost:8000/api/classes/${classId}/book`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Booking update failed.');
        }
        data = await res.json();
      } else {
        data = await backendSim.handleRequest('POST', `/api/classes/${classId}/book`, null, {
          'Authorization': `Bearer ${token}`
        });
      }

      setFeedback(data.message || 'Class registration status updated successfully.');
      setTimeout(() => setFeedback(null), 3000);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFeedback(err.message || 'Failed to update class registration.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleLogoutClick = () => {
    // Fire API request to logout in the background
    if (backendSim.getDbState().isLiveMode) {
      fetch('http://localhost:8000/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(err => console.error('Live API logout failed:', err));
    } else {
      backendSim.handleRequest('POST', '/api/logout', null, {
        'Authorization': `Bearer ${token}`
      }).catch(err => console.error('Simulated API logout failed:', err));
    }

    // Immediately clear local authentication state and redirect
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    onLogout();
    navigate('/login');
  };

  if (!packageInfo) {
    return <div className="portal-loading">Loading ironpulse portal dashboard...</div>;
  }

  // Calculate SVG Chart dimensions
  const svgWidth = 460;
  const svgHeight = 150;
  const chartPadding = 25;
  const chartWidth = svgWidth - chartPadding * 2;
  const chartHeight = svgHeight - chartPadding * 2;
  
  // Find min/max BMI to scale graph
  const bmiValues = bmiHistory.map(b => b.bmi);
  const minBmi = Math.min(...bmiValues) - 0.5;
  const maxBmi = Math.max(...bmiValues) + 0.5;
  const bmiRange = maxBmi - minBmi;

  // Generate SVG coordinates
  const points = bmiHistory.map((item, idx) => {
    const x = chartPadding + (idx / (bmiHistory.length - 1)) * chartWidth;
    const y = chartPadding + (1 - (item.bmi - minBmi) / bmiRange) * chartHeight;
    return { x, y, label: item.date, val: item.bmi };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, '');

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-glow">
            <Activity size={22} className="text-green-400" />
          </div>
          <span>IRONPULSE</span>
        </div>

        <div className="sidebar-user-card">
          <img src={user.profile_photo || 'https://i.pravatar.cc/150'} alt="User" />
          <div className="user-details">
            <h4>{user.name}</h4>
            <span className="badge-role member uppercase">{user.role}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={16} />
            Member Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            <Calendar size={16} />
            Class Bookings
          </button>
          <button 
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Clock size={16} />
            Check-In History
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="kiosk-shortcut-btn border-green" onClick={() => navigate('/kiosk')} title="Launch self-check-in terminal">
            <Award size={14} className="text-green-400" />
            Kiosk Terminal
          </button>
          <button className="logout-btn" onClick={handleLogoutClick}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Welcome Back, {user.name.split(' ')[0]}!</h1>
            <p className="header-subtitle">Your fitness analytics & booking center</p>
          </div>
          <div className="header-actions">
            <div className="datetime-widget border-green">
              <Clock size={14} className="text-green-400" />
              <span>Checked in today: {userLogs.length > 0 && new Date(userLogs[0].timestamp).toDateString() === new Date().toDateString() ? 'Logged' : 'Pending'}</span>
            </div>
          </div>
        </header>

        {feedback && (
          <div className="feedback-alert success">
            <CheckCircle size={16} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tab layouts */}
        {activeTab === 'overview' && (
          <div className="dashboard-grid">
            {/* Left Side: Membership status & BMI */}
            <div className="space-y-6">
              {/* Package card */}
              <div className="panel package-status-panel">
                <div className="panel-header">
                  <h2>Active Gym Package</h2>
                  <span className={`status-badge ${packageInfo.status.toLowerCase()}`}>{packageInfo.status}</span>
                </div>

                <div className="package-status-body">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3>{packageInfo.name}</h3>
                      <p className="subtext mt-1">Expires: {packageInfo.expires_at}</p>
                    </div>
                    <div className="days-counter-circle">
                      <span className="count">{packageInfo.days_left}</span>
                      <span className="unit">Days Left</span>
                    </div>
                  </div>

                  <div className="package-progress-bar">
                    <div 
                      className={`fill ${packageInfo.status === 'Active' ? 'active' : packageInfo.status === 'Suspended' ? 'suspended' : 'expired'}`}
                      style={{ width: `${Math.min(100, (packageInfo.days_left / 90) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                    <span>Expired</span>
                    <span>90 Days Standard Cycle</span>
                  </div>
                </div>
              </div>

              {/* BMI graph panel */}
              <div className="panel bmi-panel-chart">
                <div className="panel-header">
                  <h2>Body Mass Index (BMI) Analytics</h2>
                  <span className="tag green-glow"><TrendingDown size={11} /> Healthy Trend</span>
                </div>
                <p className="section-desc">Track weight loss progress. Hover points to inspect metrics.</p>

                <div className="bmi-graph-container relative flex items-center justify-center p-2">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="bmi-svg-chart">
                    {/* Grid lines */}
                    <line x1={chartPadding} y1={chartPadding} x2={svgWidth - chartPadding} y2={chartPadding} stroke="#2e303a" strokeWidth="1" strokeDasharray="3" />
                    <line x1={chartPadding} y1={svgHeight - chartPadding} x2={svgWidth - chartPadding} y2={svgHeight - chartPadding} stroke="#2e303a" strokeWidth="1" />
                    
                    {/* Line path */}
                    <path d={pathD} fill="none" stroke="url(#greenGradient)" strokeWidth="3" />

                    {/* Gradient under line */}
                    <path 
                      d={`${pathD} L ${points[points.length - 1].x} ${svgHeight - chartPadding} L ${points[0].x} ${svgHeight - chartPadding} Z`} 
                      fill="url(#areaGradient)" 
                    />

                    {/* Nodes */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r={hoveredBmi?.idx === idx ? 6 : 4} 
                          fill="#4ade80" 
                          stroke="#16171d" 
                          strokeWidth="2"
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredBmi({ idx, ...p })}
                          onMouseLeave={() => setHoveredBmi(null)}
                        />
                        <text x={p.x} y={svgHeight - 8} textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">
                          {p.label}
                        </text>
                      </g>
                    ))}

                    {/* Gradients definitions */}
                    <defs>
                      <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#4ade80" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Tooltip Overlay */}
                  {hoveredBmi && (
                    <div 
                      className="absolute bmi-tooltip"
                      style={{ 
                        left: `${(hoveredBmi.x / svgWidth) * 100}%`, 
                        top: `${(hoveredBmi.y / svgHeight) * 100 - 30}%`
                      }}
                    >
                      <span className="weight-tag">{hoveredBmi.val} BMI</span>
                      <span className="date-tag">{hoveredBmi.label}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 border-t border-gray-800 pt-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="bullet green"></div>
                    <span className="text-gray-400">Target Goal: 23.5 BMI</span>
                  </div>
                  <span className="font-semibold text-gray-200">Current: {bmiValues[bmiValues.length - 1]} BMI</span>
                </div>
              </div>
            </div>

            {/* Right Side: Quick Class reservation */}
            <div className="panel classes-preview-panel">
              <div className="panel-header">
                <h2>Today's Class Schedule</h2>
                <span className="tag">Quick Booking</span>
              </div>

              <div className="classes-grid-scroll space-y-4 mt-4">
                {classes.map(cls => (
                  <div key={cls.id} className={`class-schedule-card ${cls.booked ? 'booked' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3>{cls.name}</h3>
                        <p className="instructor">Trainer: {cls.trainer}</p>
                      </div>
                      <span className="class-time-tag">
                        <Clock size={11} />
                        {cls.time}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-800">
                      <span className="spots-counter text-xs text-gray-400">
                        {cls.booked ? (
                          <span className="text-green-400 font-semibold">✓ Registered</span>
                        ) : (
                          <span>{cls.available} spots left</span>
                        )}
                      </span>
                      <button 
                        className={`book-inner-btn ${cls.booked ? 'cancel' : 'book'}`}
                        onClick={() => handleBookClass(cls.id)}
                        disabled={cls.available === 0 && !cls.booked}
                      >
                        {cls.booked ? 'Cancel Booking' : cls.available === 0 ? 'Fully Booked' : 'Reserve Spot'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'booking' && (
          <div className="panel booking-expanded-panel">
            <div className="panel-header">
              <h2>Reserve Group Training Slots</h2>
              <span className="tag">Laravel API integration</span>
            </div>
            <p className="section-desc">Register for specialized slots. Actions require Sanctum authentication scope abilities.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {classes.map(cls => (
                <div key={cls.id} className={`class-schedule-card ${cls.booked ? 'booked' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="category-badge">CROSSFIT & POWER</span>
                      <h3 className="text-base font-semibold mt-1.5">{cls.name}</h3>
                      <p className="instructor mt-1">Instructor: {cls.trainer}</p>
                    </div>
                    <span className="class-time-tag">
                      <Clock size={11} />
                      {cls.time}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-800">
                    <div className="text-xs text-gray-400">
                      {cls.booked ? (
                        <span className="text-green-400 font-semibold flex items-center gap-1">
                          <CheckCircle size={12} /> Booking confirmed
                        </span>
                      ) : (
                        <span>Available Capacity: <span className="font-semibold text-white">{cls.available}</span></span>
                      )}
                    </div>
                    <button 
                      className={`book-inner-btn ${cls.booked ? 'cancel' : 'book'}`}
                      onClick={() => handleBookClass(cls.id)}
                      disabled={cls.available === 0 && !cls.booked}
                    >
                      {cls.booked ? 'Cancel Booking' : cls.available === 0 ? 'Fully Booked' : 'Book Session'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="panel checkins-history-panel">
            <div className="panel-header">
              <h2>My Check-in Log History</h2>
              <span className="tag">{userLogs.length} total entries</span>
            </div>
            <p className="section-desc">Audit trail of your gym visits logged by staff or via the self-service kiosk.</p>

            <div className="logs-table-wrapper mt-6">
              <table className="logs-history-table font-mono text-xs">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Entry Point / Authorization</th>
                  </tr>
                </thead>
                <tbody>
                  {userLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-500 py-6 italic">No attendance records found for your account.</td>
                    </tr>
                  ) : (
                    userLogs.map((log) => {
                      const logDate = new Date(log.timestamp);
                      return (
                        <tr key={log.id}>
                          <td>#{log.id}</td>
                          <td>{logDate.toLocaleDateString()}</td>
                          <td>{logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="text-white font-semibold">{log.checked_in_by}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
