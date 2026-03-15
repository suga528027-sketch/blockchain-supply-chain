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
    requestId: null as number | null
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
        requestId: location.state.requestId || null
      });
      setShowModal(true);
    }
  }, [user?.id, location.state]);

  const fetchPayments = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await paymentAPI.getPaymentsByUser(user.id);
      setPayments(res.data.data || []);
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
      setFormData({ batchCode: '', amount: '', paymentMethod: 'ONLINE', receiverId: '', requestId: null });
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
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-green-400" />
            Financial Center
          </h1>
          <p className="text-gray-400 mt-1">Manage your transactions and payment history</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Payment
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white bg-opacity-5 backdrop-blur-md border border-white border-opacity-10 p-6 rounded-3xl relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500 opacity-5 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-2xl flex items-center justify-center text-green-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Sales / Spending</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">₹{totalAmount.toLocaleString()}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white bg-opacity-5 backdrop-blur-md border border-white border-opacity-10 p-6 rounded-3xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 bg-opacity-20 rounded-2xl flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending Payments</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {payments.filter(p => p.paymentStatus === 'PENDING').length}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white bg-opacity-5 backdrop-blur-md border border-white border-opacity-10 p-6 rounded-3xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-2xl flex items-center justify-center text-blue-400">
              <History className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Transactions</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{payments.length}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Payment History List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white bg-opacity-5 backdrop-blur-md border border-white border-opacity-10 rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-white border-opacity-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            Transaction History
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search payments..."
                className="bg-white bg-opacity-5 border border-white border-opacity-10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-green-500 transition-all w-64 text-white"
              />
            </div>
            <button className="p-2 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-xl text-gray-400 hover:text-white transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Batch Info</th>
                <th className="px-6 py-4 font-semibold">Payer / Receiver</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white divide-opacity-5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-gray-400">Loading your history...</p>
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
                    className="hover:bg-white hover:bg-opacity-5 transition-all group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{payment.batch?.productName || 'Batch Payment'}</span>
                        <span className="text-xs text-gray-500 font-mono tracking-tighter">
                          #{payment.batch?.batchCode || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-white text-sm">
                            {user?.id === payment.payer?.id ? 'Outgoing' : 'Incoming'}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <span>{payment.payer?.fullName}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>{payment.receiver?.fullName}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-bold">₹{payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-300">{payment.paymentMethod}</span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(payment.paymentStatus)}`}>
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.paymentStatus === 'PENDING' && (
                        <button
                          onClick={() => handleConfirm(payment.id)}
                          className="px-4 py-2 bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30 rounded-lg text-xs font-bold hover:bg-opacity-30 transition-all"
                        >
                          Confirm
                        </button>
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#1a2e35] border border-white border-opacity-10 rounded-3xl p-8 shadow-2xl"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-6 top-6 p-2 text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-5 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold text-white mb-2">Initiate Payment</h2>
              <p className="text-gray-400 text-sm mb-8">Securely transfer funds for produce batches</p>

              <form onSubmit={handleCreatePayment} className="space-y-6">
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2 pl-1">Batch Code / ID</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      required
                      type="text"
                      placeholder="Enter batch code (e.g. BTC-123)"
                      className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 transition-all"
                      value={formData.batchCode}
                      onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2 pl-1">Amount (₹)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        required
                        type="number"
                        placeholder="0.00"
                        className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-green-500 transition-all"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2 pl-1">Method</label>
                    <select
                      className="w-full bg-white bg-opacity-5 border border-white border-opacity-10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-green-500 transition-all appearance-none"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="ONLINE" className="bg-[#1a2e35]">Online / UPI</option>
                      <option value="CASH" className="bg-[#1a2e35]">Cash</option>
                      <option value="CHEQUE" className="bg-[#1a2e35]">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="bg-green-500 bg-opacity-5 border border-green-500 border-opacity-10 p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <p className="text-[11px] text-green-300">
                    Funds will be held in escrow until the produce is verified or manually confirmed by the recipient.
                    Blockchain proof will be generated upon completion.
                  </p>
                </div>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  disabled={submitting}
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Send Payment
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
