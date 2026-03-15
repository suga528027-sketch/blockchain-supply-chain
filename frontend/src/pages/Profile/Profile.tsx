import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Shield, Calendar, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Header Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full md:w-1/3 bg-app-card backdrop-blur-3xl border border-app-border rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px]"></div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-400 to-indigo-600 p-1 shadow-2xl mb-6">
              <div className="w-full h-full rounded-[1.4rem] bg-[#0a0f1e] flex items-center justify-center">
                <User className="w-16 h-16 text-emerald-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-white mb-1">{user?.fullName}</h2>
            <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">{user?.role}</span>
            </div>

            <div className="w-full space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-left group hover:border-emerald-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Mail className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Primary Email</p>
                  <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-left group hover:border-indigo-500/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <Phone className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Contact Number</p>
                  <p className="text-sm font-bold text-white">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details & Security Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 space-y-6 w-full"
        >
          {/* Identity Info */}
          <div className="bg-app-card backdrop-blur-3xl border border-app-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
              <Shield className="w-6 h-6 text-emerald-400" />
              Identity Verification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Legal Full Name</label>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold">
                  {user?.fullName}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Government ID (Aadhaar/PAN)</label>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold">
                  {user?.aadhaarNumber || 'Verified Identity'}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Verification Status</label>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                   <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                      <Award className="w-4 h-4 text-white" />
                   </div>
                   <span className="text-emerald-400 font-black text-sm uppercase tracking-widest">Active Trusted Node</span>
                </div>
              </div>
            </div>
          </div>

          {/* Node History */}
          <div className="bg-app-card backdrop-blur-3xl border border-app-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-indigo-400" />
              Node Chronology
            </h3>
            
            <div className="space-y-6">
               <div className="flex gap-4">
                  <div className="w-px bg-white/10 relative">
                     <div className="absolute top-0 -left-1 w-2 h-2 bg-indigo-500 rounded-full"></div>
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Created Account</p>
                     <p className="text-sm text-slate-400 font-medium leading-relaxed">Identity established on the AgriChain ledger via manual registration.</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="w-px bg-white/10 relative h-12">
                     <div className="absolute top-0 -left-1 w-2 h-2 bg-emerald-500 rounded-full"></div>
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Role Assigned</p>
                     <p className="text-sm text-slate-400 font-medium leading-relaxed">Granted {user?.role} level permissions for supply chain operations.</p>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
