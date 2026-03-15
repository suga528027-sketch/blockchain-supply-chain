import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Bell, 
  ChevronDown, 
  Truck, 
  UserCircle,
  Shield,
  Clock,
  Zap,
  CheckCircle,
  Moon,
  Sun,
  Sparkles,
  Leaf,
  Trash2,
  X,
  AlertTriangle,
  Heart
} from 'lucide-react';

const UserProfile: React.FC<{ unreadCount: number }> = ({ unreadCount }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleDeleteRequest = async () => {
    if (!user?.email) return;
    setIsDeleting(true);
    try {
      await authAPI.requestDeletion(user.email);
      toast.success('Verification code sent to your email.');
      setOtpSent(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user?.email || !deleteOtp) {
      toast.warning('Please enter the verification code.');
      return;
    }
    setIsDeleting(true);
    try {
      await authAPI.confirmDeletion(user.email, deleteOtp);
      toast.success('Your account has been permanently deleted.');
      logout();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'TRANSPORTER': return <Truck className="w-3 h-3" />;
      case 'ADMIN': return <Shield className="w-3 h-3" />;
      case 'FARMER': return <Leaf className="w-3 h-3" />;
      default: return <UserCircle className="w-3 h-3" />;
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'pink': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'dark': return <Moon className="w-4 h-4 text-indigo-400" />;
      case 'midnight': return <Zap className="w-4 h-4 text-purple-400" />;
      case 'nature': return <Leaf className="w-4 h-4 text-green-500" />;
      default: return <Moon className="w-4 h-4" />;
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/notifications')}
          className="relative p-2.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg group"
        >
          <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-app-bg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </motion.button>

        {/* Profile Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 p-1.5 pr-4 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-500/30 transition-all shadow-xl group"
        >
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-indigo-600 flex items-center justify-center border-2 border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.2)] overflow-hidden"
            >
               <User className="w-5 h-5 text-white" />
            </motion.div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#020617] shadow-sm"></span>
          </div>

          <div className="hidden md:block text-left">
            <p className="text-sm font-black text-app-text leading-none mb-1 group-hover:text-emerald-400 transition-colors">
              {user?.fullName?.split(' ')[0]}
            </p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {getRoleIcon()}
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{user?.role}</span>
            </div>
          </div>

          <ChevronDown className={`w-4 h-4 text-app-text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute top-full right-0 mt-4 w-72 bg-[#0a0f1e]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
            >
              {/* Header / Stats Overlay */}
              <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border-b border-white/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-indigo-600 flex items-center justify-center shadow-2xl">
                      <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h4 className="text-app-text font-black text-lg truncate w-40">{user?.fullName}</h4>
                    <p className="text-app-text-secondary text-xs font-medium">{user?.email}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span className="text-app-text font-black text-xs">5 Active</span>
                    </div>
                    <p className="text-[10px] text-app-text-muted font-bold uppercase tracking-wider">Shipments</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-3 h-3 text-cyan-400" />
                      <span className="text-app-text font-black text-xs">12 Ready</span>
                    </div>
                    <p className="text-[10px] text-app-text-muted font-bold uppercase tracking-wider">Completed</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <button 
                  onClick={() => handleNavigate('/profile')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-app-text-secondary hover:text-app-text hover:bg-white/5 transition-all group"
                >
                  <UserCircle className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-sm font-bold">View Profile</span>
                </button>
                <button 
                  onClick={() => handleNavigate('/settings')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-app-text-secondary hover:text-app-text hover:bg-white/5 transition-all group"
                >
                  <Settings className="w-5 h-5 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-sm font-bold">Account Settings</span>
                </button>
                <button 
                  onClick={() => handleNavigate('/help')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-app-text-secondary hover:text-app-text hover:bg-white/5 transition-all group"
                >
                  <HelpCircle className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-sm font-bold">Help & Support</span>
                </button>
                
                <div className="my-2 border-t border-white/5"></div>

                {/* Theme Switcher in Dropdown */}
                <button 
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {getThemeIcon()}
                    <span className="text-sm font-bold uppercase tracking-widest">{theme} Theme</span>
                  </div>
                  <div className="w-8 h-4 bg-white/10 rounded-full relative p-0.5">
                     <motion.div 
                       animate={{ x: theme === 'midnight' || theme === 'dark' || theme === 'nature' ? 16 : 0 }}
                       className="w-3 h-3 bg-emerald-400 rounded-full"
                     />
                  </div>
                </button>

                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-app-text-secondary hover:text-app-text hover:bg-white/5 transition-all group"
                >
                  <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-widest">Logout System</span>
                </button>

                <button 
                  onClick={() => { setIsOpen(false); setShowDeleteModal(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all group mt-2"
                >
                  <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-widest">Delete Identity</span>
                </button>
              </div>

              {/* Footer */}
              <div className="p-4 bg-black/20 text-center flex items-center justify-center gap-2">
                 <Clock className="w-3 h-3 text-slate-600" />
                 <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Last Login: Oct 24, 14:32</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Account Deletion Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0f1e] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px]"></div>
              
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                 </div>
                 <button onClick={() => setShowDeleteModal(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <h3 className="text-2xl font-black text-white mb-2">Delete Account?</h3>
              <p className="text-slate-400 text-sm mb-8">
                This action is permanent and cannot be undone. All your node data, batches, and history will be cleared from the ledger.
              </p>

              {!otpSent ? (
                <button
                  onClick={handleDeleteRequest}
                  disabled={isDeleting}
                  className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-4 rounded-2xl transition-all shadow-[0_10px_30px_rgba(239,68,68,0.3)]"
                >
                  {isDeleting ? 'Broadcasting...' : 'Request Deletion Code'}
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2 text-center">
                    <label className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em]">Identity Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={deleteOtp}
                      onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g,''))}
                      placeholder="000000"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-center text-3xl font-black tracking-[1em] text-white focus:outline-none focus:border-red-500/50 transition-all"
                    />
                    <p className="text-[10px] text-slate-500 italic">Code sent to: {user?.email}</p>
                  </div>
                  
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_10px_40px_rgba(220,38,38,0.4)]"
                  >
                    {isDeleting ? 'Wiping Node Data...' : 'Confirm Permanent Deletion'}
                  </button>
                </div>
              )}

              <button 
                onClick={() => setShowDeleteModal(false)}
                className="w-full mt-4 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors py-2"
              >
                Cancel Process
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserProfile;
