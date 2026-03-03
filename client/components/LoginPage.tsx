import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, LogIn, UserPlus, Mail, Lock, User, Shield, Code, TestTube, ArrowLeft } from 'lucide-react';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface LoginPageProps {
    initialMode?: 'login' | 'register';
    onBack?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'login', onBack }) => {
    const { login, register, error } = useAuth();
    const [isRegister, setIsRegister] = useState(initialMode === 'register');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>('developer');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setLoading(true);

        try {
            if (isRegister) {
                await register(email, password, displayName, selectedRole);
            } else {
                await login(email, password);
            }
        } catch (err: any) {
            setLocalError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const roles: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
        { value: 'team_lead', label: 'Team Lead', icon: <Shield size={16} />, desc: 'Full control of the pipeline' },
        { value: 'developer', label: 'Developer', icon: <Code size={16} />, desc: 'View tasks, report blockers' },
        { value: 'tester', label: 'Tester', icon: <TestTube size={16} />, desc: 'View tasks, report blockers' },
    ];

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Back to Landing */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors z-20"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                )}

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 mx-auto mb-4">
                        <Bot size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-tight">AIVA</h1>
                    <p className="text-gray-500 text-sm mt-1 font-mono">Autonomous Agile Virtual Assistant</p>
                </div>

                {/* Form */}
                <div className="glass-panel rounded-2xl p-8">
                    <h2 className="text-xl font-display font-semibold text-white mb-6">
                        {isRegister ? 'Create Account' : 'Sign In'}
                    </h2>

                    {(localError || error) && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 mb-4">
                            {localError || error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Display Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-3 text-gray-500" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={e => setDisplayName(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {isRegister && (
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block">Select Your Role</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {roles.map(role => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => setSelectedRole(role.value)}
                                            className={`p-3 rounded-lg border text-center transition-all ${selectedRole === role.value
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex justify-center mb-1">{role.icon}</div>
                                            <div className="text-xs font-medium">{role.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isRegister ? (
                                <>
                                    <UserPlus size={16} /> Create Account
                                </>
                            ) : (
                                <>
                                    <LogIn size={16} /> Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setIsRegister(!isRegister); setLocalError(''); }}
                            className="text-sm text-gray-400 hover:text-primary transition-colors"
                        >
                            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
