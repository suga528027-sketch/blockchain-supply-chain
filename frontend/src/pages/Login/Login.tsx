import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Lock, Mail, Eye, EyeOff, Shield, Globe, Cpu, Database, Activity, ArrowRight, UserPlus } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mode, setMode] = useState<'login' | 'otp'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, googleLogin } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Access Granted. Welcome back.');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Authentication Failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!email) {
            toast.warning('Identity Required: Please enter your email.');
            return;
        }

        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            toast.success('Verification Token Dispatched.');
            setMode('otp');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Transmission Failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Phase Mismatch: Passwords must be identical.');
            return;
        }
        setLoading(true);
        try {
            await authAPI.resetPassword(email, otp, newPassword);
            toast.success('Encryption Keys Updated.');
            setMode('login');
            setPassword('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Verification Failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!credentialResponse.credential) return;
        setLoading(true);
        try {
            await googleLogin(credentialResponse.credential);
            toast.success('Global ID Verified.');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error('Provider Error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center overflow-hidden relative font-sans selection:bg-emerald-500/30">
            
            {/* Ultra-Premium Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/assets/premium-hero.png" 
                    alt="Premium Background" 
                    className="w-full h-full object-cover opacity-50 scale-105 filter brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-emerald-900/40"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.1),transparent_50%)]"></div>
            </div>

            {/* Decorative Tech Elements to fill space */}
            <div className="absolute inset-0 z-10 pointer-events-none hidden lg:block">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] border border-emerald-500/10 rounded-full flex items-center justify-center"
                >
                    <div className="w-[400px] h-[400px] border border-emerald-500/5 rounded-full"></div>
                </motion.div>
                
                {/* Floating Data Icons */}
                <motion.div initial={{ y: 0 }} animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-[20%] right-[15%] flex flex-col items-center gap-2 opacity-20">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 backdrop-blur-md">
                        <Cpu className="w-8 h-8 text-emerald-400" />
                    </div>
                    <span className="text-emerald-500 text-[10px] uppercase font-bold tracking-widest">Process Node</span>
                </motion.div>

                <motion.div initial={{ y: 0 }} animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute bottom-[20%] left-[10%] flex flex-col items-center gap-2 opacity-20">
                    <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
                        <Database className="w-8 h-8 text-cyan-400" />
                    </div>
                    <span className="text-cyan-500 text-[10px] uppercase font-bold tracking-widest">Ledge Sync</span>
                </motion.div>
            </div>

            {/* Main Center Content */}
            <div className="container mx-auto px-6 relative z-20 flex flex-col lg:flex-row items-center justify-between gap-12">
                
                {/* Brand Showcase Section */}
                <div className="hidden lg:flex flex-col w-1/2 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 backdrop-blur-xl">
                                <Leaf className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h3 className="text-slate-400 font-bold tracking-[0.3em] text-sm uppercase">Secure Ecosystem</h3>
                        </div>
                        <h1 className="text-7xl font-black text-white leading-tight">
                            The New Standard <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500">of Trust.</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-lg mt-6 leading-relaxed">
                            AgriChain leverages decentralized ledger technology to bring unprecedented transparency to the global agricultural marketplace.
                        </p>
                    </motion.div>

                    <div className="flex gap-12 pt-8">
                        <div className="flex flex-col gap-1">
                            <span className="text-white font-black text-3xl flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-500"/>84+</span>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Global Nodes</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-white font-black text-3xl flex items-center gap-2"><Activity className="w-5 h-5 text-cyan-500"/>RealTime</span>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Validation</p>
                        </div>
                    </div>
                </div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full lg:w-[450px]"
                >
                    <div className="relative group">
                        {/* Glowing Edge Effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                        
                        <div className="relative bg-[#020617]/90 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl">
                            
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                                    {mode === 'login' ? 'Authentication' : 'Key Recovery'}
                                </h2>
                                <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full"></div>
                            </div>

                            <AnimatePresence mode="wait">
                                {mode === 'login' ? (
                                    <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleLogin} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-emerald-500/70 text-[10px] font-bold uppercase tracking-widest ml-1">Network Identifier</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-all"
                                                    placeholder="mail@network.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-emerald-500/70 text-[10px] font-bold uppercase tracking-widest ml-1">Access Pass</label>
                                                <button type="button" onClick={handleForgotPassword} className="text-[10px] text-slate-500 hover:text-emerald-400 font-bold transition-colors">LOST ACCESS?</button>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-all font-mono"
                                                    placeholder="••••••••"
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <button disabled={loading} className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-emerald-500/10">
                                            {loading ? 'Validating...' : <>Connect to Grid <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                                        </button>
                                    </motion.form>
                                ) : (
                                    <motion.form key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleResetPassword} className="space-y-6 text-center">
                                        <div className="space-y-4">
                                            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/20 mb-2">
                                                <Shield className="w-8 h-8 text-cyan-400" />
                                            </div>
                                            <p className="text-slate-400 text-xs italic">A 6-digit confirmation has been broadcasted to your contact node.</p>
                                            
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-center text-3xl font-black tracking-[0.8em] text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-all"
                                                placeholder="000000"
                                            />

                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-all"
                                                placeholder="Initialize New Key"
                                                required
                                            />
                                            
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-all"
                                                placeholder="Confirm New Key"
                                                required
                                            />
                                        </div>

                                        <div className="flex gap-4">
                                            <button type="button" onClick={() => setMode('login')} className="w-1/3 py-4 text-slate-500 font-bold hover:text-white transition-colors">Abort</button>
                                            <button disabled={loading} className="w-2/3 bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl hover:bg-emerald-400 transition-all">
                                                {loading ? 'Re-keying...' : 'Update Key'}
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>

                            <div className="mt-8 flex flex-col items-center gap-6">
                                <div className="w-full flex items-center gap-4 text-slate-700">
                                    <div className="h-[1px] w-full bg-white/5"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">External Sign-In</span>
                                    <div className="h-[1px] w-full bg-white/5"></div>
                                </div>
                                <GoogleLogin 
                                    onSuccess={handleGoogleSuccess} 
                                    onError={() => toast.error('Google Terminal Error')}
                                    theme="filled_black" 
                                    width="320" 
                                    shape="pill" 
                                    text="continue_with"
                                />
                                
                                <p className="text-slate-500 text-xs">
                                    New Entity? <button onClick={() => navigate('/register')} className="text-emerald-500 hover:underline font-bold">Register Node</button>
                                </p>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Subtle Footer */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-700 font-bold tracking-[0.5em] uppercase pointer-events-none z-30">
                Encrypted Data Link • Decentralized Environment • v1.0.4
            </div>
        </div>
    );
};

export default Login;