import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import ForgotPassword from './components/ForgotPassword';
import { Toaster } from 'react-hot-toast';


// Simple Protected Route Component
const ProtectedRoute = ({ children, role }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        return <Navigate to="/" />;
    }

    if (role && user.role !== role) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/user'} />;
    }

    return children;
};

function App() {
  return (
    <Router>
      <Toaster />
      <Routes>

        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user" 
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
