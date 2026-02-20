import React from 'react';
import { AgentStatus } from '../types';
import { motion } from 'framer-motion';
import { CheckCircle2, CircleDashed, Loader2, AlertCircle } from 'lucide-react';

interface AgentCardProps {
  role: string;
  name: string;
  description: string;
  status: AgentStatus;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ role, name, description, status, icon, active, onClick }) => {
  const getStatusColor = () => {
    switch (status) {
      case AgentStatus.COMPLETED: return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
      case AgentStatus.PROCESSING: return 'text-primary border-primary/20 bg-primary/10';
      case AgentStatus.WAITING_APPROVAL: return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
      case AgentStatus.FAILED: return 'text-red-400 border-red-500/20 bg-red-500/10';
      default: return 'text-gray-500 border-white/5 bg-white/5';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case AgentStatus.COMPLETED: return <CheckCircle2 size={16} />;
      case AgentStatus.PROCESSING: return <Loader2 size={16} className="animate-spin" />;
      case AgentStatus.WAITING_APPROVAL: return <CircleDashed size={16} />;
      default: return <div className="w-2 h-2 rounded-full bg-gray-600" />;
    }
  };

  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -2 }}
      className={`glass-panel rounded-xl p-5 relative overflow-hidden transition-all duration-300 cursor-pointer group ${
        active ? 'ring-1 ring-primary/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'hover:bg-white/10'
      }`}
    >
      {/* Active Pulse Background */}
      {status === AgentStatus.PROCESSING && (
         <div className="absolute inset-0 bg-primary/5 animate-pulse" />
      )}

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2 rounded-lg ${active ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{status.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-sm font-mono text-primary mb-1 uppercase tracking-wider">{role}</h3>
        <h2 className="text-lg font-display font-bold text-white mb-2">{name}</h2>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      </div>
      
      {/* Progress Bar for Active */}
      {status === AgentStatus.PROCESSING && (
        <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-full bg-primary"
          />
        </div>
      )}
    </motion.div>
  );
};

export default AgentCard;
