import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Inbox, Sparkles, TrendingUp, Package, Send } from 'lucide-react';
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
      <header className="relative h-[450px] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] group">
        {/* Background Image with Layered Gradients */}
        <div className="absolute inset-0">
          <img 
            src="/agrichain_market_header_visual_1773581156605.png" 
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
            alt="Market Visual" 
          />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-color)] via-[var(--bg-color)]/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-color)] via-transparent to-transparent"></div>
        </div>
        
        <div className="absolute inset-0 p-12 flex flex-col justify-between">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6"
            >
               <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-300">Global Supply Chain Protocol</span>
               </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl font-black text-app-text tracking-tighter mb-6 leading-none"
            >
              AgriChain <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Market</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-app-text-secondary text-lg font-medium max-w-xl leading-relaxed opacity-90"
            >
              The epicenter of decentralized node-to-node agricultural commerce. 
              Securely authenticate produce, manage trade flows, and execute smart contracts.
            </motion.p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Navigation Pill */}
            <div className="flex items-center gap-2 bg-app-card backdrop-blur-2xl p-2 rounded-[2rem] border border-app-border w-fit shadow-2xl shadow-black/5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs transition-all relative ${
                    activeTab === tab.id 
                      ? 'text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="marketTabPill"
                      className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-[0_10px_25px_rgba(16,185,129,0.4)]"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                     <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'group-hover:text-emerald-400'}`} />
                     {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Stats Cards */}
            <div className="flex gap-4">
               <div className="px-6 py-4 rounded-[1.5rem] bg-app-card backdrop-blur-xl border border-app-border shadow-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted mb-1">Total Volume</p>
                  <p className="text-app-text font-black text-xl tracking-tight">₹48.2M</p>
               </div>
               <div className="px-6 py-4 rounded-[1.5rem] bg-app-card backdrop-blur-xl border border-app-border shadow-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted mb-1">Active Nodes</p>
                  <p className="text-app-text font-black text-xl tracking-tight">1,248</p>
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
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="min-h-[600px]"
        >
          {activeTab === 'browse' ? <Marketplace /> : <ProductRequests />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Market;
