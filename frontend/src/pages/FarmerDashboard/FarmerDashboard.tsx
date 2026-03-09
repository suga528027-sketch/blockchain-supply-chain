import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Leaf, Package, Plus, LogOut, User,
  TrendingUp, Truck, CheckCircle, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { batchAPI } from '../../services/api';
import { toast } from 'react-toastify';

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
}

const FarmerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    quantityKg: '',
    pricePerKg: '',
    qualityGrade: 'A',
    harvestDate: '',
    expiryDate: '',
    description: '',
  });

  useEffect(() => {
    fetchBatches();
  }, []);

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

  const handleCreateBatch = async (e: React.FormEvent) => {
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
      setFormData({
        productName: '', quantityKg: '', pricePerKg: '',
        qualityGrade: 'A', harvestDate: '', expiryDate: '', description: '',
      });
      fetchBatches();
    } catch (error) {
      toast.error('Failed to create batch!');
    } finally {
      setCreateLoading(false);
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

  return (
    <div className="min-h-screen bg-[#0F2027]">

      {/* Navbar */}
      <nav className="bg-white bg-opacity-5 backdrop-blur-lg border-b border-white border-opacity-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">AgriChain</h1>
              <p className="text-gray-400 text-xs">Farmer Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-xl px-4 py-2">
              <User className="w-4 h-4 text-green-400" />
              <span className="text-white text-sm font-medium">{user?.fullName}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="flex items-center gap-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-red-400 px-4 py-2 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </motion.button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white">
            Welcome back, <span className="text-green-400">{user?.fullName}! 👋</span>
          </h2>
          <p className="text-gray-400 mt-1">Manage your produce batches on blockchain</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-5 border border-white border-opacity-10"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                {stat.icon}
              </div>
              <p className="text-gray-400 text-sm">{stat.title}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Batches Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">My Batches</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-500/25"
          >
            <Plus className="w-5 h-5" />
            Create Batch
          </motion.button>
        </div>

        {/* Batches List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : batches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white bg-opacity-5 rounded-2xl border border-white border-opacity-10"
          >
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No batches yet</p>
            <p className="text-gray-600 text-sm mt-1">Create your first batch to get started!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch, index) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white bg-opacity-5 backdrop-blur-lg rounded-2xl p-5 border border-white border-opacity-10 hover:border-green-500 hover:border-opacity-50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-white font-semibold text-lg">{batch.productName}</h4>
                    <p className="text-gray-400 text-xs mt-1">{batch.batchCode}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 ${getStatusColor(batch.status)} bg-opacity-20 px-3 py-1 rounded-full`}>
                    {getStatusIcon(batch.status)}
                    <span className="text-white text-xs font-medium">{batch.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white bg-opacity-5 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">Quantity</p>
                    <p className="text-white font-semibold">{batch.quantityKg} KG</p>
                  </div>
                  <div className="bg-white bg-opacity-5 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">Price/KG</p>
                    <p className="text-white font-semibold">₹{batch.pricePerKg}</p>
                  </div>
                  <div className="bg-white bg-opacity-5 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">Grade</p>
                    <p className="text-white font-semibold">{batch.qualityGrade}</p>
                  </div>
                  <div className="bg-white bg-opacity-5 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">Harvest</p>
                    <p className="text-white font-semibold text-xs">{batch.harvestDate}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a2f3a] rounded-3xl p-6 w-full max-w-md border border-white border-opacity-10 max-h-screen overflow-y-auto"
          >
            <h3 className="text-white text-xl font-bold mb-6">Create New Batch</h3>
            <form onSubmit={handleCreateBatch} className="space-y-4">

              <div>
                <label className="text-gray-300 text-sm mb-1 block">Product Name</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. Tomato, Wheat"
                  required
                  className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Quantity (KG)</label>
                  <input
                    type="number"
                    value={formData.quantityKg}
                    onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })}
                    placeholder="500"
                    required
                    className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Price/KG (₹)</label>
                  <input
                    type="number"
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                    placeholder="25"
                    required
                    className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-1 block">Quality Grade</label>
                <select
                  value={formData.qualityGrade}
                  onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                  className="w-full bg-[#0F2027] border border-white border-opacity-20 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-all"
                >
                  <option value="A">Grade A - Premium</option>
                  <option value="B">Grade B - Standard</option>
                  <option value="C">Grade C - Economy</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Harvest Date</label>
                  <input
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                    required
                    className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                    className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-1 block">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  {createLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create Batch'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;