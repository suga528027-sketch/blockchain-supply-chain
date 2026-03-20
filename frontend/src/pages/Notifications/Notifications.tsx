import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, Info, AlertTriangle, CheckCircle,
  XCircle, CheckCheck, RefreshCw, DollarSign, Truck
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI, productRequestAPI } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Notification {
  id: number;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  category: 'REQUEST' | 'PAYMENT' | 'LOGISTICS' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  user?: { id: number; fullName: string; email: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const timeAgo = (dateStr: string): string => {
  const now  = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

  if (diff < 60)          return 'Just now';
  if (diff < 3600)        return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 7 * 86400)  return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const typeConfig: Record<
  Notification['type'],
  { icon: React.ReactNode; color: string; bg: string; border: string; label: string }
> = {
  INFO:    { icon: <Info    className="w-5 h-5" />, color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500',   label: 'Info'    },
  WARNING: { icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500',  label: 'Warning' },
  SUCCESS: { icon: <CheckCircle   className="w-5 h-5" />, color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500',  label: 'Success' },
  ERROR:   { icon: <XCircle       className="w-5 h-5" />, color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500',    label: 'Error'   },
};

const categoryConfig: Record<
  Notification['category'],
  { icon: React.ReactNode; color: string; label: string }
> = {
  REQUEST:   { icon: <RefreshCw   className="w-3.5 h-3.5" />, color: 'text-violet-400', label: 'Trade Request' },
  PAYMENT:   { icon: <DollarSign className="w-3.5 h-3.5" />, color: 'text-emerald-400', label: 'Financial' },
  LOGISTICS: { icon: <Truck      className="w-3.5 h-3.5" />, color: 'text-blue-400', label: 'Logistics' },
  SYSTEM:    { icon: <Info       className="w-3.5 h-3.5" />, color: 'text-gray-400',  label: 'System' },
};

// ─── Component ────────────────────────────────────────────────────────────────
const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [activeFilter,   setActiveFilter]   = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'REQUEST' | 'PAYMENT' | 'LOGISTICS' | 'SYSTEM'>('ALL');
  const [markingAll,     setMarkingAll]      = useState(false);
  const [markingId,      setMarkingId]       = useState<number | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await notificationAPI.getNotifications(user.id);
      setNotifications(res.data.data || res.data || []);
    } catch {
      // silently fail on background refresh
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ─── Derived ────────────────────────────────────────────────────────────────
  const processedNotifications = notifications.map(n => {
    if (n.category && n.category !== 'SYSTEM') return n;
    
    // Fallback logic for legacy or untagged notifications
    const msg = n.message.toLowerCase();
    let cat: 'REQUEST' | 'PAYMENT' | 'LOGISTICS' | 'SYSTEM' = (n.category as any) || 'SYSTEM';
    
    // Keywords detection
    if (msg.includes('want to buy') || msg.includes('requested') || msg.includes('trade request')) {
      cat = 'REQUEST';
    } else if (msg.includes('payment') || msg.includes('paid') || msg.includes('amount to pay') || msg.includes('financial')) {
      cat = 'PAYMENT';
    } else if (msg.includes('shipment') || msg.includes('transporter') || msg.includes('delivering') || msg.includes('logistics') || msg.includes('truck')) {
      cat = 'LOGISTICS';
    }
    
    return { ...n, category: cat };
  });

  const unreadCount = processedNotifications.filter(n => !n.isRead).length;
  
  const displayed = processedNotifications.filter(n => {
    // Stage 1: Filter by Read/Unread
    const statusMatch = activeFilter === 'all' || !n.isRead;
    // Stage 2: Filter by Category
    const categoryMatch = categoryFilter === 'ALL' || n.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  // ─── Mark single as read ────────────────────────────────────────────────────
  const markAsRead = async (n: Notification) => {
    if (n.isRead) return;
    setMarkingId(n.id);
    try {
      await notificationAPI.markAsRead(n.id);
      setNotifications(prev =>
        prev.map(item => item.id === n.id ? { ...item, isRead: true } : item)
      );
    } catch {
      toast.error('Failed to mark as read.');
    } finally {
      setMarkingId(null);
    }
  };

  // ─── Mark all as read ───────────────────────────────────────────────────────
  const markAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notificationAPI.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read!');
    } catch {
      toast.error('Failed to mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm animate-pulse">Loading notifications…</p>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Bell className="w-6 h-6 text-white" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-app-text tracking-tight">Notifications</h1>
            <p className="text-app-text-secondary text-sm font-medium">Stay updated with your supply chain activity</p>
          </div>
        </div>

        {/* Mark all + refresh */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchNotifications}
            title="Refresh"
            className="p-2.5 rounded-xl bg-app-card border border-app-border text-app-text-muted hover:text-emerald-500 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={unreadCount > 0 ? { scale: 1.03 } : {}}
            whileTap={unreadCount > 0 ? { scale: 0.97 } : {}}
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || markingAll}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${
              unreadCount === 0
                ? 'bg-app-card text-gray-600 border-app-border cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-transparent shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
            }`}
          >
            {markingAll
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <CheckCheck className="w-4 h-4" />
            }
            Mark All as Read
          </motion.button>
        </div>
      </motion.div>

      {/* ── Filter Tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col gap-4 mb-8"
      >
        {/* Status Filters */}
        <div className="flex gap-2">
          {(['all', 'unread'] as const).map(filter => {
            const count = filter === 'all' ? notifications.length : unreadCount;
            const active = activeFilter === filter;
            return (
              <motion.button
                key={filter}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveFilter(filter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                  active
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-transparent shadow-lg shadow-purple-500/20'
                    : 'bg-app-card text-app-text-secondary border-app-border hover:text-app-text hover:bg-app-bg'
                }`}
              >
                {filter}
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  active ? 'bg-white/25 text-white' : 'bg-white/5 text-gray-500'
                }`}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 pb-2">
          {(['ALL', 'REQUEST', 'PAYMENT', 'LOGISTICS', 'SYSTEM'] as const).map(cat => {
            const count = cat === 'ALL' 
              ? processedNotifications.length 
              : processedNotifications.filter(n => n.category === cat).length;
            const active = categoryFilter === cat;
            
            if (cat !== 'ALL' && count === 0) return null; // Only show relevant categories

            return (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCategoryFilter(cat)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                  active
                    ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
              >
                {cat === 'ALL' && <Bell className="w-3 h-3" />}
                {cat === 'REQUEST' && <RefreshCw className="w-3 h-3" />}
                {cat === 'PAYMENT' && <DollarSign className="w-3 h-3" />}
                {cat === 'LOGISTICS' && <Truck className="w-3 h-3" />}
                {cat === 'SYSTEM' && <Info className="w-3 h-3" />}
                {cat}
                <span className="opacity-40">{count}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ── List ── */}
      <AnimatePresence mode="popLayout">
        {displayed.length === 0 ? (
          /* Empty state */
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
              <BellOff className="w-9 h-9 text-gray-600" />
            </div>
            <p className="text-app-text text-xl font-black mb-2">
              {activeFilter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </p>
            <p className="text-app-text-muted text-sm font-medium">
              {activeFilter === 'unread'
                ? 'You have no unread notifications.'
                : "Your system activity logs will appear here."}
            </p>
          </motion.div>
        ) : (
          <motion.div key="list" className="space-y-3">
            {displayed.map((notif, index) => {
              const cfg       = typeConfig[notif.type] ?? typeConfig.INFO;
              const isMarking = markingId === notif.id;

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -24, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0,   scale: 1    }}
                  exit={{    opacity: 0, x:  24,  scale: 0.95 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  onClick={() => markAsRead(notif)}
                  className={`relative flex items-start gap-4 p-5 rounded-[2rem] border cursor-pointer group transition-all duration-500 ${
                    notif.isRead
                      ? 'bg-app-card border-app-border hover:shadow-lg'
                      : 'bg-app-card border-emerald-500/20 shadow-xl shadow-black/5'
                  }`}
                >
                  {/* Unread left-border accent */}
                  {!notif.isRead && (
                    <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${cfg.border} bg-current opacity-80`}
                      style={{ backgroundColor: 'currentColor' }}
                    />
                  )}

                  {/* Type icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color} mt-0.5`}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-app-text-secondary' : 'text-app-text font-black'}`}>
                        {notif.message.includes('[PAYMENT_LINK:') ? 
                          notif.message.split('[PAYMENT_LINK:')[0] : 
                          notif.message
                        }
                      </p>

                      {/* Payment Action for specific notification types or specific text patterns */}
                      {(notif.message.includes('[PAYMENT_LINK:') || notif.message.includes('Total amount to pay:')) && (
                        <div className="mt-4 pb-1">
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              let reqId: number | null = null;
                              
                              // Strategy 1: Marker
                              const matches = notif.message.match(/\[PAYMENT_LINK:(\d+)\]/);
                              if (matches && matches[1]) {
                                reqId = parseInt(matches[1]);
                              } 
                              
                              // Strategy 2: Fallback - find the most recent accepted request for this user
                              if (!reqId) {
                                try {
                                  toast.info('Analyzing transmission context...');
                                  const res = await productRequestAPI.getSentRequests(user?.id!);
                                  const sent = res.data.data || [];
                                  // Find an accepted request for the product mentioned in the message
                                  const request = sent.find((r: any) => 
                                    r.status === 'ACCEPTED' && 
                                    !r.isPaid && 
                                    notif.message.toLowerCase().includes(r.batch.productName.toLowerCase())
                                  );
                                  if (request) reqId = request.id;
                                } catch (err) {
                                  console.error("Failed to recover request context", err);
                                }
                              }

                              if (reqId) {
                                try {
                                  const res = await productRequestAPI.getRequestById(reqId);
                                  const targetReq = res.data.data;
                                  if (targetReq && targetReq.batch && targetReq.totalPrice) {
                                  navigate('/payments', { 
                                    state: { 
                                      batch: targetReq.batch, 
                                      amount: targetReq.totalPrice, 
                                      requestId: targetReq.id,
                                      quantity: targetReq.quantityRequested
                                    } 
                                  });
                                    toast.success('System redirect: Settlement Hub accessed.');
                                  } else {
                                    toast.error('Financial endpoint not reached.');
                                  }
                                } catch {
                                  toast.error('Transmission failure.');
                                }
                              } else {
                                toast.warning('Target context not found. Redirecting to Trade Hub.');
                                navigate('/market', { state: { activeTab: 'requests' }});
                              }
                            }}
                            className="flex items-center gap-3 px-6 py-3 bg-emerald-500 text-white rounded-[1.2rem] text-xs font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all border border-emerald-400/20 group"
                          >
                            <DollarSign className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            Confirm Payment & Release Harvest
                          </motion.button>
                        </div>
                      )}

                      {/* Mark as read button (visible on hover when unread) */}
                      {!notif.isRead && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={e => { e.stopPropagation(); markAsRead(notif); }}
                          title="Mark as read"
                          className="flex-shrink-0 p-2 rounded-xl text-app-text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-emerald-500/20"
                        >
                          {isMarking
                            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : <CheckCheck className="w-4 h-4" />
                          }
                        </motion.button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                      {/* Type badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>

                      {/* Time */}
                      <span className="text-app-text-muted text-xs font-semibold">{timeAgo(notif.createdAt)}</span>

                      {/* Category Badge */}
                      {notif.category && (
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/20 ${categoryConfig[notif.category]?.color}`}>
                          {categoryConfig[notif.category]?.icon}
                          <span className="text-[9px] font-black uppercase tracking-tighter">
                            {categoryConfig[notif.category]?.label}
                          </span>
                        </div>
                      )}

                      {/* Unread dot */}
                      {!notif.isRead && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer count */}
      {displayed.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-app-text-muted text-xs mt-8 font-bold uppercase tracking-widest opacity-60"
        >
          Showing {displayed.length} frequency log{displayed.length !== 1 ? 's' : ''}
          {unreadCount > 0 && <> · <span className="text-violet-600">{unreadCount} active</span></>}
        </motion.p>
      )}
    </div>
  );
};

export default Notifications;
