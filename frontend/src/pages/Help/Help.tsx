import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, MessageSquare, BookOpen, Video, FileText, ChevronRight, Zap } from 'lucide-react';

const Help: React.FC = () => {
  const categories = [
    { title: 'User Guides', desc: 'Step-by-step app walkthroughs', icon: BookOpen, color: 'text-emerald-400' },
    { title: 'Video Tutorials', desc: 'Visual learning for all features', icon: Video, color: 'text-indigo-400' },
    { title: 'Expert Support', desc: 'Chat with our lead engineers', icon: MessageSquare, color: 'text-cyan-400' },
    { title: 'Documentation', desc: 'Complete API and protocol docs', icon: FileText, color: 'text-purple-400' },
  ];

  const faqs = [
    { q: "How do I verify a batch code?", a: "Go to the 'Track Produce' section and enter the batch code found on your physical delivery label." },
    { q: "What is an Active Trusted Node?", a: "This means your identity has been verified through Aadhaar/KYC on our supply chain protocol." },
    { q: "How do I transfer batch ownership?", a: "Use the 'My Batches' section, select a batch, and choose 'Transfer Ownership' to send it to another node." },
  ];

  return (
    <div className="pb-24">
      <header className="mb-16 text-center max-w-2xl mx-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-2xl"
        >
          <HelpCircle className="w-8 h-8 text-emerald-400" />
        </motion.div>
        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Need Assistance?</h2>
        <p className="text-slate-500 font-medium text-lg leading-relaxed">
          Access our comprehensive wisdom base or connect with our support squadron.
        </p>
      </header>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group p-8 bg-app-card backdrop-blur-3xl border border-app-border rounded-[2.5rem] hover:border-emerald-500/30 transition-all cursor-pointer shadow-xl relative overflow-hidden"
          >
            <div className={`p-4 rounded-2xl bg-white/5 w-fit mb-6 group-hover:bg-emerald-500/10 transition-colors`}>
               <cat.icon className={`w-6 h-6 ${cat.color}`} />
            </div>
            <h4 className="text-white font-black text-lg mb-2">{cat.title}</h4>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">{cat.desc}</p>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
               Access Now <ChevronRight className="w-3 h-3" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="bg-app-card backdrop-blur-3xl border border-app-border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px]"></div>
        
        <div className="flex items-center gap-3 mb-10">
           <Zap className="w-6 h-6 text-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
           <h3 className="text-2xl font-black text-white">Quick Resolutions (FAQ)</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {faqs.map((faq, i) => (
             <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                <h5 className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em] mb-3">Resolution #{i+1}</h5>
                <p className="text-white font-bold mb-3">{faq.q}</p>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{faq.a}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Help;
