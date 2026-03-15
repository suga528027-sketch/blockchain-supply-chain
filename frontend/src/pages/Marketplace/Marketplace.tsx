import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Info, User, Package,
  TrendingUp, CheckCircle, ArrowRight, X, Loader2
} from 'lucide-react';
import { batchAPI, productRequestAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface Batch {
  id: number;
  batchCode: string;
  productName: string;
  quantityKg: number;
  pricePerKg: number;
  qualityGrade: string;
  status: string;
  currentOwner: {
    id: number;
    fullName: string;
    role: string;
  };
}

const Marketplace: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Request Modal State
  const [requestModal, setRequestModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [requestQty, setRequestQty] = useState('');
  const [requestMsg, setRequestMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await batchAPI.getAllBatches();
      // Filter out own batches and order by newest
      const data = res.data.data.filter((b: Batch) => b.currentOwner?.id !== user?.id);
      setBatches(data);
    } catch (err) {
      toast.error('Failed to load marketplace products');
    } finally {
      setLoading(false);
    }
  };

  const openRequestModal = (batch: Batch) => {
    setSelectedBatch(batch);
    setRequestQty(String(batch.quantityKg));
    setRequestModal(true);
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !user) return;

    if (parseFloat(requestQty) > selectedBatch.quantityKg) {
      toast.warning('Requested quantity exceeds available stock');
      return;
    }

    setSubmitting(true);
    try {
      await productRequestAPI.createRequest({
        requester: { id: user.id },
        batch: { id: selectedBatch.id },
        owner: { id: selectedBatch.currentOwner.id },
        quantityRequested: parseFloat(requestQty),
        message: requestMsg,
        status: 'PENDING'
      });
      toast.success('Product request sent successfully!');
      setRequestModal(false);
      setRequestMsg('');
    } catch (err) {
      toast.error('Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBatches = batches.filter(b => 
    b.productName.toLowerCase().includes(search.toLowerCase()) ||
    b.batchCode.toLowerCase().includes(search.toLowerCase()) ||
    b.currentOwner?.fullName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tech-Forward Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-2 rounded-[2.5rem] bg-app-card backdrop-blur-xl border border-app-border">
        <div className="flex items-center gap-6 px-4">
           <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-app-text whitespace-nowrap">Live Exchange</span>
           </div>
           <div className="h-6 w-px bg-white/10 hidden md:block"></div>
           <p className="text-xs text-app-text-muted font-medium hidden lg:block">Synchronized with Node Registry</p>
        </div>
        
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
          <input
            type="text"
            placeholder="Query Registry: Product, Code, or Node Identity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-app-bg border border-app-border rounded-[2rem] py-4 pl-14 pr-6 text-app-text text-sm focus:outline-none focus:border-emerald-500/30 transition-all font-medium placeholder:text-app-text-muted/50"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredBatches.length === 0 ? (
        <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
          <Package className="w-16 h-16 text-app-text-muted mx-auto mb-6 opacity-20" />
          <h3 className="text-2xl font-black text-app-text italic opacity-50">Node Quiet...</h3>
          <p className="text-app-text-muted mt-2 font-medium">No active trade frequencies detected at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredBatches.map((batch, idx) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-app-card backdrop-blur-3xl rounded-[2.5rem] border border-app-border overflow-hidden hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all group relative"
              >
                <div className="absolute top-0 right-0 p-6">
                   <div className="px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      Live
                   </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                      <Package className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-emerald-500 font-black tracking-[0.2em] mb-1">Batch Registry</p>
                      <h3 className="text-2xl font-black text-app-text group-hover:text-emerald-400 transition-colors leading-tight">
                        {batch.productName}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-app-bg/50 border border-app-border flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-xs font-bold text-app-text uppercase border border-app-border">
                           {batch.currentOwner?.fullName.charAt(0)}
                        </div>
                        <div>
                           <p className="text-[10px] text-app-text-muted font-black uppercase tracking-tight">Node Operator</p>
                           <p className="text-app-text text-xs font-bold">{batch.currentOwner?.fullName}</p>
                        </div>
                     </div>
                     <span className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-black text-app-text-muted uppercase tracking-widest border border-white/5">
                        {batch.currentOwner?.role}
                     </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-app-bg/30 border border-app-border">
                      <p className="text-[10px] uppercase text-app-text-muted font-black tracking-widest mb-1.5">Availability</p>
                      <p className="text-app-text font-black text-lg">{batch.quantityKg} KG</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-app-bg/30 border border-app-border">
                      <p className="text-[10px] uppercase text-app-text-muted font-black tracking-widest mb-1.5">Unit Price</p>
                      <p className="text-emerald-500 font-black text-lg">₹{batch.pricePerKg}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${batch.qualityGrade === 'A' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-400'}`}></div>
                        <span className="text-xs font-black text-app-text uppercase tracking-widest">Protocol Grade {batch.qualityGrade}</span>
                     </div>
                     <p className="text-[10px] text-app-text-muted font-bold font-mono tracking-tighter uppercase">{batch.batchCode}</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openRequestModal(batch)}
                    className="w-full bg-app-text text-app-bg font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-500 hover:text-white transition-all transform group-hover:translate-y-[-2px] border border-app-border/10"
                  >
                    Initiate Trade
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Request Modal */}
      <AnimatePresence>
        {requestModal && selectedBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-app-card rounded-[3rem] p-10 max-w-md w-full border border-app-border shadow-[0_30px_100px_rgba(0,0,0,0.2)] relative overflow-hidden"
            >
              <button 
                onClick={() => setRequestModal(false)}
                className="absolute top-6 right-6 p-2 text-app-text-muted hover:text-app-text rounded-xl hover:bg-app-text/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-green-500/20 rounded-2xl">
                  <ShoppingCart className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-app-text">Send Request</h2>
                  <p className="text-app-text-secondary text-sm font-medium italic">Protocol Entry: {selectedBatch.productName}</p>
                </div>
              </div>

              <form onSubmit={handleRequest} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-app-text-muted mb-2 ml-1">Quantity (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={requestQty}
                    onChange={(e) => setRequestQty(e.target.value)}
                    max={selectedBatch.quantityKg}
                    className="w-full bg-app-bg border border-app-border rounded-2xl py-4 px-6 text-app-text focus:outline-none focus:border-emerald-500 transition-all font-black text-lg"
                    placeholder="Enter quantity"
                    required
                  />
                  <p className="text-[10px] text-app-text-muted mt-2 ml-1 uppercase tracking-widest font-bold">
                    Node Available: <span className="text-emerald-500">{selectedBatch.quantityKg} KG</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-app-text-muted mb-2 ml-1">Transmission Message</label>
                  <textarea
                    value={requestMsg}
                    onChange={(e) => setRequestMsg(e.target.value)}
                    className="w-full bg-app-bg border border-app-border rounded-2xl py-4 px-6 text-app-text focus:outline-none focus:border-emerald-500 transition-all h-28 resize-none text-sm font-medium italic"
                    placeholder="E.g. Logistics requirements or node details..."
                  />
                </div>

                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={submitting}
                    className="w-full bg-green-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 disabled:bg-gray-700 disabled:shadow-none transition-all"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Send Request
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;
