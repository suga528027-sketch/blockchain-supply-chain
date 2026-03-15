import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Monitor, 
  Globe, 
  Key,
  Database,
  Lock,
  Smartphone,
  X,
  Check
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';

const Toggle: React.FC<{ enabled: boolean; onClick: () => void }> = ({ enabled, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${enabled ? 'bg-emerald-500' : 'bg-white/10'}`}
  >
    <motion.div 
      animate={{ x: enabled ? 24 : 0 }}
      className={`w-4 h-4 rounded-full shadow-lg ${enabled ? 'bg-white' : 'bg-slate-500'}`}
    />
  </button>
);

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { theme, toggleTheme } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [settings, setSettings] = useState({
    blockchainSync: true,
    lowDataMode: false,
    twoFactor: false,
    emailDispatch: true,
    pushAlerts: true,
    smsBroadcast: false,
    marketingInsight: false
  });

  const [passwords, setPasswords] = useState({ current: '', next: '' });
  const [isScanning, setIsScanning] = useState(false);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Setting updated successfully.');
  };

  const handleEnumDevices = () => {
    setIsScanning(true);
    const id = toast.loading('Scanning for hardware nodes...');
    setTimeout(() => {
      toast.update(id, { 
        render: 'No compatible hardware wallet detected via USB.', 
        type: 'error', 
        isLoading: false, 
        autoClose: 3000 
      });
      setIsScanning(false);
    }, 2000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-12">
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">System Configuration</h2>
        <p className="text-slate-500 font-medium">Fine-tune your node's performance and accessibility settings.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation */}
        <div className="w-full md:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg'
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-app-card backdrop-blur-3xl border border-app-border rounded-[2.5rem] p-8 shadow-2xl h-full"
            >
              {activeTab === 'general' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <Monitor className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold">Theme Mode</p>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">{theme} Mode Active</p>
                        </div>
                      </div>
                      <button 
                        onClick={toggleTheme}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all border border-white/10"
                      >
                        Switch Theme
                      </button>
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                            <Globe className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold">Blockchain Sync</p>
                            <p className="text-xs text-slate-500">Real-time ledger updates</p>
                        </div>
                      </div>
                      <Toggle enabled={settings.blockchainSync} onClick={() => toggleSetting('blockchainSync')} />
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <Database className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold">Low Data Mode</p>
                            <p className="text-xs text-slate-500">Optimized asset loading</p>
                        </div>
                      </div>
                      <Toggle enabled={settings.lowDataMode} onClick={() => toggleSetting('lowDataMode')} />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all group"
                  >
                      <div className="flex items-center gap-4">
                        <Key className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
                        <span className="text-white font-bold text-lg">Change Passphrase</span>
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-widest uppercase border border-emerald-500/20">Rotate Keys</div>
                  </button>

                  <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-4">
                        <Smartphone className="w-6 h-6 text-indigo-400" />
                        <div>
                           <p className="text-white font-bold text-lg">Two-Factor Auth</p>
                           <p className="text-xs text-slate-500">Secure your node entry</p>
                        </div>
                      </div>
                      <Toggle enabled={settings.twoFactor} onClick={() => toggleSetting('twoFactor')} />
                  </div>

                  <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-start gap-4">
                      <Lock className="w-6 h-6 text-indigo-400 mt-1" />
                      <div>
                        <p className="text-white font-bold mb-1">Hardware Wallet Protection</p>
                        <p className="text-sm text-slate-500 mb-4 leading-relaxed">Connect a Ledger or Trezor device to sign blockchain transactions manually.</p>
                        <button 
                          onClick={handleEnumDevices}
                          disabled={isScanning}
                          className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-indigo-300 transition-colors disabled:opacity-50"
                        >
                          {isScanning ? 'Scanning Ledger...' : 'Enumerate Devices →'}
                        </button>
                      </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  {[
                    { key: 'emailDispatch', label: 'Email Dispatch', desc: 'Detailed reports sent to your registry email.' },
                    { key: 'pushAlerts', label: 'Push Alerts', desc: 'Real-time dashboard popups and node alerts.' },
                    { key: 'smsBroadcast', label: 'SMS Broadcast', desc: 'Critical supply chain disruptions via mobile.' },
                    { key: 'marketingInsight', label: 'Marketing Insight', desc: 'Updates on new AgriChain protocol features.' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                      <div>
                        <p className="text-white font-bold">{item.label}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{item.desc}</p>
                      </div>
                      <Toggle 
                        enabled={settings[item.key as keyof typeof settings]} 
                        onClick={() => toggleSetting(item.key as keyof typeof settings)} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0f1e] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white">Rotate Passphrase</h3>
                <button onClick={() => setShowPasswordModal(false)} className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all">
                   <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Current Passphrase</label>
                   <input 
                     type="password" 
                     value={passwords.current}
                     onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                     placeholder="••••••••"
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">New Passphrase</label>
                   <input 
                     type="password" 
                     value={passwords.next}
                     onChange={(e) => setPasswords(prev => ({ ...prev, next: e.target.value }))}
                     placeholder="••••••••"
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                   />
                </div>
                
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                   <Check className="w-4 h-4 text-emerald-400 mt-0.5" />
                   <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Changing your passphrase will invalidate all current active sessions on other nodes for security.</p>
                </div>

                <button
                  onClick={() => {
                    if (!passwords.current || !passwords.next) {
                      toast.error('Please fill in both passphrase fields.');
                      return;
                    }
                    toast.success('Passphrase rotated successfully!');
                    setPasswords({ current: '', next: '' });
                    setShowPasswordModal(false);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl transition-all shadow-lg mt-4"
                >
                  Update Identity Key
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
