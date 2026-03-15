import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Package, TrendingUp, CheckCircle, Clock, Search,
  ArrowRight, Shield, MapPin, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { batchAPI, userAPI, statsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import AnalyticsSection from '../../components/AnalyticsSection';

interface Batch {
  id: number;
  batchCode: string;
  productName: string;
  quantityKg: number;
  pricePerKg: number;
  status: string;
  qualityGrade: string;
}

const TransporterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferBatchId, setTransferBatchId] = useState<number | null>(null);
  const [transferData, setTransferData] = useState({
    newOwnerId: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchBatches();
    fetchUsers();
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      if (user?.id) {
        // Transporters can see their handling volume
        const response = await batchAPI.getBatchesByOwner(user.id);
        const data = response.data.data || [];
        
        // Mocking grouping by product name for transporter diversity
        const grouped = data.reduce((acc: any, b: any) => {
          acc[b.productName] = (acc[b.productName] || 0) + b.quantityKg;
          return acc;
        }, {});

        setAnalyticsData(Object.entries(grouped).map(([label, value]) => ({ label, value: Number(value) })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBatches = async () => {
    try {
      if (user?.id) {
        const response = await batchAPI.getBatchesByOwner(user.id);
        setBatches(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch shipments!');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAllUsers();
      if (res.data && res.data.data) {
        // Transporters can transfer to Retailers or other Transporters
        const filtered = res.data.data.filter((u: any) => u.id !== user?.id && u.role !== 'FARMER');
        setUsersList(filtered);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const getCurrentLocation = (): Promise<{lat: number, lon: number} | null> => {
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferBatchId) return;

    try {
      setLoading(true);
      const coords = await getCurrentLocation();
      await batchAPI.transferOwnership(
        transferBatchId,
        Number(transferData.newOwnerId),
        transferData.location,
        transferData.notes,
        coords?.lat,
        coords?.lon
      );
      toast.success('Batch handed over successfully!');
      setShowTransferModal(false);
      fetchBatches();
    } catch (e) {
      toast.error('Transfer failed!');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-app-card p-6 rounded-2xl border border-app-border"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Truck className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Shipments</p>
              <h3 className="text-2xl font-bold text-white">{batches.filter(b => b.status === 'IN_TRANSIT').length}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-app-card p-6 rounded-2xl border border-app-border"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Package className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Waiting Pickup</p>
              <h3 className="text-2xl font-bold text-white">{batches.filter(b => b.status === 'CREATED').length}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-app-card p-6 rounded-2xl border border-app-border"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Capacity</p>
              <h3 className="text-2xl font-bold text-white">{batches.reduce((acc, b) => acc + b.quantityKg, 0)} KG</h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Analytics Section */}
      {analyticsData && analyticsData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsSection
             title="Shipment Volume"
             subtitle="Total weight handled by product"
             data={analyticsData}
             type="bar"
             color="#fbbf24"
             icon={<Truck className="w-5 h-5 text-amber-500" />}
             formatter={(v) => `${v}kg`}
          />
          <div className="bg-app-card rounded-2xl border border-app-border p-6 flex flex-col justify-center items-center text-center space-y-4">
             <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-500" />
             </div>
             <h3 className="text-xl font-bold text-white">Efficiency Guard</h3>
             <p className="text-gray-400 max-w-xs text-sm">You are maintaining a 98% on-time delivery rate this month. Keep up the great work!</p>
             <div className="grid grid-cols-2 gap-4 w-full pt-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                   <p className="text-xs text-gray-400">Avg. Transit</p>
                   <p className="text-lg font-bold">2.4 Days</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                   <p className="text-xs text-gray-400">Rating</p>
                   <p className="text-lg font-bold">4.9/5.0</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden">
        <div className="p-6 border-b border-app-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            My Shipments
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="p-4 text-gray-400 font-semibold text-sm">Batch Code</th>
                <th className="p-4 text-gray-400 font-semibold text-sm">Product</th>
                <th className="p-4 text-gray-400 font-semibold text-sm">Quantity</th>
                <th className="p-4 text-gray-400 font-semibold text-sm">Status</th>
                <th className="p-4 text-gray-400 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500 italic">
                    No shipments currently assigned to you.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="border-t border-app-border hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-sm text-amber-500">{batch.batchCode}</td>
                    <td className="p-4">
                      <p className="text-white font-medium">{batch.productName}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                        Grade {batch.qualityGrade}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{batch.quantityKg} KG</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        batch.status === 'IN_TRANSIT' ? 'bg-blue-500/10 text-blue-400' :
                        batch.status === 'CREATED' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setTransferBatchId(batch.id);
                          setShowTransferModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
                      >
                        Handover <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a2f3a] rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-amber-500" />
                Handover Batch
              </h2>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Next Owner (Retailer/Transporter)</label>
                  <select
                    required
                    className="w-full bg-app-bg border border-app-border rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                    onChange={(e) => setTransferData({ ...transferData, newOwnerId: e.target.value })}
                  >
                    <option value="">Select recipient...</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Current Location</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-app-bg border border-app-border rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                    placeholder="E.g., Warehouse A, City Center"
                    onChange={(e) => setTransferData({ ...transferData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Notes</label>
                  <textarea
                    className="w-full bg-app-bg border border-app-border rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 h-24"
                    placeholder="Additional details..."
                    onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-all border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 shadow-xl shadow-amber-500/20 transition-all"
                  >
                    Handover
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransporterDashboard;
