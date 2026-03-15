import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Lock, Mail, Hash, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(email, otp, password);
      setSuccess(true);
      toast.success('Password reset successful!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Please check your OTP and Email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-color)] flex items-center justify-center p-4 transition-colors duration-500 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse transition-colors duration-1000 ${
          theme === 'nature' ? 'bg-emerald-500' : theme === 'midnight' ? 'bg-indigo-500' : 'bg-green-500'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse transition-colors duration-1000 ${
          theme === 'nature' ? 'bg-lime-500' : theme === 'midnight' ? 'bg-purple-500' : 'bg-amber-500'
        }`}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-white/10">
          
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/20"
            >
              <Leaf className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verify OTP</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Enter the 6-digit code sent to your email</p>
          </div>

          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Success!</h2>
              <p className="text-gray-400">Your password has been reset. Redirecting to login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-300 text-sm font-medium ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    required
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* OTP */}
              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-300 text-sm font-medium ml-1">6-Digit OTP</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400 font-bold text-lg">#</div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 tracking-[0.5em] font-mono text-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-300 text-sm font-medium ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-slate-700 dark:text-gray-300 text-sm font-medium ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full text-center text-slate-500 dark:text-gray-400 hover:text-green-500 text-sm font-medium transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
