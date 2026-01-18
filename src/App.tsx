import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { BingoBoard } from './components/BingoBoard';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-bg-dark text-slate-500">Initializing...</div>;

  return user ? <BingoBoard /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
