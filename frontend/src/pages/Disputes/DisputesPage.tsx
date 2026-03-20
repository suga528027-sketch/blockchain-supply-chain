import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Plus,
  History,
  CheckCircle,
  Clock,
  X,
  Search,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Package
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { disputeAPI, batchAPI } from '../../services/api';
import { toast } from 'react-toastify';

interface Dispute {
  id: number;
  batch: {
    id: number;
    batchCode: string;
    productName: string;
  };
  reason: string;
  status: 'OPEN' | 'RESOLVED';
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
  raisedBy: {
    fullName: string;
  };
}

const DisputesPage: React.FC = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    batchId: '',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [disputeRes, batchRes] = await Promise.all([
        disputeAPI.getDisputesByUser(user.id),
        batchAPI.getBatchesByOwner(user.id)
      ]);
      setDisputes(disputeRes.data.data || []);
      setBatches(batchRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load dispute data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.batchId || !formData.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await disputeAPI.createDispute({
        batchId: parseInt(formData.batchId),
        reason: formData.reason
      });
      toast.success('Dispute raised successfully');
      setShowModal(false);
      setFormData({ batchId: '', reason: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to raise dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    return status === 'OPEN' 
      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
            Dispute Resolution Center
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic opacity-80">Track and manage batch-related disputes</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Raise Dispute
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Open Disputes', count: disputes.filter(d => d.status === 'OPEN').length, icon: <Clock className="text-amber-500" /> },
          { label: 'Resolved', count: disputes.filter(d => d.status === 'RESOLVED').length, icon: <CheckCircle className="text-emerald-500" /> },
          { label: 'Total Cases', count: disputes.length, icon: <History className="text-blue-500" /> }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-900 border border-white/5 p-6 rounded-2xl flex items-center gap-4"
          >
            <div className="bg-white/5 p-3 rounded-xl">{stat.icon}</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">{stat.label}</p>
              <h3 className="text-2xl font-black text-white">{stat.count}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Accessing Dispute Registry...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="bg-zinc-900 border border-white/5 rounded-3xl p-16 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
            <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Clean Record</p>
            <p className="text-gray-400 text-sm mt-1">No active disputes found in the registry.</p>
          </div>
        ) : (
          disputes.map((dispute, idx) => (
            <motion.div
              key={dispute.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-zinc-900 border border-white/5 p-6 rounded-2xl group hover:border-white/10 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-rose-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black">{dispute.batch?.productName || 'Batch Deleted'}</span>
                      <span className="text-[10px] font-mono text-gray-500 px-2 py-0.5 bg-white/5 rounded">#{dispute.batch?.batchCode || 'Unknown'}</span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-1">{dispute.reason}</p>
                    <div className="flex items-center gap-4 text-[10px] text-gray-500 uppercase font-black tracking-widest">
                      <span>By: {dispute.raisedBy.fullName}</span>
                      <span>Raised: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(dispute.status)}`}>
                    {dispute.status}
                  </span>
                  
                  <div className="w-px h-8 bg-white/5 hidden lg:block" />

                  {dispute.status === 'RESOLVED' && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Resolution</span>
                      <p className="text-xs text-gray-400 font-medium italic">"{dispute.resolutionNote}"</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Raise Dispute Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter">Raise Formal Dispute</h2>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">Secure Conflict Management Protocol</p>
                </div>
              </div>

              <form onSubmit={handleCreateDispute} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Involved Resource (Batch) *</label>
                  <select
                    required
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-rose-500/50 transition-all font-bold"
                  >
                    <option value="">— Select Impacted Batch —</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>📦 {b.productName} ({b.batchCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Detail Conflict Context *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide a detailed explanation of the issue..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-rose-500/50 transition-all font-medium resize-none"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>

                <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-rose-300 font-medium">
                    Critical: Raising a dispute will notify the system administrator. Investigation protocols will be initiated upon submission.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting}
                  type="submit"
                  className="w-full py-5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-500/25 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Formal Dispute
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

export default DisputesPage;
