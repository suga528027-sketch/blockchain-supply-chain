import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Leaf, Package, Truck, CheckCircle, MapPin, Calendar, Shield } from 'lucide-react';
import { batchAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ConsumerTracker: React.FC = () => {
  const [batchCode, setBatchCode] = useState('');
  const [batch, setBatch] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      toast.error('Batch not found!');
      setBatch(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (eventType: string) => {
    switch (eventType) {
      case 'BATCH_CREATED': return <Package className="w-5 h-5 text-blue-400" />;
      case 'OWNERSHIP_TRANSFERRED': return <Truck className="w-5 h-5 text-amber-400" />;
      case 'DELIVERED': return <CheckCircle className="w-5 h-5 text-green-400" />;
      default: return <MapPin className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364]">

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold text-white mb-3">
            Track Your <span className="text-green-400">Produce</span>
          </h2>
          <p className="text-gray-400">Enter batch code to see the complete journey of your food</p>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white bg-opacity-5 backdrop-blur-lg rounded-3xl p-6 border border-white border-opacity-10 mb-6"
        >
          <form onSubmit={handleTrack} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                placeholder="Enter batch code e.g. BATCH-TOM-2025-001"
                required
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
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

        {/* Batch Details */}
        {batch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Batch Info Card */}
            <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-3xl p-6 border border-white border-opacity-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white text-2xl font-bold">{batch.productName}</h3>
                  <p className="text-gray-400 text-sm mt-1">{batch.batchCode}</p>
                </div>
                <div className="bg-green-500 bg-opacity-20 px-4 py-2 rounded-xl border border-green-500 border-opacity-30">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Blockchain Verified</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white bg-opacity-5 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Farmer</p>
                  <p className="text-white font-semibold text-sm">{batch.farmer?.fullName || 'N/A'}</p>
                </div>
                <div className="bg-white bg-opacity-5 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Quantity</p>
                  <p className="text-white font-semibold text-sm">{batch.quantityKg} KG</p>
                </div>
                <div className="bg-white bg-opacity-5 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Grade</p>
                  <p className="text-white font-semibold text-sm">{batch.qualityGrade}</p>
                </div>
                <div className="bg-white bg-opacity-5 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Status</p>
                  <p className="text-green-400 font-semibold text-sm">{batch.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-white bg-opacity-5 rounded-xl p-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Harvest Date</p>
                    <p className="text-white text-sm font-semibold">{batch.harvestDate}</p>
                  </div>
                </div>
                <div className="bg-white bg-opacity-5 rounded-xl p-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Expiry Date</p>
                    <p className="text-white text-sm font-semibold">{batch.expiryDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Journey Timeline */}
            <div className="bg-white bg-opacity-5 backdrop-blur-lg rounded-3xl p-6 border border-white border-opacity-10">
              <h4 className="text-white text-xl font-bold mb-6">
                🗺️ Journey Timeline
              </h4>
              {history.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No tracking events yet</p>
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
                        <div className="w-10 h-10 bg-white bg-opacity-10 rounded-full flex items-center justify-center border border-white border-opacity-20">
                          {getStatusIcon(event.eventType)}
                        </div>
                        {index < history.length - 1 && (
                          <div className="w-0.5 h-full bg-white bg-opacity-10 mt-2"></div>
                        )}
                      </div>

                      {/* Event details */}
                      <div className="flex-1 bg-white bg-opacity-5 rounded-xl p-4 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-semibold text-sm">{event.eventType}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(event.eventTimestamp).toLocaleDateString()}
                          </p>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <p className="text-gray-400 text-xs">{event.location}</p>
                          </div>
                        )}
                        {event.notes && (
                          <p className="text-gray-500 text-xs mt-1">{event.notes}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ConsumerTracker;