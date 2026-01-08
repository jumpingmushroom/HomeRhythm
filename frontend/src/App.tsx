import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { authApi } from './lib/api';

function App() {
  const { isAuthenticated, setAuth, logout } = useAuthStore();

  useEffect(() => {
    // Verify token on app load
    const verifyAuth = async () => {
      if (isAuthenticated) {
        try {
          const response = await authApi.me();
          setAuth(response.data.user, localStorage.getItem('token')!);
        } catch {
          logout();
        }
      }
    };

    verifyAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
