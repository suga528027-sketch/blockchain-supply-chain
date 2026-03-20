import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Leaf,
  LayoutDashboard,
  Package,
  Search,
  LogOut,
  User,
  Menu,
  X,
  Users,
  MapPin,
  Sun,
  Moon,
  Sparkles,
  Bell,
  ShoppingCart,
  Inbox,
  CreditCard,
  Truck,
  Store,
  AlertTriangle,
  DollarSign,
  QrCode,
  PackageCheck,
  MessageSquare
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationAPI } from '../services/api';

import UserProfile from './UserProfile';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const res = await notificationAPI.getUnreadCount(user.id);
        setUnreadCount(res.data.data ?? res.data ?? 0);
      } catch { /* silent */ }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const menuItems = [
    // ── FARMER ──────────────────────────────────────────────────────────────
    {
      title: 'My Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/farmer-dashboard',
      roles: ['FARMER'],
    },
    {
      title: 'My Batches',
      icon: <Package className="w-5 h-5" />,
      path: '/farmer-dashboard',
      roles: ['FARMER'],
    },
    {
      title: 'Track Produce',
      icon: <Search className="w-5 h-5" />,
      path: '/track',
      roles: ['FARMER'],
    },
    {
      title: 'My Payments',
      icon: <CreditCard className="w-5 h-5" />,
      path: '/payments',
      roles: ['FARMER'],
    },
    {
      title: 'My Disputes',
      icon: <AlertTriangle className="w-5 h-5" />,
      path: '/disputes',
      roles: ['FARMER'],
    },

    // ── TRANSPORTER ─────────────────────────────────────────────────────────
    {
      title: 'My Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/transporter-dashboard',
      roles: ['TRANSPORTER'],
    },
    {
      title: 'Assigned Batches',
      icon: <PackageCheck className="w-5 h-5" />,
      path: '/transporter-dashboard',
      roles: ['TRANSPORTER'],
    },
    {
      title: 'Update Location',
      icon: <MapPin className="w-5 h-5" />,
      path: '/transporter-dashboard',
      roles: ['TRANSPORTER'],
    },
    {
      title: 'My Earnings',
      icon: <DollarSign className="w-5 h-5" />,
      path: '/payments',
      roles: ['TRANSPORTER'],
    },

    // ── RETAILER ────────────────────────────────────────────────────────────
    {
      title: 'My Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/retailer-dashboard',
      roles: ['RETAILER'],
    },
    {
      title: 'Received Batches',
      icon: <Inbox className="w-5 h-5" />,
      path: '/retailer-dashboard',
      roles: ['RETAILER'],
    },
    {
      title: 'Make Payment',
      icon: <CreditCard className="w-5 h-5" />,
      path: '/payments',
      roles: ['RETAILER'],
    },
    {
      title: 'Track Produce',
      icon: <Search className="w-5 h-5" />,
      path: '/track',
      roles: ['RETAILER'],
    },

    // ── CONSUMER ────────────────────────────────────────────────────────────
    {
      title: 'Track Produce',
      icon: <Search className="w-5 h-5" />,
      path: '/track',
      roles: ['CONSUMER'],
    },
    {
      title: 'My Signals',
      icon: <MessageSquare className="w-5 h-5" />,
      path: '/my-signals',
      roles: ['CONSUMER'],
    },

    // ── ADMIN ────────────────────────────────────────────────────────────────
    {
      title: 'Admin Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/admin-dashboard',
      roles: ['ADMIN'],
    },
    {
      title: 'All Users',
      icon: <Users className="w-5 h-5" />,
      path: '/admin-users',
      roles: ['ADMIN'],
    },
    {
      title: 'All Batches',
      icon: <Package className="w-5 h-5" />,
      path: '/admin-batches',
      roles: ['ADMIN'],
    },
    {
      title: 'All Payments',
      icon: <CreditCard className="w-5 h-5" />,
      path: '/admin-payments',
      roles: ['ADMIN'],
    },
    {
      title: 'All Disputes',
      icon: <AlertTriangle className="w-5 h-5" />,
      path: '/admin-disputes',
      roles: ['ADMIN'],
    },
    {
      title: 'Consumer Signals',
      icon: <MessageSquare className="w-5 h-5" />,
      path: '/admin-feedback',
      roles: ['ADMIN'],
    },
  ];

  const filteredMenu = menuItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex transition-colors duration-500 overflow-hidden">

      {/* Sidebar */}
      <motion.div
        animate={{ width: sidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.3 }}
        className="bg-app-card backdrop-blur-3xl border-r border-app-border flex flex-col h-screen sticky top-0 shadow-[20px_0_50px_-20px_rgba(0,0,0,0.05)] transition-all duration-500 z-50"
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-4 border-b border-app-border">
          <div className="w-12 h-12 min-w-[48px] bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Leaf className="w-6 h-6 text-white" />
          </div>

          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="font-black text-xl tracking-tighter text-app-text">AgriChain</h1>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">Ecosystem</p>
            </motion.div>
          )}
        </div>

        {/* Role Badge */}
        {sidebarOpen && user?.role && (
          <div className="px-6 py-3 border-b border-app-border">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest w-full justify-center
              ${user.role === 'FARMER'      ? 'bg-green-500/15 text-green-500 border border-green-500/30' : ''}
              ${user.role === 'TRANSPORTER' ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30' : ''}
              ${user.role === 'RETAILER'    ? 'bg-orange-500/15 text-orange-500 border border-orange-500/30' : ''}
              ${user.role === 'CONSUMER'    ? 'bg-purple-500/15 text-purple-500 border border-purple-500/30' : ''}
              ${user.role === 'ADMIN'       ? 'bg-red-500/15 text-red-500 border border-red-500/30' : ''}
            `}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse
                ${user.role === 'FARMER'      ? 'bg-green-500' : ''}
                ${user.role === 'TRANSPORTER' ? 'bg-blue-500' : ''}
                ${user.role === 'RETAILER'    ? 'bg-orange-500' : ''}
                ${user.role === 'CONSUMER'    ? 'bg-purple-500' : ''}
                ${user.role === 'ADMIN'       ? 'bg-red-500' : ''}
              `} />
              {user.role}
            </div>
          </div>
        )}


        {/* Menu */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {filteredMenu.map((item, index) => {
            const hasBadge = (item as any).badge > 0;
            const isActive = location.pathname === item.path;
            
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                    : 'text-app-text-secondary hover:bg-app-bg hover:text-emerald-500'
                }`}
              >
                <div className={`relative flex-shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`}>
                  {item.icon}
                  {hasBadge && !sidebarOpen && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-app-card" />
                  )}
                </div>

                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-bold flex-1 text-left tracking-tight"
                  >
                    {item.title}
                  </motion.span>
                )}

                {sidebarOpen && hasBadge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full min-w-[20px] text-center"
                  >
                    {(item as any).badge > 99 ? '99+' : (item as any).badge}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* System Version Footer */}
        {sidebarOpen && (
          <div className="p-6 border-t border-app-border">
            <div className="flex items-center gap-3 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-app-text-muted">v1.2.0 Stable</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Header Navigation */}
        <header className="h-20 bg-app-card/30 backdrop-blur-xl border-b border-app-border px-8 flex items-center justify-between transition-all duration-500 z-40">
          
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-app-bg text-app-text-secondary hover:text-emerald-500 transition-all border border-app-border"
            >
              <Menu className="w-6 h-6" />
            </motion.button>

            <div className="hidden lg:block">
              <h2 className="text-app-text-muted text-xs font-black uppercase tracking-[0.2em] mb-1">Current Node</h2>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-app-text font-bold text-sm">AgriChain Protocol v1.4.2</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Dynamic User Profile & Actions Component */}
             <UserProfile unreadCount={unreadCount} />
          </div>
        </header>

        {/* Content Container (Scrollable) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-app-bg">
           <div className="max-w-7xl mx-auto">
             {children}
           </div>
        </main>

      </div>
    </div>
  );
};

export default Layout;