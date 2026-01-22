import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NoiseOverlay } from './components/ui/NoiseOverlay';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DialogProvider } from './contexts/DialogContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Login } from './components/Login';
import { BingoBoard } from './components/BingoBoard';
import { Dashboard } from './components/Dashboard';
import { DynamicBackground } from './components/DynamicBackground';
import { HelpPage } from './components/HelpPage';
import { ProfilePage } from './components/ProfilePage';
import { AppShell } from './components/layout/AppShell';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-bg-dark text-slate-500">Initializing...</div>;

  return (
    <>
      <DynamicBackground />
      <NoiseOverlay />
      <div className="relative z-10 min-h-screen">
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
            <Route path="/help" element={<HelpPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={user ? <AppShell><Dashboard /></AppShell> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={user ? <AppShell><ProfilePage /></AppShell> : <Navigate to="/login" replace />} />
            <Route path="/board/legacy/:yearId" element={user ? <AppShell><BingoBoard /></AppShell> : <Navigate to="/login" replace />} />
            <Route path="/board/:boardId" element={user ? <AppShell><BingoBoard /></AppShell> : <Navigate to="/login" replace />} />

            {/* Root Redirect */}
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <DialogProvider>
          <AppContent />
        </DialogProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
