import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, TrendingUp, Truck, CheckCircle, Clock, QrCode,
  Pencil, Trash2, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { batchAPI, userAPI, statsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import AnalyticsSection from '../../components/AnalyticsSection';
import { DollarSign, TrendingUp as TrendingIcon } from 'lucide-react';

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
  description?: string;
}

const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const location = useLocation();
  const isBatchesPage = location.pathname.includes('/farmer-batches');
  const [activeTab, setActiveTab] = useState('ALL');

  // Users List (for Transfer)
  const [usersList, setUsersList] = useState<any[]>([]);

  // Modals specific states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editBatchId, setEditBatchId] = useState<number | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBatchId, setDeleteBatchId] = useState<number | null>(null);
  const [deleteBatchName, setDeleteBatchName] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferBatchId, setTransferBatchId] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    productName: '',
    quantityKg: '',
    pricePerKg: '',
    qualityGrade: 'A',
    harvestDate: '',
    expiryDate: '',
    description: '',
  });

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
        const res = await statsAPI.getFarmerStats(user.id);
        const data = res.data.data;
        
        // Transform the map data { "Jan": 200 } to [ { label: "Jan", value: 200 } ]
        const transform = (obj: any) => Object.entries(obj).map(([label, value]) => ({ label, value: Number(value) }));
        
        setAnalyticsData({
          revenue: transform(data.monthlyRevenue),
          production: transform(data.monthlyProduction)
        });
      }
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    }
  };

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

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getAllUsers();
      if (res.data && res.data.data) {
        const filtered = res.data.data.filter((u: any) => u.role !== 'FARMER');
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

  const handleOpenCreate = () => {
    setFormData({ productName: '', quantityKg: '', pricePerKg: '', qualityGrade: 'A', harvestDate: '', expiryDate: '', description: '' });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
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
      fetchBatches();
    } catch (error) {
      toast.error('Failed to create batch!');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (batch: Batch) => {
    setFormData({
      productName: batch.productName || '',
      quantityKg: batch.quantityKg ? batch.quantityKg.toString() : '',
      pricePerKg: batch.pricePerKg ? batch.pricePerKg.toString() : '',
      qualityGrade: batch.qualityGrade || 'A',
      harvestDate: batch.harvestDate || '',
      expiryDate: batch.expiryDate || '',
      description: batch.description || '',
    });
    setEditBatchId(batch.id);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const batchData = {
        ...formData,
        quantityKg: parseFloat(formData.quantityKg),
        pricePerKg: parseFloat(formData.pricePerKg),
        harvestDate: formData.harvestDate,
        expiryDate: formData.expiryDate,
      };
      await batchAPI.updateBatch(editBatchId!, batchData);
      toast.success('Batch updated successfully!');
      setShowEditModal(false);
      fetchBatches();
    } catch (error) {
      toast.error('Failed to update batch!');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenDelete = (id: number, name: string) => {
    setDeleteBatchId(id);
    setDeleteBatchName(name);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await batchAPI.deleteBatch(deleteBatchId!);
      toast.success('Batch deleted successfully!');
      setShowDeleteModal(false);
      fetchBatches();
    } catch (err) {
      toast.error('Failed to delete batch!');
    }
  };

  const handleOpenTransfer = (id: number) => {
    setTransferBatchId(id);
    setTransferData({ newOwnerId: '', location: '', notes: '' });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true); // Reuse loading state
    try {
      if (!transferData.newOwnerId) {
        toast.warning('Please select a user to transfer to');
        return;
      }
      
      // Attempt to get current geolocation for the map
      const coords = await getCurrentLocation();
      
      await batchAPI.transferOwnership(
        transferBatchId!,
        Number(transferData.newOwnerId),
        transferData.location,
        transferData.notes,
        coords?.lat,
        coords?.lon
      );
      toast.success('Batch transferred successfully!');
      setShowTransferModal(false);
      fetchBatches();
    } catch (err) {
      toast.error('Failed to transfer batch!');
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

  const filteredBatches = isBatchesPage && activeTab !== 'ALL'
    ? batches.filter(b => b.status === activeTab)
    : batches;

  return (
    <div>
      <div className="max-w-7xl mx-auto pb-10">

        {/* Welcome */}
        {!isBatchesPage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold">
              Welcome back, <span className="text-green-600 dark:text-green-400">{user?.fullName}! 👋</span>
            </h2>
            <p className="text-gray-400 mt-1">Manage your produce batches on blockchain</p>
          </motion.div>
        )}

        {/* Stats */}
        {!isBatchesPage && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
                className="bg-app-card backdrop-blur-xl rounded-2xl p-5 border border-app-border shadow-sm transition-all duration-500"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                {stat.icon}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</p>
              <p className="text-slate-900 dark:text-white text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
          </div>
        )}

        {/* Analytics Section */}
        {!isBatchesPage && analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <AnalyticsSection
              title="Monthly Revenue"
              subtitle="Earnings from batch sales"
              data={analyticsData.revenue}
              type="area"
              color="#10b981"
              icon={<DollarSign className="w-5 h-5" />}
              formatter={(v) => `₹${v}`}
            />
            <AnalyticsSection
              title="Stock Rotation"
              subtitle="Production volume (KG)"
              data={analyticsData.production}
              type="bar"
              color="#6366f1"
              icon={<TrendingIcon className="w-5 h-5" />}
              formatter={(v) => `${v}kg`}
            />
          </div>
        )}

        {/* Batches Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold">{isBatchesPage ? 'My Batches' : 'Recent Batches'}</h3>
            {isBatchesPage && <p className="text-gray-400 text-sm mt-1">Track and manage your grouped batches</p>}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-500/25"
          >
            <Plus className="w-5 h-5" />
            Create Batch
          </motion.button>
        </div>

        {/* Filter Tabs for Batches Page */}
        {isBatchesPage && (
          <div className="flex flex-wrap gap-2 mb-6">
            {['ALL', 'CREATED', 'IN_TRANSIT', 'DELIVERED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === tab
                    ? 'bg-green-600 dark:bg-green-500 text-white shadow-lg'
                    : 'bg-app-card text-gray-400 border border-app-border hover:bg-opacity-80'
                }`}
              >
                {tab === 'ALL' ? 'All Batches' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}

        {/* Batches List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-app-card rounded-2xl border border-app-border"
          >
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No batches found</p>
            <p className="text-gray-600 text-sm mt-1">Try changing categories or create a new batch!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBatches.map((batch, index) => (
                 <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-app-card backdrop-blur-xl rounded-2xl p-5 border border-app-border hover:border-green-500 hover:border-opacity-50 transition-all duration-500 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                     <div>
                      <h4 className="font-semibold text-lg">{batch.productName}</h4>
                      <p className="text-gray-400 text-xs mt-1 font-mono">{batch.batchCode}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 ${getStatusColor(batch.status)} bg-opacity-10 dark:bg-opacity-20 px-3 py-1 rounded-full border border-current border-opacity-10 text-current`}>
                      {getStatusIcon(batch.status)}
                      <span className="text-xs font-medium">{batch.status}</span>
                    </div>
                  </div>

                   <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-app-bg rounded-xl p-3 border border-app-border">
                      <p className="text-gray-400 text-xs">Quantity</p>
                      <p className="font-semibold">{batch.quantityKg} KG</p>
                    </div>
                    <div className="bg-app-bg rounded-xl p-3 border border-app-border">
                      <p className="text-gray-400 text-xs">Price/KG</p>
                      <p className="font-semibold">₹{batch.pricePerKg}</p>
                    </div>
                    <div className="bg-app-bg rounded-xl p-3 border border-app-border">
                      <p className="text-gray-400 text-xs">Grade</p>
                      <p className="font-semibold">{batch.qualityGrade}</p>
                    </div>
                    <div className="bg-app-bg rounded-xl p-3 border border-app-border">
                      <p className="text-gray-400 text-xs">Harvest</p>
                      <p className="font-semibold text-xs">{batch.harvestDate}</p>
                    </div>
                  </div>
                </div>

                 <div>
                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-app-border">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenEdit(batch)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-yellow-500 bg-opacity-10 hover:bg-opacity-20 text-yellow-500 transition-all text-sm font-medium"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenTransfer(batch.id)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500 bg-opacity-10 hover:bg-opacity-20 text-blue-500 transition-all text-sm font-medium"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Transfer
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenDelete(batch.id, batch.productName)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500 bg-opacity-10 hover:bg-opacity-20 text-red-500 transition-all text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </motion.button>
                  </div>

                  {/* QR Code Button */}
                  <div className="mt-3">
                     <a
                      href={`http://localhost:8080/api/qr/batch/${batch.batchCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-app-bg hover:bg-opacity-80 transition-all py-2.5 rounded-xl text-sm font-medium border border-app-border"
                    >
                      <QrCode className="w-4 h-4" />
                      View QR Code
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {/* Create/Edit Batch Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-app-card rounded-3xl p-6 w-full max-w-md border border-app-border max-h-screen overflow-y-auto custom-scrollbar shadow-2xl transition-all duration-500"
            >
              <h3 className="text-xl font-bold mb-6">
                {showEditModal ? 'Edit Batch' : 'Create New Batch'}
              </h3>
              <form onSubmit={showEditModal ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
                
                 <div>
                  <label className="text-gray-400 text-sm mb-1 block">Product Name</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g. Tomato, Wheat"
                    required
                    className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div>
                    <label className="text-gray-400 text-sm mb-1 block">Quantity (KG)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.quantityKg}
                      onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })}
                      placeholder="500"
                      required
                      className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                    />
                  </div>
                   <div>
                    <label className="text-gray-400 text-sm mb-1 block">Price/KG (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.pricePerKg}
                      onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                      placeholder="25"
                      required
                      className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                    />
                  </div>
                </div>

                 <div>
                  <label className="text-gray-400 text-sm mb-1 block">Quality Grade</label>
                  <select
                    value={formData.qualityGrade}
                    onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                    className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                  >
                    <option value="A" className="bg-app-bg">Grade A - Premium</option>
                    <option value="B" className="bg-app-bg">Grade B - Standard</option>
                    <option value="C" className="bg-app-bg">Grade C - Economy</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div>
                    <label className="text-gray-400 text-sm mb-1 block">Harvest Date</label>
                    <input
                      type="date"
                      value={formData.harvestDate}
                      onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                      required
                      className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                      style={{ colorScheme: theme }}
                    />
                  </div>
                   <div>
                    <label className="text-gray-400 text-sm mb-1 block">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      required
                      className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                      style={{ colorScheme: theme }}
                    />
                  </div>
                </div>

                 <div>
                  <label className="text-gray-400 text-sm mb-1 block">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 transition-all focus:border-green-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 mt-6 pt-2">
                   <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                    className="flex-1 bg-app-bg hover:bg-opacity-80 border border-app-border py-3 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 shadow-lg text-white py-3 rounded-xl font-semibold transition-all"
                  >
                    {createLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{showEditModal ? 'Saving...' : 'Creating...'}</span>
                      </div>
                    ) : (
                      <>{showEditModal ? 'Save Details' : 'Create Batch'}</>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
             <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-app-card rounded-3xl p-6 w-full max-w-sm border border-app-border shadow-2xl text-center transition-all duration-500"
            >
              <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-2">Delete Batch?</h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">
                Are you sure you want to delete <span className="text-slate-900 dark:text-white font-semibold">{deleteBatchName}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all shadow-lg"
                >
                  Confirm Delete
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Transfer Batch Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
             <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-app-card rounded-3xl p-6 w-full max-w-md border border-app-border shadow-2xl transition-all duration-500"
            >
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ArrowRight className="text-blue-500" />
                Transfer Ownership
              </h3>
              <form onSubmit={handleTransferSubmit} className="space-y-4">
                
                <div>
                   <label className="text-slate-600 dark:text-gray-300 text-sm mb-1 block">Select Recipient User</label>
                  <select
                    value={transferData.newOwnerId}
                    onChange={(e) => setTransferData({ ...transferData, newOwnerId: e.target.value })}
                    required
                     className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="" disabled>Select User (Transporter/Retailer)</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                   <label className="text-slate-600 dark:text-gray-300 text-sm mb-1 block">Current Location</label>
                  <input
                    type="text"
                    value={transferData.location}
                    onChange={(e) => setTransferData({ ...transferData, location: e.target.value })}
                    placeholder="e.g. Warehouse A, Port Blair"
                    required
                     className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                   <label className="text-slate-600 dark:text-gray-300 text-sm mb-1 block">Transfer Notes</label>
                  <input
                    type="text"
                    value={transferData.notes}
                    onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                    placeholder="e.g. Quality sealed, Ready for dispatch"
                     className="w-full bg-app-bg border border-app-border rounded-xl py-3 px-4 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div className="flex gap-3 mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                     className="flex-1 bg-app-bg hover:bg-opacity-80 border border-app-border py-3 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 text-white py-3 rounded-xl font-semibold transition-all"
                  >
                    Transfer Batch
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

export default FarmerDashboard;
