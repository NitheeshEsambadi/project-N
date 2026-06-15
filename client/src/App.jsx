import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import PrintQR from './pages/PrintQR';
import './index.css';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/print-qr" element={<ProtectedRoute><PrintQR /></ProtectedRoute>} />
          <Route path="/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
