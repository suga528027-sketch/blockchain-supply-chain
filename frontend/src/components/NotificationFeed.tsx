import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, RefreshCw, DollarSign, Truck, Info, 
  CheckCheck, ChevronRight, Inbox, Clock
} from 'lucide-react';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  category: 'REQUEST' | 'PAYMENT' | 'LOGISTICS' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

const categoryConfig: Record<
  Notification['category'],
  { icon: React.ReactNode; color: string; bg: string; label: string }
> = {
  REQUEST:   { icon: <RefreshCw   className="w-3.5 h-3.5" />, color: 'text-violet-400',   bg: 'bg-violet-500/10',   label: 'Request' },
  PAYMENT:   { icon: <DollarSign className="w-3.5 h-3.5" />, color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  label: 'Payment' },
  LOGISTICS: { icon: <Truck      className="w-3.5 h-3.5" />, color: 'text-blue-400',     bg: 'bg-blue-500/10',     label: 'Logistics' },
  SYSTEM:    { icon: <Info       className="w-3.5 h-3.5" />, color: 'text-gray-400',     bg: 'bg-white/5',         label: 'System' },
};

const NotificationFeed: React.FC<{ limit?: number; showFilters?: boolean }> = ({ 
  limit = 5, 
  showFilters = true 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'REQUEST' | 'PAYMENT' | 'LOGISTICS' | 'SYSTEM'>('ALL');

  const fetchNotifs = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await notificationAPI.getNotifications(user.id);
      setNotifications(res.data.data || []);
    } catch (e) {
      console.error("Failed to fetch feed", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const processed = notifications.map(n => {
    if (n.category && n.category !== 'SYSTEM') return n;
    const msg = n.message.toLowerCase();
    let cat: Notification['category'] = (n.category as any) || 'SYSTEM';
    if (msg.includes('want to buy') || msg.includes('requested') || msg.includes('trade request')) {
      cat = 'REQUEST';
    } else if (msg.includes('payment') || msg.includes('paid') || msg.includes('amount to pay')) {
      cat = 'PAYMENT';
    } else if (msg.includes('shipment') || msg.includes('transporter') || msg.includes('delivery')) {
      cat = 'LOGISTICS';
    }
    return { ...n, category: cat };
  });

  const filtered = processed.filter(n => 
    activeCategory === 'ALL' ? true : n.category === activeCategory
  ).slice(0, limit);

  const markRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-50">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">Syncing Node...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Categories Header */}
      {showFilters && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {(['ALL', 'REQUEST', 'PAYMENT', 'LOGISTICS', 'SYSTEM'] as const).map(cat => {
            const count = cat === 'ALL' ? processed.length : processed.filter(n => n.category === cat).length;
            const active = activeCategory === cat;
            if (cat !== 'ALL' && count === 0) return null;

            return (
              <button
                key={cat}
                onClick={(e) => { e.stopPropagation(); setActiveCategory(cat); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  active 
                    ? 'bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/20' 
                    : 'bg-app-card text-white/40 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat === 'ALL' && <Bell className="w-3 h-3" />}
                {cat === 'REQUEST' && <RefreshCw className="w-3 h-3" />}
                {cat === 'PAYMENT' && <DollarSign className="w-3 h-3" />}
                {cat === 'LOGISTICS' && <Truck className="w-3 h-3" />}
                {cat === 'SYSTEM' && <Info className="w-3 h-3" />}
                <span>{cat}</span>
                <span className={`px-1 rounded-full ${active ? 'bg-white/20' : 'bg-white/5'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="flex-1 space-y-3 custom-scrollbar overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <Inbox className="w-10 h-10 text-white/5 mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Frequency Void</p>
              <p className="text-xs text-white/10 italic">No signals detected in this cluster</p>
            </motion.div>
          ) : (
            filtered.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { markRead(n.id); navigate('/notifications'); }}
                className={`relative p-4 rounded-3xl border cursor-pointer group transition-all duration-500 ${
                  n.isRead ? 'bg-app-card/40 border-white/5 opacity-60' : 'bg-app-card border-emerald-500/20 shadow-xl'
                }`}
              >
                {!n.isRead && (
                  <span className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                )}
                
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${categoryConfig[n.category].bg} ${categoryConfig[n.category].color}`}>
                    {categoryConfig[n.category].icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs line-clamp-2 leading-relaxed ${n.isRead ? 'text-white/40' : 'text-white/90 font-bold'}`}>
                      {n.message.split('[PAYMENT_LINK:')[0]}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2">
                       <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-lg bg-black/30 ${categoryConfig[n.category].color}`}>
                          {categoryConfig[n.category].label}
                       </span>
                       <span className="text-[9px] text-white/20 font-black uppercase flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(n.createdAt)}
                       </span>
                    </div>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-all self-center">
                    <ChevronRight className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* View All Footer */}
      {processed.length > 5 && (
        <button 
          onClick={() => navigate('/notifications')}
          className="mt-6 flex items-center justify-center gap-2 py-3 w-full rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20"
        >
          Access Signal Archives
          <CheckCheck className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default NotificationFeed;
