import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, User, Phone, MapPin, Shield } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import { APP_NAME } from '../../branding';
import BrandMark from '../../components/BrandMark';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'FARMER',
    address: '',
    walletAddress: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.register(formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-color)] flex items-center justify-center p-4 transition-colors duration-500 overflow-hidden relative">

      {/* Background decoration */}
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
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
         <div className="bg-white dark:bg-white dark:bg-opacity-5 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-white dark:border-opacity-10">

          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-4"
            >
              <BrandMark className="w-16 h-16" iconClassName="w-8 h-8" />
            </motion.div>
             <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Join {APP_NAME}</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Create your account</p>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 bg-green-500 bg-opacity-10 rounded-xl p-2 border border-green-500 border-opacity-20">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-xs font-medium">Secured by Blockchain Technology</span>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">

            {/* Full Name */}
            <div>
               <label className="text-slate-700 dark:text-gray-300 text-sm font-medium mb-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full bg-slate-50 dark:bg-white dark:bg-opacity-10 border border-slate-200 dark:border-white dark:border-opacity-20 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
               <label className="text-slate-700 dark:text-gray-300 text-sm font-medium mb-2 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-slate-50 dark:bg-white dark:bg-opacity-10 border border-slate-200 dark:border-white dark:border-opacity-20 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
               <label className="text-slate-700 dark:text-gray-300 text-sm font-medium mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  className="w-full bg-slate-50 dark:bg-white dark:bg-opacity-10 border border-slate-200 dark:border-white dark:border-opacity-20 rounded-xl py-3 pl-10 pr-12 text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div>
               <label className="text-slate-700 dark:text-gray-300 text-sm font-medium mb-2 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full bg-slate-50 dark:bg-white dark:bg-opacity-10 border border-slate-200 dark:border-white dark:border-opacity-20 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Role */}
            <div>
               <label className="text-slate-700 dark:text-gray-300 text-sm font-medium mb-2 block">Role</label>
               <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-[#1a2f3a] border border-slate-200 dark:border-white dark:border-opacity-20 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-green-500 transition-all shadow-sm"
              >
                <option value="FARMER">🌾 Farmer</option>
                <option value="TRANSPORTER">🚛 Transporter</option>
                <option value="RETAILER">🏪 Retailer</option>
                <option value="CONSUMER">👤 Consumer</option>
              </select>
            </div>

            {/* Address */}
            <div>
               <label className="text-slate-700 dark:text-gray-300 text-sm font-medium mb-2 block">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  className="w-full bg-slate-50 dark:bg-white dark:bg-opacity-10 border border-slate-200 dark:border-white dark:border-opacity-20 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Register Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-green-500/25 mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
              Login here
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
