import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, ArrowRight, Sparkles, FileText, Calendar, Trello,
    ShieldAlert, Zap, Users, CheckCircle, ChevronDown, Play
} from 'lucide-react';

interface LandingPageProps {
    onGetStarted: (mode: 'login' | 'register') => void;
}

// Floating particle component
const FloatingOrb = ({ delay, size, x, y, color }: { delay: number; size: number; x: string; y: string; color: string }) => (
    <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: size, height: size, left: x, top: y, background: color }}
        animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
        }}
        transition={{ duration: 8, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
);

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    const [activeFeature, setActiveFeature] = useState(0);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-cycle features
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature(prev => (prev + 1) % 4);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const agents = [
        {
            icon: <FileText size={24} />,
            name: 'Business Analyst',
            tag: 'Agent 01',
            description: 'Transforms raw client requirements into structured SRS documents using AI-powered analysis.',
            color: 'from-blue-500 to-cyan-400',
            glow: 'shadow-blue-500/20',
        },
        {
            icon: <Calendar size={24} />,
            name: 'Coordinator',
            tag: 'Agent 02',
            description: 'Automatically schedules meetings, checks availability, and sends Google Calendar invites.',
            color: 'from-emerald-500 to-teal-400',
            glow: 'shadow-emerald-500/20',
        },
        {
            icon: <Trello size={24} />,
            name: 'Tech Lead',
            tag: 'Agent 03',
            description: 'Breaks down approved SRS into actionable tasks, assigns resources, and flags missing dependencies.',
            color: 'from-amber-500 to-orange-400',
            glow: 'shadow-amber-500/20',
        },
        {
            icon: <ShieldAlert size={24} />,
            name: 'Scrum Master',
            tag: 'Agent 04',
            description: 'Monitors blockers in real-time and generates AI-powered solutions to keep your sprint on track.',
            color: 'from-rose-500 to-pink-400',
            glow: 'shadow-rose-500/20',
        },
    ];

    const stats = [
        { value: '4', label: 'AI Agents' },
        { value: '80%', label: 'Time Saved' },
        { value: '24/7', label: 'Availability' },
        { value: '0', label: 'Manual Overhead' },
    ];

    const workflows = [
        { step: '01', title: 'Paste Requirements', desc: 'Drop in emails, notes, or rough ideas from clients' },
        { step: '02', title: 'AI Generates SRS', desc: 'Business Analyst agent structures everything automatically' },
        { step: '03', title: 'Schedule & Plan', desc: 'Coordinator books meetings, Tech Lead creates tasks' },
        { step: '04', title: 'Ship & Resolve', desc: 'Scrum Master tracks blockers and suggests AI fixes' },
    ];

    return (
        <div className="min-h-screen bg-background text-white overflow-x-hidden">

            {/* ═══════════════════════════════════════════════ */}
            {/* HERO SECTION */}
            {/* ═══════════════════════════════════════════════ */}
            <section className="relative min-h-screen flex flex-col">

                {/* Ambient background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-30%] left-[50%] translate-x-[-50%] w-[900px] h-[900px] bg-primary/8 rounded-full blur-[150px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/6 rounded-full blur-[120px]" />
                    <div className="absolute top-[20%] left-[-5%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
                    <FloatingOrb delay={0} size={6} x="15%" y="20%" color="rgba(99,102,241,0.4)" />
                    <FloatingOrb delay={1.5} size={4} x="80%" y="30%" color="rgba(139,92,246,0.4)" />
                    <FloatingOrb delay={3} size={8} x="60%" y="70%" color="rgba(99,102,241,0.3)" />
                    <FloatingOrb delay={2} size={5} x="25%" y="65%" color="rgba(139,92,246,0.3)" />
                    <FloatingOrb delay={4} size={3} x="70%" y="15%" color="rgba(59,130,246,0.4)" />

                    {/* Grid pattern */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                            backgroundSize: '60px 60px',
                        }}
                    />
                </div>

                {/* Navbar */}
                <motion.nav
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                            <Bot size={22} className="text-white" />
                        </div>
                        <span className="text-xl font-display font-bold tracking-tight">AIVA</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
                        <a href="#agents" className="text-sm text-gray-400 hover:text-white transition-colors">Agents</a>
                        <a href="#workflow" className="text-sm text-gray-400 hover:text-white transition-colors">Workflow</a>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onGetStarted('login')}
                            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors font-medium"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => onGetStarted('register')}
                            className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent rounded-lg text-sm font-medium text-white hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            Get Started
                        </button>
                    </div>
                </motion.nav>

                {/* Hero Content */}
                <div className="relative z-10 flex-1 flex items-center justify-center px-6">
                    <div className="max-w-4xl mx-auto text-center">

                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8"
                        >
                            <Sparkles size={14} className="text-primary" />
                            <span className="text-xs font-medium text-primary tracking-wide">Powered by Gemini AI</span>
                        </motion.div>

                        {/* Heading */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="text-5xl md:text-7xl font-display font-bold leading-[1.1] tracking-tight mb-6"
                        >
                            Your Agile Team,{' '}
                            <span className="bg-gradient-to-r from-primary via-accent to-purple-400 bg-clip-text text-transparent">
                                Orchestrated by AI
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                        >
                            Four autonomous AI agents that handle requirements analysis, meeting scheduling,
                            task planning, and blocker resolution — so your team can focus on building.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            <button
                                onClick={() => onGetStarted('register')}
                                className="group px-8 py-4 bg-gradient-to-r from-primary to-accent rounded-xl text-white font-semibold text-base flex items-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40"
                            >
                                Start Free
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => onGetStarted('login')}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 font-semibold text-base flex items-center gap-3 transition-all"
                            >
                                <Play size={16} /> Sign In to Dashboard
                            </button>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.9 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto"
                        >
                            {stats.map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-2xl md:text-3xl font-display font-bold text-white">{stat.value}</div>
                                    <div className="text-xs text-gray-500 mt-1 font-medium tracking-wide uppercase">{stat.label}</div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">Scroll</span>
                    <ChevronDown size={16} className="text-gray-600 animate-bounce" />
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════════ */}
            {/* AGENTS SECTION */}
            {/* ═══════════════════════════════════════════════ */}
            <section id="agents" className="relative py-24 md:py-32 px-6 md:px-12">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px]" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
                            <Zap size={14} className="text-amber-400" />
                            <span className="text-xs font-medium text-gray-400">Meet Your AI Agents</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                            Four Agents.{' '}
                            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">One Pipeline.</span>
                        </h2>
                        <p className="text-gray-500 max-w-xl mx-auto">
                            Each agent is specialized in a critical phase of the agile development lifecycle,
                            working sequentially to deliver results.
                        </p>
                    </motion.div>

                    {/* Agent Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {agents.map((agent, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                onMouseEnter={() => setActiveFeature(i)}
                                className={`group relative glass-panel rounded-2xl p-8 cursor-pointer transition-all duration-500 hover:border-white/15 ${activeFeature === i ? `shadow-2xl ${agent.glow}` : ''
                                    }`}
                            >
                                {/* Active indicator glow */}
                                {activeFeature === i && (
                                    <motion.div
                                        layoutId="agentGlow"
                                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${agent.color} opacity-[0.03]`}
                                        transition={{ type: 'spring', duration: 0.6 }}
                                    />
                                )}

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-white shadow-lg`}>
                                            {agent.icon}
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-3 py-1 rounded-full border border-white/5 tracking-wider">{agent.tag}</span>
                                    </div>
                                    <h3 className="text-xl font-display font-semibold text-white mb-3">{agent.name}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{agent.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pipeline connector visual */}
                    <div className="hidden md:flex items-center justify-center mt-12 gap-4">
                        {agents.map((agent, i) => (
                            <React.Fragment key={i}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                                >
                                    {i + 1}
                                </motion.div>
                                {i < agents.length - 1 && (
                                    <motion.div
                                        initial={{ scaleX: 0 }}
                                        whileInView={{ scaleX: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                                        className="w-20 h-0.5 bg-gradient-to-r from-white/10 to-white/5 origin-left"
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════ */}
            {/* WORKFLOW SECTION */}
            {/* ═══════════════════════════════════════════════ */}
            <section id="workflow" className="relative py-24 md:py-32 px-6 md:px-12">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute bottom-[-20%] left-[30%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px]" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4" id="features">
                            How it{' '}
                            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Works</span>
                        </h2>
                        <p className="text-gray-500 max-w-xl mx-auto">From raw requirements to shipped sprints — fully automated.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {workflows.map((w, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="flex gap-5 group"
                            >
                                <div className="shrink-0">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg font-display font-bold text-gray-500 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                                        {w.step}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-display font-semibold text-white mb-1">{w.title}</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">{w.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════ */}
            {/* FEATURES HIGHLIGHT */}
            {/* ═══════════════════════════════════════════════ */}
            <section className="relative py-24 md:py-32 px-6 md:px-12">
                <div className="relative z-10 max-w-6xl mx-auto">
                    <div className="glass-panel rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-[-50%] left-[50%] translate-x-[-50%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
                        </div>

                        <div className="relative z-10">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                                    Built for{' '}
                                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                        Modern Teams
                                    </span>
                                </h2>
                                <p className="text-gray-400 max-w-lg mx-auto mb-10">
                                    Role-based access, real-time collaboration, Google Calendar integration, Slack notifications, and AI-powered everything.
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                                {[
                                    { icon: <Users size={20} />, label: 'Team Roles' },
                                    { icon: <Calendar size={20} />, label: 'Google Calendar' },
                                    { icon: <Sparkles size={20} />, label: 'Gemini AI' },
                                    { icon: <CheckCircle size={20} />, label: 'Kanban Board' },
                                ].map((f, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-colors"
                                    >
                                        <div className="text-primary">{f.icon}</div>
                                        <span className="text-xs text-gray-400 font-medium">{f.label}</span>
                                    </motion.div>
                                ))}
                            </div>

                            <button
                                onClick={() => onGetStarted('register')}
                                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-accent rounded-xl text-white font-semibold hover:opacity-90 transition-all shadow-xl shadow-primary/25"
                            >
                                Get Started for Free
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════ */}
            {/* FOOTER */}
            {/* ═══════════════════════════════════════════════ */}
            <footer className="border-t border-white/5 py-10 px-6 md:px-12">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Bot size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-display font-semibold text-gray-400">AIVA</span>
                        <span className="text-xs text-gray-600">— Autonomous Agile Virtual Assistant</span>
                    </div>
                    <div className="text-xs text-gray-600">
                        {new Date().getFullYear()} AIVA. Built with Gemini AI.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
