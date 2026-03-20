import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Truck, Package, MapPin, CheckCircle, ArrowRight,
  Navigation, X, ChevronDown, Loader2,
  PackageCheck, AlertTriangle, TrendingUp, IndianRupee,
  RefreshCw, Clock, Layers, ChevronRight,
  Activity, Zap as LogisticsIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { batchAPI, userAPI, paymentAPI, productRequestAPI } from '../../services/api';
import { toast } from 'react-toastify';
import NotificationFeed from '../../components/NotificationFeed';
import { useNavigate } from 'react-router-dom';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Batch {
  id: number;
  batchCode: string;
  productName: string;
  quantityKg: number;
  pricePerKg: number;
  status: string;
  qualityGrade: string;
  farmer?: { id: number; fullName: string; address?: string };
  currentOwner?: { id: number; fullName: string; role: string };
  createdAt?: string;
}

interface RetailerUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  address?: string;
}

interface Payment {
  id: number;
  amount: number;
  paymentStatus: string;
  paymentType: string;
  paymentDate: string;
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  icon, label, value, color, delay = 0
}: {
  icon: React.ReactNode; label: string; value: string | number; color: string; delay?: number;
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
      <div className="p-3 rounded-xl border border-white/10"
        style={{ background: `${color}20` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{label}</p>
        <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
      </div>
    </div>
  </motion.div>
);

// ─── Status Badge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    CREATED:              { color: '#f59e0b', bg: '#f59e0b20', label: 'Awaiting Pickup' },
    IN_TRANSIT:           { color: '#3b82f6', bg: '#3b82f620', label: 'In Transit' },
    DELIVERED:            { color: '#22c55e', bg: '#22c55e20', label: 'Delivered' },
    DELIVERED_FINAL:      { color: '#10b981', bg: '#10b98120', label: 'Final Delivery' },
    ACCEPTED_BY_RETAILER: { color: '#8b5cf6', bg: '#8b5cf620', label: 'At Retailer' },
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
const TransporterDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [retailers, setRetailers] = useState<RetailerUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);

  // Accept modal
  const [acceptBatchId, setAcceptBatchId] = useState<number | null>(null);

  // Update location modal
  const [locationModal, setLocationModal] = useState<{ open: boolean; batchId: number | null }>({ open: false, batchId: null });
  const [locationInput, setLocationInput] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  // Deliver modal
  const [deliverModal, setDeliverModal] = useState<{ open: boolean; batchId: number | null }>({ open: false, batchId: null });
  const [selectedRetailerId, setSelectedRetailerId] = useState('');
  const [deliverLoading, setDeliverLoading] = useState(false);

  // Detail modal
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [batchRes, userRes, payRes] = await Promise.all([
        batchAPI.getBatchesByOwner(user.id),
        userAPI.getAllUsers(),
        paymentAPI.getPaymentsByUser(user.id),
      ]);

      setBatches(batchRes.data.data || []);

      const allUsers: RetailerUser[] = userRes.data.data || [];
      setRetailers(allUsers.filter(u => u.role === 'RETAILER'));

      const rawPayments: Payment[] = payRes.data.data || [];
      // Keep only payments received by this transporter
      setPayments(rawPayments.filter(p => p.paymentType === 'TRANSPORT_PAYMENT'));

      // Fetch pending assignments
      const requestsRes = await productRequestAPI.getTransporterRequests(user.id);
      const allReqs = (requestsRes.data?.data || requestsRes.data || []);
      setPendingAssignments(allReqs.filter((r: any) => r.status === 'PENDING'));
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleConfirmPayment = async (id: number) => {
    try {
      await paymentAPI.confirmPayment(id);
      toast.success('Transport fee receipt verified!');
      fetchAll();
    } catch (error) {
      toast.error('Failed to verify fee reception');
    }
  };

  const handleAccept = async (batchId: number) => {
    try {
      await axios.put(
        `http://localhost:8080/api/transport/${batchId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Batch accepted — now In Transit!');
      setAcceptBatchId(null);
      fetchAll();
    } catch { toast.error('Failed to accept batch'); }
  };

  const handleUpdateLocation = async () => {
    if (!locationModal.batchId || !locationInput.trim()) {
      toast.error('Please enter a location'); return;
    }
    setLocationLoading(true);
    try {
      await axios.put(
        `http://localhost:8080/api/transport/${locationModal.batchId}/update-location`,
        { location: locationInput, notes: locationNotes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }
      );
      toast.success('Location updated successfully!');
      setLocationModal({ open: false, batchId: null });
      setLocationInput(''); setLocationNotes('');
      fetchAll();
    } catch { toast.error('Failed to update location'); }
    finally { setLocationLoading(false); }
  };

  const handleDeliver = async () => {
    if (!deliverModal.batchId || !selectedRetailerId) {
      toast.error('Please select a retailer'); return;
    }
    setDeliverLoading(true);
    try {
      await axios.put(
        `http://localhost:8080/api/transport/${deliverModal.batchId}/deliver/${selectedRetailerId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success('Batch delivered to retailer!');
      setDeliverModal({ open: false, batchId: null });
      setSelectedRetailerId('');
      fetchAll();
    } catch { toast.error('Failed to mark delivery'); }
    finally { setDeliverLoading(false); }
  };

  const totalEarned  = payments.filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'CONFIRMED')
                               .reduce((s, p) => s + (p.amount ?? 0), 0);
  const pendingEarnings = payments.filter(p => p.paymentStatus === 'PENDING')
                                  .reduce((s, p) => s + (p.amount ?? 0), 0);
  const inTransit   = batches.filter(b => b.status === 'IN_TRANSIT').length;
  const delivered   = batches.filter(b => ['DELIVERED', 'DELIVERED_FINAL'].includes(b.status)).length;
  const totalKg     = batches.reduce((s, b) => s + (b.quantityKg ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <p className="text-white/40 font-black uppercase tracking-widest text-xs">Loading Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl" style={{ background: '#3b82f615', border: '1px solid #3b82f640' }}>
              <Truck className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white">Transporter Hub</h1>
          </div>
          <p className="text-white/40 text-sm font-medium ml-1">
            Welcome back, <span className="text-blue-400 font-bold">{user?.fullName}</span> — manage your shipments below.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Truck className="w-5 h-5" />}       label="In Transit"       value={inTransit}              color="#3b82f6" delay={0}   />
        <StatCard icon={<PackageCheck className="w-5 h-5" />} label="Delivered"        value={delivered}              color="#22c55e" delay={0.1} />
        <StatCard icon={<Layers className="w-5 h-5" />}       label="Total Volume"     value={`${totalKg} KG`}        color="#f59e0b" delay={0.2} />
        <StatCard icon={<IndianRupee className="w-5 h-5" />}  label="Total Earned"     value={`₹${totalEarned.toLocaleString('en-IN')}`} color="#10b981" delay={0.3} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl border border-white/10 p-6 grid grid-cols-1 sm:grid-cols-3 gap-6"
        style={{ background: 'linear-gradient(135deg, #071a24 0%, #0a2436 50%, #071a24 100%)' }}
      >
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl" style={{ background: '#10b98115', border: '1px solid #10b98130' }}>
              <IndianRupee className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">Earnings Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, color: '#10b981' },
              { label: 'Pending', value: `₹${pendingEarnings.toLocaleString('en-IN')}`, color: '#f59e0b' },
              { label: 'Batches Handled', value: batches.length, color: '#3b82f6' },
              { label: 'Payments Received', value: payments.length, color: '#8b5cf6' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-white/5" style={{ background: '#ffffff08' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: item.color + 'aa' }}>{item.label}</p>
                <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center items-center gap-3 p-6 rounded-xl border border-white/5 text-center" style={{ background: '#ffffff05' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#10b98115', border: '1px solid #10b98130' }}>
            <TrendingUp className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Performance</p>
          <p className="text-4xl font-black text-white tracking-tighter">
            {batches.length > 0 ? Math.round((delivered / batches.length) * 100) : 0}
            <span className="text-sm text-white/40">%</span>
          </p>
          <p className="text-xs text-white/40 font-medium">Delivery success rate</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: '#0a1a24' }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5"
          style={{ background: 'linear-gradient(90deg, #0d2030 0%, #0a1a24 100%)' }}>
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-black text-white tracking-tight">Assigned Batches</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-blue-400 border border-blue-500/30" style={{ background: '#3b82f615' }}>
              {batches.length}
            </span>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#3b82f610', border: '1px solid #3b82f630' }}>
              <Truck className="w-8 h-8 text-blue-400/40" />
            </div>
            <p className="text-white/30 font-black uppercase tracking-widest text-xs">No batches assigned</p>
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
                className="p-5 hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setSelectedBatch(batch)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Batch Code</p>
                      <p className="font-mono text-sm font-black text-blue-400">{batch.batchCode}</p>
                    </div>
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
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Quantity</p>
                      <p className="text-sm font-black text-white">{batch.quantityKg} <span className="text-white/40 text-xs">KG</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Status</p>
                      <StatusBadge status={batch.status} />
                    </div>
                  </div>

                  <div className="hidden lg:flex items-center gap-2 min-w-[200px]">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#22c55e15', border: '1px solid #22c55e30' }}>
                        <MapPin className="w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-[9px] text-white/30 font-black uppercase">From</p>
                      <p className="text-xs text-white/60 font-bold max-w-[80px] truncate">{batch.farmer?.address ?? 'Farm'}</p>
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="h-px flex-1 border-t border-dashed border-white/10" />
                      <Truck className="w-4 h-4 text-blue-400 mx-1" />
                      <div className="h-px flex-1 border-t border-dashed border-white/10" />
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: '#3b82f615', border: '1px solid #3b82f630' }}>
                        <Navigation className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-[9px] text-white/30 font-black uppercase">To</p>
                      <p className="text-xs text-white/60 font-bold max-w-[80px] truncate">Retailer</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {batch.status !== 'IN_TRANSIT' && !['DELIVERED', 'DELIVERED_FINAL'].includes(batch.status) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setAcceptBatchId(batch.id); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Accept
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setLocationModal({ open: true, batchId: batch.id }); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Update
                    </button>
                    {!['DELIVERED', 'DELIVERED_FINAL'].includes(batch.status) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeliverModal({ open: true, batchId: batch.id }); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-white border border-white/20 hover:bg-white/5 transition-all"
                        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1a3050 100%)' }}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Deliver
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ─── Pending Logistics Assignments ───────────────────────────────────── */}
      {pendingAssignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl border border-dashed border-blue-500/30 overflow-hidden"
          style={{ background: '#0a1a2480' }}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-blue-500/5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-black text-white tracking-tight">Pending Dispatch Assignments</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-blue-400 border border-blue-500/30" style={{ background: '#3b82f615' }}>
                {pendingAssignments.length} NEW
              </span>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {pendingAssignments.map((req, i) => (
              <div key={i} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Truck className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-0.5">Upcoming Route</p>
                    <h4 className="text-sm font-black text-white">{req.batch.productName} — {req.quantityRequested} KG</h4>
                    <p className="text-[10px] text-white/30 font-medium">Requested by: <span className="text-white/60">{req.requester.fullName}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                   <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Status</p>
                      <p className="text-[10px] font-black text-amber-400 uppercase">Awaiting Farmer Approval</p>
                   </div>
                   <div className="w-px h-6 bg-white/10 mx-2"></div>
                   <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Type</p>
                      <p className="text-[10px] font-black text-blue-400 uppercase">Pre-Assigned</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-blue-500/5 text-[10px] text-blue-400/60 font-medium italic border-t border-white/5">
            Note: These jobs are pending farmer verification. Once accepted, they will move to "Assigned Batches".
          </div>
        </motion.div>
      )}

      {/* ─── Logistics Intelligence Terminal ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <LogisticsIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Logistics Intelligence</h2>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Real-time verification of supply signals</p>
            </div>
            <button 
              onClick={() => navigate('/notifications')}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all shadow-xl shadow-black/20"
            >
              Signal Archives <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="rounded-[2.5rem] border border-white/5 p-8 shadow-2xl overflow-hidden relative" style={{ background: '#ffffff03' }}>
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>
             <NotificationFeed limit={4} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
           <div className="p-8 rounded-[2.5rem] border border-blue-500/10 relative overflow-hidden group shadow-xl" style={{ background: 'linear-gradient(to bottom right, #0a1128, #001f3f05)' }}>
              <div className="relative z-10">
                 <Activity className="w-8 h-8 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                 <h4 className="text-lg font-black text-white mb-1 tracking-tight">Active Assignments</h4>
                 <p className="text-xs text-white/40 mb-6 leading-relaxed">System has detected <span className="text-blue-400 font-bold">{pendingAssignments.length}</span> unassigned pickup requests.</p>
                 <button onClick={() => navigate('/transporter-jobs')} className="w-full py-4 bg-blue-500/10 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20">Market Scanning</button>
              </div>
           </div>
           
           <div className="p-8 rounded-[2.5rem] border border-emerald-500/10 relative overflow-hidden group shadow-xl" style={{ background: 'linear-gradient(to bottom right, #0a2811, #001f3f05)' }}>
              <div className="relative z-10">
                 <TrendingUp className="w-8 h-8 text-emerald-400 mb-4 group-hover:-translate-y-1 transition-transform" />
                 <h4 className="text-lg font-black text-white mb-1 tracking-tight">Fleet Earnings</h4>
                 <p className="text-xs text-white/40 mb-6 leading-relaxed">Verified transport fees: <span className="text-emerald-400 font-bold">₹{totalEarned.toLocaleString()}</span> on the ledger.</p>
                 <button onClick={() => navigate('/payments')} className="w-full py-4 bg-emerald-500/10 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20">Revenue Stream</button>
              </div>
           </div>
        </div>
      </div>

      {payments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{ background: '#0a1a24' }}
        >
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5"
            style={{ background: 'linear-gradient(90deg, #0d2030 0%, #0a1a24 100%)' }}>
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white tracking-tight">Transport Payments</h2>
          </div>
          <div className="divide-y divide-white/5">
            {payments.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: p.paymentStatus === 'COMPLETED' ? '#10b98115' : '#f59e0b15', border: `1px solid ${p.paymentStatus === 'COMPLETED' ? '#10b98130' : '#f59e0b30'}` }}>
                    <IndianRupee className="w-4 h-4" style={{ color: p.paymentStatus === 'COMPLETED' ? '#10b981' : '#f59e0b' }} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Transport Payment</p>
                    <p className="text-[10px] text-white/30 font-medium">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="text-sm font-black text-white">₹{(p.amount ?? 0).toLocaleString('en-IN')}</p>
                  {p.paymentStatus === 'PENDING' ? (
                    <button
                      onClick={() => handleConfirmPayment(p.id)}
                      className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Verify Receipt
                    </button>
                  ) : (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      p.paymentStatus === 'COMPLETED' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
                    }`}>{p.paymentStatus}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Accept Confirm Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {acceptBatchId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
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
                    <p className="text-white/40 text-xs font-medium">This will mark the batch as In Transit</p>
                  </div>
                </div>
                <button onClick={() => setAcceptBatchId(null)} className="text-white/30 hover:text-white/70 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAcceptBatchId(null)} className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={() => handleAccept(acceptBatchId)} className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }}>Confirm Accept</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Update Location Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {locationModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0a1a24 100%)' }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: '#f59e0b15', border: '1px solid #f59e0b30' }}>
                    <MapPin className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Update Location</h3>
                    <p className="text-white/40 text-xs font-medium">Log the current transit checkpoint</p>
                  </div>
                </div>
                <button onClick={() => setLocationModal({ open: false, batchId: null })} className="text-white/30 hover:text-white/70 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Current Location *</label>
                  <input
                    type="text" value={locationInput} onChange={e => setLocationInput(e.target.value)} placeholder="E.g., Chennai Highway, Km 42"
                    className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none transition-all"
                    style={{ background: '#ffffff08', border: '1px solid rgba(255,255,255,0.12)', caretColor: '#f59e0b' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Notes (optional)</label>
                  <textarea
                    value={locationNotes} onChange={e => setLocationNotes(e.target.value)} placeholder="Cold storage maintained, ETA 2 hrs..."
                    rows={3} className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none transition-all resize-none"
                    style={{ background: '#ffffff08', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setLocationModal({ open: false, batchId: null })} className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
                  <button onClick={handleUpdateLocation} disabled={locationLoading} className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all" style={{ background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' }}>
                    {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}Update
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Deliver Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deliverModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
              className="rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0a1a24 100%)' }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ background: '#3b82f615', border: '1px solid #3b82f630' }}><ArrowRight className="w-6 h-6 text-blue-400" /></div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Deliver to Retailer</h3>
                    <p className="text-white/40 text-xs font-medium">Mark this batch as delivered</p>
                  </div>
                </div>
                <button onClick={() => setDeliverModal({ open: false, batchId: null })} className="text-white/30 hover:text-white/70 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Select Retailer *</label>
                  <div className="relative">
                    <select
                      value={selectedRetailerId} onChange={e => setSelectedRetailerId(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none transition-all appearance-none"
                      style={{ background: '#ffffff08', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <option value="" style={{ background: '#0a1a24' }}>Choose a retailer…</option>
                      {retailers.map(r => (<option key={r.id} value={r.id} style={{ background: '#0a1a24' }}>{r.fullName} {r.address ? `— ${r.address}` : ''}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-white/5 flex items-center gap-3" style={{ background: '#3b82f608' }}>
                  <Clock className="w-4 h-4 text-blue-400/60" />
                  <p className="text-xs text-white/40 font-medium">Once confirmed, ownership transfers to the retailer node.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setDeliverModal({ open: false, batchId: null })} className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 border border-white/10 hover:bg-white/5 transition-all">Cancel</button>
                  <button onClick={handleDeliver} disabled={deliverLoading || !selectedRetailerId} className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' }}>
                    {deliverLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}Confirm Delivery
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Batch Detail Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="rounded-[2.5rem] max-w-2xl w-full border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0a1a24 100%)' }}
            >
              <div className="relative h-32 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%) shadow-inner' }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }}></div>
                <button onClick={() => setSelectedBatch(null)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-all z-10"><X className="w-5 h-5" /></button>
                <div className="absolute -bottom-8 left-10 p-4 rounded-3xl bg-[#0a1a24] border-4 border-[#0a1a24] shadow-xl">
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20"><Package className="w-8 h-8 text-blue-400" /></div>
                </div>
              </div>

              <div className="p-10 pt-12 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-1">{selectedBatch.productName}</h2>
                    <p className="text-blue-400 font-mono text-sm tracking-widest font-black flex items-center gap-2">BATCH #{selectedBatch.batchCode}<StatusBadge status={selectedBatch.status} /></p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-[120px]">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] mb-1">Quantity</p>
                    <p className="text-2xl font-black text-white">{selectedBatch.quantityKg} <span className="text-xs text-white/40 font-medium">KG</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center"><MapPin className="w-4 h-4 text-green-500" /></div><h3 className="text-xs font-black uppercase tracking-widest text-white/40">Point of Origin</h3></div>
                    <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                      <div><p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Farmer</p><p className="text-sm font-bold text-white">{selectedBatch.farmer?.fullName || 'Registry Unknown'}</p></div>
                      <div><p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Farm Address</p><p className="text-xs text-white/60 leading-relaxed font-medium">{selectedBatch.farmer?.address || 'Premium Farm Node'}</p></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Navigation className="w-4 h-4 text-blue-500" /></div><h3 className="text-xs font-black uppercase tracking-widest text-white/40">Shipment Destination</h3></div>
                    <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                      <div><p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Target Node</p><p className="text-sm font-bold text-white">{selectedBatch.status === 'CREATED' ? 'Awaiting Distribution' : 'Retailer Node'}</p></div>
                      <div><p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Terminal Address</p><p className="text-xs text-white/60 leading-relaxed font-medium italic">Address available upon assignment</p></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Grade</p><span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">{selectedBatch.qualityGrade || 'A+'}</span></div>
                  <div><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Creation</p><p className="text-sm font-bold text-white">{selectedBatch.createdAt ? new Date(selectedBatch.createdAt).toLocaleDateString() : 'N/A'}</p></div>
                  <div><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Market Value</p><p className="text-sm font-black text-emerald-400">₹{selectedBatch.pricePerKg}/kg</p></div>
                  <div><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Total Payload</p><p className="text-sm font-black text-white">₹{(selectedBatch.pricePerKg * selectedBatch.quantityKg).toLocaleString()}</p></div>
                </div>

                <div className="mt-10 p-6 rounded-[2rem] bg-black/20 border border-white/5">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6 flex items-center gap-2"><Clock className="w-3 h-3" /> Shipment Timeline</h4>
                   {[
                     { label: 'Origin Registered', detail: 'System verified by Farmer', active: true, color: 'emerald' },
                     { label: 'In Transit', detail: 'Secure logistics initiated', active: selectedBatch.status !== 'CREATED', color: 'blue' },
                     { label: 'Destination Reached', detail: 'Pending confirmation', active: ['DELIVERED', 'DELIVERED_FINAL', 'ACCEPTED_BY_RETAILER'].includes(selectedBatch.status), color: 'indigo' }
                   ].map((step, i, arr) => (
                     <div key={i} className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${step.active ? `bg-${step.color}-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]` : 'bg-white/10'}`}></div>
                          {i < arr.length - 1 && <div className="w-0.5 h-8 bg-white/5"></div>}
                        </div>
                        <div className={`flex-1 ${i < arr.length - 1 ? 'pb-4' : ''}`}>
                          <p className={`text-[10px] font-black uppercase italic ${step.active ? 'text-white' : 'text-white/20'}`}>{step.label}</p>
                          <p className="text-[9px] text-white/40">{step.detail}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-[#ffffff02] flex gap-4">
                  <button onClick={() => setSelectedBatch(null)} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-all">Close Registry</button>
                  {selectedBatch.status === 'CREATED' && (
                    <button onClick={() => { handleAccept(selectedBatch.id); setSelectedBatch(null); }} className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2">Process Assignment <ArrowRight className="w-4 h-4" /></button>
                  )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransporterDashboard;
