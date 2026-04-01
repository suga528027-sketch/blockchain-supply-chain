import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Pages
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import FarmerDashboard from './pages/FarmerDashboard/FarmerDashboard';
import ConsumerTracker from './pages/ConsumerTracker/ConsumerTracker';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import SupplyChainMap from './pages/SupplyChainMap/SupplyChainMap';
import Notifications from './pages/Notifications/Notifications';
import TransporterDashboard from './pages/TransporterDashboard/TransporterDashboard';
import RetailerDashboard from './pages/RetailerDashboard/RetailerDashboard';
import PaymentPage from './pages/Payment/PaymentPage';
import Profiles from './pages/Profile/Profile';
import DisputesPage from './pages/Disputes/DisputesPage';
import Market from './pages/Market/Market';
import Settings from './pages/Settings/Settings';
import Help from './pages/Help/Help';

// Components
import Layout from './components/Layout';
import { APP_NAME } from './branding';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
        <div className="min-h-screen bg-[#0F2027] flex items-center justify-center transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg font-black tracking-tight uppercase opacity-50">Initializing {APP_NAME}...</p>
        </div>
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  switch (user?.role) {
    case 'FARMER': return <Navigate to="/farmer-dashboard" />;
    case 'ADMIN': return <Navigate to="/admin-dashboard" />;
    case 'TRANSPORTER': return <Navigate to="/transporter-dashboard" />;
    case 'RETAILER': return <Navigate to="/retailer-dashboard" />;
    case 'CONSUMER': return <Navigate to="/track" />;
    default: return <Navigate to="/track" />;
  }
};

const AppContent: React.FC = () => {
  const { theme } = useTheme();
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Core App Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

          <Route path="/payments" element={<ProtectedRoute><Layout><PaymentPage /></Layout></ProtectedRoute>} />
          <Route path="/disputes" element={<ProtectedRoute><Layout><DisputesPage /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profiles /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Layout><Help /></Layout></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><Layout><SupplyChainMap /></Layout></ProtectedRoute>} />
          <Route path="/track" element={<ProtectedRoute><Layout><ConsumerTracker initialTab="track" /></Layout></ProtectedRoute>} />
          <Route path="/my-signals" element={<ProtectedRoute><Layout><ConsumerTracker initialTab="history" /></Layout></ProtectedRoute>} />
          <Route path="/market" element={<ProtectedRoute><Layout><Market /></Layout></ProtectedRoute>} />

          {/* Role Specific Dashboards */}
          <Route path="/farmer-dashboard" element={<ProtectedRoute><Layout><FarmerDashboard /></Layout></ProtectedRoute>} />
          <Route path="/farmer-batches" element={<ProtectedRoute><Layout><FarmerDashboard /></Layout></ProtectedRoute>} />

          <Route path="/transporter-dashboard" element={<ProtectedRoute><Layout><TransporterDashboard /></Layout></ProtectedRoute>} />
          <Route path="/retailer-dashboard" element={<ProtectedRoute><Layout><RetailerDashboard /></Layout></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<ProtectedRoute><Layout><AdminDashboard initialTab="overview" /></Layout></ProtectedRoute>} />
          <Route path="/admin-users" element={<ProtectedRoute><Layout><AdminDashboard initialTab="users" /></Layout></ProtectedRoute>} />
          <Route path="/admin-batches" element={<ProtectedRoute><Layout><AdminDashboard initialTab="batches" /></Layout></ProtectedRoute>} />
          <Route path="/admin-payments" element={<ProtectedRoute><Layout><AdminDashboard initialTab="payments" /></Layout></ProtectedRoute>} />
          <Route path="/admin-disputes" element={<ProtectedRoute><Layout><AdminDashboard initialTab="disputes" /></Layout></ProtectedRoute>} />
          <Route path="/admin-feedback" element={<ProtectedRoute><Layout><AdminDashboard initialTab="feedback" /></Layout></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} theme={theme === 'pink' ? 'light' : 'dark'} />
    </AuthProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
