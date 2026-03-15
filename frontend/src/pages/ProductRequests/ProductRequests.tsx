import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, Send, CheckCircle, XCircle, Clock,
  User, Package, MessageSquare, AlertCircle, Loader2, ArrowRight, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productRequestAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface ProductRequest {
  id: number;
  requester: { id: number; fullName: string; role: string; email: string };
  batch: { id: number; batchCode: string; productName: string };
  owner: { id: number; fullName: string; role: string; email: string };
  quantityRequested: number;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  totalPrice: number | null;
  isPaid: boolean;
  createdAt: string;
}

const ProductRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sentRequests, setSentRequests] = useState<ProductRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    fetchRequests();
  }, [user?.id]);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      const [sent, received] = await Promise.all([
        productRequestAPI.getSentRequests(user.id),
        productRequestAPI.getReceivedRequests(user.id)
      ]);
      setSentRequests(sent.data.data);
      setReceivedRequests(received.data.data);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: number, newStatus: 'ACCEPTED' | 'REJECTED') => {
    try {
      await productRequestAPI.updateRequestStatus(requestId, newStatus);
      toast.success(`Request ${newStatus.toLowerCase()}!`);
      fetchRequests();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-500/20 text-green-400 border-green-500/20';
      case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/20';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  const displayedRequests = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Premium Toggle Hub */}
      <div className="bg-app-card backdrop-blur-2xl p-2 rounded-[2.5rem] border border-app-border w-fit flex items-center gap-2 mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-10 py-4 rounded-full font-black text-xs transition-all relative ${
            activeTab === 'received' ? 'text-app-text' : 'text-app-text-muted hover:text-emerald-500'
          }`}
        >
          {activeTab === 'received' && (
            <motion.div layoutId="requestTypePill" className="absolute inset-0 bg-emerald-500 rounded-full shadow-[0_10px_25px_rgba(16,185,129,0.3)]" />
          )}
          <span className="relative z-10 flex items-center gap-2.5">
            <Inbox className="w-4 h-4" />
            Node Inbound
            {receivedRequests.filter(r => r.status === 'PENDING').length > 0 && (
              <span className="bg-app-text text-app-bg text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                {receivedRequests.filter(r => r.status === 'PENDING').length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-10 py-4 rounded-full font-black text-xs transition-all relative ${
            activeTab === 'sent' ? 'text-app-text' : 'text-app-text-muted hover:text-emerald-500'
          }`}
        >
          {activeTab === 'sent' && (
            <motion.div layoutId="requestTypePill" className="absolute inset-0 bg-emerald-500 rounded-full shadow-[0_10px_25px_rgba(16,185,129,0.3)]" />
          )}
          <span className="relative z-10 flex items-center gap-2.5">
            <Send className="w-4 h-4" />
            Node Outbound
          </span>
        </button>
      </div>

      {/* List */}
      <div className="space-y-6">
        {displayedRequests.length === 0 ? (
          <div className="text-center py-32 bg-app-card rounded-[3rem] border border-dashed border-app-border">
            <Inbox className="w-16 h-16 text-app-text-muted mx-auto mb-6 opacity-20" />
            <h3 className="text-2xl font-black text-app-text italic opacity-50">Log Clear...</h3>
            <p className="text-app-text-muted mt-2 font-medium">No recorded trade frequencies in this sector.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayedRequests.map((req, idx) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-app-card backdrop-blur-3xl p-1 rounded-[3rem] border border-app-border hover:border-emerald-500/30 transition-all group shadow-xl shadow-black/5"
              >
                <div className="bg-app-bg/10 rounded-[2.8rem] p-8">
                  <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
                    {/* Visual Asset & Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:border-emerald-500/30 transition-colors">
                          <Package className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] mb-1">Contract Asset</p>
                          <h4 className="text-2xl font-black text-app-text">{req.batch.productName}</h4>
                          <p className="text-[10px] text-app-text-muted font-mono mt-1 opacity-50 uppercase tracking-tighter">REF: {req.batch.batchCode}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                         <div>
                            <p className="text-[10px] text-app-text-muted font-black uppercase tracking-widest mb-1.5">Trade Volume</p>
                            <p className="text-app-text font-black text-xl italic">{req.quantityRequested} <span className="text-xs text-app-text-secondary font-bold not-italic">KG</span></p>
                         </div>
                         <div className="h-10 w-px bg-white/5"></div>
                         <div>
                            <p className="text-[10px] text-app-text-muted font-black uppercase tracking-widest mb-1.5">Status Flag</p>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${getStatusStyle(req.status)} shadow-[0_5px_15px_rgba(0,0,0,0.2)] flex items-center gap-2`}>
                               <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${req.status === 'PENDING' ? 'bg-amber-400' : req.status === 'ACCEPTED' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                               {req.status}
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Meta Section */}
                     <div className="flex-[1.8] flex flex-col md:flex-row gap-8">
                       <div className="flex-1 space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-app-text-muted block pl-1">{activeTab === 'received' ? 'Requester Node' : 'Owner Node'}</label>
                          <div className="p-4 rounded-2xl bg-black/5 border border-white/5 flex items-center gap-4">
                             <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black border border-emerald-500/20">
                                {(activeTab === 'received' ? req.requester.fullName : req.owner.fullName).charAt(0)}
                             </div>
                             <div>
                                <p className="text-app-text text-sm font-bold truncate">{(activeTab === 'received' ? req.requester.fullName : req.owner.fullName)}</p>
                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tight">{(activeTab === 'received' ? req.requester.role : req.owner.role)}</p>
                             </div>
                          </div>
                       </div>

                       <div className="flex-[1.5] space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-app-text-muted block pl-1">Transmission Message</label>
                          <div className="p-4 rounded-2xl bg-black/5 border border-white/5 h-full">
                             <p className="text-app-text-secondary text-xs italic font-medium leading-relaxed opacity-70">
                                "{req.message || 'No additional parameters provided in transmission.'}"
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-none flex items-center lg:justify-end min-w-[180px]">
                      {activeTab === 'received' && req.status === 'PENDING' ? (
                        <div className="flex gap-4 w-full lg:w-fit">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateStatus(req.id, 'REJECTED')}
                            className="p-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 hover:bg-red-500 transition-all hover:text-white"
                          >
                            <XCircle className="w-6 h-6" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateStatus(req.id, 'ACCEPTED')}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                          >
                            <CheckCircle className="w-6 h-6" />
                            Accept
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-3 w-full">
                          {activeTab === 'sent' && req.status === 'ACCEPTED' && !req.isPaid && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => navigate('/payment', { state: { batch: req.batch, amount: req.totalPrice, requestId: req.id } })}
                              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-500/20"
                            >
                              <DollarSign className="w-5 h-5 shadow-inner" />
                              Authorize Settlement
                            </motion.button>
                          )}
                          {req.isPaid && (
                            <div className="flex items-center gap-2 px-6 py-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 font-black text-xs uppercase tracking-widest w-full justify-center">
                              <CheckCircle className="w-5 h-5" />
                              Settled & Transferred
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                       <span className="text-[10px] text-app-text-muted font-black uppercase tracking-[0.3em]">ID: {req.id}</span>
                       {req.totalPrice && (
                         <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/10">
                            <DollarSign className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs font-black text-emerald-400 italic">Settlement Total: ₹{req.totalPrice.toLocaleString()}</span>
                         </div>
                       )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-app-text-muted font-bold uppercase tracking-widest">
                       <Clock className="w-3 h-3" />
                       Node Timestamp: {new Date(req.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ProductRequests;
