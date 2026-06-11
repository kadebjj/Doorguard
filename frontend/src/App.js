import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TrainerSearch from "./pages/TrainerSearch";
import TrainerProfile from "./pages/TrainerProfile";
import Sessions from "./pages/Sessions";
import Challenges from "./pages/Challenges";
import Safety from "./pages/Safety";
import { PaymentSuccess, PaymentCancel } from "./pages/Payment";
import EmergencySOS from "./components/EmergencySOS";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <div className="spinner" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <div className="spinner" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout><Landing /></Layout>} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      
      {/* Semi-Protected Routes (viewable but actions need auth) */}
      <Route path="/trainers" element={<Layout><TrainerSearch /></Layout>} />
      <Route path="/trainers/:id" element={<Layout><TrainerProfile /></Layout>} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/sessions" 
        element={
          <ProtectedRoute>
            <Layout><Sessions /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/challenges" 
        element={
          <ProtectedRoute>
            <Layout><Challenges /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/safety" 
        element={
          <ProtectedRoute>
            <Layout><Safety /></Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Payment Routes */}
      <Route path="/payment/success" element={<Layout><PaymentSuccess /></Layout>} />
      <Route path="/payment/cancel" element={<Layout><PaymentCancel /></Layout>} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <EmergencySOS />
        <Toaster 
          position="top-right" 
          richColors 
          toastOptions={{
            style: {
              background: '#18181B',
              border: '1px solid #27272A',
              color: '#FAFAFA',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
