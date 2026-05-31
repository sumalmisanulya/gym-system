import React, { useState, useEffect } from 'react';
import { backendSim } from '../utils/simulatedBackend';
import type { SimUser, SimCheckIn } from '../utils/simulatedBackend';
import { 
  Users, Search, CheckCircle, AlertOctagon, Clock, LogOut, 
  Settings, TrendingUp, Bell, Shield, Lock, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardProps {
  onLogout: () => void;
  defaultTab?: 'checkin' | 'packages' | 'billing' | 'members_list';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, defaultTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<SimUser[]>([]);
  const [checkIns, setCheckIns] = useState<SimCheckIn[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [currentTab, setCurrentTab] = useState<'checkin' | 'packages' | 'billing' | 'members_list'>(defaultTab || 'checkin');

  // Member editing states
  const [editingMember, setEditingMember] = useState<SimUser | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    membership_status: 'Active' as 'Active' | 'Suspended' | 'Expired',
    days_left: 0
  });

  // Member creation states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    membership_status: 'Active' as 'Active' | 'Suspended' | 'Expired',
    days_left: 30
  });

  // Autocomplete suggestion states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'checkin' | 'members_list' | null>(null);

  // Filter suggestions from all members in the database
  const allDbMembers = backendSim.getDbState().users.filter(u => u.role === 'member');
  const suggestions = searchQuery.trim() 
    ? allDbMembers.filter(m => 
        (
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.id.toString().includes(searchQuery.trim()) ||
          m.id.toString().padStart(5, '0').includes(searchQuery.trim()) ||
          (m.phone && m.phone.includes(searchQuery.trim()))
        ) && 
        m.name.toLowerCase() !== searchQuery.trim().toLowerCase()
      ).slice(0, 5)
    : [];

  const handleEditClick = (member: SimUser) => {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      membership_status: member.membership_status || 'Active',
      days_left: member.days_left !== undefined ? member.days_left : (backendSim.getDbState().users.find(u => u.id === member.id)?.days_left ?? 0)
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      if (backendSim.getDbState().isLiveMode) {
        const res = await fetch(`http://localhost:8000/api/members/${editingMember.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(editForm)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to update member.');
        }
      } else {
        await backendSim.handleRequest('PUT', `/api/members/${editingMember.id}`, editForm, {
          'Authorization': `Bearer ${token}`
        });
      }

      setFeedback({ type: 'success', message: `Successfully updated member: ${editForm.name}` });
      setEditingMember(null);
      loadData();
      
      // Auto clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save changes.' });
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (backendSim.getDbState().isLiveMode) {
        const res = await fetch('http://localhost:8000/api/members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(addForm)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to create member.');
        }
      } else {
        await backendSim.handleRequest('POST', '/api/members', addForm, {
          'Authorization': `Bearer ${token}`
        });
      }

      setFeedback({ type: 'success', message: `Successfully registered member: ${addForm.name}` });
      setShowAddModal(false);
      setAddForm({
        name: '',
        email: '',
        phone: '',
        membership_status: 'Active',
        days_left: 30
      });
      loadData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create member.' });
    }
  };

  useEffect(() => {
    if (defaultTab) {
      setCurrentTab(defaultTab);
    }
  }, [defaultTab]);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const token = localStorage.getItem('auth_token') || '';

  // Load database lists
  const loadData = async () => {
    try {
      if (backendSim.getDbState().isLiveMode) {
        // Real API call simulation
        const mRes = await fetch(`http://localhost:8000/api/members?query=${searchQuery}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const mData = await mRes.json();
        setMembers(mData.members || []);

        const cRes = await fetch('http://localhost:8000/api/check-ins', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const cData = await cRes.json();
        setCheckIns(cData.check_ins || []);
      } else {
        // Simulated API call
        const mData = await backendSim.handleRequest('GET', `/api/members?query=${searchQuery}`, null, {
          'Authorization': `Bearer ${token}`
        });
        setMembers(mData.members);

        const cData = await backendSim.handleRequest('GET', '/api/check-ins', null, {
          'Authorization': `Bearer ${token}`
        });
        setCheckIns(cData.check_ins);
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Error loading dashboard data.' });
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = backendSim.registerListener(() => {
      loadData();
    });
    return unsubscribe;
  }, [searchQuery]);

  const handleCheckIn = async (memberId: number, name: string) => {
    setFeedback(null);
    try {
      let res;
      if (backendSim.getDbState().isLiveMode) {
        res = await fetch(`http://localhost:8000/api/members/${memberId}/check-in`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Check-in failed');
        }
      } else {
        res = await backendSim.handleRequest('POST', `/api/members/${memberId}/check-in`, null, {
          'Authorization': `Bearer ${token}`
        });
      }

      setFeedback({ 
        type: 'success', 
        message: `Successfully checked in member: ${name}` 
      });
      
      // Auto clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
      loadData();
    } catch (err: any) {
      setFeedback({ 
        type: 'error', 
        message: err.message || 'Failed to check in member.' 
      });
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

  // Compute stat metrics
  const activeMembersCount = backendSim.getDbState().users.filter(u => u.role === 'member' && u.membership_status === 'Active').length;
  const expiredMembersCount = backendSim.getDbState().users.filter(u => u.role === 'member' && u.membership_status === 'Expired').length;
  const suspendedMembersCount = backendSim.getDbState().users.filter(u => u.role === 'member' && u.membership_status === 'Suspended').length;
  const todayCheckInsCount = checkIns.length;

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-glow">
            <Users size={22} className="text-purple-400" />
          </div>
          <span>IRONPULSE</span>
        </div>

        <div className="sidebar-user-card">
          <img src={user.profile_photo || 'https://i.pravatar.cc/150'} alt="User" />
          <div className="user-details">
            <h4>{user.name}</h4>
            <span className="badge-role uppercase">{user.role}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentTab === 'checkin' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('checkin');
              navigate('/admin/dashboard');
            }}
          >
            <CheckCircle size={16} />
            Check-In Counter
          </button>
          <button 
            className={`nav-item ${currentTab === 'members_list' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('members_list');
              navigate('/admin/members');
            }}
          >
            <Users size={16} />
            Member Directory
          </button>
          <button 
            className={`nav-item ${currentTab === 'packages' ? 'active' : ''}`}
            onClick={() => setCurrentTab('packages')}
          >
            <Settings size={16} />
            Membership Packages
          </button>
          <button 
            className={`nav-item ${currentTab === 'billing' ? 'active' : ''}`}
            onClick={() => setCurrentTab('billing')}
          >
            <TrendingUp size={16} />
            Club Analytics
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="kiosk-shortcut-btn" onClick={() => navigate('/kiosk')} title="Open specialized kiosk login portal">
            <Award size={14} />
            Launch Kiosk Mode
          </button>
          <button className="logout-btn" onClick={handleLogoutClick}>
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1>Front-Desk Attendance Terminal</h1>
            <p className="header-subtitle">Scan, audit, and log members arriving at the club</p>
          </div>
          <div className="header-actions">
            <div className="datetime-widget">
              <Clock size={14} />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="notification-icon">
              <Bell size={18} />
              <span className="dot"></span>
            </div>
          </div>
        </header>

        {/* Top Stats Strip */}
        <section className="stats-strip">
          <div className="stat-card">
            <div className="stat-icon-wrapper checkin">
              <CheckCircle size={20} />
            </div>
            <div className="stat-info">
              <span className="label">Checked In Today</span>
              <h3>{todayCheckInsCount}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper active">
              <Users size={20} />
            </div>
            <div className="stat-info">
              <span className="label">Active Members</span>
              <h3>{activeMembersCount}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper suspended">
              <AlertOctagon size={20} />
            </div>
            <div className="stat-info">
              <span className="label">Suspended</span>
              <h3>{suspendedMembersCount}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper expired">
              <AlertOctagon size={20} />
            </div>
            <div className="stat-info">
              <span className="label">Expired Packages</span>
              <h3>{expiredMembersCount}</h3>
            </div>
          </div>
        </section>

        {/* Tab Layouts */}
        {feedback && (
          <div className={`feedback-alert ${feedback.type}`}>
            {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertOctagon size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {currentTab === 'checkin' && (
          <div className="dashboard-grid">
            {/* Search and Check-In Panel */}
            <div className="panel search-panel">
              <div className="panel-header">
                <h2>Real-Time Directory Search</h2>
                <span className="tag">Live Filter</span>
              </div>

              <div className="search-bar-input">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Filter by name, email, phone or membership ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    setFocusedInput('checkin');
                    setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
                {showSuggestions && focusedInput === 'checkin' && suggestions.length > 0 && (
                  <div className="search-suggestions-dropdown">
                    {suggestions.map((member) => (
                      <div 
                        key={member.id} 
                        className="suggestion-item" 
                        onMouseDown={() => {
                          setSearchQuery(member.name);
                          setShowSuggestions(false);
                        }}
                      >
                        <img 
                          src={member.profile_photo} 
                          alt={member.name} 
                          style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div className="flex flex-col text-left" style={{ marginLeft: '8px' }}>
                          <span className="name" style={{ fontSize: '11px', fontWeight: 600, color: 'white' }}>{member.name}</span>
                          <span className="email" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{member.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="members-results-list">
                {members.length === 0 ? (
                  <div className="empty-results">
                    <Search size={28} className="text-gray-600 mb-2" />
                    <p>No members match your criteria.</p>
                  </div>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="member-row-card">
                      <div className="member-avatar">
                        <img src={member.profile_photo} alt={member.name} />
                      </div>
                      <div className="member-meta">
                        <h4>{member.name}</h4>
                        <span className="member-id">ID: #{member.id.toString().padStart(5, '0')}</span>
                        <div className="member-contact">
                          <span>{member.email}</span>
                          <span className="divider">•</span>
                          <span>{member.phone}</span>
                        </div>
                      </div>
                      <div className="member-actions">
                        <span className={`status-badge ${member.membership_status?.toLowerCase()}`}>
                          {member.membership_status}
                        </span>
                        <button
                          className="btn-checkin"
                          disabled={member.membership_status !== 'Active'}
                          onClick={() => handleCheckIn(member.id, member.name)}
                        >
                          Check In
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Attendance Ticker */}
            <div className="panel ticker-panel">
              <div className="panel-header">
                <h2>Attendance Logs Ticker</h2>
                <span className="counter-badge">{checkIns.length}</span>
              </div>

              <div className="ticker-history-list">
                {checkIns.length === 0 ? (
                  <div className="empty-ticker">
                    <Clock size={28} className="text-gray-600 mb-2" />
                    <p>No check-ins logged for today yet.</p>
                  </div>
                ) : (
                  checkIns.map((log) => (
                    <div key={log.id} className="ticker-log-card">
                      <div className="ticker-marker"></div>
                      <div className="ticker-info">
                        <div className="flex justify-between items-start">
                          <h4>{log.member_name}</h4>
                          <span className="time-tag">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="subtext">{log.member_email}</p>
                        <p className="authorized-by">Authorized by: <span>{log.checked_in_by}</span></p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'packages' && (
          <div className="panel packages-panel">
            <div className="panel-header">
              <h2>Membership Package Configurator</h2>
              {user.role === 'admin' ? (
                <span className="security-tag admin">
                  <Shield size={12} /> Admin Mode
                </span>
              ) : (
                <span className="security-tag staff">
                  <Lock size={12} /> Staff (Read-Only)
                </span>
              )}
            </div>

            <p className="section-desc">Manage standard club passes, pricing variables, and Sanctum security scopes limits.</p>

            <div className="packages-grid">
              <div className="package-card">
                <div className="package-icon elite">
                  <Award size={20} />
                </div>
                <h3>Standard Access Pass</h3>
                <div className="price-tag">$49<span>/mo</span></div>
                <ul className="package-features">
                  <li>Full Access to Gym Floor</li>
                  <li>Locker Room & Sauna access</li>
                  <li>Simulated Scope: <code>view-profile</code></li>
                </ul>
                <button className="package-edit-btn" disabled={user.role !== 'admin'}>
                  {user.role === 'admin' ? 'Edit Package Configurations' : 'Requires Admin Rights'}
                </button>
              </div>

              <div className="package-card featured">
                <div className="package-badge">POPULAR</div>
                <div className="package-icon premium">
                  <Award size={20} />
                </div>
                <h3>Premium Elite Club Pass</h3>
                <div className="price-tag">$89<span>/mo</span></div>
                <ul className="package-features">
                  <li>24/7 Club Access</li>
                  <li>Unlimited Yoga and HIIT classes</li>
                  <li>Simulated Scope: <code>book-classes</code></li>
                </ul>
                <button className="package-edit-btn" disabled={user.role !== 'admin'}>
                  {user.role === 'admin' ? 'Edit Package Configurations' : 'Requires Admin Rights'}
                </button>
              </div>

              <div className="package-card">
                <div className="package-icon VIP">
                  <Award size={20} />
                </div>
                <h3>VIP Training Suite Pass</h3>
                <div className="price-tag">$199<span>/mo</span></div>
                <ul className="package-features">
                  <li>Includes 1-on-1 Personal Trainer</li>
                  <li>Custom Nutrition Planner access</li>
                  <li>Simulated Scope: <code>update-workouts</code></li>
                </ul>
                <button className="package-edit-btn" disabled={user.role !== 'admin'}>
                  {user.role === 'admin' ? 'Edit Package Configurations' : 'Requires Admin Rights'}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'billing' && (
          <div className="panel billing-panel">
            <div className="panel-header">
              <h2>Club Metrics & Analytics</h2>
              <span className="tag">Real-Time Sync</span>
            </div>

            <div className="analytics-metrics-cards">
              <div className="metric-mini-card">
                <span className="mini-label">Monthly Recurring Revenue</span>
                <h4>$24,850</h4>
                <span className="trend positive"><TrendingUp size={12} /> +8.4%</span>
              </div>
              <div className="metric-mini-card">
                <span className="mini-label">Average Weekly Capacity</span>
                <h4>72%</h4>
                <span className="trend positive"><TrendingUp size={12} /> +2.1%</span>
              </div>
              <div className="metric-mini-card">
                <span className="mini-label">Active Sanctum API Clients</span>
                <h4>{backendSim.getDbState().tokens.length}</h4>
                <span className="trend font-mono">Tokens Active</span>
              </div>
            </div>

            {/* Peak Hours visualizer */}
            <div className="peak-hours-graph mt-6">
              <h3>Peak Traffic Hours Today</h3>
              <div className="hours-bars">
                {[
                  { hour: '6 AM', val: 30 },
                  { hour: '8 AM', val: 85 },
                  { hour: '10 AM', val: 50 },
                  { hour: '12 PM', val: 40 },
                  { hour: '2 PM', val: 25 },
                  { hour: '4 PM', val: 65 },
                  { hour: '6 PM', val: 95 },
                  { hour: '8 PM', val: 70 },
                  { hour: '10 PM', val: 20 },
                ].map((item, idx) => (
                  <div key={idx} className="hour-bar-col">
                    <div className="bar-wrapper">
                      <div className="fill-bar" style={{ height: `${item.val}%` }}>
                        <span className="tooltip">{item.val}%</span>
                      </div>
                    </div>
                    <span className="hour-label">{item.hour}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'members_list' && (
          <div className="panel members-directory-panel animate-fadeIn">
            <div className="panel-header">
              <h2>Member Management Directory</h2>
              <div className="flex gap-2 items-center">
                <span className="tag">{members.length} members loaded</span>
                {user.role === 'admin' && (
                  <button 
                    className="login-submit-btn" 
                    style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px' }}
                    onClick={() => setShowAddModal(true)}
                  >
                    + Add New Member
                  </button>
                )}
              </div>
            </div>

            <p className="section-desc">Audit registered member databases, verify emails, or modify account state properties.</p>

            <div className="search-bar-input">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search member database by name, email, phone or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setFocusedInput('members_list');
                  setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
              />
              {showSuggestions && focusedInput === 'members_list' && suggestions.length > 0 && (
                <div className="search-suggestions-dropdown">
                  {suggestions.map((member) => (
                    <div 
                      key={member.id} 
                      className="suggestion-item" 
                      onMouseDown={() => {
                        setSearchQuery(member.name);
                        setShowSuggestions(false);
                      }}
                    >
                      <img 
                        src={member.profile_photo} 
                        alt={member.name} 
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div className="flex flex-col text-left" style={{ marginLeft: '8px' }}>
                        <span className="name" style={{ fontSize: '11px', fontWeight: 600, color: 'white' }}>{member.name}</span>
                        <span className="email" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{member.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="logs-table-wrapper mt-4">
              <table className="logs-history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Member Profile</th>
                    <th>Contact Info</th>
                    <th>Days Left</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-6 italic">No members found matching directory filter.</td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id}>
                        <td className="font-mono text-xs">#{member.id.toString().padStart(5, '0')}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <img 
                              src={member.profile_photo} 
                              alt={member.name} 
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} 
                            />
                            <span className="text-white font-semibold" style={{ marginLeft: '8px' }}>{member.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-200">{member.email}</span>
                            <span className="text-[10px] text-gray-500">{member.phone}</span>
                          </div>
                        </td>
                        <td className="font-mono text-xs">
                          {member.days_left !== undefined ? member.days_left : (backendSim.getDbState().users.find(u => u.id === member.id)?.days_left ?? 0)} Days
                        </td>
                        <td>
                          <span className={`status-badge ${member.membership_status?.toLowerCase()}`}>
                            {member.membership_status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="package-edit-btn"
                            disabled={user.role !== 'admin'}
                            onClick={() => handleEditClick(member)}
                            title={user.role === 'admin' ? 'Edit member details' : 'Requires Admin rights'}
                            style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignContent: 'center', gap: '4px' }}
                          >
                            {user.role === 'admin' ? (
                              <span>Edit Profile</span>
                            ) : (
                              <>
                                <Lock size={10} style={{ alignSelf: 'center' }} />
                                <span>Locked</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Edit Member Modal Overlay */}
      {editingMember && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Member Details</h3>
              <button className="modal-close" onClick={() => setEditingMember(null)}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="input-group-field">
                <label>Member Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="input-group-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="input-group-field">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="input-group-field">
                <label>Membership Status</label>
                <select
                  value={editForm.membership_status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, membership_status: e.target.value as any }))}
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div className="input-group-field">
                <label>Package Days Left</label>
                <input
                  type="number"
                  value={editForm.days_left}
                  onChange={(e) => setEditForm(prev => ({ ...prev, days_left: parseInt(e.target.value, 10) || 0 }))}
                  min="0"
                  required
                />
              </div>

              <div className="flex gap-4 items-center justify-end mt-4">
                <button 
                  type="button" 
                  className="kiosk-clear-btn" 
                  style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }} 
                  onClick={() => setEditingMember(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="login-submit-btn" style={{ padding: '10px 24px', fontSize: '0.85rem' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal Overlay */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Member</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateMember} className="modal-form">
              <div className="input-group-field">
                <label>Member Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="input-group-field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="input-group-field">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 018-999"
                  value={addForm.phone}
                  onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="input-group-field">
                <label>Membership Status</label>
                <select
                  value={addForm.membership_status}
                  onChange={(e) => setAddForm(prev => ({ ...prev, membership_status: e.target.value as any }))}
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div className="input-group-field">
                <label>Package Days Left</label>
                <input
                  type="number"
                  value={addForm.days_left}
                  onChange={(e) => setAddForm(prev => ({ ...prev, days_left: parseInt(e.target.value, 10) || 0 }))}
                  min="0"
                  required
                />
              </div>

              <div className="flex gap-4 items-center justify-end mt-4">
                <button 
                  type="button" 
                  className="kiosk-clear-btn" 
                  style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }} 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="login-submit-btn" style={{ padding: '10px 24px', fontSize: '0.85rem' }}>
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
