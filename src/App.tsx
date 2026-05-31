import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { MemberDashboard } from './components/MemberDashboard';
import { KioskMode } from './components/KioskMode';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DevTerminal } from './components/DevTerminal';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));
  const [userRole, setUserRole] = useState<string | null>(null);

  const checkAuth = () => {
    setIsAuthenticated(!!localStorage.getItem('auth_token'));
    const userString = localStorage.getItem('auth_user');
    if (userString) {
      setUserRole(JSON.parse(userString).role);
    } else {
      setUserRole(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    checkAuth();
  };

  const handleLogout = () => {
    checkAuth();
  };

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <Routes>
          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                userRole === 'member' ? (
                  <Navigate to="/member/dashboard" replace />
                ) : (
                  <Navigate to="/admin/dashboard" replace />
                )
              ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
              )
            } 
          />

          {/* Kiosk Mode Route */}
          <Route path="/kiosk" element={<KioskMode />} />

          {/* Admin & Staff Dashboard Route */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff', 'trainer']}>
                <AdminDashboard onLogout={handleLogout} defaultTab="checkin" />
              </ProtectedRoute>
            } 
          />

          {/* Admin Member Directory Route */}
          <Route 
            path="/admin/members" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff', 'trainer']}>
                <AdminDashboard onLogout={handleLogout} defaultTab="members_list" />
              </ProtectedRoute>
            } 
          />

          {/* Member Dashboard Route */}
          <Route 
            path="/member/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Default Route */}
          <Route 
            path="*" 
            element={<Navigate to="/login" replace />} 
          />
        </Routes>

        {/* Developer Sandbox Control Panel */}
        <DevTerminal onStateChange={checkAuth} />
      </div>
    </BrowserRouter>
  );
}

export default App;
