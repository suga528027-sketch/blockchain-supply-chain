import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Package, Shield,
  CheckCircle, Truck, Trash2, Ban,
  UserCheck, Pencil, X, AlertTriangle, Search
} from 'lucide-react';
import { userAPI, batchAPI, statsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import AnalyticsSection from '../../components/AnalyticsSection';
import { TrendingUp as TrendingIcon, DollarSign } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  initialTab?: 'overview' | 'users' | 'batches';
}

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Batch {
  id: number;
  batchCode: string;
  productName: string;
  quantityKg: number;
  pricePerKg: number;
  qualityGrade: string;
  status: string;
}

interface EditBatchForm {
  productName: string;
  quantityKg: string;
  pricePerKg: string;
  qualityGrade: string;
  status: string;
}

// ─── UsersView subcomponent (search + role tabs) ─────────────────────────────
const UsersView: React.FC<{
  users: User[];
  ROLES: readonly string[];
  roleTabColors: Record<string, string>;
  getRoleColor: (r: string) => string;
  banLoadingMap: Record<number, boolean>;
  handleToggleBan: (u: User) => void;
  openDeleteUser: (u: User) => void;
  deleteUserModal: boolean;
  userToDelete: User | null;
  deleteUserLoading: boolean;
  confirmDeleteUser: () => void;
  setDeleteUserModal: (v: boolean) => void;
  setUserToDelete: (u: User | null) => void;
}> = ({
  users, ROLES, roleTabColors, getRoleColor,
  banLoadingMap, handleToggleBan, openDeleteUser,
  deleteUserModal, userToDelete, deleteUserLoading,
  confirmDeleteUser, setDeleteUserModal, setUserToDelete,
}) => {
  const [search,      setSearch]      = useState('');
  const [activeRole,  setActiveRole]  = useState('ALL');

  const q = search.trim().toLowerCase();

  const filtered = users.filter(u => {
    const matchRole   = activeRole === 'ALL' || u.role === activeRole;
    const matchSearch = !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  // Count per role for badge
  const countOf = (role: string) =>
    role === 'ALL' ? users.length : users.filter(u => u.role === role).length;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">All Users</h2>
            <p className="text-gray-400 text-sm">{users.length} registered users · ADMIN accounts are protected</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-app-card border border-app-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Role filter tabs ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ROLES.map(role => {
          const active = activeRole === role;
          const count  = countOf(role);
          return (
            <motion.button
              key={role}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveRole(role)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                active
                  ? `bg-gradient-to-r ${roleTabColors[role]} text-white border-transparent shadow-lg`
                  : 'bg-app-card text-gray-400 border-app-border hover:text-white'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                active ? 'bg-white/25 text-white' : 'bg-white/5 text-gray-500'
              }`}>{count}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No users found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app-border bg-white/[0.02]">
                  <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Name</th>
                  <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Email</th>
                  <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Role</th>
                  <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Status</th>
                  <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, index) => {
                  const isAdmin      = user.role === 'ADMIN';
                  const isBanLoading = banLoadingMap[user.id] || false;
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-all"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleTabColors[user.role] ?? 'from-gray-500 to-gray-600'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium text-sm">{user.fullName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${
                          user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                          {user.isActive ? 'Active' : 'Banned'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {/* Ban / Activate */}
                          <motion.button
                            whileHover={!isAdmin ? { scale: 1.07 } : {}}
                            whileTap={!isAdmin  ? { scale: 0.94 } : {}}
                            onClick={() => !isAdmin && handleToggleBan(user)}
                            disabled={isAdmin || isBanLoading}
                            title={isAdmin ? 'Cannot modify ADMIN' : user.isActive ? 'Ban User' : 'Activate User'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isAdmin
                                ? 'opacity-30 cursor-not-allowed bg-gray-500/10 text-gray-500 border border-gray-500/10'
                                : user.isActive
                                  ? 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/20'
                                  : 'bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20'
                            }`}
                          >
                            {isBanLoading
                              ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              : user.isActive
                                ? <><Ban className="w-3.5 h-3.5" /> Ban</>
                                : <><UserCheck className="w-3.5 h-3.5" /> Activate</>
                            }
                          </motion.button>

                          {/* Delete */}
                          <motion.button
                            whileHover={!isAdmin ? { scale: 1.07 } : {}}
                            whileTap={!isAdmin  ? { scale: 0.94 } : {}}
                            onClick={() => !isAdmin && openDeleteUser(user)}
                            disabled={isAdmin}
                            title={isAdmin ? 'Cannot delete ADMIN' : 'Delete User'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isAdmin
                                ? 'opacity-30 cursor-not-allowed bg-gray-500/10 text-gray-500 border border-gray-500/10'
                                : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Result count */}
      {search && (
        <p className="text-gray-500 text-xs mt-3 text-right">
          Showing {filtered.length} of {users.length} users
        </p>
      )}

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {deleteUserModal && userToDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#1a2f3a] rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Delete User?</h3>
              <p className="text-gray-400 text-sm mb-1">Are you sure you want to delete</p>
              <p className="text-white font-semibold mb-1">{userToDelete.fullName}</p>
              <p className="text-gray-500 text-xs mb-4">{userToDelete.email}</p>
              <p className="text-red-400 text-xs mb-6 bg-red-500/10 rounded-xl py-2 px-3 border border-red-500/20">
                ⚠️ This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteUserModal(false); setUserToDelete(null); }}
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-semibold transition-all border border-white/10"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={confirmDeleteUser}
                  disabled={deleteUserLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-70"
                >
                  {deleteUserLoading
                    ? <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Deleting…</span>
                      </div>
                    : 'Confirm Delete'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboard: React.FC<Props> = ({ initialTab = 'overview' }) => {

  const [users,   setUsers]   = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<any>(null);

  // Delete user modal
  const [deleteUserModal,   setDeleteUserModal]   = useState(false);
  const [userToDelete,      setUserToDelete]       = useState<User | null>(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);

  // Ban / activate per-button loading map
  const [banLoadingMap, setBanLoadingMap] = useState<Record<number, boolean>>({});

  // Edit batch modal
  const [editBatchModal,   setEditBatchModal]   = useState(false);
  const [batchToEdit,      setBatchToEdit]       = useState<Batch | null>(null);
  const [editBatchLoading, setEditBatchLoading] = useState(false);
  const [editBatchForm,    setEditBatchForm]     = useState<EditBatchForm>({
    productName: '', quantityKg: '', pricePerKg: '', qualityGrade: '', status: '',
  });

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, batchesRes, statsRes] = await Promise.all([
        userAPI.getAllUsers(),
        batchAPI.getAllBatches(),
        statsAPI.getAdminStats()
      ]);
      setUsers(usersRes.data.data || []);
      setBatches(batchesRes.data.data || []);
      setAdminStats(statsRes.data.data);
    } catch {
      toast.error('Failed to fetch data!');
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'FARMER':      return 'bg-green-500/20 text-green-400';
      case 'TRANSPORTER': return 'bg-amber-500/20 text-amber-400';
      case 'RETAILER':    return 'bg-blue-500/20 text-blue-400';
      case 'ADMIN':       return 'bg-red-500/20 text-red-400';
      default:            return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED':    return 'bg-blue-500/20 text-blue-400';
      case 'IN_TRANSIT': return 'bg-amber-500/20 text-amber-400';
      case 'DELIVERED':  return 'bg-green-500/20 text-green-400';
      case 'CANCELLED':  return 'bg-red-500/20 text-red-400';
      default:           return 'bg-gray-500/20 text-gray-400';
    }
  };

  // ─── Delete user ────────────────────────────────────────────────────────────
  const openDeleteUser = (user: User) => { setUserToDelete(user); setDeleteUserModal(true); };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteUserLoading(true);
    try {
      await userAPI.deleteUser(userToDelete.id);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast.success(`User "${userToDelete.fullName}" deleted successfully!`);
      setDeleteUserModal(false);
      setUserToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user!');
    } finally {
      setDeleteUserLoading(false);
    }
  };

  // ─── Ban / Activate ─────────────────────────────────────────────────────────
  const handleToggleBan = async (user: User) => {
    setBanLoadingMap(prev => ({ ...prev, [user.id]: true }));
    try {
      if (user.isActive) {
        await userAPI.banUser(user.id);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: false } : u));
        toast.success(`User "${user.fullName}" banned.`);
      } else {
        await userAPI.activateUser(user.id);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: true } : u));
        toast.success(`User "${user.fullName}" activated.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed!');
    } finally {
      setBanLoadingMap(prev => ({ ...prev, [user.id]: false }));
    }
  };

  // ─── Edit batch ─────────────────────────────────────────────────────────────
  const openEditBatch = (batch: Batch) => {
    setBatchToEdit(batch);
    setEditBatchForm({
      productName:  batch.productName,
      quantityKg:   String(batch.quantityKg),
      pricePerKg:   String(batch.pricePerKg),
      qualityGrade: batch.qualityGrade,
      status:       batch.status,
    });
    setEditBatchModal(true);
  };

  const handleEditBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchToEdit) return;
    setEditBatchLoading(true);
    try {
      await batchAPI.updateBatch(batchToEdit.id, {
        productName:  editBatchForm.productName,
        quantityKg:   parseFloat(editBatchForm.quantityKg),
        pricePerKg:   parseFloat(editBatchForm.pricePerKg),
        qualityGrade: editBatchForm.qualityGrade,
        status:       editBatchForm.status,
      });
      setBatches(prev =>
        prev.map(b => b.id === batchToEdit.id
          ? { ...b, ...editBatchForm,
              quantityKg: parseFloat(editBatchForm.quantityKg),
              pricePerKg: parseFloat(editBatchForm.pricePerKg) }
          : b
        )
      );
      toast.success('Batch updated successfully!');
      setEditBatchModal(false);
      setBatchToEdit(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update batch!');
    } finally {
      setEditBatchLoading(false);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Shared styles ───────────────────────────────────────────────────────────
  const inputCls =
    'w-full bg-app-bg border border-app-border rounded-xl py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all';

  const stats = [
    { title: 'Total Users',   value: users.length,                                          icon: <Users className="w-6 h-6" />,       color: 'from-blue-500 to-blue-600' },
    { title: 'Total Batches', value: batches.length,                                        icon: <Package className="w-6 h-6" />,     color: 'from-green-500 to-green-600' },
    { title: 'In Transit',    value: batches.filter(b => b.status === 'IN_TRANSIT').length, icon: <Truck className="w-6 h-6" />,       color: 'from-amber-500 to-amber-600' },
    { title: 'Delivered',     value: batches.filter(b => b.status === 'DELIVERED').length,  icon: <CheckCircle className="w-6 h-6" />, color: 'from-purple-500 to-purple-600' },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: OVERVIEW  (/admin-dashboard)
  // ═══════════════════════════════════════════════════════════════════════════
  if (initialTab === 'overview') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
            <p className="text-gray-400 text-sm">Complete oversight of the supply chain system</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-app-card backdrop-blur-xl rounded-2xl p-5 border border-app-border shadow-sm transition-all duration-500"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white mb-3 shadow-lg`}>
                {stat.icon}
              </div>
              <p className="text-gray-400 text-sm">{stat.title}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Global Analytics */}
        {adminStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AnalyticsSection
              title="System Growth"
              subtitle="Total transaction volume (INR)"
              data={[
                { label: 'Jan', value: 45000 },
                { label: 'Feb', value: 89000 },
                { label: 'Mar', value: Number(adminStats.totalTransactionVolume) || 0 }
              ]}
              type="area"
              color="#ef4444"
              icon={<DollarSign className="w-5 h-5 text-red-400" />}
              formatter={(v) => `₹${v}`}
            />
            <AnalyticsSection
              title="User Distribution"
              subtitle="Registered users per role"
              data={Object.entries(adminStats.userRolesDistribution || {}).map(([label, value]) => ({ 
                label, 
                value: Number(value) 
              }))}
              type="bar"
              color="#3b82f6"
              icon={<Users className="w-5 h-5 text-blue-400" />}
            />
          </div>
        )}

        {/* Overview distribution cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role distribution */}
          <div className="bg-app-card rounded-2xl p-6 border border-app-border">
            <h3 className="text-white font-bold mb-5 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" /> Users by Role
            </h3>
            {['FARMER', 'TRANSPORTER', 'RETAILER', 'CONSUMER', 'ADMIN'].map(role => {
              const count = users.filter(u => u.role === role).length;
              const pct   = users.length ? Math.round((count / users.length) * 100) : 0;
              return (
                <div key={role} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getRoleColor(role)}`}>{role}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Batch status distribution */}
          <div className="bg-app-card rounded-2xl p-6 border border-app-border">
            <h3 className="text-white font-bold mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-400" /> Batches by Status
            </h3>
            {['CREATED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map(status => {
              const count = batches.filter(b => b.status === status).length;
              const pct   = batches.length ? Math.round((count / batches.length) * 100) : 0;
              return (
                <div key={status} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(status)}`}>{status}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: ALL USERS  (/admin-users)
  // ═══════════════════════════════════════════════════════════════════════════
  if (initialTab === 'users') {
    const ROLES = ['ALL', 'FARMER', 'TRANSPORTER', 'RETAILER', 'CONSUMER', 'ADMIN'] as const;
    const roleTabColors: Record<string, string> = {
      ALL:         'from-blue-500 to-indigo-500',
      FARMER:      'from-green-500 to-emerald-500',
      TRANSPORTER: 'from-amber-500 to-orange-500',
      RETAILER:    'from-sky-500 to-cyan-500',
      CONSUMER:    'from-purple-500 to-violet-500',
      ADMIN:       'from-red-500 to-rose-500',
    };

    return (
      <UsersView
        users={users}
        ROLES={ROLES}
        roleTabColors={roleTabColors}
        getRoleColor={getRoleColor}
        banLoadingMap={banLoadingMap}
        handleToggleBan={handleToggleBan}
        openDeleteUser={openDeleteUser}
        deleteUserModal={deleteUserModal}
        userToDelete={userToDelete}
        deleteUserLoading={deleteUserLoading}
        confirmDeleteUser={confirmDeleteUser}
        setDeleteUserModal={setDeleteUserModal}
        setUserToDelete={setUserToDelete}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: ALL BATCHES  (/admin-batches)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">All Batches</h2>
          <p className="text-gray-400 text-sm">{batches.length} batches across the supply chain</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-app-border bg-white/[0.02]">
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Batch Code</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Product</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Qty (KG)</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Price/KG</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Grade</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-gray-400 text-xs font-semibold uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch, index) => (
                <motion.tr
                  key={batch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-all"
                >
                  <td className="p-4 text-green-400 font-mono text-sm font-semibold">{batch.batchCode}</td>
                  <td className="p-4 text-white font-medium">{batch.productName}</td>
                  <td className="p-4 text-gray-400">{batch.quantityKg}</td>
                  <td className="p-4 text-gray-400">₹{batch.pricePerKg}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-500/20 text-purple-400">
                      {batch.qualityGrade}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(batch.status)}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <motion.button
                      whileHover={{ scale: 1.07 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => openEditBatch(batch)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 border border-yellow-500/20 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Batch Modal */}
      <AnimatePresence>
        {editBatchModal && batchToEdit && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#1a2f3a] rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white text-xl font-bold flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-yellow-400" /> Edit Batch
                </h3>
                <button
                  onClick={() => { setEditBatchModal(false); setBatchToEdit(null); }}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-green-400 font-mono text-sm mb-5 bg-green-500/10 px-3 py-2 rounded-xl border border-green-500/20">
                {batchToEdit.batchCode}
              </p>

              <form onSubmit={handleEditBatchSubmit} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Product Name</label>
                  <input type="text" value={editBatchForm.productName} required
                    onChange={e => setEditBatchForm({ ...editBatchForm, productName: e.target.value })}
                    className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Quantity (KG)</label>
                    <input type="number" step="any" min="0" value={editBatchForm.quantityKg} required
                      onChange={e => setEditBatchForm({ ...editBatchForm, quantityKg: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Price / KG (₹)</label>
                    <input type="number" step="any" min="0" value={editBatchForm.pricePerKg} required
                      onChange={e => setEditBatchForm({ ...editBatchForm, pricePerKg: e.target.value })}
                      className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Quality Grade</label>
                  <select value={editBatchForm.qualityGrade}
                    onChange={e => setEditBatchForm({ ...editBatchForm, qualityGrade: e.target.value })}
                    className={inputCls}>
                    <option value="A" className="bg-[#1a2f3a]">Grade A – Premium</option>
                    <option value="B" className="bg-[#1a2f3a]">Grade B – Standard</option>
                    <option value="C" className="bg-[#1a2f3a]">Grade C – Economy</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Status</label>
                  <select value={editBatchForm.status}
                    onChange={e => setEditBatchForm({ ...editBatchForm, status: e.target.value })}
                    className={inputCls}>
                    <option value="CREATED"    className="bg-[#1a2f3a]">CREATED</option>
                    <option value="IN_TRANSIT" className="bg-[#1a2f3a]">IN_TRANSIT</option>
                    <option value="DELIVERED"  className="bg-[#1a2f3a]">DELIVERED</option>
                    <option value="CANCELLED"  className="bg-[#1a2f3a]">CANCELLED</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button"
                    onClick={() => { setEditBatchModal(false); setBatchToEdit(null); }}
                    className="flex-1 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-semibold transition-all border border-white/10">
                    Cancel
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit" disabled={editBatchLoading}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-70">
                    {editBatchLoading
                      ? <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving…</span>
                        </div>
                      : 'Save Changes'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;