import React from 'react';
import { LayoutGrid, Users, FileText, Settings, Bot, Calendar, Trello, ShieldAlert } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeAgent: number;
}

const Layout: React.FC<LayoutProps> = ({ children, activeAgent }) => {
  return (
    <div className="min-h-screen flex bg-background text-gray-300 font-sans selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 fixed h-full border-r border-glassBorder bg-surface/50 backdrop-blur-xl z-50 hidden md:flex flex-col">
        <div className="p-6 border-b border-glassBorder">
          <h1 className="text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot size={18} className="text-white" />
            </div>
            AIVA
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-mono">Sequential AI Orchestrator</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={<LayoutGrid size={18} />} label="Dashboard" active />
          
          <div className="pt-6 pb-2 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Agents</div>
          <NavItem icon={<FileText size={18} />} label="Business Analyst" active={activeAgent === 1} />
          <NavItem icon={<Calendar size={18} />} label="Coordinator" active={activeAgent === 2} />
          <NavItem icon={<Trello size={18} />} label="Tech Lead" active={activeAgent === 3} />
          <NavItem icon={<ShieldAlert size={18} />} label="Scrum Master" active={activeAgent === 4} />
        </nav>

        <div className="p-4 border-t border-glassBorder">
          <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/5 transition-colors text-sm">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <Users size={14} />
            </div>
            <div className="text-left">
              <div className="text-white font-medium">Dev Team</div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
    active 
      ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
      : 'hover:bg-white/5 text-gray-400 hover:text-white'
  }`}>
    {icon}
    {label}
  </button>
);

export default Layout;
