import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Plus,
  History,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Filter,
  DollarSign,
  Search,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';

interface Payment {
  id: number;
  batch: {
    batchCode: string;
    productName: string;
  };
  payer: {
    id: number;
    fullName: string;
  };
  receiver: {
    id: number;
    fullName: string;
  };
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentDate: string;
  fromWallet: string;
  toWallet: string;
}

const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    batchCode: '',
    amount: '',
    paymentMethod: 'ONLINE',
    receiverId: '',
    requestId: null as number | null,
    quantity: ''
  });

  useEffect(() => {
    fetchPayments();

    // Auto-fill form if redirected from ProductRequests
    if (location.state && location.state.batch) {
      setFormData({
        batchCode: location.state.batch.batchCode,
        amount: location.state.amount?.toString() || '',
        paymentMethod: 'ONLINE',
        receiverId: '',
        requestId: location.state.requestId || null,
        quantity: location.state.quantity?.toString() || ''
      });
      setShowModal(true);
    }
  }, [user?.id, location.state]);

  const fetchPayments = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await paymentAPI.getPaymentsByUser(user.id);
      let rawData: Payment[] = res.data.data || [];
      
      // Show relevant payments: Receivers should see their incoming funds
      if (user.role === 'FARMER' || user.role === 'TRANSPORTER') {
        rawData = rawData.filter(p => p.receiver?.id === user.id);
      }
      
      setPayments(rawData);
    } catch (error) {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setSubmitting(true);
      const payload = {
        batch: { batchCode: formData.batchCode },
        payer: { id: user.id },
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        productRequest: formData.requestId ? { id: formData.requestId } : null
      };

      await paymentAPI.createPayment(payload);
      toast.success('Payment initiated successfully!');
      setShowModal(false);
      setFormData({ batchCode: '', amount: '', paymentMethod: 'ONLINE', receiverId: '', requestId: null, quantity: '' });
      fetchPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await paymentAPI.confirmPayment(id);
      toast.success('Payment confirmed!');
      fetchPayments();
    } catch (error) {
      toast.error('Failed to confirm payment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500 text-green-100';
      case 'PENDING': return 'bg-amber-500 text-amber-100';
      case 'FAILED': return 'bg-red-500 text-red-100';
      default: return 'bg-slate-500 text-slate-100';
    }
  };

  const totalAmount = payments
    .filter(p => p.paymentStatus === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-app-text flex items-center gap-3 tracking-tight">
            <CreditCard className="w-8 h-8 text-emerald-500" />
            {user?.role === 'FARMER' ? 'Earnings Hub' : 'Financial Center'}
          </h1>
          <p className="text-app-text-secondary mt-1 font-medium italic opacity-80">
            {user?.role === 'FARMER' 
              ? 'Track your produce sales and incoming payments from retailers' 
              : 'Manage your transactions and payment history securely'}
          </p>
        </div>

        {user?.role !== 'FARMER' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Payment
          </motion.button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-app-card backdrop-blur-md border border-app-border p-7 rounded-[2rem] relative overflow-hidden group shadow-xl shadow-black/5"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500 opacity-5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-500 bg-opacity-10 rounded-2xl flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1">
                {user?.role === 'FARMER' ? 'Total Earned' : 'Total Flow'}
              </p>
              <h3 className="text-3xl font-black text-app-text tracking-tighter">₹{totalAmount.toLocaleString()}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-app-card backdrop-blur-md border border-app-border p-7 rounded-[2rem] shadow-xl shadow-black/5"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-500 bg-opacity-10 rounded-2xl flex items-center justify-center text-amber-600">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1">In Pipeline</p>
              <h3 className="text-3xl font-black text-app-text tracking-tighter">
                {payments.filter(p => p.paymentStatus === 'PENDING').length}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-app-card backdrop-blur-md border border-app-border p-7 rounded-[2rem] shadow-xl shadow-black/5"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500 bg-opacity-10 rounded-2xl flex items-center justify-center text-indigo-600">
              <History className="w-8 h-8" />
            </div>
            <div>
              <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Node Registry</p>
              <h3 className="text-3xl font-black text-app-text tracking-tighter">{payments.length}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Payment History List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-app-card backdrop-blur-md border border-app-border rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5"
      >
        <div className="p-8 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-app-text flex items-center gap-3 italic">
            <History className="w-6 h-6 text-emerald-500" />
            {user?.role === 'FARMER' ? 'Earnings Registry' : 'Transmission History'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
              <input
                type="text"
                placeholder="Query transmission logs..."
                className="bg-app-bg/50 border border-app-border rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/30 transition-all w-full text-app-text placeholder:text-app-text-muted/50 font-medium"
              />
            </div>
            <button className="p-3 bg-app-bg/50 border border-app-border rounded-2xl text-app-text-muted hover:text-emerald-500 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-app-text-muted text-[10px] font-black uppercase tracking-[0.2em] border-b border-app-border/10">
                <th className="px-8 py-5">Node Context</th>
                <th className="px-8 py-5">Transmission Path</th>
                <th className="px-8 py-5">Settlement</th>
                <th className="px-8 py-5">Protocol</th>
                <th className="px-8 py-5">Verification</th>
                <th className="px-8 py-5 text-right">Registry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white divide-opacity-5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-app-text-muted font-black text-xs uppercase tracking-widest">Querying Node History...</p>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <CreditCard className="w-12 h-12 opacity-20" />
                      <p>No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment, idx) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-app-bg/50 transition-all group border-b border-app-border/5"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-app-text font-black tracking-tight">{payment.batch?.productName || 'Direct Settlement'}</span>
                        <span className="text-[10px] text-app-text-muted font-mono tracking-tighter uppercase opacity-60">
                          #{payment.batch?.batchCode || 'INTERNAL-TXN'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${user?.id === payment.payer?.id ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {user?.id === payment.payer?.id 
                              ? 'Outgoing Node' 
                              : (user?.role === 'FARMER' ? 'Earnings From' : 'Incoming Node')}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-app-text font-bold">
                            <span className="truncate max-w-[120px]">{payment.payer?.fullName}</span>
                            <ArrowRight className="w-3 h-3 text-app-text-muted" />
                            <span className="truncate max-w-[120px]">{payment.receiver?.fullName}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-app-text font-black text-lg tracking-tighter">₹{payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-app-text font-black uppercase tracking-widest bg-app-bg px-2 py-0.5 rounded border border-app-border w-fit mb-1">{payment.paymentMethod}</span>
                        <span className="text-[10px] text-app-text-muted font-bold tracking-tight">
                          {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(payment.paymentStatus)}`}>
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {payment.paymentStatus === 'PENDING' && user?.id === payment.receiver?.id && (
                        <button
                          onClick={() => handleConfirm(payment.id)}
                          className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Verify Receipt
                        </button>
                      )}
                      {payment.paymentStatus === 'PENDING' && user?.id !== payment.receiver?.id && (
                        <div className="flex items-center justify-end gap-1 text-app-text-muted italic opacity-60">
                          <Clock className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-bold tracking-tighter">Awaiting Verification</span>
                        </div>
                      )}
                      {payment.paymentStatus === 'COMPLETED' && (
                        <div className="flex items-center justify-end gap-1 text-green-500">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-[10px] uppercase font-bold">Verified</span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Payment Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-app-card border border-app-border rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-6 top-6 p-2 text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-3xl font-black text-app-text mb-2 tracking-tighter">Initiate Settlement</h2>
              <p className="text-app-text-secondary text-sm mb-10 font-medium italic">Secure decentralized fund transmission protocol</p>

              <form onSubmit={handleCreatePayment} className="space-y-6">
                <div>
                  <label className="block text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Protocol Resource ID</label>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                    <input
                      required
                      type="text"
                      placeholder="BATCH-WHE-177..."
                      className="w-full bg-app-bg border border-app-border rounded-2xl py-4.5 pl-14 pr-6 text-app-text focus:outline-none focus:border-emerald-500 transition-all font-bold placeholder:text-app-text-muted/30"
                      value={formData.batchCode}
                      onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Trade Volume (₹)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                      <input
                        required
                        type="number"
                        placeholder="0.00"
                        className="w-full bg-app-bg border border-app-border rounded-2xl py-4.5 pl-14 pr-6 text-app-text focus:outline-none focus:border-emerald-500 transition-all font-black text-xl"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Network Method</label>
                    <select
                      className="w-full bg-app-bg border border-app-border rounded-2xl py-4.5 px-6 text-app-text focus:outline-none focus:border-emerald-500 transition-all appearance-none font-bold"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="ONLINE">Digital Protocol</option>
                      <option value="CASH">Physical Settlement</option>
                      <option value="CHEQUE">Legacy Voucher</option>
                    </select>
                  </div>
                </div>

                <div className="bg-green-500 bg-opacity-5 border border-green-500 border-opacity-10 p-5 rounded-[1.5rem] flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <p className="text-[11px] text-green-300">
                      Funds will be held in escrow until the produce is verified or manually confirmed by the recipient.
                      Blockchain proof will be generated upon completion.
                    </p>
                  </div>
                  {formData.quantity && (
                    <div className="flex items-center justify-between border-t border-green-500/10 pt-3 mt-1">
                      <span className="text-[10px] text-green-400/70 font-black uppercase tracking-widest">Settlement Quantity</span>
                      <span className="text-sm text-green-400 font-black tracking-tight">{formData.quantity} KG</span>
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting}
                  type="submit"
                  className="w-full py-5 bg-emerald-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify & Send
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentPage;
