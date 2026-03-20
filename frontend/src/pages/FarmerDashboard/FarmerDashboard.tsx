import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, TrendingUp, Truck, CheckCircle, Clock, QrCode,
  Pencil, Trash2, ArrowRight, DollarSign, TrendingUp as TrendingIcon, 
  IndianRupee, CreditCard, AlertCircle, CheckCircle as CheckIcon, 
  XCircle, Inbox, Send, MessageSquare, User, Bell, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productRequestAPI, batchAPI, userAPI, statsAPI, paymentAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import AnalyticsSection from '../../components/AnalyticsSection';
import NotificationFeed from '../../components/NotificationFeed';

interface Batch {
  id: number;
  batchCode: string;
  productName: string;
  quantityKg: number;
  pricePerKg: number;
  status: string;
  qualityGrade: string;
  harvestDate: string;
  expiryDate: string;
  description?: string;
  currentOwner?: { id: number; fullName: string };
}

const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const location = useLocation();
  const isBatchesPage = location.pathname.includes('/farmer-batches');
  const [activeTab, setActiveTab] = useState('ALL');

  // Users List (only transporters for transfer)
  const [usersList, setUsersList] = useState<any[]>([]);

  // Trade Requests
  const [tradeRequests, setTradeRequests] = useState<any[]>([]);
  const [requestLoading, setRequestLoading] = useState(false);

  // Payments received by this farmer
  const [payments, setPayments] = useState<any[]>([]);

  // Modals specific states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editBatchId, setEditBatchId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBatchId, setDeleteBatchId] = useState<number | null>(null);
  const [deleteBatchName, setDeleteBatchName] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferBatchId, setTransferBatchId] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    productName: '',
    quantityKg: '',
    pricePerKg: '',
    qualityGrade: 'A',
    harvestDate: '',
    expiryDate: '',
    description: '',
  });

  const [transferData, setTransferData] = useState({
    newOwnerId: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchBatches();
    fetchUsers();
    fetchAnalytics();
    fetchPayments();
    fetchTradeRequests();
  }, [user]);

  const fetchTradeRequests = async () => {
    if (!user?.id) return;
    try {
      const res = await productRequestAPI.getReceivedRequests(user.id);
      const all: any[] = res.data.data || [];
      // Show PENDING requests OR ACCEPTED but NOT YET PAID
      setTradeRequests(all.filter(r => 
        r.status === 'PENDING' || (r.status === 'ACCEPTED' && !r.isPaid)
      ));
    } catch (e) {
      console.error("Failed to fetch requests", e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      if (user?.id) {
        const res = await statsAPI.getFarmerStats(user.id);
        const data = res.data.data;

        // Transform the map data { "Jan": 200 } to [ { label: "Jan", value: 200 } ]
        const transform = (obj: any) => Object.entries(obj).map(([label, value]) => ({ label, value: Number(value) }));

        setAnalyticsData({
          revenue: transform(data.monthlyRevenue),
          production: transform(data.monthlyProduction)
        });
      }
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    }
  };

  const fetchBatches = async () => {
    try {
      if (user?.id) {
        const response = await batchAPI.getBatchesByFarmer(user.id);
        setBatches(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch batches!');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAllUsers();
      if (res.data && res.data.data) {
        // Farmers can ONLY transfer to TRANSPORTERS
        const transporters = res.data.data.filter((u: any) => u.role === 'TRANSPORTER');
        setUsersList(transporters);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const fetchPayments = async () => {
    try {
      if (!user?.id) return;
      const res = await paymentAPI.getPaymentsByUser(user.id);
      const all: any[] = res.data.data || [];
      // Only payments received by farmer (PRODUCE_PAYMENT)
      const received = all.filter(
        (p: any) => p.paymentType === 'PRODUCE_PAYMENT' &&
          p.receiver?.id === user.id
      );
      setPayments(received);
    } catch (e) {
      console.error('Failed to fetch payments', e);
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number, lon: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const handleOpenCreate = () => {
    setFormData({ productName: '', quantityKg: '', pricePerKg: '', qualityGrade: 'A', harvestDate: '', expiryDate: '', description: '' });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const batchData = {
        ...formData,
        quantityKg: parseFloat(formData.quantityKg),
        pricePerKg: parseFloat(formData.pricePerKg),
        harvestDate: formData.harvestDate,
        expiryDate: formData.expiryDate,
        farmer: { id: user?.id },
        status: 'CREATED',
      };
      await batchAPI.createBatch(batchData);
      toast.success('Batch created successfully!');
      setShowCreateModal(false);
      fetchBatches();
    } catch (error) {
      toast.error('Failed to create batch!');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (batch: Batch) => {
    setFormData({
      productName: batch.productName || '',
      quantityKg: batch.quantityKg ? batch.quantityKg.toString() : '',
      pricePerKg: batch.pricePerKg ? batch.pricePerKg.toString() : '',
      qualityGrade: batch.qualityGrade || 'A',
      harvestDate: batch.harvestDate || '',
      expiryDate: batch.expiryDate || '',
      description: batch.description || '',
    });
    setEditBatchId(batch.id);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const batchData = {
        ...formData,
        quantityKg: parseFloat(formData.quantityKg),
        pricePerKg: parseFloat(formData.pricePerKg),
        harvestDate: formData.harvestDate,
        expiryDate: formData.expiryDate,
      };
      await batchAPI.updateBatch(editBatchId!, batchData);
      toast.success('Batch updated successfully!');
      setShowEditModal(false);
      fetchBatches();
    } catch (error) {
      toast.error('Failed to update batch!');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenDelete = (id: number, name: string) => {
    setDeleteBatchId(id);
    setDeleteBatchName(name);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await batchAPI.deleteBatch(deleteBatchId!);
      toast.success('Batch deleted successfully!');
      setShowDeleteModal(false);
      fetchBatches();
    } catch (err) {
      toast.error('Failed to delete batch!');
    }
  };

  const handleConfirmPayment = async (id: number) => {
    try {
      await paymentAPI.confirmPayment(id);
      toast.success('Payment receipt verified!');
      fetchPayments();
      // Also refresh batches as settlement might trigger ownership transfer
      fetchBatches();
    } catch (e) {
      toast.error('Failed to verify payment reception');
    }
  };

  const handleOpenTransfer = (id: number) => {
    setTransferBatchId(id);
    setTransferData({ newOwnerId: '', location: '', notes: '' });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true); // Reuse loading state
    try {
      if (!transferData.newOwnerId) {
        toast.warning('Please select a user to transfer to');
        return;
      }

      // Attempt to get current geolocation for the map
      const coords = await getCurrentLocation();

      await batchAPI.transferOwnership(
        transferBatchId!,
        Number(transferData.newOwnerId),
        transferData.location,
        transferData.notes,
        coords?.lat,
        coords?.lon
      );
      toast.success('Batch transferred successfully!');
      setShowTransferModal(false);
      fetchBatches();
    } catch (err) {
      toast.error('Failed to transfer batch!');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTradeAction = async (requestId: number, status: 'ACCEPTED' | 'REJECTED') => {
    setRequestLoading(true);
    try {
      await productRequestAPI.updateRequestStatus(requestId, status);
      toast.success(`Trade Request ${status.toLowerCase()} successfully!`);
      fetchTradeRequests();
      fetchBatches(); // Refresh batches as ownership/status might have changed
    } catch (err) {
      toast.error('Failed to update trade request status');
    } finally {
      setRequestLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-blue-500';
      case 'IN_TRANSIT': return 'bg-amber-500';
      case 'DELIVERED': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CREATED': return <Clock className="w-4 h-4" />;
      case 'IN_TRANSIT': return <Truck className="w-4 h-4" />;
      case 'DELIVERED': return <CheckCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const stats = [
    {
      title: 'Total Batches',
      value: batches.length,
      icon: <Package className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'In Transit',
      value: batches.filter(b => b.status === 'IN_TRANSIT').length,
      icon: <Truck className="w-6 h-6" />,
      color: 'from-amber-500 to-amber-600',
    },
    {
      title: 'Delivered',
      value: batches.filter(b => b.status === 'DELIVERED').length,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Total KG',
      value: batches.reduce((sum, b) => sum + b.quantityKg, 0).toFixed(0),
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  const filteredBatches = batches.filter(b => {
    // 1. Only show batches where this user is the current physical owner
    const isOwned = b.currentOwner?.id === user?.id;
    if (!isOwned) return false;

    // 2. Apply tab filter if on Batches page
    if (isBatchesPage && activeTab !== 'ALL') {
      return b.status === activeTab;
    }
    return true;
  });

  return (
    <div>
      <div className="max-w-7xl mx-auto pb-10">

        {/* Welcome */}
        {!isBatchesPage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-black text-app-text tracking-tighter">
              Welcome back, <span className="text-emerald-500">{user?.fullName}! 👋</span>
            </h2>
            <p className="text-app-text-secondary mt-1 font-medium">Manage your produce batches on the decentralized ledger</p>
          </motion.div>
        )}

        {/* Stats */}
        {!isBatchesPage && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-app-card backdrop-blur-xl rounded-[2rem] p-6 border border-app-border shadow-xl shadow-black/5"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-black/10`}>
                  {stat.icon}
                </div>
                <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1">{stat.title}</p>
                <p className="text-app-text text-3xl font-black tracking-tighter">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ─── Signals & Intelligence (Notifications) ─── */}
        {!isBatchesPage && (
          <div className="mb-14 px-4">
            <div className="flex items-center gap-3 mb-8">
               <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20 shadow-lg shadow-violet-500/5">
                 <Bell className="w-7 h-7 text-violet-500" />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-app-text tracking-tight uppercase">Signals & Intel</h3>
                 <p className="text-app-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60">System-wide frequency monitor</p>
               </div>
               <div className="ml-auto">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 bg-app-card border border-app-border rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-500/5"
                    onClick={() => navigate('/notifications')}
                  >
                    Signal Archives <ChevronRight className="w-3 h-3" />
                  </motion.div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               {/* Notification Feed (Left) */}
               <div className="lg:col-span-8 bg-app-card/30 backdrop-blur-2xl border border-app-border/40 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-violet-500/10 transition-colors"></div>
                  <NotificationFeed limit={4} />
               </div>

               {/* Quick Insights (Right) */}
               <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="p-8 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                     <div className="relative z-10">
                        <DollarSign className="w-8 h-8 text-emerald-500 mb-4 group-hover:rotate-12 transition-transform" />
                        <h4 className="text-xl font-black text-app-text mb-1 tracking-tight">Active Trade</h4>
                        <p className="text-xs text-app-text-muted mb-6 leading-relaxed">System has detected <span className="text-emerald-400 font-bold">{tradeRequests.length}</span> incoming acquisition signals.</p>
                        <button onClick={() => navigate('/market', { state: { activeTab: 'requests' }})} className="w-full py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.03] transition-all">Resolve Signals</button>
                     </div>
                  </div>
                  
                  <div className="p-8 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                     <div className="relative z-10">
                        <Truck className="w-8 h-8 text-blue-500 mb-4 group-hover:-translate-x-1 transition-transform" />
                        <h4 className="text-xl font-black text-app-text mb-1 tracking-tight">Logistics Hub</h4>
                        <p className="text-xs text-app-text-muted mb-6 leading-relaxed">Monitor your verified produce instances in transit across the ledger.</p>
                        <button onClick={() => setActiveTab('IN_TRANSIT')} className="w-full py-3 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.03] transition-all">Track Movement</button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ─── Actionable Trade Requests ─────────────────────────────────────── */}
        {!isBatchesPage && tradeRequests.length > 0 && (
          <div className="mb-10">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                  <Inbox className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-app-text tracking-tight uppercase">Incoming Requests</h3>
                  <p className="text-app-text-secondary text-xs font-semibold">
                    Retailers awaiting your approval
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                   <span className="px-3 py-1.5 bg-orange-500/10 text-orange-500 text-[10px] font-black rounded-full border border-orange-500/20 animate-pulse tracking-widest uppercase">
                    Action Required
                   </span>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {tradeRequests.map((req, idx) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-app-card backdrop-blur-3xl border border-app-border rounded-[2.5rem] p-8 hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/5 transition-all group relative overflow-hidden flex flex-col h-full"
                    >
                      {/* Decorative Element */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-all"></div>

                      <div className="flex items-center justify-between mb-8">
                         <div className="p-3 rounded-2xl bg-app-bg border border-app-border shadow-inner">
                            <Package className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                         </div>
                         <div className="text-right">
                            <p className="text-2xl font-black text-app-text">{req.quantityRequested} <span className="text-xs text-app-text-muted">KG</span></p>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Order Volume</p>
                         </div>
                      </div>

                      <div className="mb-6 flex-1">
                         <h4 className="text-xl font-black text-app-text mb-1">{req.batch.productName}</h4>
                         <p className="text-[10px] font-mono text-app-text-muted uppercase tracking-[0.2em] mb-6">UID: {req.batch.batchCode}</p>

                         <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-app-bg/50 border border-app-border/5">
                               <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                  <User className="w-4 h-4 text-emerald-400" />
                               </div>
                               <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-app-text-muted">Retailer Profile</p>
                                  <p className="text-sm font-bold text-app-text-secondary">{req.requester.fullName}</p>
                               </div>
                            </div>

                            {req.message && (
                              <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 italic text-xs text-app-text-muted leading-relaxed relative">
                                 <MessageSquare className="w-4 h-4 text-orange-500/30 absolute -top-2 -right-2" />
                                 "{req.message}"
                              </div>
                            )}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-app-border/10">
                        {req.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleTradeAction(req.id, 'REJECTED')}
                              disabled={requestLoading}
                              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-app-bg border border-app-border text-red-500/70 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Decline
                            </button>
                            <button
                              onClick={() => handleTradeAction(req.id, 'ACCEPTED')}
                              disabled={requestLoading}
                              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.03] hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <CheckIcon className="w-4 h-4" />
                              Accept Trade
                            </button>
                          </>
                        ) : (
                          <div className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black text-[10px] uppercase tracking-widest">
                             <Clock className="w-4 h-4 animate-spin" />
                             Awaiting Retailer Payment
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
             </div>
          </div>
        )}

        {/* Analytics Section */}
        {!isBatchesPage && analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <AnalyticsSection
              title="Monthly Revenue"
              subtitle="Earnings from batch sales"
              data={analyticsData.revenue}
              type="area"
              color="#10b981"
              icon={<DollarSign className="w-5 h-5" />}
              formatter={(v) => `₹${v}`}
            />
            <AnalyticsSection
              title="Stock Rotation"
              subtitle="Production volume (KG)"
              data={analyticsData.production}
              type="bar"
              color="#6366f1"
              icon={<TrendingIcon className="w-5 h-5" />}
              formatter={(v) => `${v}kg`}
            />
          </div>
        )}

        {/* Batches Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-black text-app-text tracking-tight">{isBatchesPage ? 'Registry Archives' : 'Recent Nodes'}</h3>
            {isBatchesPage && <p className="text-app-text-secondary text-sm mt-1 font-medium">Track and manage your verified produce instances</p>}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-500/25"
          >
            <Plus className="w-5 h-5" />
            Create Batch
          </motion.button>
        </div>

        {/* Filter Tabs for Batches Page */}
        {isBatchesPage && (
          <div className="flex flex-wrap gap-2 mb-6">
            {['ALL', 'CREATED', 'IN_TRANSIT', 'DELIVERED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border ${activeTab === tab
                    ? 'bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/20'
                    : 'bg-app-card text-app-text-muted border-app-border hover:text-emerald-500'
                  }`}
              >
                {tab === 'ALL' ? 'All Batches' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}

        {/* Batches List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-app-card rounded-2xl border border-app-border"
          >
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No batches found</p>
            <p className="text-gray-600 text-sm mt-1">Try changing categories or create a new batch!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBatches.map((batch, index) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-app-card backdrop-blur-xl rounded-2xl p-5 border border-app-border hover:border-green-500 hover:border-opacity-50 transition-all duration-500 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h4 className="font-black text-xl text-app-text tracking-tight">{batch.productName}</h4>
                      <p className="text-app-text-muted text-[10px] mt-1 font-mono uppercase tracking-widest opacity-60">ID: {batch.batchCode}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-current shadow-sm ${getStatusColor(batch.status)} bg-opacity-10 text-current`}>
                      {getStatusIcon(batch.status)}
                      <span className="text-[10px] font-black uppercase tracking-widest">{batch.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-app-bg/50 rounded-2xl p-4 border border-app-border/5">
                      <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Volume</p>
                      <p className="font-black text-app-text text-xl tracking-tighter">{batch.quantityKg} <span className="text-xs text-app-text-muted">KG</span></p>
                    </div>
                    <div className="bg-app-bg/50 rounded-2xl p-4 border border-app-border/5">
                      <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Unit Val</p>
                      <p className="font-black text-app-text text-xl tracking-tighter">₹{batch.pricePerKg}</p>
                    </div>
                    <div className="bg-app-bg/50 rounded-2xl p-4 border border-app-border/5">
                      <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Grade</p>
                      <p className="font-black text-app-text tracking-tight uppercase">{batch.qualityGrade}</p>
                    </div>
                    <div className="bg-app-bg/50 rounded-2xl p-4 border border-app-border/5">
                      <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Origin Date</p>
                      <p className="font-black text-app-text-secondary text-xs">{batch.harvestDate}</p>
                    </div>
                  </div>
                </div>

                <div>
                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-app-border">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenEdit(batch)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-yellow-500 bg-opacity-10 hover:bg-opacity-20 text-yellow-500 transition-all text-sm font-medium"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenTransfer(batch.id)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500 bg-opacity-10 hover:bg-opacity-20 text-blue-500 transition-all text-sm font-medium"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Transfer
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenDelete(batch.id, batch.productName)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500 bg-opacity-10 hover:bg-opacity-20 text-red-500 transition-all text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </motion.button>
                  </div>

                  {/* QR Code Button */}
                  <div className="mt-3">
                    <a
                      href={`http://localhost:8080/api/qr/batch/${batch.batchCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-app-bg hover:bg-opacity-80 transition-all py-2.5 rounded-xl text-sm font-medium border border-app-border"
                    >
                      <QrCode className="w-4 h-4" />
                      View QR Code
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {/* Create/Edit Batch Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-app-card rounded-3xl p-6 w-full max-w-md border border-app-border max-h-screen overflow-y-auto custom-scrollbar shadow-2xl transition-all duration-500"
            >
              <h3 className="text-xl font-bold mb-6">
                {showEditModal ? 'Edit Batch' : 'Create New Batch'}
              </h3>
              <form onSubmit={showEditModal ? handleEditSubmit : handleCreateSubmit} className="space-y-4">

                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Product Name</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g. Tomato, Wheat"
                    required
                    className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Quantity (KG)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.quantityKg}
                      onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })}
                      placeholder="500"
                      required
                      className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Price/KG (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.pricePerKg}
                      onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                      placeholder="25"
                      required
                      className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Quality Grade</label>
                  <select
                    value={formData.qualityGrade}
                    onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                    className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                  >
                    <option value="A" className="bg-app-bg">Grade A - Premium</option>
                    <option value="B" className="bg-app-bg">Grade B - Standard</option>
                    <option value="C" className="bg-app-bg">Grade C - Economy</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Harvest Date</label>
                    <input
                      type="date"
                      value={formData.harvestDate}
                      onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                      required
                      className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                      style={{ colorScheme: theme }}
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      required
                      className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                      style={{ colorScheme: theme }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                    className="flex-1 bg-app-bg hover:bg-opacity-80 border border-app-border py-3 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 shadow-lg text-white py-3 rounded-xl font-semibold transition-all"
                  >
                    {createLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{showEditModal ? 'Saving...' : 'Creating...'}</span>
                      </div>
                    ) : (
                      <>{showEditModal ? 'Save Details' : 'Create Batch'}</>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-app-card rounded-3xl p-6 w-full max-w-sm border border-app-border shadow-2xl text-center transition-all duration-500"
            >
              <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-app-text text-2xl font-black mb-2 tracking-tighter">Delete Batch Instance?</h3>
              <p className="text-app-text-secondary text-sm mb-10 font-medium">
                Are you sure you want to delete <span className="text-app-text font-black underline decoration-red-500/30">{deleteBatchName}</span>? This action is permanent and clears high-fidelity node data.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all shadow-lg"
                >
                  Confirm Delete
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Transfer Batch Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-app-card rounded-3xl p-6 w-full max-w-md border border-app-border shadow-2xl transition-all duration-500"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ArrowRight className="text-blue-500" />
                Transfer Ownership
              </h3>
              <form onSubmit={handleTransferSubmit} className="space-y-4">

                <div>
                  <label className="text-slate-600 dark:text-gray-300 text-sm mb-2 block font-bold">
                    Select Transporter
                  </label>
                  {usersList.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      No transporters are registered in this system yet.
                    </div>
                  ) : (
                    <select
                      value={transferData.newOwnerId}
                      onChange={(e) => setTransferData({ ...transferData, newOwnerId: e.target.value })}
                      required
                      className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="" disabled>— Select a Transporter —</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>
                          🚚 {u.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[10px] text-app-text-muted mt-1.5 font-medium">
                    Only transporters can receive batch transfers from farmers.
                  </p>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-gray-300 text-sm mb-1 block">Current Location</label>
                  <input
                    type="text"
                    value={transferData.location}
                    onChange={(e) => setTransferData({ ...transferData, location: e.target.value })}
                    placeholder="e.g. Warehouse A, Port Blair"
                    required
                    className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-gray-300 text-sm mb-1 block">Transfer Notes</label>
                  <input
                    type="text"
                    value={transferData.notes}
                    onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                    placeholder="e.g. Quality sealed, Ready for dispatch"
                    className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 bg-app-bg hover:bg-opacity-80 border border-app-border py-3 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 text-white py-3 rounded-xl font-semibold transition-all"
                  >
                    Transfer Batch
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Payments Received Section ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto pb-10 mt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <IndianRupee className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-app-text tracking-tight">Payments Received</h3>
            <p className="text-app-text-muted text-xs font-medium">
              Produce payments sent to you by retailers
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {payments.filter(p => p.paymentStatus === 'PENDING').length} Pending
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {payments.filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'CONFIRMED').length} Received
            </span>
          </div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-app-card rounded-2xl p-5 border border-app-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted mb-2">Total Received</p>
            <p className="text-2xl font-black text-emerald-500 tracking-tighter">
              ₹{payments
                .filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'CONFIRMED')
                .reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
                .toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-app-card rounded-2xl p-5 border border-app-border">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted mb-2">Pending</p>
            <p className="text-2xl font-black text-amber-400 tracking-tighter">
              ₹{payments
                .filter(p => p.paymentStatus === 'PENDING')
                .reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
                .toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-app-card rounded-2xl p-5 border border-app-border">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-app-text-muted" />
              <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted">Transactions</p>
            </div>
            <p className="text-2xl font-black text-app-text tracking-tighter">{payments.length}</p>
          </div>
        </div>

        {/* Payments Table */}
        {payments.length === 0 ? (
          <div className="bg-app-card rounded-2xl border border-app-border p-12 text-center">
            <IndianRupee className="w-12 h-12 text-app-text-muted mx-auto mb-3 opacity-30" />
            <p className="text-app-text-muted font-black uppercase tracking-widest text-xs">No payments received yet</p>
            <p className="text-app-text-secondary text-sm mt-1">Retailers will pay you here once your batches are sold</p>
          </div>
        ) : (
          <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden">
            {/* Pending Payments */}
            {payments.filter(p => p.paymentStatus === 'PENDING').length > 0 && (
              <div>
                <div className="px-5 py-3 border-b border-app-border bg-amber-500/5 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Pending Payments</span>
                </div>
                <div className="divide-y divide-app-border">
                  {payments.filter(p => p.paymentStatus === 'PENDING').map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <IndianRupee className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-app-text">Produce Payment</p>
                          <p className="text-[10px] text-app-text-muted font-medium">
                            {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-sm font-black text-white">₹{(p.amount ?? 0).toLocaleString('en-IN')}</p>
                        <button
                          onClick={() => handleConfirmPayment(p.id)}
                          className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Verify Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed / Completed Payments */}
            {payments.filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'CONFIRMED').length > 0 && (
              <div>
                <div className="px-5 py-3 border-b border-app-border bg-emerald-500/5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Confirmed Payments</span>
                </div>
                <div className="divide-y divide-app-border">
                  {payments
                    .filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'CONFIRMED')
                    .map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <IndianRupee className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-app-text">Produce Payment</p>
                            <p className="text-[10px] text-app-text-muted font-medium">
                              {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">₹{(p.amount ?? 0).toLocaleString('en-IN')}</p>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                            {p.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;