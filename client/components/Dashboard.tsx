
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, Trello, ShieldAlert, ArrowRight, Check, Plus, AlertTriangle, Play, Sparkles, Bot, Loader2, FolderPlus, LogOut, RefreshCw, Users, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import AgentCard from './AgentCard';
import { ManageTeamModal } from './ManageTeamModal';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { Project, AgentStatus, TaskStatus } from '../types';

// Internal state interfaces
interface SRS {
  id?: string;
  title: string;
  overview: string;
  sections: { title: string; content: string }[];
  generatedAt: string;
  status: string;
}

interface Meeting {
  id?: string;
  title: string;
  date: string;
  duration: string;
  agenda: string[];
  attendees: string[];
  meetLink: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: TaskStatus;
  resourcesNeeded: string[];
  missingResources?: string[];
}

interface Blocker {
  id: string;
  description: string;
  reportedBy: string;
  timestamp: string;
  aiSolution?: string;
  status: 'OPEN' | 'RESOLVED' | 'ESCALATED';
}



const Dashboard: React.FC = () => {
  const { user, isTeamLead, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // All users (for team resolution)
  const [allUsers, setAllUsers] = useState<{ uid: string; displayName: string; role: string }[]>([]);

  // Agent data
  const [rawRequirements, setRawRequirements] = useState('');
  const [srs, setSrs] = useState<SRS | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [activeAgent, setActiveAgent] = useState(1);
  const [agentStatuses, setAgentStatuses] = useState({
    ba: AgentStatus.IDLE,
    coordinator: AgentStatus.IDLE,
    techLead: AgentStatus.IDLE,
    scrumMaster: AgentStatus.IDLE,
  });

  // Load projects and users on mount
  useEffect(() => {
    loadProjects();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setAllUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  // Compute team members for the current project
  const currentProject = projects.find(p => p.id === currentProjectId);
  const projectTeamMembers = (currentProject?.teamMembers || []).map((uid: string) => {
    const u = allUsers.find(u => u.uid === uid);
    return u || { uid, displayName: uid.substring(0, 8), role: 'developer' };
  });

  const loadProjects = async () => {
    try {
      const data = await api.listProjects();
      setProjects(data.projects);
      if (data.projects.length > 0 && !currentProjectId) {
        loadProject(data.projects[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadProject = async (projectId: string) => {
    try {
      setCurrentProjectId(projectId);
      const data = await api.getProject(projectId);
      const proj = data.project;

      setRawRequirements(proj.rawRequirements || '');
      setActiveAgent(proj.activeAgent);
      setAgentStatuses(proj.agentStatuses);

      // Update the project in the projects list to keep it fresh (e.g. for team members)
      setProjects(prev => prev.map(p => p.id === projectId ? proj : p));

      if (data.srs.length > 0) setSrs(data.srs[0]);
      else setSrs(null);

      if (data.meetings.length > 0) setMeeting(data.meetings[0]);
      else setMeeting(null);

      setTasks(data.tasks || []);
      setBlockers(data.blockers || []);
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setLoading(true);
    try {
      const data = await api.createProject(newProjectName);
      setProjects(prev => [data.project, ...prev]);
      loadProject(data.project.id);
      setNewProjectName('');
      setShowNewProject(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // Agent handlers
  // ========================
  const handleBA_Submit = async () => {
    if (!rawRequirements || !currentProjectId) return;
    setLoading(true);
    setAgentStatuses(prev => ({ ...prev, ba: AgentStatus.PROCESSING }));

    try {
      const data = await api.generateSRS(currentProjectId, rawRequirements);
      setSrs(data.srs);
      setAgentStatuses(prev => ({ ...prev, ba: AgentStatus.WAITING_APPROVAL }));
    } catch (e) {
      console.error(e);
      setAgentStatuses(prev => ({ ...prev, ba: AgentStatus.FAILED }));
    } finally {
      setLoading(false);
    }
  };

  const handleBA_Approve = async () => {
    if (!currentProjectId || !srs?.id) return;
    try {
      await api.approveSRS(currentProjectId, srs.id);
      setActiveAgent(2);
      setAgentStatuses(prev => ({ ...prev, ba: AgentStatus.COMPLETED, coordinator: AgentStatus.IDLE }));
      setSrs(prev => prev ? { ...prev, status: 'approved' } : null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCoordinator_Trigger = async () => {
    if (!currentProjectId) return;
    setLoading(true);
    setAgentStatuses(prev => ({ ...prev, coordinator: AgentStatus.PROCESSING }));

    try {
      const data = await api.scheduleMeeting(currentProjectId);
      setMeeting(data.meeting);
      setAgentStatuses(prev => ({ ...prev, coordinator: AgentStatus.WAITING_APPROVAL }));
    } catch (e) {
      console.error(e);
      setAgentStatuses(prev => ({ ...prev, coordinator: AgentStatus.FAILED }));
    } finally {
      setLoading(false);
    }
  };

  const handleCoordinator_Approve = async () => {
    if (!currentProjectId || !meeting?.id) return;
    try {
      await api.confirmMeeting(currentProjectId, meeting.id);
      setActiveAgent(3);
      setAgentStatuses(prev => ({ ...prev, coordinator: AgentStatus.COMPLETED, techLead: AgentStatus.IDLE }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTechLead_Trigger = async () => {
    if (!currentProjectId) return;
    setLoading(true);
    setAgentStatuses(prev => ({ ...prev, techLead: AgentStatus.PROCESSING }));

    try {
      const data = await api.generateTasks(currentProjectId);
      setTasks(data.tasks);
      setActiveAgent(4);
      setAgentStatuses(prev => ({
        ...prev,
        techLead: AgentStatus.COMPLETED,
        scrumMaster: AgentStatus.IDLE,
      }));
    } catch (e) {
      console.error(e);
      setAgentStatuses(prev => ({ ...prev, techLead: AgentStatus.FAILED }));
    } finally {
      setLoading(false);
    }
  };

  // Agent 4 — Blockers
  const [newBlocker, setNewBlocker] = useState('');

  const handleAddBlocker = async () => {
    if (!newBlocker.trim() || !currentProjectId) return;
    setLoading(true);

    try {
      const data = await api.reportBlocker(currentProjectId, newBlocker);
      setBlockers(prev => [data.blocker, ...prev]);
      setNewBlocker('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    if (!currentProjectId) return;

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    try {
      await api.updateTaskStatus(currentProjectId, taskId, newStatus);
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert on failure
      setTasks(previousTasks);
      alert('Failed to update task status');
    }
  };

  const handleResolveBlocker = async (id: string) => {
    if (!currentProjectId) return;
    try {
      await api.resolveBlocker(currentProjectId, id);
      setBlockers(prev =>
        prev.map(b => (b.id === id ? { ...b, status: 'RESOLVED' as const } : b))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleEscalateBlocker = async (id: string) => {
    if (!currentProjectId) return;
    try {
      await api.escalateBlocker(currentProjectId, id);
      setBlockers(prev =>
        prev.map(b => (b.id === id ? { ...b, status: 'ESCALATED' as const } : b))
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Retry handler — resets a failed agent back to IDLE
  const handleRetryAgent = async (agentKey: 'ba' | 'coordinator' | 'techLead' | 'scrumMaster') => {
    if (!currentProjectId) return;
    try {
      await api.resetAgent(currentProjectId, agentKey);
      setAgentStatuses(prev => ({ ...prev, [agentKey]: AgentStatus.IDLE }));
    } catch (e) {
      console.error('Failed to reset agent:', e);
    }
  };

  // ========================
  // Render functions
  // ========================

  // Retry button component for failed agents
  const RetryButton = ({ agentKey, label }: { agentKey: 'ba' | 'coordinator' | 'techLead' | 'scrumMaster'; label: string }) => (
    <button
      onClick={() => handleRetryAgent(agentKey)}
      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2 transition-all"
    >
      <RefreshCw size={14} /> Retry {label}
    </button>
  );

  // Project selector top bar
  const renderProjectBar = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <select
          value={currentProjectId || ''}
          onChange={e => e.target.value && loadProject(e.target.value)}
          className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary/50"
        >
          <option value="" disabled>Select Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {isTeamLead && (
          <>
            <button
              onClick={() => setShowNewProject(true)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm flex items-center gap-2 transition-colors"
            >
              <FolderPlus size={14} /> New Project
            </button>
            {currentProjectId && (
              <button
                onClick={() => setShowTeamModal(true)}
                className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-indigo-400 text-sm flex items-center gap-2 transition-colors"
              >
                <Users size={14} /> Manage Team
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm text-white font-medium">{user?.displayName}</div>
          <div className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</div>
        </div>
        <button
          onClick={logout}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  // New project modal
  const renderNewProjectModal = () => (
    showNewProject ? (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-panel rounded-2xl p-8 w-full max-w-md"
        >
          <h2 className="text-xl font-display font-semibold text-white mb-4">Create New Project</h2>
          <input
            type="text"
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 mb-4"
            placeholder="Project name..."
            onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
          />
          <div className="flex gap-3">
            <button
              onClick={handleCreateProject}
              disabled={loading || !newProjectName.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent rounded-lg text-white text-sm font-medium disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewProject(false)}
              className="px-4 py-2.5 bg-white/5 rounded-lg text-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    ) : null
  );

  // Agent 1: Business Analyst
  const renderAgent1_BA = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display font-semibold text-white">Requirement Analysis</h3>
        {agentStatuses.ba === AgentStatus.WAITING_APPROVAL && isTeamLead && (
          <button onClick={handleBA_Approve} className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors">
            Approve SRS & Proceed <ArrowRight size={16} />
          </button>
        )}
        {((agentStatuses.ba === AgentStatus.FAILED || agentStatuses.ba === AgentStatus.WAITING_APPROVAL || (agentStatuses.ba === AgentStatus.PROCESSING && !loading))) && isTeamLead && (
          <RetryButton agentKey="ba" label="Regenerate SRS" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
        <div className="glass-panel rounded-xl p-4 flex flex-col">
          <label className="text-sm text-gray-400 mb-2">Raw Client Requirements</label>
          <textarea
            className="flex-1 bg-black/20 border border-white/5 rounded-lg p-4 text-gray-300 focus:outline-none focus:border-primary/50 resize-none font-mono text-sm"
            placeholder="Paste email, notes, or rough ideas here..."
            value={rawRequirements}
            onChange={e => setRawRequirements(e.target.value)}
            disabled={!isTeamLead || agentStatuses.ba === AgentStatus.COMPLETED || agentStatuses.ba === AgentStatus.WAITING_APPROVAL}
          />
          {agentStatuses.ba === AgentStatus.IDLE && isTeamLead && (
            <button
              onClick={handleBA_Submit}
              disabled={!rawRequirements}
              className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles size={16} /> Generate SRS
            </button>
          )}
        </div>

        <div className="glass-panel rounded-xl p-6 overflow-y-auto relative">
          {loading && agentStatuses.ba === AgentStatus.PROCESSING ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-black/50 backdrop-blur-sm z-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-primary font-mono text-sm animate-pulse">Analyzing Requirements...</p>
            </div>
          ) : srs ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h1 className="text-2xl text-white font-display m-0">{srs.title}</h1>
                <span className="text-xs font-mono text-gray-500">Generated: {new Date(srs.generatedAt).toLocaleTimeString()}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-lg mb-6 border border-white/5">
                <h4 className="text-primary m-0 mb-2 uppercase text-xs tracking-wider">Overview</h4>
                <p className="m-0 text-gray-300">{srs.overview}</p>
              </div>
              {(srs.sections || []).map((section, idx) => (
                <div key={idx} className="mb-6">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <div className="w-1 h-6 bg-accent rounded-full" />
                    {section.title}
                  </h3>
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600 flex-col gap-3">
              <FileText size={48} className="opacity-20" />
              <p>Waiting for input...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Agent 2: Coordinator
  const renderAgent2_Coord = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display font-semibold text-white">Meeting Coordination</h3>
        {agentStatuses.coordinator === AgentStatus.WAITING_APPROVAL && isTeamLead ? (
          <button onClick={handleCoordinator_Approve} className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors">
            Confirm Schedule & Notify <ArrowRight size={16} />
          </button>
        ) : agentStatuses.coordinator === AgentStatus.IDLE && isTeamLead ? (
          <button onClick={handleCoordinator_Trigger} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors">
            <Play size={16} /> Auto-Schedule
          </button>
        ) : ((agentStatuses.coordinator === AgentStatus.FAILED || agentStatuses.coordinator === AgentStatus.WAITING_APPROVAL || agentStatuses.coordinator === AgentStatus.COMPLETED || (agentStatuses.coordinator === AgentStatus.PROCESSING && !loading))) && isTeamLead ? (
          <RetryButton agentKey="coordinator" label="Regenerate Meeting" />
        ) : null}
      </div>

      <div className="glass-panel rounded-xl p-8 min-h-[400px] flex items-center justify-center relative overflow-hidden">
        {loading && agentStatuses.coordinator === AgentStatus.PROCESSING && (
          <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Calendar size={48} className="text-primary animate-bounce" />
              <p className="text-gray-400 font-mono">Checking calendars & availability...</p>
            </div>
          </div>
        )}

        {meeting ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="bg-primary/10 p-6 border-b border-white/5 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{meeting.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-2"><Calendar size={14} /> {meeting.date}</span>
                  <span className="flex items-center gap-2"><div className="w-1 h-1 bg-gray-500 rounded-full" /> {meeting.duration}</span>
                </div>
              </div>
              <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                {meeting.status === 'confirmed' ? 'Confirmed' : 'Tentative'}
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Agenda</h4>
                <ul className="space-y-3">
                  {(meeting.agenda || []).map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-xs font-mono text-gray-500 mt-0.5">{i + 1}</div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Attendees</h4>
                  <div className="flex -space-x-2">
                    {(meeting.attendees || []).map((att, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-[#1a1a1a] flex items-center justify-center text-xs text-white" title={att}>
                        {att.charAt(0)}
                      </div>
                    ))}
                  </div>
                </div>
                {meeting.meetLink && (
                  <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Google Meet Link</p>
                    <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline truncate block">
                      {meeting.meetLink}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center text-gray-500">
            <Calendar size={64} className="mx-auto mb-4 opacity-20" />
            <p>Ready to schedule discussion{srs ? ` for "${srs.title}"` : ''}</p>
          </div>
        )}
      </div>
    </div>
  );

  // Agent 3: Tech Lead
  const renderAgent3_Tech = () => (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display font-semibold text-white">Work Breakdown & Planning</h3>
        {agentStatuses.techLead === AgentStatus.IDLE && isTeamLead && (
          <button onClick={handleTechLead_Trigger} className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors">
            <Sparkles size={16} /> Analyze & Create Tasks
          </button>
        )}
        {((agentStatuses.techLead === AgentStatus.FAILED || agentStatuses.techLead === AgentStatus.COMPLETED || (agentStatuses.techLead === AgentStatus.PROCESSING && !loading))) && isTeamLead && (
          <RetryButton agentKey="techLead" label="Regenerate Tasks" />
        )}
      </div>

      {loading && agentStatuses.techLead === AgentStatus.PROCESSING ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Trello size={32} className="text-primary" />
            </div>
            <h3 className="text-white font-medium mb-1">Constructing Work Plan</h3>
            <p className="text-gray-500 text-sm">Identifying resources and dependencies...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          {tasks.length > 0 ? (
            <div className="flex gap-6 h-full min-w-[1000px]">
              {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE].map(status => (
                <div key={status} className="flex-1 min-w-[300px] bg-white/5 rounded-xl border border-white/5 flex flex-col">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h4 className="font-medium text-gray-300 text-sm">{status.replace('_', ' ')}</h4>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-500">
                      {tasks.filter(t => t.status === status).length}
                    </span>
                  </div>
                  <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                    {tasks.filter(t => t.status === status).map(task => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={task.id}
                        className={`bg-[#121212] p-4 rounded-lg border ${task.missingResources && task.missingResources.length > 0 ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-white/5 hover:border-white/20'} transition-all group relative`}
                      >
                        {task.missingResources && task.missingResources.length > 0 && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse" title="Missing Resources">
                            <AlertTriangle size={12} fill="white" />
                          </div>
                        )}
                        <h5 className="text-white text-sm font-medium mb-1">{task.title}</h5>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                              {task.assignee.charAt(0)}
                            </div>
                            <span className="text-[10px] text-gray-500 ml-1">{task.assignee}</span>
                          </div>
                          {task.missingResources && task.missingResources.length > 0 ? (
                            <span className="text-[10px] text-red-400 font-mono bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                              Missing: {task.missingResources[0]}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-600 font-mono border border-white/5 px-2 py-1 rounded">
                              {task.resourcesNeeded.length} Resources
                            </span>
                          )}
                        </div>

                        {/* Task Actions (Move Status) */}
                        <div className="mt-3 flex justify-end gap-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {status === TaskStatus.TODO && (
                            <button
                              onClick={() => handleTaskStatusUpdate(task.id, TaskStatus.IN_PROGRESS)}
                              className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded hover:bg-indigo-500/30 transition-colors"
                              title="Start Task"
                            >
                              <ArrowRight size={14} />
                            </button>
                          )}
                          {status === TaskStatus.IN_PROGRESS && (
                            <>
                              <button
                                onClick={() => handleTaskStatusUpdate(task.id, TaskStatus.TODO)}
                                className="p-1.5 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
                                title="Back to Todo"
                              >
                                <ArrowLeft size={14} />
                              </button>
                              <button
                                onClick={() => handleTaskStatusUpdate(task.id, TaskStatus.DONE)}
                                className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
                                title="Complete Task"
                              >
                                <Check size={14} />
                              </button>
                            </>
                          )}
                          {status === TaskStatus.DONE && (
                            <button
                              onClick={() => handleTaskStatusUpdate(task.id, TaskStatus.IN_PROGRESS)}
                              className="p-1.5 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 transition-colors"
                              title="Reopen Task"
                            >
                              <ArrowLeft size={14} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
              <p className="text-gray-600">No tasks generated yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Agent 4: Scrum Master
  const renderAgent4_Scrum = () => (
    <div className="h-[600px] flex gap-6">
      <div className="flex-1 glass-panel rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-glassBorder bg-white/5">
          <h3 className="font-display font-semibold text-white">Blocker Feed</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {blockers.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              <Check size={32} className="mx-auto mb-2 opacity-50" />
              No active blockers reported.
            </div>
          )}
          {blockers.map(blocker => (
            <motion.div
              key={blocker.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-surface border border-white/5 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${blocker.status === 'RESOLVED' ? 'bg-emerald-500' : blocker.status === 'ESCALATED' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'} `} />
                  <span className={`${blocker.status === 'RESOLVED' ? 'text-emerald-400' : blocker.status === 'ESCALATED' ? 'text-amber-400' : 'text-red-400'} font-bold text-xs uppercase tracking-wider`}>
                    {blocker.status === 'OPEN' ? 'Blocker' : blocker.status}
                  </span>
                </div>
                <span className="text-xs text-gray-600">{new Date(blocker.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-white text-sm mb-2">"{blocker.description}"</p>
              <p className="text-xs text-gray-500 mb-4">Reported by: {blocker.reportedBy}</p>

              {blocker.aiSolution ? (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-3 relative">
                  <div className="absolute -top-3 left-3 bg-[#1e1e2e] px-2 py-0.5 rounded text-[10px] text-primary flex items-center gap-1 border border-primary/20">
                    <Bot size={10} /> AI Solution
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">{blocker.aiSolution}</p>

                  {blocker.status === 'RESOLVED' ? (
                    <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                      <Check size={12} /> Issue Resolved
                    </div>
                  ) : isTeamLead ? (
                    <div className="mt-2 flex gap-2 items-center">
                      <button
                        onClick={() => handleResolveBlocker(blocker.id)}
                        className="text-[10px] bg-primary/20 hover:bg-primary/30 text-primary px-2 py-1 rounded transition-colors"
                      >
                        Apply Fix
                      </button>
                      {blocker.status === 'ESCALATED' ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
                          Escalated <ArrowRight size={10} />
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEscalateBlocker(blocker.id)}
                          className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 px-2 py-1 rounded transition-colors"
                        >
                          Escalate to PM
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 size={12} className="animate-spin" /> Analyzing solution...
                </div>
              )}
            </motion.div>
          ))}
        </div>
        <div className="p-4 border-t border-glassBorder bg-surface">
          <div className="relative">
            <input
              type="text"
              className="w-full bg-black/30 border border-white/10 rounded-lg pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
              placeholder="Report a new blocker..."
              value={newBlocker}
              onChange={e => setNewBlocker(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddBlocker()}
            />
            <button
              onClick={handleAddBlocker}
              className="absolute right-2 top-2 p-1 bg-white/10 rounded-md hover:bg-primary hover:text-white text-gray-400 transition-colors"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="w-80 space-y-4">
        <div className="glass-panel rounded-xl p-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Sprint Health</h4>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-3xl font-bold text-white">
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100) : 0}%
            </span>
            <span className="text-emerald-400 text-xs mb-1">
              {tasks.filter(t => t.status === TaskStatus.DONE).length}/{tasks.length} Done
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Blocker Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Open</span>
              <span className="text-red-400">{blockers.filter(b => b.status === 'OPEN').length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Resolved</span>
              <span className="text-emerald-400">{blockers.filter(b => b.status === 'RESOLVED').length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Escalated</span>
              <span className="text-amber-400">{blockers.filter(b => b.status === 'ESCALATED').length}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Team</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
              <span className="text-xs text-gray-300">{user?.displayName}</span>
              <span className="text-[10px] text-gray-600 capitalize ml-auto">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout activeAgent={activeAgent} teamMembers={projectTeamMembers}>
      <div className="space-y-8 pb-20">
        {renderProjectBar()}
        {renderNewProjectModal()}

        {/* Render Team Modal */}
        {currentProjectId && (
          <ManageTeamModal
            isOpen={showTeamModal}
            onClose={() => setShowTeamModal(false)}
            project={projects.find(p => p.id === currentProjectId)!}
            onUpdate={() => loadProject(currentProjectId)}
          />
        )}

        {!currentProjectId ? (
          <div className="flex items-center justify-center min-h-[400px] text-gray-500">
            <div className="text-center">
              <FolderPlus size={48} className="mx-auto mb-4 opacity-20" />
              <p>Create a project to get started</p>
            </div>
          </div>
        ) : (
          <>
            {/* Agent Status Cards */}
            <div className="grid grid-cols-4 gap-4">
              <AgentCard
                role="Agent 1" name="Business Analyst"
                description="Requirement Analysis"
                status={agentStatuses.ba}
                icon={<FileText size={20} />}
                active={activeAgent === 1}
                onClick={() => setActiveAgent(1)}
              />
              <AgentCard
                role="Agent 2" name="Coordinator"
                description="Scheduling & Logistics"
                status={agentStatuses.coordinator}
                icon={<Calendar size={20} />}
                active={activeAgent === 2}
                onClick={() => setActiveAgent(2)}
              />
              <AgentCard
                role="Agent 3" name="Tech Lead"
                description="Planning & Assignment"
                status={agentStatuses.techLead}
                icon={<Trello size={20} />}
                active={activeAgent === 3}
                onClick={() => setActiveAgent(3)}
              />
              <AgentCard
                role="Agent 4" name="Scrum Master"
                description="Blocker Resolution"
                status={agentStatuses.scrumMaster}
                icon={<ShieldAlert size={20} />}
                active={activeAgent === 4}
                onClick={() => setActiveAgent(4)}
              />
            </div>

            {/* Main Action Area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAgent}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[500px]"
              >
                {activeAgent === 1 && renderAgent1_BA()}
                {activeAgent === 2 && renderAgent2_Coord()}
                {activeAgent === 3 && renderAgent3_Tech()}
                {activeAgent === 4 && renderAgent4_Scrum()}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;