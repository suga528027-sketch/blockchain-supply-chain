import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Inbox, Sparkles, TrendingUp, Package, Send, Truck } from 'lucide-react';
import Marketplace from '../Marketplace/Marketplace';
import ProductRequests from '../ProductRequests/ProductRequests';

const Market: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'requests'>('browse');

  const tabs = [
    { id: 'browse', label: 'Browse Node Marketplace', icon: ShoppingCart },
    { id: 'requests', label: 'Active Trade Requests', icon: Inbox },
  ];

  return (
    <div className="space-y-12 pb-24">
      {/* Cinematic Premium Header */}
      <header className="relative h-[480px] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] group bg-app-bg/50">
        {/* Background Image with Layered Gradients */}
        <div className="absolute inset-0">
          <img 
            src="/agrichain_market_header_visual_1773581156605.png" 
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000 opacity-60"
            alt="Market Visual" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-[var(--bg-color)]/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-color)] via-transparent to-transparent"></div>
        </div>
        
        <div className="absolute inset-0 p-12 flex flex-col justify-between">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-8"
            >
               <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300">Agricultural Supply Chain Protocol</span>
               </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl font-black text-app-text tracking-tighter mb-6 leading-none italic"
            >
              Supply <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Exchange</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-app-text-secondary text-lg font-medium max-w-xl leading-relaxed opacity-90 border-l-2 border-emerald-500/30 pl-6"
            >
              The epicenter of decentralized node-to-node agricultural commerce. 
              Securely source production stock, assign logistics providers, and execute smart contracts across the network.
            </motion.p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Navigation Pill */}
            <div className="flex items-center gap-2 bg-app-card/60 backdrop-blur-3xl p-2.5 rounded-[2.5rem] border border-white/5 w-fit shadow-2xl shadow-black/20">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-10 py-5 rounded-full font-black text-[11px] transition-all relative ${
                    activeTab === tab.id 
                      ? 'text-white' 
                      : 'text-app-text-muted hover:text-emerald-500'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="marketTabPill_v2"
                      className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-[0_12px_28px_rgba(16,185,129,0.35)]"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5 uppercase tracking-widest">
                     <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'group-hover:text-emerald-400'}`} />
                     {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Stats Cards */}
            <div className="flex gap-4">
               <div className="px-8 py-5 rounded-[2rem] bg-app-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted mb-1.5 opacity-50 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-emerald-500" /> Total Volume
                  </p>
                  <p className="text-app-text font-black text-2xl tracking-tighter">₹48.2M +</p>
               </div>
               <div className="px-8 py-5 rounded-[2rem] bg-app-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted mb-1.5 opacity-50 flex items-center gap-2">
                    <Truck className="w-3 h-3 text-blue-500" /> Fleet Active
                  </p>
                  <p className="text-app-text font-black text-2xl tracking-tighter">142 <span className="text-xs text-app-text-muted font-bold tracking-normal opacity-50 ml-1">TRUCKS</span></p>
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="min-h-[600px]"
        >
          {activeTab === 'browse' ? <Marketplace /> : <ProductRequests />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Market;
