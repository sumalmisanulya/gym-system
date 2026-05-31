import React, { useState, useEffect } from 'react';
import { backendSim } from '../utils/simulatedBackend';
import type { SimLog, SimUser, SimCheckIn, SimToken } from '../utils/simulatedBackend';
import { Terminal, Database, Key, Play, RotateCcw, AlertTriangle, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';

interface DevTerminalProps {
  onStateChange?: () => void;
}

export const DevTerminal: React.FC<DevTerminalProps> = ({ onStateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'db_users' | 'db_checkins' | 'tokens'>('logs');
  const [dbState, setDbState] = useState(backendSim.getDbState());

  useEffect(() => {
    const unsubscribe = backendSim.registerListener(() => {
      setDbState(backendSim.getDbState());
      if (onStateChange) onStateChange();
    });
    return unsubscribe;
  }, [onStateChange]);

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the database and logs?')) {
      backendSim.resetDatabase();
    }
  };

  const handleCron = () => {
    backendSim.runCronScheduler();
  };

  const handleToggleMode = () => {
    backendSim.setLiveMode(!dbState.isLiveMode);
  };

  const getLogColor = (type: SimLog['type']) => {
    switch (type) {
      case 'HTTP': return 'text-purple-400';
      case 'SQL': return 'text-yellow-400';
      case 'MIDDLEWARE': return 'text-cyan-400';
      case 'AUTH': return 'text-green-400';
      case 'SCHEDULER': return 'text-red-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className={`dev-terminal-container ${isOpen ? 'open' : 'closed'}`}>
      {/* Toggle Button */}
      <button 
        className="dev-terminal-toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Developer Panel"
      >
        <span className="flex items-center gap-2 font-mono text-xs font-semibold">
          <Terminal size={14} className="animate-pulse" />
          LARAVEL SANCTUM & MYSQL ENGINE SIMULATOR
          {dbState.isLiveMode ? (
            <span className="mode-badge live">LIVE API</span>
          ) : (
            <span className="mode-badge simulated">SIMULATED</span>
          )}
        </span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {isOpen && (
        <div className="dev-terminal-body">
          {/* Header Controls */}
          <div className="dev-terminal-controls">
            <div className="flex gap-2">
              <button 
                className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                <Terminal size={12} />
                Server Logs
              </button>
              <button 
                className={`tab-btn ${activeTab === 'db_users' ? 'active' : ''}`}
                onClick={() => setActiveTab('db_users')}
              >
                <Database size={12} />
                users Table
              </button>
              <button 
                className={`tab-btn ${activeTab === 'db_checkins' ? 'active' : ''}`}
                onClick={() => setActiveTab('db_checkins')}
              >
                <Database size={12} />
                check_ins Table
              </button>
              <button 
                className={`tab-btn ${activeTab === 'tokens' ? 'active' : ''}`}
                onClick={() => setActiveTab('tokens')}
              >
                <Key size={12} />
                Sanctum Tokens
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <button className="ctrl-btn cron" onClick={handleCron} title="Simulate Daily Midnight Cron Scheduler">
                <Play size={11} />
                Trigger Midnight Cron
              </button>
              <button className="ctrl-btn reset" onClick={handleReset} title="Reset In-Memory DB to initial seed">
                <RotateCcw size={11} />
                Reset DB
              </button>
              <button 
                className={`ctrl-btn mode-toggle ${dbState.isLiveMode ? 'live' : ''}`} 
                onClick={handleToggleMode}
                title="Toggle between simulating API or sending real fetch requests"
              >
                <ShieldCheck size={11} />
                {dbState.isLiveMode ? 'Switch to Simulation' : 'Switch to Live API'}
              </button>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="dev-terminal-content font-mono text-xs">
            {activeTab === 'logs' && (
              <div className="logs-view">
                {dbState.logs.length === 0 ? (
                  <div className="text-gray-500 italic p-4 text-center">No server logs yet. Try logging in or checking in.</div>
                ) : (
                  dbState.logs.map(log => (
                    <div key={log.id} className="log-line">
                      <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                      <span className={`font-bold mr-2 ${getLogColor(log.type)}`}>[{log.type}]</span>
                      <span className="text-gray-100">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'db_users' && (
              <div className="table-view">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>id</th>
                      <th>name</th>
                      <th>email</th>
                      <th>role</th>
                      <th>membership_status</th>
                      <th>days_left</th>
                      <th>phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbState.users.map((u: SimUser) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td className="text-white font-semibold">{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className={`badge-role ${u.role}`}>{u.role}</span></td>
                        <td>
                          {u.membership_status ? (
                            <span className={`status-badge ${u.membership_status.toLowerCase()}`}>
                              {u.membership_status}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td>{u.days_left !== undefined ? `${u.days_left} d` : '-'}</td>
                        <td>{u.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'db_checkins' && (
              <div className="table-view">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>id</th>
                      <th>member_id</th>
                      <th>member_name</th>
                      <th>checked_in_by</th>
                      <th>created_at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbState.checkIns.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-500 py-4 italic">check_ins table is empty.</td>
                      </tr>
                    ) : (
                      dbState.checkIns.map((c: SimCheckIn) => (
                        <tr key={c.id}>
                          <td>{c.id}</td>
                          <td>{c.member_id}</td>
                          <td className="text-white">{c.member_name}</td>
                          <td>{c.checked_in_by}</td>
                          <td className="text-gray-400">{new Date(c.timestamp).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'tokens' && (
              <div className="tokens-view">
                {dbState.tokens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
                    <AlertTriangle size={24} className="mb-2 text-yellow-500" />
                    <span>No active Laravel Sanctum sessions in memory.</span>
                    <span className="text-[10px] mt-1 text-gray-600">Tokens are generated dynamically when users log in.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
                    {dbState.tokens.map((t: SimToken, idx) => {
                      const tokenUser = dbState.users.find(u => u.id === t.userId);
                      return (
                        <div key={idx} className="token-card">
                          <div className="flex justify-between items-start border-b border-gray-800 pb-1 mb-2">
                            <span className="font-semibold text-emerald-400">{tokenUser?.name}</span>
                            <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 uppercase">{tokenUser?.role}</span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Sanctum Token:</span>
                              <span className="text-gray-300 truncate max-w-[200px]" title={t.token}>{t.token}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Abilities (scopes):</span>
                              <span className="text-purple-400 font-semibold">{JSON.stringify(t.abilities)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
