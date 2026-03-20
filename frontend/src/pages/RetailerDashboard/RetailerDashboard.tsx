import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NotificationFeed from '../../components/NotificationFeed';
import {
  Package, CheckCircle, CreditCard, Truck,
  X, ChevronDown, Loader2, IndianRupee, Store,
  RefreshCw, Clock, Layers, TrendingDown, User,
  ShieldCheck, Inbox, AlertTriangle, Banknote, ShoppingCart,
  Zap, Activity, ChevronRight, Bell, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { batchAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import axios from 'axios';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Batch {
  id: number;
  batchCode: string;
  productName: string;
  quantityKg: number;
  pricePerKg: number;
  status: string;
  qualityGrade: string;
  expiryDate?: string;
  farmer?: { id: number; fullName: string; phone?: string; address?: string };
  currentOwner?: { id: number; fullName: string; role: string };
  createdAt?: string;
}

interface Payment {
  id: number;
  amount: number;
  paymentStatus: string;
  paymentType: string;
  paymentDate: string;
  receiver?: { id: number; fullName: string; role: string };
}

interface PaymentModalState {
  open: boolean;
  batchId: number | null;
  type: 'FARMER' | 'TRANSPORTER' | null;
  recipientId: number | null;
  recipientName: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const StatCard = ({
  icon, label, value, sub, color, delay = 0
}: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="relative overflow-hidden rounded-2xl border border-white/10 p-6"
    style={{ background: 'linear-gradient(135deg, #0d1a22 0%, #0F2027 100%)' }}
  >
    <div className="absolute inset-0 opacity-10"
      style={{ background: `radial-gradient(ellipse at top right, ${color} 0%, transparent 70%)` }} />
    <div className="relative flex items-center gap-4">
      <div className="p-3 rounded-xl border border-white/10" style={{ background: `${color}20` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{label}</p>
        <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5 font-medium">{sub}</p>}
      </div>
    </div>
  </motion.div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    CREATED:              { color: '#f59e0b', bg: '#f59e0b20', label: 'Awaiting Pickup' },
    IN_TRANSIT:           { color: '#3b82f6', bg: '#3b82f620', label: 'In Transit' },
    DELIVERED:            { color: '#22c55e', bg: '#22c55e20', label: 'Delivered' },
    DELIVERED_FINAL:      { color: '#10b981', bg: '#10b98120', label: 'Final Delivery' },
    ACCEPTED_BY_RETAILER: { color: '#8b5cf6', bg: '#8b5cf620', label: 'Accepted' },
    PURCHASED:            { color: '#06b6d4', bg: '#06b6d420', label: 'Purchased' },
  };
  const cfg = map[status] ?? { color: '#9ca3af', bg: '#9ca3af20', label: status };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}40` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const RetailerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches]   = useState<Batch[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Accept confirm
  const [acceptBatchId, setAcceptBatchId] = useState<number | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);

  // Confirm delivery
  const [confirmBatchId, setConfirmBatchId] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Payment modal
  const [payModal, setPayModal] = useState<PaymentModalState>({
    open: false, batchId: null, type: null, recipientId: null, recipientName: ''
  });
  const [payAmount, setPayAmount]   = useState('');
  const [payMethod, setPayMethod]   = useState('ONLINE');
  const [payLoading, setPayLoading] = useState(false);

  // ─── Data Fetch ───────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [batchRes, payRes] = await Promise.all([
        batchAPI.getBatchesByOwner(user.id),
        paymentAPI.getPaymentsByUser(user.id),
      ]);
      setBatches(batchRes.data.data || []);
      const rawPay: Payment[] = payRes.data.data || [];
      // Only payments where retailer is the payer
      setPayments(rawPay.filter(p =>
        p.paymentType === 'PRODUCE_PAYMENT' || p.paymentType === 'TRANSPORT_PAYMENT'
      ));
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = () => { setRefreshing(true); fetchAll(); };

  // ─── Accept Batch ─────────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!acceptBatchId) return;
    setAcceptLoading(true);
    try {
      await axios.put(
        `http://localhost:8080/api/retail/${acceptBatchId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Batch accepted!');
      setAcceptBatchId(null);
      fetchAll();
    } catch { toast.error('Failed to accept batch'); }
    finally { setAcceptLoading(false); }
  };

  // ─── Confirm Final Delivery ───────────────────────────────────────────────────
  const handleConfirmDelivery = async () => {
    if (!confirmBatchId) return;
    setConfirmLoading(true);
    try {
      await axios.put(
        `http://localhost:8080/api/retail/${confirmBatchId}/confirm-delivery`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Final delivery confirmed!');
      setConfirmBatchId(null);
      fetchAll();
    } catch { toast.error('Failed to confirm delivery'); }
    finally { setConfirmLoading(false); }
  };

  // ─── Make Payment ─────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!payModal.batchId || !payModal.type || !payAmount || parseFloat(payAmount) <= 0) {
      toast.error('Please enter a valid amount'); return;
    }
    setPayLoading(true);
    try {
      const endpoint = payModal.type === 'FARMER'
        ? 'http://localhost:8080/api/retail/pay/farmer'
        : 'http://localhost:8080/api/retail/pay/transporter';

      const idKey = payModal.type === 'FARMER' ? 'farmerId' : 'transporterId';

      await axios.post(endpoint, {
        batchId: payModal.batchId,
        [idKey]: payModal.recipientId,
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });

      toast.success(`Payment to ${payModal.type === 'FARMER' ? 'Farmer' : 'Transporter'} initiated!`);
      setPayModal({ open: false, batchId: null, type: null, recipientId: null, recipientName: '' });
      setPayAmount(''); setPayMethod('ONLINE');
      fetchAll();
    } catch { toast.error('Payment failed!'); }
    finally { setPayLoading(false); }
  };

  // ─── Derived Stats ────────────────────────────────────────────────────────────
  const inTransit    = batches.filter(b => b.status === 'IN_TRANSIT').length;
  const delivered    = batches.filter(b => ['DELIVERED', 'DELIVERED_FINAL', 'ACCEPTED_BY_RETAILER'].includes(b.status)).length;
  const totalKg      = batches.reduce((s, b) => s + (b.quantityKg ?? 0), 0);
  const totalPaid    = payments
    .filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'CONFIRMED')
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPending = payments
    .filter(p => p.paymentStatus === 'PENDING')
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const toFarmer     = payments.filter(p => p.paymentType === 'PRODUCE_PAYMENT').reduce((s, p) => s + (p.amount ?? 0), 0);
  const toTransporter = payments.filter(p => p.paymentType === 'TRANSPORT_PAYMENT').reduce((s, p) => s + (p.amount ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
          <p className="text-white/40 font-black uppercase tracking-widest text-xs">Loading Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl" style={{ background: '#f9731615', border: '1px solid #f9731640' }}>
              <Store className="w-6 h-6 text-orange-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white">Retailer Hub</h1>
          </div>
          <p className="text-white/40 text-sm font-medium ml-1">
            Welcome, <span className="text-orange-400 font-bold">{user?.fullName}</span> — manage received batches and payments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/market')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Sourcing Market
          </button>
        </div>
      </motion.div>

      {/* ─── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="w-5 h-5" />}       label="In Transit"     value={inTransit}                                    color="#3b82f6" delay={0}   />
        <StatCard icon={<Inbox className="w-5 h-5" />}       label="Received"       value={delivered}                                    color="#22c55e" delay={0.1} />
        <StatCard icon={<Layers className="w-5 h-5" />}      label="Total Stock"    value={`${totalKg} KG`}                              color="#f97316" delay={0.2} />
        <StatCard icon={<IndianRupee className="w-5 h-5" />} label="Total Paid Out" value={`₹${totalPaid.toLocaleString('en-IN')}`}      color="#8b5cf6" delay={0.3} />
      </div>

      {/* ─── Payments Summary Card ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl border border-white/10 p-6 grid grid-cols-1 sm:grid-cols-3 gap-6"
        style={{ background: 'linear-gradient(135deg, #1a0d24 0%, #1a0a20 50%, #0F2027 100%)' }}
      >
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl" style={{ background: '#8b5cf615', border: '1px solid #8b5cf630' }}>
              <CreditCard className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">Payments Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Paid to Farmers',      value: `₹${toFarmer.toLocaleString('en-IN')}`,      color: '#22c55e' },
              { label: 'Paid to Transporters', value: `₹${toTransporter.toLocaleString('en-IN')}`, color: '#3b82f6' },
              { label: 'Pending Payments',      value: `₹${totalPending.toLocaleString('en-IN')}`, color: '#f59e0b' },
              { label: 'Total Transactions',    value: payments.length,                             color: '#8b5cf6' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/5" style={{ background: '#ffffff08' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: item.color + 'aa' }}>{item.label}</p>
                <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Spending Breakdown Donut */}
        <div className="flex flex-col justify-center items-center gap-3 p-6 rounded-xl border border-white/5 text-center" style={{ background: '#ffffff05' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#8b5cf615', border: '1px solid #8b5cf630' }}>
            <TrendingDown className="w-7 h-7 text-violet-400" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Spend</p>
          <p className="text-3xl font-black text-white tracking-tighter">
            ₹{(totalPaid + totalPending).toLocaleString('en-IN')}
          </p>
          <div className="w-full space-y-2 pt-2">
            {[
              { label: 'To Farmers',      val: toFarmer,      total: toFarmer + toTransporter, color: '#22c55e' },
              { label: 'To Transporters', val: toTransporter,  total: toFarmer + toTransporter, color: '#3b82f6' },
            ].map((row, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] font-black text-white/40 mb-1 uppercase tracking-widest">
                  <span>{row.label}</span>
                  <span style={{ color: row.color }}>{row.total > 0 ? Math.round((row.val / row.total) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 rounded-full w-full" style={{ background: '#ffffff10' }}>
                  <div className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: row.total > 0 ? `${(row.val / row.total) * 100}%` : '0%', background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Intelligence Terminal (Categorized Notifications) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6 mt-8">
            <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
              <Zap className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Intelligence Terminal</h2>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live categorization of decentralized signals</p>
            </div>
            <button 
              onClick={() => navigate('/notifications')}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all shadow-xl shadow-black/20"
            >
              Signal Archives <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="rounded-[2.5rem] border border-white/5 p-8 shadow-2xl overflow-hidden relative" style={{ background: '#ffffff03' }}>
             {/* Decorative Radial */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-[100px] rounded-full pointer-events-none"></div>
             <NotificationFeed limit={4} />
          </div>
        </div>

        <div className="flex flex-col gap-6 mt-0 lg:mt-[4.5rem]">
           <div className="p-8 rounded-[2.5rem] border border-sky-500/10 relative overflow-hidden group shadow-xl" style={{ background: 'linear-gradient(to bottom right, #0a1128, #001f3f05)' }}>
              <div className="relative z-10">
                 <Activity className="w-8 h-8 text-sky-400 mb-4 group-hover:scale-110 transition-transform" />
                 <h4 className="text-lg font-black text-white mb-1 tracking-tight">Signal Analysis</h4>
                 <p className="text-xs text-white/40 mb-6 leading-relaxed">System monitoring <span className="text-sky-400 font-bold">ACTIVE</span> acquisition channels and logistics frequencies.</p>
                 <button onClick={() => navigate('/market')} className="w-full py-4 bg-sky-500/10 text-sky-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20">Scan Marketplace</button>
              </div>
           </div>
           
           <div className="p-8 rounded-[2.5rem] border border-emerald-500/10 relative overflow-hidden group shadow-xl" style={{ background: 'linear-gradient(to bottom right, #0a2811, #001f3f05)' }}>
              <div className="relative z-10">
                 <TrendingUp className="w-8 h-8 text-emerald-400 mb-4 group-hover:-translate-y-1 transition-transform" />
                 <h4 className="text-lg font-black text-white mb-1 tracking-tight">Financial Flow</h4>
                 <p className="text-xs text-white/40 mb-6 leading-relaxed">Verified payments total <span className="text-emerald-400 font-bold">₹{totalPaid.toLocaleString()}</span> on the immutable ledger.</p>
                 <button onClick={() => navigate('/payments')} className="w-full py-4 bg-emerald-500/10 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20">Settlement Ledger</button>
              </div>
           </div>
        </div>
      </div>

      <div className="mt-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: '#0a1520' }}
      >
        {/* Table Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5"
          style={{ background: 'linear-gradient(90deg, #1a0d10 0%, #0a1520 100%)' }}>
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-black text-white tracking-tight">Received Batches</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-orange-400 border border-orange-500/30" style={{ background: '#f9731615' }}>
              {batches.length}
            </span>
          </div>
        </div>

        {/* Empty State */}
        {batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#f9731610', border: '1px solid #f9731630' }}>
              <Package className="w-8 h-8 text-orange-400/40" />
            </div>
            <p className="text-white/30 font-black uppercase tracking-widest text-xs">No batches received yet</p>
            <p className="text-white/20 text-sm">Batches transferred to you will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {batches.map((batch, index) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="p-5 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex flex-col xl:flex-row xl:items-center gap-5">

                  {/* ── Batch Info Grid ── */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* Product */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Product</p>
                      <p className="text-sm font-black text-white">{batch.productName}</p>
                      {batch.qualityGrade && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase"
                          style={{ background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b30' }}>
                          Grade {batch.qualityGrade}
                        </span>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Quantity</p>
                      <p className="text-sm font-black text-white">{batch.quantityKg} <span className="text-white/30 text-xs">KG</span></p>
                      {batch.pricePerKg && (
                        <p className="text-[10px] text-white/30 font-medium">₹{batch.pricePerKg}/kg</p>
                      )}
                    </div>

                    {/* Farmer */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Farmer</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: '#22c55e20', color: '#22c55e' }}>
                          {batch.farmer?.fullName?.[0] ?? 'F'}
                        </div>
                        <p className="text-sm font-bold text-white/80 truncate max-w-[100px]">
                          {batch.farmer?.fullName ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* Batch Code */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Batch ID</p>
                      <p className="font-mono text-xs font-black text-orange-400 truncate">{batch.batchCode}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Status</p>
                      <StatusBadge status={batch.status} />
                    </div>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="flex flex-wrap gap-2 min-w-fit">
                    {/* Accept */}
                    {batch.status === 'DELIVERED' && (
                      <button
                        onClick={() => setAcceptBatchId(batch.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
                        style={{ background: '#22c55e15', color: '#22c55e', border: '1px solid #22c55e30' }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Accept
                      </button>
                    )}

                    {/* Confirm Delivery */}
                    {['ACCEPTED_BY_RETAILER', 'IN_TRANSIT', 'DELIVERED'].includes(batch.status) && (
                      <button
                        onClick={() => setConfirmBatchId(batch.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
                        style={{ background: '#8b5cf615', color: '#8b5cf6', border: '1px solid #8b5cf630' }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Confirm
                      </button>
                    )}

                    {/* Pay Farmer */}
                    {batch.farmer && (
                      <button
                        onClick={() => setPayModal({
                          open: true,
                          batchId: batch.id,
                          type: 'FARMER',
                          recipientId: batch.farmer!.id,
                          recipientName: batch.farmer!.fullName,
                        })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
                        style={{ background: '#10b98115', color: '#10b981', border: '1px solid #10b98130' }}
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        Pay Farmer
                      </button>
                    )}

                    {/* Pay Transporter */}
                    <button
                      onClick={() => setPayModal({
                        open: true,
                        batchId: batch.id,
                        type: 'TRANSPORTER',
                        recipientId: batch.currentOwner?.id ?? null,
                        recipientName: 'Transporter',
                      })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
                      style={{ background: '#3b82f615', color: '#3b82f6', border: '1px solid #3b82f630' }}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Pay Transport
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ─── Recent Payments List ─────────────────────────────────────────────── */}
      {payments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: '#0a1520' }}
        >
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5"
            style={{ background: 'linear-gradient(90deg, #1a0d10 0%, #0a1520 100%)' }}>
            <CreditCard className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-black text-white tracking-tight">Recent Payments Made</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-violet-400 border border-violet-500/30" style={{ background: '#8b5cf615' }}>
              {payments.length}
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {payments.slice(0, 10).map((p, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: p.paymentType === 'PRODUCE_PAYMENT' ? '#10b98115' : '#3b82f615',
                      border: `1px solid ${p.paymentType === 'PRODUCE_PAYMENT' ? '#10b98130' : '#3b82f630'}`
                    }}>
                    {p.paymentType === 'PRODUCE_PAYMENT'
                      ? <User className="w-4 h-4 text-emerald-400" />
                      : <Truck className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">
                      {p.paymentType === 'PRODUCE_PAYMENT' ? 'Paid to Farmer' : 'Paid to Transporter'}
                    </p>
                    <p className="text-[10px] text-white/30 font-medium">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">₹{(p.amount ?? 0).toLocaleString('en-IN')}</p>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'CONFIRMED'
                      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                      : p.paymentStatus === 'PENDING'
                        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                        : 'text-red-400 border-red-500/30 bg-red-500/10'
                  }`}>{p.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      </div>

      {/* ══════════════════════════ MODALS ══════════════════════════════════════ */}

      {/* ─── Accept Confirm Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {acceptBatchId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="rounded-3xl p-8 max-w-sm w-full border border-white/10 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0a1a24 100%)' }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: '#22c55e15', border: '1px solid #22c55e30' }}>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Accept Batch?</h3>
                    <p className="text-white/40 text-xs font-medium">Status → ACCEPTED_BY_RETAILER</p>
                  </div>
                </div>
                <button onClick={() => setAcceptBatchId(null)} className="text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAcceptBatchId(null)}
                  className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 border border-white/10 hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={handleAccept} disabled={acceptLoading}
                  className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }}>
                  {acceptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Accept
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Confirm Delivery Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmBatchId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="rounded-3xl p-8 max-w-sm w-full border border-white/10 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0a1a24 100%)' }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: '#8b5cf615', border: '1px solid #8b5cf630' }}>
                    <ShieldCheck className="w-6 h-6 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Confirm Delivery?</h3>
                    <p className="text-white/40 text-xs font-medium">This marks the batch as DELIVERED_FINAL</p>
                  </div>
                </div>
                <button onClick={() => setConfirmBatchId(null)} className="text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 rounded-xl mb-5 flex items-center gap-2 text-xs text-amber-400/70 font-medium"
                style={{ background: '#f59e0b08', border: '1px solid #f59e0b20' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Make sure you have physically received the goods before confirming.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmBatchId(null)}
                  className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 border border-white/10 hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button onClick={handleConfirmDelivery} disabled={confirmLoading}
                  className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)' }}>
                  {confirmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Payment Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {payModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              className="rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0a1520 100%)' }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl"
                    style={{
                      background: payModal.type === 'FARMER' ? '#10b98115' : '#3b82f615',
                      border: `1px solid ${payModal.type === 'FARMER' ? '#10b98130' : '#3b82f630'}`
                    }}>
                    {payModal.type === 'FARMER'
                      ? <User className="w-6 h-6 text-emerald-400" />
                      : <Truck className="w-6 h-6 text-blue-400" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">
                      Pay {payModal.type === 'FARMER' ? 'Farmer' : 'Transporter'}
                    </h3>
                    <p className="text-white/40 text-xs font-medium">
                      To: <span className="font-black" style={{ color: payModal.type === 'FARMER' ? '#10b981' : '#3b82f6' }}>
                        {payModal.recipientName}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPayModal({ open: false, batchId: null, type: null, recipientId: null, recipientName: '' });
                    setPayAmount(''); setPayMethod('ONLINE');
                  }}
                  className="text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Payment Type Badge */}
              <div className="mb-5 px-4 py-2.5 rounded-xl flex items-center gap-3 border border-white/5" style={{ background: '#ffffff06' }}>
                <IndianRupee className="w-4 h-4 text-white/30" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Payment Type</p>
                  <p className="text-sm font-black text-white">
                    {payModal.type === 'FARMER' ? 'PRODUCE_PAYMENT — Farm to Market' : 'TRANSPORT_PAYMENT — Logistics Fee'}
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-black text-sm">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl pl-8 pr-4 py-3.5 text-sm font-black text-white focus:outline-none transition-all"
                      style={{
                        background: '#ffffff08',
                        border: '1px solid rgba(255,255,255,0.12)',
                        caretColor: payModal.type === 'FARMER' ? '#10b981' : '#3b82f6'
                      }}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                    Payment Method *
                  </label>
                  <div className="relative">
                    <select
                      value={payMethod}
                      onChange={e => setPayMethod(e.target.value)}
                      className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none transition-all appearance-none"
                      style={{ background: '#ffffff08', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <option value="ONLINE"  style={{ background: '#0a1520' }}>💳 Online Transfer</option>
                      <option value="CASH"    style={{ background: '#0a1520' }}>💵 Cash Payment</option>
                      <option value="CHEQUE"  style={{ background: '#0a1520' }}>🏦 Cheque</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  </div>
                </div>

                {/* Method Icons Row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'ONLINE', icon: <CreditCard className="w-4 h-4" />, label: 'Online' },
                    { val: 'CASH',   icon: <Banknote className="w-4 h-4" />,   label: 'Cash' },
                    { val: 'CHEQUE', icon: <IndianRupee className="w-4 h-4" />, label: 'Cheque' },
                  ].map(m => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => setPayMethod(m.val)}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all"
                      style={{
                        background: payMethod === m.val
                          ? (payModal.type === 'FARMER' ? '#10b98120' : '#3b82f620')
                          : '#ffffff06',
                        borderColor: payMethod === m.val
                          ? (payModal.type === 'FARMER' ? '#10b98150' : '#3b82f650')
                          : 'rgba(255,255,255,0.08)',
                        color: payMethod === m.val
                          ? (payModal.type === 'FARMER' ? '#10b981' : '#3b82f6')
                          : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Confirm / Cancel */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayModal({ open: false, batchId: null, type: null, recipientId: null, recipientName: '' });
                      setPayAmount(''); setPayMethod('ONLINE');
                    }}
                    className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 border border-white/10 hover:bg-white/5 transition-all">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={payLoading || !payAmount || parseFloat(payAmount) <= 0}
                    className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    style={{
                      background: payModal.type === 'FARMER'
                        ? 'linear-gradient(135deg, #065f46 0%, #10b981 100%)'
                        : 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)'
                    }}>
                    {payLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <IndianRupee className="w-4 h-4" />}
                    Confirm Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RetailerDashboard;
