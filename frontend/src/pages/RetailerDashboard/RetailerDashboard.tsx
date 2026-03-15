import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, TrendingUp, CheckCircle, Clock, Search,
  ArrowRight, Shield, Check, AlertCircle, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { batchAPI, statsAPI } from '../../services/api';
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
  expiryDate: string;
}

const RetailerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    fetchInventory();
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      if (user?.id) {
        const res = await statsAPI.getRetailerStats(user.id);
        const data = res.data.data;
        
        const transform = (obj: any) => Object.entries(obj).map(([label, value]) => ({ label, value: Number(value) }));
        
        setAnalyticsData({
          spending: transform(data.monthlySpending),
          // Local calculation for inventory breakdown
          inventory: Object.entries(
            batches.reduce((acc: any, b: any) => {
              acc[b.productName] = (acc[b.productName] || 0) + b.quantityKg;
              return acc;
            }, {})
          ).map(([label, value]) => ({ label, value: Number(value) }))
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInventory = async () => {
    try {
      if (user?.id) {
        const response = await batchAPI.getBatchesByOwner(user.id);
        setBatches(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch inventory!');
    } finally {
      setLoading(false);
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

  const confirmReceipt = async (batchId: number) => {
    try {
      if (!user?.id) return;
      setLoading(true);
      const coords = await getCurrentLocation();
      await batchAPI.confirmDelivery(batchId, user.id, coords?.lat, coords?.lon);
      toast.success('Batch delivery confirmed!');
      fetchInventory();
    } catch (e) {
      toast.error('Confirmation failed!');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Retailer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-app-card p-6 rounded-2xl border border-app-border"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Store Inventory</p>
              <h3 className="text-2xl font-bold text-white">{batches.filter(b => b.status === 'DELIVERED').length} Batches</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className="bg-app-card p-6 rounded-2xl border border-app-border"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Incoming Shipments</p>
              <h3 className="text-2xl font-bold text-white">{batches.filter(b => b.status === 'IN_TRANSIT').length} Shipments</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2 }}
           className="bg-app-card p-6 rounded-2xl border border-app-border"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Package className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Stock</p>
              <h3 className="text-2xl font-bold text-white">{batches.reduce((acc, b) => acc + b.quantityKg, 0)} KG</h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Analytics Section */}
      {analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsSection
            title="Purchase Analytics"
            subtitle="Monthly spending on batches"
            data={analyticsData.spending}
            type="area"
            color="#6366f1"
            icon={<TrendingUp className="w-5 h-5 text-indigo-400" />}
            formatter={(v) => `₹${v}`}
          />
          <AnalyticsSection
            title="Inventory Breakdown"
            subtitle="Quantity available by product"
            data={analyticsData.inventory}
            type="bar"
            color="#10b981"
            icon={<Package className="w-5 h-5 text-green-400" />}
            formatter={(v) => `${v}kg`}
          />
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden">
        <div className="p-6 border-b border-app-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            Inventory & Shipments
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="p-4 text-gray-400 font-semibold text-sm">Batch Code</th>
                <th className="p-4 text-gray-400 font-semibold text-sm">Product</th>
                <th className="p-4 text-gray-400 font-semibold text-sm">Quantity</th>
                <th className="p-4 text-gray-400 font-semibold text-sm">Shelf Status</th>
                <th className="p-4 text-gray-400 font-semibold text-sm">Expiry</th>
                <th className="p-4 text-gray-400 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500 italic">
                    Your store inventory is currently empty.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="border-t border-app-border hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-sm text-indigo-400">{batch.batchCode}</td>
                    <td className="p-4">
                      <p className="text-white font-medium">{batch.productName}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                        Grade {batch.qualityGrade}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 font-bold">{batch.quantityKg} KG</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        batch.status === 'DELIVERED' ? 'bg-green-500/10 text-green-400' :
                        batch.status === 'IN_TRANSIT' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-400">{batch.expiryDate || 'N/A'}</td>
                    <td className="p-4">
                      {batch.status === 'IN_TRANSIT' ? (
                        <button
                          onClick={() => confirmReceipt(batch.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all scale-animation"
                        >
                          <Check className="w-4 h-4" /> Confirm Receipt
                        </button>
                      ) : (
                        <span className="text-gray-600 text-xs italic">Already in store</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RetailerDashboard;
