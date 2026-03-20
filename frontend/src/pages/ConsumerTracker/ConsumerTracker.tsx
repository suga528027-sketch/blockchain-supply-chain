import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Leaf, Package, Truck, CheckCircle, MapPin, Calendar, Shield, MessageSquare, Star, Send, Sparkles } from 'lucide-react';
import { batchAPI, feedbackAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

interface Props {
  initialTab?: 'track' | 'history' | 'overview';
}

const ConsumerTracker: React.FC<Props> = ({ initialTab = 'track' }) => {
  const { user } = useAuth();
  const [batchCode, setBatchCode] = useState('');
  const [batch, setBatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Real-time metrics
  const totalSignals = 12; // Mock
  const ecosystemImpact = 85; // Mock
  const safetyScore = 98.4; // Mock
  
  useEffect(() => {
    if (initialTab === 'history') {
      setBatch(null);
      setBatchCode('');
    }
  }, [initialTab]);
  const [myFeedbacks, setMyFeedbacks] = useState<any[]>([]);
  const [fetchingFeedbacks, setFetchingFeedbacks] = useState(false);
  
  // Feedback states
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('GENERAL');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const trimmedCode = batchCode.trim();
      const response = await batchAPI.trackBatch(trimmedCode);
      setBatch(response.data.data);
      const historyResponse = await batchAPI.getTrackingHistory(response.data.data.id);
      setHistory(historyResponse.data.data || []);
      toast.success('Batch found!');
      // Reset feedback fields when a new batch is tracked
      setFeedbackComment('');
      setFeedbackRating(5);
    } catch (error) {
      toast.error('Batch not found!');
      setBatch(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
       fetchMyFeedbacks();
    }
  }, [user?.id]);

  const fetchMyFeedbacks = async () => {
    if (!user?.id) return;
    setFetchingFeedbacks(true);
    try {
      const res = await feedbackAPI.getFeedbackByConsumer(user.id);
      setMyFeedbacks(res.data.data || []);
    } catch { /* Silent */ }
    finally { setFetchingFeedbacks(false); }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !user) return;
    
    setSubmittingFeedback(true);
    try {
      await feedbackAPI.submitFeedback({
        batchId: batch.id,
        consumerId: user.id,
        comment: feedbackComment,
        rating: feedbackRating,
        category: feedbackCategory
      });
      toast.success('Feedback submitted to Admin for review');
      setFeedbackComment('');
      fetchMyFeedbacks(); // Refresh history
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const existingFeedback = myFeedbacks.find(f => f.batch?.id === batch?.id);

  const getStatusIcon = (eventType: string) => {
    switch (eventType) {
      case 'BATCH_CREATED': return <Package className="w-5 h-5 text-blue-400" />;
      case 'TRADE_REQUESTED': return <Calendar className="w-5 h-5 text-violet-400" />;
      case 'TRADE_ACCEPTED': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'OWNERSHIP_TRANSFERRED': return <Truck className="w-5 h-5 text-amber-400" />;
      case 'TRANSPORTER_ACCEPTED': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'ACCEPTED_BY_RETAILER': return <Package className="w-5 h-5 text-emerald-600" />;
      case 'DELIVERED_FINAL': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'BATCH_SPLIT': return <Shield className="w-5 h-5 text-indigo-400" />;
      case 'DELIVERED': return <CheckCircle className="w-5 h-5 text-green-400" />;
      default: return <MapPin className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-app-bg transition-colors duration-500">

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Advanced Ecosystem Metrics Banner */}
        {!batch && initialTab !== 'history' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
          >
            {[
              { label: 'Verified Signals', val: totalSignals, icon: <MessageSquare className="w-5 h-5 text-amber-500" />, desc: 'Personal Feedback Logs' },
              { label: 'Eco Impact', val: ecosystemImpact + '%', icon: <Sparkles className="w-5 h-5 text-emerald-500" />, desc: 'Supply Transparency Index' },
              { label: 'Safety Factor', val: safetyScore, icon: <Shield className="w-5 h-5 text-blue-500" />, desc: 'System Protocol Integrity' },
            ].map((stat, i) => (
              <div key={i} className="bg-app-card backdrop-blur-3xl p-6 rounded-[2.5rem] border border-app-border relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full" />
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-app-text font-black text-2xl tracking-tighter italic">{stat.val}</p>
                    <p className="text-[10px] text-app-text-muted font-black uppercase tracking-widest leading-none">{stat.label}</p>
                  </div>
                </div>
                <p className="text-app-text-muted text-[10px] font-medium italic opacity-60 leading-relaxed">{stat.desc}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Header (Simplified if tracking) */}
        {!batch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h2 className="text-5xl font-black text-app-text mb-4 tracking-tighter italic leading-none">
              Consumer <span className="text-emerald-500">Terminal</span>
            </h2>
            <div className="flex items-center justify-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-app-text-secondary text-xs font-black uppercase tracking-[0.3em] opacity-40">Blockchain Protocol v1.4.2 Active</p>
            </div>
          </motion.div>
        )}

        {/* Search Box */}
        {initialTab === 'track' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-app-card backdrop-blur-xl rounded-[2.5rem] p-8 border border-app-border mb-8 shadow-2xl shadow-black/5"
          >
            <form onSubmit={handleTrack} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
                <input
                  type="text"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  placeholder="Ex: BATCH-CRYPTO-2026-X99"
                  required
                  className="w-full bg-app-bg border border-app-border rounded-2xl py-4 pl-12 pr-6 text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-emerald-500 transition-all font-bold tracking-tight"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-green-500/25"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Track'
                )}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Batch Details */}
        {batch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Batch Info Card */}
            <div className="bg-app-card backdrop-blur-lg rounded-[2.5rem] p-8 border border-app-border shadow-2xl shadow-black/5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-app-text text-3xl font-black tracking-tight">{batch.productName}</h3>
                  <p className="text-app-text-muted text-[10px] mt-1 font-mono uppercase tracking-widest opacity-60">{batch.batchCode}</p>
                </div>
                <div className="bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Protocol Verified</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-app-bg/50 rounded-2xl p-4 border border-app-border/5">
                  <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Origin Node</p>
                  <p className="text-app-text font-bold text-sm">{batch.farmer?.fullName || 'N/A'}</p>
                </div>
                <div className="bg-app-bg/50 rounded-2xl p-4 border border-app-border/5">
                  <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Net Quantity</p>
                  <p className="text-app-text font-black text-lg">{batch.quantityKg} KG</p>
                </div>
                <div className="bg-app-bg/50 rounded-2xl p-4 border border-app-border/5">
                  <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Quality Grade</p>
                  <p className="text-app-text font-black text-lg">{batch.qualityGrade}</p>
                </div>
                <div className="bg-app-bg/50 rounded-2xl p-4 border border-app-border/5">
                  <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Node Status</p>
                  <p className="text-emerald-500 font-black text-sm">{batch.status}</p>
                </div>
                <div className="bg-app-bg/50 rounded-2xl p-4 border border-app-border/5">
                  <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Node Reputation</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <p className="text-white font-black text-lg">
                      {batch.farmer?.totalRatingScore && batch.farmer?.ratingCount 
                        ? (batch.farmer.totalRatingScore / batch.farmer.ratingCount).toFixed(1)
                        : '5.0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-app-bg/50 rounded-2xl p-4 flex items-center gap-3 border border-app-border/5">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest">Harvest Instance</p>
                    <p className="text-app-text text-sm font-black">{batch.harvestDate}</p>
                  </div>
                </div>
                <div className="bg-app-bg/50 rounded-2xl p-4 flex items-center gap-3 border border-app-border/5">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  <div>
                    <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest">Integrity Limit</p>
                    <p className="text-app-text text-sm font-black">{batch.expiryDate}</p>
                  </div>
                </div>
              </div>
                <div className="bg-app-bg/50 rounded-2xl p-4 flex items-center justify-between border border-app-border/10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                         <Shield className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-app-text-muted font-black uppercase tracking-widest opacity-60 leading-none mb-1">Node Certification</p>
                        <p className="text-white text-sm font-black italic">Verified AgriChain Origin Pass</p>
                      </div>
                   </div>
                   <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2">
                     <Package className="w-4 h-4" /> Download Certificate
                   </button>
                </div>
              </div>

              {/* Advanced: Safety Protocol Verification */}
              <div className="bg-app-card backdrop-blur-lg rounded-[2.5rem] p-8 border border-app-border shadow-2xl shadow-black/5">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                         <CheckCircle className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-app-text text-xl font-black tracking-tighter italic uppercase">Safety Protocols</h4>
                        <p className="text-app-text-secondary text-[10px] font-black uppercase tracking-widest opacity-60">Multi-point validation status</p>
                      </div>
                   </div>
                   <div className="bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
                      <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest">System Check: Optimal</p>
                   </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Blockchain Origin Anchored', status: 'PASS' },
                    { label: 'Custody Chain Unbroken', status: 'PASS' },
                    { label: 'Quality Parameters Verified', status: 'PASS' },
                    { label: 'Eco-Standard Compliance', status: 'PASS' }
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-app-bg/30 rounded-2xl border border-white/5">
                       <p className="text-app-text font-bold text-xs tracking-tight">{p.label}</p>
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{p.status}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Journey Timeline */}
              <div className="bg-app-card backdrop-blur-lg rounded-[2.5rem] p-8 border border-app-border shadow-2xl shadow-black/5">
              <h4 className="text-app-text text-2xl font-black mb-10 tracking-tighter flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                    <MapPin className="w-6 h-6 text-emerald-500" />
                 </div>
                 Journey Telemetry
              </h4>
              {history.length === 0 ? (
                <p className="text-app-text-muted text-center py-8 font-medium italic opacity-50">No chain events recorded in the protocol.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((event: any, index: number) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-app-bg rounded-2xl flex items-center justify-center border border-app-border shadow-inner">
                          {getStatusIcon(event.eventType)}
                        </div>
                        {index < history.length - 1 && (
                          <div className="w-0.5 h-full bg-app-border/30 mt-3"></div>
                        )}
                      </div>

                      {/* Event details */}
                      <div className="flex-1 bg-app-bg/40 rounded-3xl p-6 mb-4 border border-app-border/5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-app-text font-black text-sm tracking-tight">
                            {event.eventType === 'BATCH_CREATED' ? 'Harvest Origin Created' :
                             event.eventType === 'TRADE_REQUESTED' ? 'Trade Requested by Retailer' :
                             event.eventType === 'TRADE_ACCEPTED' ? 'Trade Accepted by Farmer' :
                             event.eventType === 'OWNERSHIP_TRANSFERRED' ? 'Payment Verified & Ownership Transferred' :
                             event.eventType === 'TRANSPORTER_ACCEPTED' ? 'Shipment Picked up by Transporter' :
                             event.eventType === 'ACCEPTED_BY_RETAILER' ? 'Batch Received & Verified by Retailer' :
                             event.eventType === 'BATCH_SPLIT' ? 'Harvest Subdivision (Partial Purchase)' :
                             event.eventType === 'DELIVERED_FINAL' ? 'Final Inventory Restock' : 
                             event.eventType === 'DELIVERED' ? 'Delivery Node Reached' : 
                             event.eventType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-app-text-muted text-[10px] font-black uppercase tracking-widest opacity-60">
                            {new Date(event.eventTimestamp).toLocaleDateString()}
                          </p>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shadow-sm" />
                            <p className="text-app-text-secondary text-xs font-bold">{event.location}</p>
                          </div>
                        )}
                        {event.notes && (
                          <p className="text-app-text-muted text-xs mt-3 font-medium italic leading-relaxed opacity-70">"{event.notes}"</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback / Complaint Section */}
            {batch && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-app-card backdrop-blur-lg rounded-[2.5rem] p-8 border border-app-border shadow-2xl shadow-black/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <MessageSquare className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-app-text text-2xl font-black tracking-tighter">Chain Feedback & Complaints</h4>
                    <p className="text-app-text-secondary text-[10px] font-black uppercase tracking-widest opacity-60">Report issues or provide feedback to admin</p>
                  </div>
                </div>

                {existingFeedback ? (
                  <div className="bg-app-bg/50 rounded-[2rem] p-6 border border-app-border/40">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= existingFeedback.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-600'}`} />
                        ))}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        existingFeedback.isReviewedByAdmin ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {existingFeedback.isReviewedByAdmin ? 'Reviewed by Admin' : 'Awaiting Review'}
                      </span>
                    </div>
                    <p className="text-app-text-secondary text-sm font-medium italic mb-2">"{existingFeedback.comment}"</p>
                    <p className="text-app-text-muted text-[9px] font-black uppercase tracking-widest opacity-40">Submitted: {new Date(existingFeedback.createdAt).toLocaleDateString()}</p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                    <div>
                      <label className="block text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Signal Type</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { id: 'PRODUCT_QUALITY', label: 'Bad Quality', color: 'rose' },
                          { id: 'DELIVERY_EXPERIENCE', label: 'Poor Delivery', color: 'amber' },
                          { id: 'POSITIVE_FEEDBACK', label: 'Good Feedback', color: 'emerald' },
                          { id: 'GENERAL', label: 'General', color: 'blue' }
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFeedbackCategory(cat.id)}
                            className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                              feedbackCategory === cat.id 
                                ? `bg-${cat.color}-500/10 border-${cat.color}-500/50 text-${cat.color}-500 shadow-lg shadow-${cat.color}-500/10` 
                                : 'bg-app-bg border-app-border text-app-text-muted hover:border-white/20'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Experience Rating</label>
                      <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setFeedbackRating(num)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              feedbackRating >= num 
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                                : 'bg-app-bg border border-app-border text-app-text-muted hover:border-amber-500/50'
                            }`}
                          >
                            <Star className={`w-5 h-5 ${feedbackRating >= num ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-app-text-muted text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">Signal Details / Proof of Issue</label>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder={
                          feedbackCategory === 'PRODUCT_QUALITY' ? "Describe the quality issue (damage, freshness, etc.)..." :
                          feedbackCategory === 'DELIVERY_EXPERIENCE' ? "Describe the delivery issue (late, rude, handling)..." :
                          "Provide your detailed feedback or summary for the admin..."
                        }
                        required
                        rows={4}
                        className="w-full bg-app-bg border border-app-border rounded-3xl py-4 px-6 text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-emerald-500 transition-all font-medium leading-relaxed"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={submittingFeedback}
                      type="submit"
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 transition-all"
                    >
                      {submittingFeedback ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Transmit Feedback
                        </>
                      )}
                    </motion.button>
                    
                    <p className="text-center text-[9px] text-app-text-muted font-black uppercase tracking-widest opacity-40">
                      Admin will review this signal and adjust ecosystem ratings accordingly.
                    </p>
                  </form>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* My Feedback Signal History */}
        {initialTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30">
                     <MessageSquare className="w-7 h-7 text-amber-500 shadow-xl" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-app-text tracking-tighter uppercase italic">My Feedback Signal Archive</h3>
                    <p className="text-app-text-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Personal performance logs across the chain</p>
                  </div>
               </div>
               
               <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/track'}
                className="bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
               >
                 Track More Produce
               </motion.button>
            </div>

            {myFeedbacks.length === 0 ? (
              <div className="bg-app-card rounded-[3rem] p-20 border border-app-border text-center">
                 <Leaf className="w-16 h-16 text-emerald-500/20 mx-auto mb-4 animate-pulse" />
                 <p className="text-app-text-muted font-black text-[10px] uppercase tracking-[0.3em]">No signals archived in this sector</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myFeedbacks.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-app-card backdrop-blur-2xl rounded-[2rem] p-6 border border-app-border shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none rounded-full group-hover:bg-amber-500/10 transition-colors" />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-amber-500 text-[10px] font-black uppercase tracking-tighter">{f.batch?.productName}</p>
                        <p className="text-app-text-muted text-[9px] font-mono tracking-widest opacity-60">#{f.batch?.batchCode}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= f.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-600'}`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-app-text font-medium text-xs mb-4 line-clamp-2 italic opacity-80">"{f.comment}"</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-app-border/10">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                         f.isReviewedByAdmin ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-app-text-muted'
                       }`}>
                          {f.isReviewedByAdmin ? 'Signal Verified' : 'In Review'}
                       </span>
                       <span className="text-app-text-muted text-[9px] font-black opacity-40">{new Date(f.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ConsumerTracker;