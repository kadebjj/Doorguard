import React from 'react';
import { useAuth } from '../context/AuthContext';
import ClientDashboard from './ClientDashboard';
import TrainerDashboard from './TrainerDashboard';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { isClient, isTrainer, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isClient) {
    return <ClientDashboard />;
  }

  if (isTrainer) {
    return <TrainerDashboard />;
  }

  return <Navigate to="/" replace />;
};

export default Dashboard;
