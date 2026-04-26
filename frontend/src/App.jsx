import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import People from './pages/People';
import Profile from './pages/Profile';
import ProjectDetails from './pages/ProjectDetails';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyTasks from './pages/MyTasks';
import Calendar from './pages/Calendar';
import Team from './pages/Team';
import TeamMembers from './pages/TeamMembers';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import FloatingChatbot from './components/FloatingChatbot';
import FloatingChatManager from './components/FloatingChatManager';
import api from './api';

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-white">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm font-medium tracking-wide">Loading workspace...</span>
    </div>
  </div>
);

const PendingAccessScreen = ({ error, logout }) => {
  const [secret, setSecret] = useState('');
  const [claimError, setClaimError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    setLoading(true);
    setClaimError('');
    try {
      await api.post('/auth/claim-cto', { secret });
      window.location.reload();
    } catch (err) {
      setClaimError(err.response?.data?.message || 'Invalid CTO code');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212] shadow-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Access Pending</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
          {error || 'Your account has been created but is pending role assignment from your administrator.'}
        </p>

        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-white/5 text-left">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Initialize Workspace (CTO Only)</label>
          <div className="flex gap-2">
            <input 
              type="password" 
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Enter secret code" 
              className="flex-1 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary"
            />
            <button 
              onClick={handleClaim}
              disabled={loading || !secret}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50"
            >
              {loading ? '...' : 'Claim'}
            </button>
          </div>
          {claimError && <p className="text-red-500 text-xs mt-2 font-medium">{claimError}</p>}
        </div>

        <button 
          onClick={logout}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
        >
          Sign out and try another account
        </button>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading, error, isSignedIn, logout } = useAuth();
  
  if (loading) return <FullScreenLoader />;

  if (isSignedIn && !user) {
    if (error && error.includes('pending')) {
       return <PendingAccessScreen error={error} logout={logout} />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg p-4">
        <div className="w-full max-w-md rounded-3xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-dark-card shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Authentication Error</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
            {error || 'Clerk signed you in, but the backend could not load your workspace profile.'}
          </p>
          <button 
            onClick={logout}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold w-full hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return user ? (
    <>
      {children}
      <FloatingChatbot />
      <FloatingChatManager />
    </>
  ) : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
            <Route path="/people" element={
              <PrivateRoute>
                <Layout><People /></Layout>
              </PrivateRoute>
            } />
            <Route path="/profile/:userId" element={
              <PrivateRoute>
                <Layout><Profile /></Layout>
              </PrivateRoute>
            } />
            <Route path="/my-tasks" element={<PrivateRoute><Layout><MyTasks /></Layout></PrivateRoute>} />
            <Route path="/calendar" element={<PrivateRoute><Layout><Calendar /></Layout></PrivateRoute>} />
            <Route path="/team" element={<PrivateRoute><Layout><Team /></Layout></PrivateRoute>} />
            <Route path="/directory" element={<PrivateRoute><Layout><TeamMembers /></Layout></PrivateRoute>} />
            <Route path="/leaderboard" element={<PrivateRoute><Layout><Leaderboard /></Layout></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
            <Route path="/project/:id" element={<PrivateRoute><ProjectDetails /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;