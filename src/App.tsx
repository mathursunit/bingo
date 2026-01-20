import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DialogProvider } from './contexts/DialogContext';
import { Login } from './components/Login';
import { BingoBoard } from './components/BingoBoard';
import { Dashboard } from './components/Dashboard';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-bg-dark text-slate-500">Initializing...</div>;

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/board/legacy/:yearId" element={<BingoBoard />} />
        <Route path="/board/:boardId" element={<BingoBoard />} />
        {/* Fallback for legacy URL or direct access, though typically redirected */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <AppContent />
      </DialogProvider>
    </AuthProvider>
  );
}

export default App;
