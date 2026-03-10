import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
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

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-white">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm font-medium tracking-wide">Loading workspace...</span>
    </div>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading, error, isSignedIn } = useAuth();
  if (loading) return <FullScreenLoader />;

  if (isSignedIn && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg p-4">
        <div className="w-full max-w-xl rounded-3xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-dark-card shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Workspace authentication is incomplete</h1>
          <p className="text-slate-600 dark:text-slate-300 leading-7">
            {error || 'Clerk signed you in, but the backend could not create or load your workspace user.'}
          </p>
        </div>
      </div>
    );
  }

  return user ? (
    <>
      {children}
      <FloatingChatbot />
    </>
  ) : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  return user ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />
            <Route path="/" element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/my-tasks" element={
              <PrivateRoute>
                <Layout>
                  <MyTasks />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/calendar" element={
              <PrivateRoute>
                <Layout>
                  <Calendar />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/team" element={
              <PrivateRoute>
                <Layout>
                  <Team />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/directory" element={
              <PrivateRoute>
                <Layout>
                  <TeamMembers />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/leaderboard" element={
              <PrivateRoute>
                <Layout>
                  <Leaderboard />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            } />
            <Route path="/project/:id" element={
              <PrivateRoute>
                <ProjectDetails />
              </PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
